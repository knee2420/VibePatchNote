"""inspector 가 외부 세계에 요구하는 계약.

관측 콘솔은 **읽기 전용 조회 계층**이지만, 그렇다고 디스크 레이아웃을 알아도
되는 것은 아니다. 예전에는 이 도메인만 컨테이너를 거치지 않고
`InspectorService()` 를 직접 만들었고, 서비스가 `settings.storage.runs` 를 읽어
run 디렉터리를 손으로 훑었다. 그 결과:

- `data/runs/{run_id}/` 레이아웃을 아는 곳이 세 군데가 되었고
  (`agent_runtime` 레포지토리 · `core/llm/tracer` · 여기),
- `knowledge/documents/{doc_id}/meta.json` 을 직접 읽어 **documents 도메인의
  저장 레이아웃에 디스크 수준으로 결합**되었다. import 가 없을 뿐 결합은 있었다.

그래서 조회에 필요한 것을 전부 포트로 세운다. 서비스는 경로를 모르고,
어느 파일에 무엇이 들어 있는지도 모른다.
"""
from __future__ import annotations

from typing import Any, Mapping, Optional, Protocol


class RunArchivePort(Protocol):
    """실행 기록 보관소. run 디렉터리의 레이아웃을 아는 유일한 계약."""

    def list_run_ids(self) -> list[str]:
        """보관된 run 식별자. 순서는 보장하지 않는다."""
        ...

    def lifecycle(self, run_id: str) -> Any | None:
        """실행 생애주기 상태(`AgentRun`). 계측이 없어도 존재한다."""
        ...

    def meta(self, run_id: str) -> dict[str, Any]:
        """텔레메트리 요약. 없으면 빈 딕셔너리다 — 없는 것이 정상이다."""
        ...

    def spans(self, run_id: str) -> list[dict[str, Any]]:
        ...

    def attempts(self, run_id: str) -> list[dict[str, Any]]:
        ...

    def snapshots(self, run_id: str) -> list[dict[str, Any]]:
        """단계 스냅샷. 옛 형식은 어댑터가 현재 형식으로 옮겨서 준다."""
        ...

    def has_span_detail(self, run_id: str) -> bool:
        ...

    def payload(self, run_id: str, digest: str) -> Optional[str]:
        """포인터가 가리키는 대용량 본문."""
        ...

    def delete(self, run_id: str) -> bool:
        ...

    def ledger_by_run(self) -> Mapping[str, dict[str, Any]]:
        """월별 원장을 `run_id` 로 색인한 것. 비용의 정본이다."""
        ...


class TargetNamePort(Protocol):
    """작업 대상의 사람이 읽는 이름.

    조회 계층은 대상이 무엇인지 모른다. 식별자를 이름으로 바꾸는 일은 그
    애그리거트를 소유한 쪽이 한다.
    """

    def display_name(self, target_id: str) -> Optional[str]:
        ...


class SourceArchivePort(Protocol):
    """저장소 안의 소스 코드 조회."""

    def read(
        self,
        *,
        file_path: Optional[str] = None,
        symbol: Optional[str] = None,
        module: Optional[str] = None,
    ) -> Optional[dict[str, Any]]:
        ...


class ModelMatrixPort(Protocol):
    """모델 레지스트리와 라우팅 설정의 현재 모습."""

    def describe(self) -> dict[str, Any]:
        ...
