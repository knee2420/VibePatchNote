"""애플리케이션의 유일한 객체 조립 장소.

도메인 서비스와 어댑터는 여기서만 실제 구현체를 선택한다. 서비스 모듈 안에서
전역 싱글턴을 만들거나 ``SomeAdapter()``를 직접 호출하지 않도록 한다.

**저장 위치가 정해지는 곳도 여기 한 군데다.** 어댑터는 자기가 어느 등급 루트
아래 있는지 모른 채 받은 경로만 쓴다. 그래야 "이건 지워도 되는가"의 답이
`core/storage/paths.py` 와 이 파일 두 곳에만 존재하게 된다.
"""
from pathlib import Path

from agent_runtime import (
    AgentRuntime,
    ApprovalService,
    LocalAgentRunRepository,
    LocalAgreementRepository,
    LocalLedger,
)
from dependency_injector import containers, providers
from llm_driver import (
    CliQuotaAvailability,
    ProviderStateStore,
    RuntimePolicyHarness,
)
from scaffold_engine import JsonPromptRunner, SegmentPipeline

from app.core.config import settings
from app.core.llm import (
    AgyStatusSnapshot,
    LlmManager,
    RuntimeExecutionPolicy,
)
from app.core.llm.credentials import OsCredentialStore
from app.core.observation import RunObservationStore
from app.documents.adapters import (
    LocalDocumentArtifactRepository,
    LocalDocumentCacheRepository,
    LocalDocumentSourceRepository,
    RunObservationArchiveAdapter,
)
from app.documents.service import DocumentService
from app.documents.use_cases import (
    DeleteDocumentUseCase,
    GetDocumentFileUseCase,
    ListDocumentArtifactsUseCase,
    RegisterDocumentUseCase,
)
from app.inspector.adapters import (
    DocumentTargetNameAdapter,
    LocalRunArchive,
    LocalSourceArchive,
    RegistryModelMatrixAdapter,
)
from app.inspector.service import InspectorService
from app.llm_settings.adapters import (
    AgyUsageReader,
    GoogleModelCatalog,
    GoogleQuotaReader,
    LocalAgyStatusLineSettings,
    LocalRuntimePolicyRepository,
)
from app.llm_settings.service import LlmSettingsService
from app.llm_settings.use_cases import (
    ReadGoogleProjectUsageUseCase,
    ResolveNextExecutionUseCase,
    UpdateRuntimePolicyUseCase,
)
from app.outline.adapters import (
    DocumentOutlineArchiveAdapter,
    EngineOutlineExtractAdapter,
    OutlineTelemetryAdapter,
)
from app.outline.agents import ExtractOutlineUseCase
from app.outline.service import OutlineService
from app.runtime.service import RuntimeService
from app.segments.adapters import (
    EngineSegmentExtractAdapter,
    LocalDocumentSourceReader,
    LocalOutlineReader,
    LocalSegmentAgreementRepository,
    LocalSegmentMappingCache,
    LocalSegmentRepository,
    LocalWireframeReader,
    SegmentCleanupAdapter,
    SegmentTelemetryAdapter,
)
from app.segments.agents import ExtractSegmentsUseCase
from app.segments.service import SegmentsService
from app.segments.use_cases import (
    GetAdoptedSegmentsUseCase,
    GetSegmentStructureViewUseCase,
    SaveSegmentRevisionUseCase,
    SetRelationshipOverrideUseCase,
)
from app.wireframe.adapters import (
    EngineWireframeExtractAdapter,
    HttpWireframeUrlResolver,
    LocalWireframeRepository,
    WireframeTelemetryAdapter,
)
from app.wireframe.agents import GenerateWireframeUseCase
from app.wireframe.service import WireframeArchiveService
from app.workspaces.adapters.local_workspace_repository import LocalWorkspaceRepository
from app.workspaces.service import WorkspaceService

_storage = settings.storage


def _policy_from_settings() -> RuntimeExecutionPolicy:
    """기본값을 설정에서 한 번 읽어 실행 정책을 만든다.

    `providers.Object(settings.x)` 로 쓰지 않는 이유는 그것이 **클래스 본문이
    실행되는 시점**, 즉 모듈 import 시점의 값을 복사하기 때문이다. 그러면 컨테이너를
    만들기 전에 설정을 바꿔도 반영되지 않고, 실제로 그 방식으로 굳어 있던
    인스펙터 매트릭스는 정책을 바꿔도 옛 값을 보여줬다.
    """
    return RuntimeExecutionPolicy(
        primary_provider=settings.primary_provider,
        fallback_provider=settings.fallback_provider,
        google_api_model=settings.google_api_model,
        google_api_timeout_seconds=settings.google_api_timeout_seconds,
        agent_cli_model=settings.agent_cli_model,
        agent_cli_timeout_seconds=settings.agent_cli_timeout_seconds,
        agent_cli_bin=settings.agent_cli_bin,
    )


