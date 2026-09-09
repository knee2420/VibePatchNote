"""애플리케이션의 유일한 객체 조립 장소.

도메인 서비스와 어댑터는 여기서만 실제 구현체를 선택한다. 서비스 모듈 안에서
전역 싱글턴을 만들거나 ``SomeAdapter()``를 직접 호출하지 않도록 한다.
"""
from dependency_injector import containers, providers

from app.core.llm import llm_manager
from app.core.storage.document_storage import document_storage
from app.core.workflow.engine import NativeWorkflowEngine
from app.core.workflow.nodes.agent_json_node import AgentJsonNode
from app.documents.adapters.local_document_analysis_repository import (
    LocalDocumentAnalysisRepository,
)
from app.documents.service import ExtractionService
from app.documents.storage import outline_storage
from app.scaffolds.service import scaffold_archive_service


class Container(containers.DeclarativeContainer):
    """API 프로세스의 장기 객체와 요청별 유스케이스를 정의한다."""

    llm_harness = providers.Singleton(llm_manager.get_harness)
    agent_node = providers.Factory(AgentJsonNode, harness=llm_harness)
    workflow_engine = providers.Factory(NativeWorkflowEngine, agent_node=agent_node)
    document_analysis_repository = providers.Singleton(
        LocalDocumentAnalysisRepository,
        outline_repository=providers.Object(outline_storage),
        document_store=providers.Object(document_storage),
    )

    extraction_service = providers.Factory(
        ExtractionService,
        workflow_engine=workflow_engine,
        document_analysis=document_analysis_repository,
        llm_harness=llm_harness,
        scaffold_archives=providers.Object(scaffold_archive_service),
    )
