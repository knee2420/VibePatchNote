from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, Response

from app.bootstrap.container import Container

from .schemas import (
    AgyStatusLineInstallResponse,
    AgyUsageResponse,
    GoogleApiKeyRequest,
    GoogleApiModelResponse,
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
