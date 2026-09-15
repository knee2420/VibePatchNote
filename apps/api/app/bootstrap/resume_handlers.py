"""재개 가능한 유스케이스를 Agent Runtime 에 등록한다.

재개는 클로저가 아니라 **"이름 + 입력 스냅샷"** 으로만 가능하다
(`AgentRuntime.resume`). 따라서 등록은 프로세스가 뜰 때 **한 번, 빠짐없이**
일어나야 한다.

예전에는 이 등록이 `DocumentService.__init__` 안에 있었다. 그 서비스는 지연
생성되는 싱글턴이라 재시작 직후 documents API 를 한 번도 부르지 않으면 등록이
되어 있지 않았고, 부팅 직후의 고아 정리와 승인 재개가 바로 그 시점이다. 게다가
등록된 것은 세 유스케이스 중 하나뿐이어서, `outline` 과 `wireframe` 은
`waiting_for_configuration` 까지 가 놓고 이어갈 수단이 없었다 — 사용자에게는
"승인했는데 아무 일도 일어나지 않는" 상태로 보인다.

등록 대상을 늘릴 때의 기준은 하나다. **`AgentRunInput` 에 payload 를 남기는
유스케이스는 여기에도 있어야 한다.** 남기기만 하고 등록하지 않으면 재개할 수
없는 대기 상태가 다시 생긴다.
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any, Awaitable, Callable

from app.segments.agents import ExtractSegmentsUseCase
from app.segments.schemas import to_run_result

if TYPE_CHECKING:  # pragma: no cover - 타입 전용
    from app.bootstrap.container import Container

logger = logging.getLogger(__name__)

ResumeHandler = Callable[[dict[str, Any]], Awaitable[dict[str, Any]]]


async def _extract_segments_result(use_case: ExtractSegmentsUseCase, doc_id: str) -> dict[str, Any]:
    return to_run_result(await use_case.execute(doc_id))


def register_resume_handlers(container: "Container") -> list[str]:
    """컨테이너가 아는 재개 가능 유스케이스를 전부 런타임에 등록한다.

    등록된 이름 목록을 돌려준다. 부팅 로그에 남겨 두면 "재개가 안 된다"는
    보고를 받았을 때 등록 누락인지 입력 스냅샷 누락인지 바로 갈린다.
    """
    runtime = container.agent_runtime()

    extract_outline = container.extract_outline()
    generate_scaffold = container.generate_scaffold()
    extract_segments = container.extract_segments()
    distill_recipe = container.distill_recipe()

    handlers: dict[str, ResumeHandler] = {
        extract_outline.name: lambda payload: extract_outline.execute(
            payload["docId"], force_refresh=bool(payload.get("forceRefresh", False))
        ),
        generate_scaffold.name: lambda payload: generate_scaffold.execute(
            payload["docId"], pages=payload.get("pages")
        ),
        # 세그먼트 유스케이스만 도메인 객체를 돌려준다. 런타임 이력은 dict 만
        # 받으므로 재개 경로에서도 같은 변환을 거쳐야 한다.
        extract_segments.name: lambda payload: _extract_segments_result(
            extract_segments, payload["docId"]
        ),
        distill_recipe.name: distill_recipe.resume,
    }

    for name, handler in handlers.items():
        runtime.register_use_case(name, handler)

    registered = sorted(handlers)
    logger.info("[Bootstrap] 재개 가능 유스케이스 %d건 등록: %s", len(registered), ", ".join(registered))
    return registered
