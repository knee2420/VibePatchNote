from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import HTMLResponse

from app.bootstrap.container import Container

from .adapters import GoogleOAuthError
from .schemas import (
    AgyStatusLineInstallResponse,
    AgyUsageResponse,
    GoogleApiKeyRequest,
    GoogleApiModelResponse,
    GoogleOAuthClientSecretRequest,
    GoogleProjectUsageResponse,
    GoogleQuotaAuthorizationResponse,
    GoogleQuotaStatusResponse,
    ProviderStatus,
    ProviderStatusResponse,
    RuntimeDashboardResponse,
    RuntimePolicy,
    RuntimePolicyUpdateRequest,
)
from .service import LlmSettingsService

router = APIRouter()
LlmSettingsServiceDep = Annotated[LlmSettingsService, Depends(Provide[Container.llm_settings_service])]


@router.get("/providers", response_model=ProviderStatusResponse)
@inject
async def list_providers(service: LlmSettingsServiceDep):
    return ProviderStatusResponse(**service.list_providers())


@router.get("/runtime", response_model=RuntimeDashboardResponse)
@inject
async def get_runtime_dashboard(service: LlmSettingsServiceDep):
    return RuntimeDashboardResponse(**service.runtime_dashboard())


@router.post("/runtime/agy-statusline/install", response_model=AgyStatusLineInstallResponse)
@inject
async def install_agy_status_line(service: LlmSettingsServiceDep):
    try:
        return AgyStatusLineInstallResponse(**service.install_agy_status_line())
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/runtime/usage", response_model=AgyUsageResponse)
@inject
async def get_agy_usage(service: LlmSettingsServiceDep):
    try:
        return AgyUsageResponse(**service.agy_usage())
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/providers/google-api/models", response_model=GoogleApiModelResponse)
@inject
async def get_google_api_models(service: LlmSettingsServiceDep):
    try:
        return GoogleApiModelResponse(**service.google_api_models())
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/google-usage/oauth/authorization", response_model=GoogleQuotaAuthorizationResponse)
@inject
async def start_google_quota_authorization(service: LlmSettingsServiceDep):
    try:
        return GoogleQuotaAuthorizationResponse(**service.google_quota_authorization_url())
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/google-usage/oauth/callback", response_class=HTMLResponse)
@inject
async def complete_google_quota_authorization(code: str, state: str, service: LlmSettingsServiceDep):
    try:
        service.complete_google_quota_authorization(code, state)
    except GoogleOAuthError as exc:
        return HTMLResponse(
            f"<p>연결하지 못했습니다: {exc}</p><p>오류 코드: {exc.code}</p>",
            status_code=400,
        )
    except RuntimeError:
        return HTMLResponse("<p>연결하지 못했습니다. 앱에서 다시 연결해 주세요.</p>", status_code=400)
    return HTMLResponse("<p>Google 연결이 완료되었습니다. 이 창을 닫고 앱으로 돌아가세요.</p><script>window.close()</script>")


@router.get("/google-usage/status", response_model=GoogleQuotaStatusResponse)
@inject
async def get_google_quota_status(service: LlmSettingsServiceDep):
    try:
        return GoogleQuotaStatusResponse(**service.google_quota_status())
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.put("/google-usage/oauth/client-secret", response_model=GoogleQuotaStatusResponse)
@inject
async def configure_google_oauth_client_secret(
    request: GoogleOAuthClientSecretRequest, service: LlmSettingsServiceDep
):
    try:
        return GoogleQuotaStatusResponse(**service.configure_google_oauth_client_secret(request.client_secret))
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/google-usage", response_model=GoogleProjectUsageResponse)
@inject
def get_google_project_usage(service: LlmSettingsServiceDep):
    # Google API 여러 곳을 동기로 부른다(2~3초). 이벤트 루프를 막지 않도록 스레드풀에서 돈다.
    try:
        return GoogleProjectUsageResponse(**service.google_project_usage())
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.put("/runtime/policy", response_model=RuntimePolicy)
@inject
async def update_runtime_policy(request: RuntimePolicyUpdateRequest, service: LlmSettingsServiceDep):
    try:
        return RuntimePolicy(**service.update_runtime_policy(
            request.primary_model, request.primary_timeout_seconds,
            request.fallback_model, request.fallback_timeout_seconds,
        ))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/providers/google-api", response_model=ProviderStatus)
@inject
async def configure_google_api(request: GoogleApiKeyRequest, service: LlmSettingsServiceDep):
    return ProviderStatus(**service.configure_google_api(request.api_key))


@router.delete("/providers/google-api", status_code=204)
@inject
async def remove_google_api(service: LlmSettingsServiceDep) -> Response:
    service.remove_google_api()
    return Response(status_code=204)