class Container(containers.DeclarativeContainer):
    """API 프로세스의 장기 객체와 요청별 유스케이스를 정의한다."""

    # --- 실행 정책 (런타임 가변) --------------------------------------------
    # 설정 화면이 바꾸는 값은 여기 하나에 모여 있다. 전역 `settings` 는 부팅 시
    # 읽는 기본값만 제공하고, 이후의 변경은 이 객체에만 일어난다.
    execution_policy = providers.Singleton(_policy_from_settings)

    # --- 비밀 · 공급자 상태 ------------------------------------------------
    credential_store = providers.Singleton(OsCredentialStore)
    provider_state = providers.Singleton(
        ProviderStateStore, state_file=providers.Object(_storage.provider_state_file)
    )
    agy_status_snapshot = providers.Singleton(
        AgyStatusSnapshot, path=providers.Object(_storage.agy_status_file)
    )
    runtime_policy_repository = providers.Singleton(
        LocalRuntimePolicyRepository, path=providers.Object(_storage.llm_runtime_policy_file)
    )
    agy_status_line_settings = providers.Singleton(
        LocalAgyStatusLineSettings,
        settings_file=providers.Object(Path.home() / ".gemini" / "antigravity-cli" / "settings.json"),
        bridge_command=providers.Object(f'python "{settings.base_dir / "scripts" / "agy_status_bridge.py"}"'),
    )
    agy_usage_reader = providers.Singleton(AgyUsageReader, executable=providers.Object(settings.agent_cli_bin))
    cli_quota_availability = providers.Singleton(
        CliQuotaAvailability, reader=agy_usage_reader
    )
    google_model_catalog = providers.Singleton(GoogleModelCatalog, credentials=credential_store)
    google_quota_reader = providers.Singleton(
        GoogleQuotaReader,
        client_id=providers.Object(settings.google_oauth_client_id),
        project_id=providers.Object(settings.google_cloud_project_id),
        project_number=providers.Object(settings.google_cloud_project_number),
        redirect_uri=providers.Object(f"{settings.public_base_url}/api/v1/llm-settings/google-usage/oauth/callback"),
    )
    read_google_project_usage = providers.Factory(
        ReadGoogleProjectUsageUseCase, quotas=google_quota_reader, models=google_model_catalog
    )
    resolve_next_execution = providers.Factory(
        ResolveNextExecutionUseCase,
        credentials=credential_store,
        policy=execution_policy,
        provider_state=provider_state,
        cli_availability=cli_quota_availability,
    )
    update_runtime_policy = providers.Factory(
        UpdateRuntimePolicyUseCase,
        credentials=credential_store,
        policy=execution_policy,
        runtime_policy=runtime_policy_repository,
    )
    llm_manager = providers.Singleton(
        LlmManager,
        credentials=credential_store,
        policy=execution_policy,
        provider_state=provider_state,
        cli_availability=cli_quota_availability,
    )
    # 에이전트·유스케이스가 모두 이 하네스 하나를 공유한다. 싱글턴 DocumentService 가
    # 유스케이스를 붙들고 있으므로 구체 하네스를 넣으면 첫 해석 시점의 정책이 굳는다.
    # 그래서 매 호출마다 LlmManager 에게서 현재 정책의 하네스를 받아 쓰는 하네스를 넣는다.
    llm_harness = providers.Singleton(
        RuntimePolicyHarness, resolve=llm_manager.provided.get_harness
    )
    llm_settings_service = providers.Factory(
        LlmSettingsService,
        credentials=credential_store,
        policy=execution_policy,
        agy_status_bridge_command=providers.Object(
            f'python "{settings.base_dir / "scripts" / "agy_status_bridge.py"}"'
        ),
        provider_state=provider_state,
        agy_status=agy_status_snapshot,
        runtime_policy=runtime_policy_repository,
        agy_status_line=agy_status_line_settings,
        agy_usage=agy_usage_reader,
        google_models=google_model_catalog,
        google_quotas=google_quota_reader,
        google_usage=read_google_project_usage,
        cli_availability=cli_quota_availability,
        resolve_next_execution=resolve_next_execution,
        update_policy_uc=update_runtime_policy,
    )

    # --- [2 Runtime] · [B Agreement] · [A Observation] ---------------------
    agent_run_repository = providers.Singleton(
        LocalAgentRunRepository, base_dir=providers.Object(_storage.runs)
    )
    agreement_repository = providers.Singleton(
        LocalAgreementRepository, base_dir=providers.Object(_storage.agreements)
    )
    ledger = providers.Singleton(LocalLedger, base_dir=providers.Object(_storage.ledger))
    approval_service = providers.Singleton(ApprovalService, repository=agreement_repository)
    agent_runtime = providers.Singleton(
        AgentRuntime,
        runs=agent_run_repository,
        approvals=approval_service,
        ledger=ledger,
    )
    runtime_service = providers.Factory(
        RuntimeService,
        agent_runtime=agent_runtime,
        approvals=approval_service,
    )
    # `data/runs/{run_id}/` 안의 관측 자료를 아는 유일한 객체. 루트는 여기서 준다.
    run_observations = providers.Singleton(
        RunObservationStore, runs_dir=providers.Object(_storage.runs)
    )

    # --- [A Observation] 조회 (inspector) ----------------------------------
    # 관측 콘솔은 읽기 전용이지만 디스크 레이아웃을 알아서는 안 된다. 예전에는
    # 이 도메인만 컨테이너를 거치지 않고 `InspectorService()` 를 직접 만들었고,
    # 서비스가 `settings.storage.runs` 를 열어 run 디렉터리를 손으로 훑었다.
    run_archive = providers.Singleton(
        LocalRunArchive,
        lifecycles=agent_run_repository,
        observations=run_observations,
        ledger_dir=providers.Object(_storage.ledger),
    )
    source_archive = providers.Singleton(
        LocalSourceArchive, repo_root=providers.Object(settings.base_dir.parents[1])
    )
    model_matrix = providers.Singleton(
        # 값을 복사하지 않고 정책 객체를 준다. 예전에는 부팅 시점 값을 복사해서,
        # 설정 화면에서 공급자를 바꿔도 관측 매트릭스는 옛 값을 보여줬다.
        RegistryModelMatrixAdapter,
        policy=execution_policy,
    )

    # --- [4 Knowledge] 저장소 ----------------------------------------------
    document_source_repository = providers.Singleton(
        LocalDocumentSourceRepository,
        root_dir=providers.Object(_storage.knowledge_of("documents")),
    )
    document_artifact_repository = providers.Singleton(
        LocalDocumentArtifactRepository,
        root_dir=providers.Object(_storage.knowledge_of("documents")),
    )
    document_cache_repository = providers.Singleton(
        LocalDocumentCacheRepository,
        root_dir=providers.Object(_storage.cache_of("documents")),
    )
    segment_repository = providers.Singleton(
        LocalSegmentRepository,
        root_dir=providers.Object(_storage.knowledge_of("segments")),
    )
    segment_agreement_repository = providers.Singleton(
        LocalSegmentAgreementRepository,
        root_dir=providers.Object(_storage.agreements),
    )
    segment_mapping_cache = providers.Singleton(
        LocalSegmentMappingCache,
        root_dir=providers.Object(_storage.cache_of("segments")),
    )
    wireframe_url_resolver = providers.Singleton(
        HttpWireframeUrlResolver,
        asset_route_prefix=providers.Object("/api/v1/scaffolds"),
    )
    scaffold_repository = providers.Singleton(
        LocalWireframeRepository,
        root_dir=providers.Object(_storage.knowledge_of("scaffolds")),
    )
    scaffold_archive_service = providers.Singleton(
        WireframeArchiveService,
        repository=scaffold_repository,
        url_resolver=wireframe_url_resolver,
    )

    # --- [6 Models] · Runner 정의 ------------------------------------------
    json_prompt_runner = providers.Factory(JsonPromptRunner, harness=llm_harness)
    segment_pipeline = providers.Factory(SegmentPipeline, runner=json_prompt_runner)
    segment_extractor = providers.Factory(EngineSegmentExtractAdapter, pipeline=segment_pipeline)
    outline_extractor = providers.Factory(
        EngineOutlineExtractAdapter,
        harness=llm_harness,
        cache=document_cache_repository,
    )
    scaffold_extractor = providers.Factory(
        EngineWireframeExtractAdapter,
        harness=llm_harness,
        cache=document_cache_repository,
    )
    outline_archive = providers.Factory(
        DocumentOutlineArchiveAdapter,
        artifacts=document_artifact_repository,
    )

    # --- 도메인 관측 (Telemetry) -------------------------------------------
    outline_telemetry = providers.Singleton(OutlineTelemetryAdapter, store=run_observations)
    wireframe_telemetry = providers.Singleton(WireframeTelemetryAdapter, store=run_observations)
    segment_telemetry = providers.Singleton(SegmentTelemetryAdapter, store=run_observations)

    # --- documents 유스케이스 ----------------------------------------------
    register_document = providers.Factory(
        RegisterDocumentUseCase, source=document_source_repository
    )
    get_document_file = providers.Factory(
        GetDocumentFileUseCase, source=document_source_repository
    )
    document_run_archive = providers.Singleton(
        RunObservationArchiveAdapter, observations=run_observations
    )
    segment_cleanup = providers.Singleton(
        SegmentCleanupAdapter,
        repository=segment_repository,
        agreements=segment_agreement_repository,
        cache=segment_mapping_cache,
    )
    delete_document = providers.Factory(
        DeleteDocumentUseCase,
        source=document_source_repository,
        artifacts=document_artifact_repository,
        cache=document_cache_repository,
        scaffolds=scaffold_archive_service,
        runs=document_run_archive,
        segments=segment_cleanup,
    )
    list_document_artifacts = providers.Factory(
        ListDocumentArtifactsUseCase,
        source=document_source_repository,
        artifacts=document_artifact_repository,
    )
    extract_outline = providers.Factory(
        ExtractOutlineUseCase,
        source=document_source_repository,
        engine=outline_extractor,
        archive=outline_archive,
        agent_runtime=agent_runtime,
        telemetry=outline_telemetry,
        llm_harness=llm_harness,
    )
    segment_source_reader = providers.Factory(
        LocalDocumentSourceReader, source=document_source_repository
    )
    segment_outline_reader = providers.Factory(
        LocalOutlineReader, artifacts=document_artifact_repository
    )
    segment_wireframe_reader = providers.Factory(
        LocalWireframeReader, repository=scaffold_repository
    )
    extract_segments = providers.Factory(
        ExtractSegmentsUseCase,
        source=segment_source_reader,
        extractor=segment_extractor,
        repository=segment_repository,
        agent_runtime=agent_runtime,
        telemetry=segment_telemetry,
        llm_harness=llm_harness,
    )
    get_adopted_segments = providers.Factory(
        GetAdoptedSegmentsUseCase,
        source=segment_source_reader,
        repository=segment_repository,
    )
    save_segment_revision = providers.Factory(
        SaveSegmentRevisionUseCase,
        source=segment_source_reader,
        repository=segment_repository,
        cache=segment_mapping_cache,
    )
    get_segment_structure_view = providers.Factory(
        GetSegmentStructureViewUseCase,
        source=segment_source_reader,
        segments=segment_repository,
        agreements=segment_agreement_repository,
        cache=segment_mapping_cache,
        outlines=segment_outline_reader,
        wireframes=segment_wireframe_reader,
    )
    set_segment_relationship_override = providers.Factory(
        SetRelationshipOverrideUseCase,
        source=segment_source_reader,
        segments=segment_repository,
        agreements=segment_agreement_repository,
        cache=segment_mapping_cache,
        outlines=segment_outline_reader,
        wireframes=segment_wireframe_reader,
    )
    generate_scaffold = providers.Factory(
        GenerateWireframeUseCase,
        source=document_source_repository,
        engine=scaffold_extractor,
        archive=scaffold_archive_service,
        agent_runtime=agent_runtime,
        telemetry=wireframe_telemetry,
    )

    # 재개 핸들러를 Agent Runtime 에 등록하는 지점이므로 요청마다 새로 만들지 않는다.
    outline_service = providers.Factory(
        OutlineService,
        extract_outline=extract_outline,
    )

    document_service = providers.Singleton(
        DocumentService,
        register=register_document,
        get_file=get_document_file,
        delete=delete_document,
        artifacts=list_document_artifacts,
    )
    segments_service = providers.Factory(
        SegmentsService,
        extract=extract_segments,
        adopted=get_adopted_segments,
        save_revision=save_segment_revision,
        structure=get_segment_structure_view,
        override=set_segment_relationship_override,
        agent_runtime=agent_runtime,
    )

    # --- [3 Memory] --------------------------------------------------------
    workspace_repository = providers.Singleton(
        LocalWorkspaceRepository, base_dir=providers.Object(_storage.sessions)
    )
    workspace_service = providers.Factory(WorkspaceService, repository=workspace_repository)

    # inspector 는 문서 저장소를 import 하지 않는다. 식별자를 이름으로 옮기는 일은
    # 그 애그리거트를 소유한 쪽에 묻고, 어느 저장소인지는 여기서 정한다.
    inspector_target_names = providers.Singleton(
        DocumentTargetNameAdapter, source=document_source_repository
    )
    inspector_service = providers.Factory(
        InspectorService,
        runs=run_archive,
        target_names=inspector_target_names,
        sources=source_archive,
        matrix=model_matrix,
    )
