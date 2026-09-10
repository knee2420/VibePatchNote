"""Google OAuth 토큰으로 Gemini 프로젝트 한도를 읽는 일회성 어댑터.

토큰은 Windows 자격 증명 관리자에만 보관하며, 조회 결과는 저장하지 않는다.

한도는 Cloud Quotas 에서, 최근 사용량은 Cloud Monitoring 에서 읽는다. Monitoring 의
시계열 조회는 Google 이 **결제가 연결된 프로젝트에만** 허용한다. AI Studio 가 만들어 주는
무료 프로젝트에서는 그 조회가 거절되므로, 거절 사유를 무료 tier 판정의 근거로 쓴다.
"""
from __future__ import annotations

import base64
import hashlib
import json
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import keyring

_SERVICE = "VibePatchNote"
_REFRESH_KEY = "google-quota-refresh-token"
_CLIENT_SECRET_KEY = "google-oauth-client-secret"
_SCOPE = "https://www.googleapis.com/auth/cloud-platform"
_QUOTA_INFOS_URL = (
    "https://cloudquotas.googleapis.com/v1/projects/{project}/locations/global"
    "/services/generativelanguage.googleapis.com/quotaInfos"
)
_MAX_QUOTA_PAGES = 20
_CLOUD_READ_FAILED = "Google Cloud에서 한도를 읽지 못했습니다. API 활성화와 계정 권한을 확인해 주세요."

# tier 별 RPM·TPM·RPD 가 담긴 Cloud Quotas 지표 (지표 경로의 마지막 조각, 갱신 주기).
# AI Studio 한도 화면과 같은 값이며, TPM 은 입력 토큰 기준이다.
TIER_METRICS: dict[str, dict[str, tuple[str, str]]] = {
    "free": {
        "rpm": ("generate_content_free_tier_requests", "minute"),
        "tpm": ("generate_content_free_tier_input_token_count", "minute"),
        "rpd": ("generate_content_free_tier_requests", "day"),
    },
    "paid_tier_1": {
        "rpm": ("generate_requests_per_model", "minute"),
        "tpm": ("generate_content_paid_tier_input_token_count", "minute"),
        "rpd": ("generate_requests_per_model_per_day", "day"),
    },
}


def summarize_tier_limits(quota_infos: list[Any], tier: str) -> dict[str, dict[str, int | None]]:
    """quotaInfos 를 모델별 RPM·TPM·RPD 로 접는다.

    그 tier 에 값이 없는 칸은 None 이다. 다른 tier 의 값으로 메우지 않는다 — 무료 프로젝트에
    유료 tier 한도를 보여 주면 쓸 수 없는 모델이 쓸 수 있는 것처럼 보인다. -1 은 무제한이다.
    """
    wanted = {spec: column for column, spec in TIER_METRICS[tier].items()}
    limits: dict[str, dict[str, int | None]] = {}
    for item in quota_infos:
        if not isinstance(item, dict):
            continue
        spec = (str(item.get("metric", "")).rsplit("/", 1)[-1], str(item.get("refreshInterval") or ""))
        column = wanted.get(spec)
        if column is None:
            continue
        for info in item.get("dimensionsInfos", []):
            if not isinstance(info, dict):
                continue
            dimensions = info.get("dimensions") if isinstance(info.get("dimensions"), dict) else {}
            model = str(dimensions.get("model", ""))
            if not model:
                continue
            row = limits.setdefault(model, {"rpm": None, "tpm": None, "rpd": None})
            value = (info.get("details") or {}).get("value")
            if value is not None:
                row[column] = int(value)
    return limits


