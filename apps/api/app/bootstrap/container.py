"""애플리케이션의 유일한 객체 조립 장소.

도메인 서비스와 어댑터는 여기서만 실제 구현체를 선택한다. 서비스 모듈 안에서
전역 싱글턴을 만들거나 ``SomeAdapter()``를 직접 호출하지 않도록 한다.
"""
from dependency_injector import containers, providers
from scaffold_engine import JsonPromptRunner

from app.core.config import settings
from app.core.llm import llm_manager
from app.core.storage.document_storage import document_storage
from app.documents.adapters.local_document_analysis_repository import (
    LocalDocumentAnalysisRepository,
)
from app.documents.adapters.local_document_source_repository import (
    LocalDocumentSourceRepository,
)
from app.documents.adapters.local_outline_storage import OutlineStorageRepository
from app.documents.adapters.native_segment_scan_adapter import EngineSegmentScanAdapter
from app.documents.service import ExtractionService
from app.scaffolds.adapters.local_scaffold_repository import LocalScaffoldRepository
from app.scaffolds.service import ScaffoldArchiveService
from app.workspaces.adapters.local_workspace_repository import LocalWorkspaceRepository
from app.workspaces.service import WorkspaceService


class Container(containers.DeclarativeContainer):
    """API 프로세스의 장기 객체와 요청별 유스케이스를 정의한다."""

    llm_harness = providers.Singleton(llm_manager.get_harness)
    json_prompt_runner = providers.Factory(JsonPromptRunner, harness=llm_harness)
    segment_scanner = providers.Factory(
        EngineSegmentScanAdapter,
        runner=json_prompt_runner,
    )
    document_analysis_repository = providers.Singleton(
        LocalDocumentAnalysisRepository,
        outline_repository=providers.Singleton(OutlineStorageRepository),
        document_store=providers.Object(document_storage),
    )
    document_source_repository = providers.Singleton(
        LocalDocumentSourceRepository,
        upload_dir=providers.Object(settings.upload_dir),
        legacy_source_dir=providers.Object(settings.legacy_document_source_dir),
    )
    scaffold_repository = providers.Singleton(LocalScaffoldRepository)
    scaffold_archive_service = providers.Singleton(
        ScaffoldArchiveService,
        repository=scaffold_repository,
    )
    workspace_repository = providers.Singleton(
        LocalWorkspaceRepository,
        database_file=providers.Object(settings.db_file),
    )
    workspace_service = providers.Factory(
        WorkspaceService,
        repository=workspace_repository,
    )

    extraction_service = providers.Factory(
        ExtractionService,
        segment_scanner=segment_scanner,
        document_analysis=document_analysis_repository,
        document_source=document_source_repository,
        llm_harness=llm_harness,
        scaffold_archives=scaffold_archive_service,
    )
