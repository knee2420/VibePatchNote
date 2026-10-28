from typing import Annotated

from agent_runtime import AgentRunInput, AgentRuntime
from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, status

from app.bootstrap.container import Container

from .agents import DistillRecipeUseCase
from .schemas import (
    CreateRecipeRequest,
    RecipeResponse,
    RecipeRunRequest,
    SaveRecipeRequest,
)
from .service import RecipeNotFoundError, RecipeRevisionConflictError, RecipeService

router = APIRouter()
RecipeServiceDep = Annotated[RecipeService, Depends(Provide[Container.recipe_service])]
RecipeDistillDep = Annotated[DistillRecipeUseCase, Depends(Provide[Container.distill_recipe])]
RuntimeDep = Annotated[AgentRuntime, Depends(Provide[Container.agent_runtime])]


def _error(exc: Exception) -> HTTPException:
    if isinstance(exc, RecipeNotFoundError):
        return HTTPException(404, str(exc))
    if isinstance(exc, RecipeRevisionConflictError):
        return HTTPException(409, {"message": str(exc), "currentRevisionId": exc.current_revision_id})
    return HTTPException(400 if isinstance(exc, ValueError) else 500, str(exc))


@router.post("", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
@inject
async def create_recipe(payload: CreateRecipeRequest, service: RecipeServiceDep):
    try:
        return RecipeResponse(recipe=service.create(title=payload.title, spec=payload.spec, source_anchors=payload.source_anchors))
    except Exception as exc:
        raise _error(exc) from exc


@router.get("/readiness/{doc_id}")
@inject
async def recipe_readiness(
    doc_id: str,
    scaffold_id: str | None = None,
    use_case: RecipeDistillDep = None,
):
    result = use_case.readiness(doc_id, scaffold_id)
    return {"ready": result["ready"], "missing": result["missing"]}


@router.post("/runs", status_code=status.HTTP_202_ACCEPTED)
@inject
async def start_recipe_run(
    payload: RecipeRunRequest,
    use_case: RecipeDistillDep,
    runtime: RuntimeDep,
):
    ready = use_case.readiness(payload.doc_id, payload.scaffold_id)
    if not ready["ready"]:
        raise HTTPException(409, {"missing": ready["missing"]})
    run = await runtime.submit(
        use_case.name,
        lambda: use_case.execute(payload.doc_id, payload.scaffold_id),
        doc_id=payload.doc_id,
        run_input=AgentRunInput(
            use_case=use_case.name,
            doc_id=payload.doc_id,
            payload={"snapshot": ready["snapshot"].model_dump(mode="json", by_alias=True)},
        ),
    )
    return {"runId": run.run_id, "status": run.status}


@router.get("/by-scaffold/{scaffold_id}", response_model=list[RecipeResponse])
@inject
async def list_recipes_for_scaffold(scaffold_id: str, service: RecipeServiceDep):
    return [RecipeResponse(recipe=item) for item in service.list_for_scaffold(scaffold_id)]


@router.get("/by-document/{doc_id}", response_model=list[RecipeResponse])
@inject
async def list_recipes_for_document(doc_id: str, service: RecipeServiceDep):
    return [RecipeResponse(recipe=item) for item in service.list_for_document(doc_id)]


@router.get("/{recipe_id}", response_model=RecipeResponse)
@inject
async def get_recipe(recipe_id: str, service: RecipeServiceDep):
    try:
        return RecipeResponse(recipe=service.get(recipe_id))
    except Exception as exc:
        raise _error(exc) from exc


@router.put("/{recipe_id}", response_model=RecipeResponse)
@inject
async def save_recipe(recipe_id: str, payload: SaveRecipeRequest, service: RecipeServiceDep):
    try:
        return RecipeResponse(recipe=service.save_revision(recipe_id, base_revision_id=payload.base_revision_id, title=payload.title, spec=payload.spec))
    except Exception as exc:
        raise _error(exc) from exc
