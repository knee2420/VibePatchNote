"""파이프라인 단계(Step) 추상 기반 클래스."""
from abc import ABC, abstractmethod
import logging

from app.documents.pipeline.context import DocumentPipelineContext

logger = logging.getLogger(__name__)


class PipelineStep(ABC):
    """
    파이프라인 내 독립 실행 단위.
    
    모든 Step은 context를 주입받아 수정/누적하며,
    프롬프트나 입출력 스키마는 각 Step 파일 내부에 함께 정의(Co-location)합니다.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """스텝 식별 이름."""
        pass

    @abstractmethod
    async def execute(self, ctx: DocumentPipelineContext) -> None:
        """컨텍스트를 갱신하는 비즈니스 로직."""
        pass
