"""애플리케이션의 유일한 객체 조립 장소.

도메인 서비스와 어댑터는 여기서만 실제 구현체를 선택한다. 서비스 모듈 안에서
전역 싱글턴을 만들거나 ``SomeAdapter()``를 직접 호출하지 않도록 한다.

**저장 위치가 정해지는 곳도 여기 한 군데다.** 어댑터는 자기가 어느 등급 루트
아래 있는지 모른 채 받은 경로만 쓴다. 그래야 "이건 지워도 되는가"의 답이
`core/storage/paths.py` 와 이 파일 두 곳에만 존재하게 된다.
"""
from pathlib import Path

from dependency_injector import containers, providers
from scaffold_engine import JsonPromptRunner

from app.core.agent_runtime import (
    AgentRuntime,
    ApprovalService,
    LocalAgentRunRepository,
    LocalAgreementRepository,
    LocalLedger,
)
from app.core.config import settings
from app.core.llm import (
    AgyStatusSnapshot,
    LedgerExecutionRecorder,
    LlmManager,
    RuntimePolicyHarness,
)
from app.core.llm.availability import CliQuotaAvailability
from app.core.llm.credentials import OsCredentialStore
from app.core.llm.provider_state import ProviderStateStore
from app.documents.adapters import (
    EngineSegmentScanAdapter,
    LocalDocumentArtifactRepository,
    LocalDocumentCacheRepository,
    LocalDocumentSourceRepository,
)
from app.documents.agents import OutlineAnalysisAgent, ScaffoldGenerationAgent
from app.documents.service import DocumentService
from app.documents.use_cases import (
    DeleteDocumentUseCase,
    ExtractOutlineUseCase,
    GenerateScaffoldUseCase,
    GetDocumentFileUseCase,
    ListDocumentArtifactsUseCase,
    RegisterDocumentUseCase,
    ScanDocumentSegmentsUseCase,
)
from app.llm_settings.adapters import (
    AgyUsageReader,
    GoogleModelCatalog,
    GoogleQuotaReader,
    LocalAgyStatusLineSettings,
    LocalRuntimePolicyRepository,
)
from app.llm_settings.service import LlmSettingsService
from app.llm_settings.use_cases import ReadGoogleProjectUsageUseCase
from app.scaffolds.adapters.local_scaffold_repository import LocalScaffoldRepository
from app.scaffolds.service import ScaffoldArchiveService
from app.workspaces.adapters.local_workspace_repository import LocalWorkspaceRepository
from app.workspaces.service import WorkspaceService

_storage = settings.storage


class Container(containers.DeclarativeContainer):
    """API 프로세스의 장기 객체와 요청별 유스케이스를 정의한다."""

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
    llm_manager = providers.Singleton(
        LlmManager,
        credentials=credential_store,
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
        provider_state=provider_state,
        agy_status=agy_status_snapshot,
        runtime_policy=runtime_policy_repository,
        agy_status_line=agy_status_line_settings,
        agy_usage=agy_usage_reader,
        google_models=google_model_catalog,
        google_quotas=google_quota_reader,
        google_usage=read_google_project_usage,
        cli_availability=cli_quota_availability,
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
    execution_recorder = providers.Singleton(LedgerExecutionRecorder, ledger=ledger)

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
    scaffold_repository = providers.Singleton(
        LocalScaffoldRepository,
        root_dir=providers.Object(_storage.knowledge_of("scaffolds")),
    )
    scaffold_archive_service = providers.Singleton(
        ScaffoldArchiveService, repository=scaffold_repository
    )

    # --- [6 Models] · Agent 정의 -------------------------------------------
    outline_analysis_agent = providers.Factory(OutlineAnalysisAgent, harness=llm_harness)
    scaffold_generation_agent = providers.Factory(ScaffoldGenerationAgent, harness=llm_harness)
    json_prompt_runner = providers.Factory(JsonPromptRunner, harness=llm_harness)
    segment_scanner = providers.Factory(EngineSegmentScanAdapter, runner=json_prompt_runner)

    # --- documents 유스케이스 ----------------------------------------------
    register_document = providers.Factory(
        RegisterDocumentUseCase, source=document_source_repository
    )
    get_document_file = providers.Factory(
        GetDocumentFileUseCase, source=document_source_repository
    )
    delete_document = providers.Factory(
        DeleteDocumentUseCase,
        source=document_source_repository,
        artifacts=document_artifact_repository,
        cache=document_cache_repository,
        scaffolds=scaffold_archive_service,
    )
    list_document_artifacts = providers.Factory(
        ListDocumentArtifactsUseCase,
        source=document_source_repository,
        artifacts=document_artifact_repository,
    )
    extract_outline = providers.Factory(
        ExtractOutlineUseCase,
        source=document_source_repository,
        artifacts=document_artifact_repository,
        cache=document_cache_repository,
        agent_runtime=agent_runtime,
        outline_agent=outline_analysis_agent,
        recorder=execution_recorder,
        llm_harness=llm_harness,
    )
    scan_document_segments = providers.Factory(
        ScanDocumentSegmentsUseCase,
        source=document_source_repository,
        artifacts=document_artifact_repository,
        scanner=segment_scanner,
        agent_runtime=agent_runtime,
    )
    generate_scaffold = providers.Factory(
        GenerateScaffoldUseCase,
        source=document_source_repository,
        scaffolds=scaffold_archive_service,
        agent=scaffold_generation_agent,
        agent_runtime=agent_runtime,
    )

    # 재개 핸들러를 Agent Runtime 에 등록하는 지점이므로 요청마다 새로 만들지 않는다.
    document_service = providers.Singleton(
        DocumentService,
        register=register_document,
        get_file=get_document_file,
        delete=delete_document,
        artifacts=list_document_artifacts,
        extract_outline=extract_outline,
        scan_segments=scan_document_segments,
        generate_scaffold=generate_scaffold,
        agent_runtime=agent_runtime,
        approvals=approval_service,
    )

    # --- [3 Memory] --------------------------------------------------------
    workspace_repository = providers.Singleton(
        LocalWorkspaceRepository, base_dir=providers.Object(_storage.sessions)
    )
    workspace_service = providers.Factory(WorkspaceService, repository=workspace_repository)