class GoogleOAuthError(RuntimeError):
    """OAuth 비밀 값 없이 사용자에게 보여줄 수 있는 교환 오류."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


class GoogleCloudRequestError(RuntimeError):
    """Google Cloud API 조회 실패. 결제 미연결로 거절됐는지를 함께 알린다."""

    def __init__(self, message: str, *, billing_required: bool = False) -> None:
        super().__init__(message)
        self.billing_required = billing_required


class GoogleQuotaReader:
    def __init__(self, client_id: str, project_id: str, project_number: str, redirect_uri: str) -> None:
        self._client_id, self._project_id, self._project_number, self._redirect_uri = client_id, project_id, project_number, redirect_uri
        self._pending: dict[str, tuple[str, float]] = {}

    def authorization_url(self) -> str:
        if not self._client_id:
            raise RuntimeError("Google OAuth 클라이언트 ID가 설정되지 않았습니다.")
        verifier = secrets.token_urlsafe(64)
        state = secrets.token_urlsafe(32)
        challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
        self._pending[state] = (verifier, time.monotonic() + 600)
        return "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode({"client_id": self._client_id, "redirect_uri": self._redirect_uri, "response_type": "code", "scope": _SCOPE, "access_type": "offline", "prompt": "consent", "code_challenge": challenge, "code_challenge_method": "S256", "state": state})

    def complete(self, code: str, state: str) -> None:
        pending = self._pending.get(state)
        if not pending or pending[1] < time.monotonic():
            self._pending.pop(state, None)
            raise GoogleOAuthError("invalid_state", "로그인 요청이 만료되었거나 서버가 재시작되었습니다. 앱에서 다시 연결해 주세요.")
        fields = {"code": code, "client_id": self._client_id, "redirect_uri": self._redirect_uri, "grant_type": "authorization_code", "code_verifier": pending[0]}
        client_secret = self._client_secret()
        if client_secret:
            fields["client_secret"] = client_secret
        payload = urlencode(fields).encode()
        data = self._request("https://oauth2.googleapis.com/token", data=payload, oauth_exchange=True)
        refresh = data.get("refresh_token")
        if not isinstance(refresh, str) or not refresh:
            raise GoogleOAuthError("missing_refresh_token", "Google이 장기 연결용 토큰을 반환하지 않았습니다. 계정의 VibePatchNote 권한을 철회한 뒤 다시 연결해 주세요.")
        try:
            keyring.set_password(_SERVICE, _REFRESH_KEY, refresh)
        except keyring.errors.KeyringError as exc:
            raise GoogleOAuthError("credential_store_failed", "Windows 자격 증명 저장소에 Google 연결을 저장하지 못했습니다.") from exc
        finally:
            self._pending.pop(state, None)

    def status(self) -> dict[str, object]:
        try:
            connected = bool(keyring.get_password(_SERVICE, _REFRESH_KEY))
        except keyring.errors.KeyringError:
            connected = False
        return {"connected": connected, "clientSecretConfigured": bool(self._client_secret()), "projectId": self._project_id, "projectNumber": self._project_number, "scope": _SCOPE}

    def set_client_secret(self, client_secret: str) -> None:
        value = client_secret.strip()
        if not value:
            raise ValueError("OAuth 클라이언트 보안 비밀번호를 입력해 주세요.")
        keyring.set_password(_SERVICE, _CLIENT_SECRET_KEY, value)

    def read(self) -> dict[str, object]:
        token = self._access_token()
        project = self._project_number or self._project_id
        if not project:
            raise RuntimeError("Google Cloud 프로젝트가 설정되지 않았습니다.")
        quota_infos = self._quota_infos(token, project)
        recent_usage, billing_enabled = self._recent_model_usage(token)
        # 결제가 연결됐다고 확인된 경우에만 유료 tier 한도를 쓴다. 유료 tier 단계(1~3)는
        # 구분할 수 없어 1 로 본다. 알 수 없으면 AI Studio 기본값인 무료 tier 로 본다.
        tier = "paid_tier_1" if billing_enabled else "free"
        limits = summarize_tier_limits(quota_infos, tier)
        return {
            "projectId": self._project_id,
            "checkedAt": int(time.time() * 1000),
            "tier": tier,
            "billingEnabled": billing_enabled,
            "quotas": [
                {"model": model, **values, "recentTokens": recent_usage.get(model, 0)}
                for model, values in limits.items()
            ],
        }

    def _quota_infos(self, token: str, project: str) -> list[Any]:
        infos: list[Any] = []
        page_token = ""
        for _ in range(_MAX_QUOTA_PAGES):
            params: dict[str, object] = {"pageSize": 100}
            if page_token:
                params["pageToken"] = page_token
            payload = self._request(f"{_QUOTA_INFOS_URL.format(project=project)}?{urlencode(params)}", token=token)
            page = payload.get("quotaInfos")
            if not isinstance(page, list):
                raise RuntimeError("Google Cloud Quotas 응답 형식이 올바르지 않습니다.")
            infos.extend(page)
            page_token = str(payload.get("nextPageToken") or "")
            if not page_token:
                break
        return infos

    def _recent_model_usage(self, token: str) -> tuple[dict[str, int], bool | None]:
        """최근 24시간 입력·출력 토큰을 정렬 힌트로만 읽고 저장하지 않는다.

        두 번째 값은 결제 연결 여부다. 조회에 성공하면 True, 결제 미연결로 거절되면 False,
        다른 이유로 실패하면 알 수 없음(None)이다.
        """
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=1)
        totals: dict[str, int] = {}
        billing_enabled: bool | None = None
        for metric in ("generate_content_usage_input_token_count", "generate_content_usage_output_token_count"):
            query = urlencode({
                "filter": f'metric.type="generativelanguage.googleapis.com/{metric}"',
                "interval.startTime": start.isoformat().replace("+00:00", "Z"),
                "interval.endTime": end.isoformat().replace("+00:00", "Z"),
                "view": "FULL",
                "pageSize": 100,
            })
            try:
                payload = self._request(f"https://monitoring.googleapis.com/v3/projects/{self._project_id}/timeSeries?{query}", token=token)
            except GoogleCloudRequestError as exc:
                if exc.billing_required:
                    return {}, False
                continue
            billing_enabled = True
            for series in payload.get("timeSeries", []):
                if not isinstance(series, dict):
                    continue
                model = str(series.get("metric", {}).get("labels", {}).get("model", ""))
                if not model:
                    continue
                totals[model] = totals.get(model, 0) + sum(
                    int(point.get("value", {}).get("int64Value", 0))
                    for point in series.get("points", []) if isinstance(point, dict)
                )
        return totals, billing_enabled

    def _access_token(self) -> str:
        refresh = keyring.get_password(_SERVICE, _REFRESH_KEY)
        if not refresh:
            raise RuntimeError("Google 계정을 먼저 연결해 주세요.")
        fields = {"refresh_token": refresh, "client_id": self._client_id, "grant_type": "refresh_token"}
        client_secret = self._client_secret()
        if client_secret:
            fields["client_secret"] = client_secret
        data = self._request("https://oauth2.googleapis.com/token", data=urlencode(fields).encode(), oauth_exchange=True)
        token = data.get("access_token")
        if not isinstance(token, str):
            raise RuntimeError("Google 접근 토큰을 갱신하지 못했습니다. 다시 연결해 주세요.")
        return token

    @staticmethod
    def _client_secret() -> str | None:
        try:
            return keyring.get_password(_SERVICE, _CLIENT_SECRET_KEY)
        except keyring.errors.KeyringError:
            return None

    @staticmethod
    def _request(url: str, token: str | None = None, data: bytes | None = None, oauth_exchange: bool = False) -> dict[str, Any]:
        request = Request(url, data=data, headers={"Authorization": f"Bearer {token}"} if token else {"Content-Type": "application/x-www-form-urlencoded"})
        try:
            with urlopen(request, timeout=20) as response:
                return json.loads(response.read().decode())
        except HTTPError as exc:
            try:
                body = json.loads(exc.read().decode("utf-8"))
            except (ValueError, UnicodeDecodeError):
                body = {}
            if not isinstance(body, dict):
                body = {}
            if oauth_exchange:
                code = str(body.get("error") or "token_exchange_failed")
                messages = {
                    "invalid_grant": "Google 인증 코드 또는 PKCE 검증값이 유효하지 않습니다. 앱에서 다시 연결해 주세요.",
                    "invalid_client": "OAuth 클라이언트 설정이 Google 프로젝트와 일치하지 않습니다.",
                    "redirect_uri_mismatch": "OAuth 리디렉션 주소가 클라이언트 설정과 일치하지 않습니다.",
                    "access_denied": "Google 계정이 요청한 프로젝트 권한을 승인하지 않았습니다.",
                    "invalid_request": "OAuth 클라이언트 요청에 필요한 값이 누락되었습니다. 클라이언트 보안 비밀번호를 저장한 뒤 다시 연결해 주세요.",
                }
                raise GoogleOAuthError(code, messages.get(code, f"Google 토큰 교환에 실패했습니다 ({code}).")) from exc
            error = body.get("error") if isinstance(body.get("error"), dict) else {}
            # 결제 미연결 거절은 구조화된 사유 코드 없이 안내 문장으로만 온다.
            billing_required = exc.code == 403 and "billing" in str(error.get("message", "")).lower()
            raise GoogleCloudRequestError(_CLOUD_READ_FAILED, billing_required=billing_required) from exc
        except (URLError, TimeoutError, ValueError) as exc:
            if oauth_exchange:
                raise GoogleOAuthError("network_error", "Google 토큰 서버에 연결하지 못했습니다.") from exc
            raise GoogleCloudRequestError(_CLOUD_READ_FAILED) from exc
