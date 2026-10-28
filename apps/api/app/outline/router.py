"""outline 도메인의 FastAPI 라우터."""
from typing import Annotated

from agent_runtime import AgentRunInput, AgentRuntime
from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from app.bootstrap.container import Container

from .agents import ExtractOutlineUseCase
from .schemas import ExtractOutlineRequest, ExtractOutlineResponse
from .service import OutlineService

router = APIRouter()

OutlineServiceDep = Annotated[
    OutlineService,
    Depends(Provide[Container.outline_service]),
]
ExtractOutlineDep = Annotated[
    ExtractOutlineUseCase,
    Depends(Provide[Container.extract_outline]),
]
AgentRuntimeDep = Annotated[
    AgentRuntime,
    Depends(Provide[Container.agent_runtime]),
]


@router.post("/extract", response_model=ExtractOutlineResponse)
@inject
async def extract_outline(
    payload: ExtractOutlineRequest,
    service: OutlineServiceDep,
):
    """문서의 계층 아웃라인과 세부 엘리먼트를 추출합니다."""
    try:
        result = await service.extract_outline(
            payload.doc_id, force_refresh=payload.force_refresh
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")

    response = (
        ExtractOutlineResponse(**result) if isinstance(result, dict) else result
    )
    if response.status == "failed":
        error = response.error
        retryable = getattr(error, "retryable", False) if error else False
        status_code = 503 if retryable else 424
        return JSONResponse(
            status_code=status_code, content=response.model_dump(by_alias=True)
        )
    return response


@router.post("/runs", status_code=202)
@inject
async def start_outline_run(
    payload: ExtractOutlineRequest,
    use_case: ExtractOutlineDep,
    runtime: AgentRuntimeDep,
) -> dict[str, str]:
    """긴 AI 목차 분석을 비동기 Agent Runtime 작업으로 접수합니다."""
    run = await runtime.submit(
        use_case.name,
        lambda: use_case.execute(payload.doc_id, force_refresh=payload.force_refresh),
        doc_id=payload.doc_id,
        run_input=AgentRunInput(
            use_case=use_case.name,
            doc_id=payload.doc_id,
            payload={"docId": payload.doc_id, "forceRefresh": payload.force_refresh},
        ),
    )
    return {"runId": run.run_id, "status": run.status}


@router.get("/{doc_id}", response_model=ExtractOutlineResponse)
@inject
async def get_adopted_outline(
    doc_id: str,
    service: OutlineServiceDep,
):
    """문서의 채택된 목차(HEAD)를 읽습니다. 없으면 404."""
    adopted = service.load_adopted(doc_id)
    if not adopted:
        raise HTTPException(status_code=404, detail="채택된 아웃라인이 없습니다.")
    return adopted
