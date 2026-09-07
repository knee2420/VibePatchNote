"""문서 파이프라인 실행기 (DocumentPipelineRunner) 및 시나리오 레시피.

PipelineContext 기반 상태 누적 패턴:
Step들을 순차적으로 실행하며 context에 결과를 누적하고, 완료 후 스토리지에 자동 영속화합니다.
"""
import logging
import time
from typing import List, Optional

from app.documents.pipeline.context import DocumentPipelineContext
from app.documents.pipeline.steps.base import PipelineStep
from app.documents.pipeline.steps.elements_step import EnrichElementsStep
from app.documents.pipeline.steps.geometry_step import ExtractGeometryStep
from app.documents.pipeline.steps.outline_step import ExtractOutlineStep
from app.documents.pipeline.storage import OutlineStorageRepository, outline_storage

logger = logging.getLogger(__name__)


class DocumentPipelineRunner:
    """선언된 Step 목록을 순차 실행하는 오케스트레이터."""

    def __init__(
        self,
        steps: List[PipelineStep],
        storage: Optional[OutlineStorageRepository] = None,
    ) -> None:
        self.steps = steps
        self.storage = storage or outline_storage

    async def run(self, ctx: DocumentPipelineContext) -> DocumentPipelineContext:
        started = time.time()
        ctx.status = "processing"
        ctx.log(f"[runner] 파이프라인 시작: {ctx.filename} (총 {len(self.steps)}단계)")

        try:
            for idx, step in enumerate(self.steps, start=1):
                step_start = time.time()
                ctx.log(f"[runner] Step {idx}/{len(self.steps)} [{step.name}] 실행 중...")
                await step.execute(ctx)
                elapsed = time.time() - step_start
                ctx.log(f"[runner] Step {idx} [{step.name}] 완료 ({elapsed:.2f}s)")

            ctx.status = "completed"
            # 스토리지 영속화
            self.storage.save(ctx)
            total_elapsed = time.time() - started
            ctx.log(f"[runner] 파이프라인 전체 완료 ({total_elapsed:.2f}s)")
        except Exception as exc:
            ctx.status = "failed"
            ctx.log(f"[runner] 파이프라인 중단: {exc}")
            logger.error("파이프라인 실행 실패: %s", exc, exc_info=True)
            raise

        return ctx


def create_outline_and_elements_pipeline(
    model: Optional[str] = None,
) -> DocumentPipelineRunner:
    """
    [시나리오: 아웃라인 + 엘리먼트 2단계 체이닝 파이프라인]
    1. ExtractGeometryStep: PyMuPDF 실측 기하 및 텍스트 블록
    2. ExtractOutlineStep: 대주제/목차 아웃라인 뼈대 추출 (LLM)
    3. EnrichElementsStep: 아웃라인 기반 표/폼필드/목록 세부 추출 및 바인딩 (LLM)
    """
    steps: List[PipelineStep] = [
        ExtractGeometryStep(),
        ExtractOutlineStep(model=model),
        EnrichElementsStep(model=model),
    ]
    return DocumentPipelineRunner(steps=steps)
