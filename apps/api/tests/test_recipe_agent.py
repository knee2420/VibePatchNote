"""Recipe Agent의 입력 고정·즉시 HEAD 반영 계약."""
from __future__ import annotations

import asyncio
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from agent_telemetry import StepCollector

from app.recipe.adapters import LocalRecipeRepository
from app.recipe.agents import DistillRecipeUseCase
from app.recipe.models import RecipeInputSnapshot, RecipeSourceAnchors


class FakeReader:
    def __init__(self, snapshot: RecipeInputSnapshot | None, missing: list[str] | None = None) -> None:
        self.snapshot = snapshot
        self.missing = missing or []
        self.calls = 0

    def readiness(
        self, _doc_id: str, _scaffold_id: str | None
    ) -> tuple[list[str], RecipeInputSnapshot | None]:
        self.calls += 1
        return self.missing, self.snapshot


class FakeExtractor:
    def __init__(self) -> None:
        self.snapshots: list[RecipeInputSnapshot] = []

    async def extract(self, snapshot: RecipeInputSnapshot) -> dict:
        self.snapshots.append(snapshot)
        return {
            "title": "지원서 작성 규격",
            "blocks": [{"id": "applicant", "role": "identity", "elementIds": ["element-1"]}],
            "validationRubric": ["필수 식별 정보를 확인한다."],
        }


class FakeRuntime:
    def __init__(self) -> None:
        self.cost_calls: list[tuple[str, str, str]] = []
        self.run_inputs: list[object] = []

    async def execute(self, _name: str, operation, *, doc_id: str, run_input: object):
        del doc_id
        self.run_inputs.append(run_input)
        return object(), await operation()

    def record_cost(self, run_id: str, _cost: object, *, model: str, status: str) -> None:
        self.cost_calls.append((run_id, model, status))


class FakeTelemetry:
    @contextmanager
    def workflow_session(
        self, *, run_id: str, doc_id: str, target_name: str
    ) -> Generator[StepCollector, None, None]:
        del run_id, doc_id, target_name
        yield StepCollector(pipeline_name="test")


class FakeHarness:
    model = "recipe-test-model"


def _snapshot() -> RecipeInputSnapshot:
    return RecipeInputSnapshot(
        docId="doc-1",
        documentTitle="입력 신청서",
        sourceAnchors=RecipeSourceAnchors(
            docId="doc-1",
            segmentArtifactId="segment-1",
            outlineArtifactId="outline-1",
            scaffoldId="wireframe-1",
            mappingFingerprint="mapping-1",
        ),
        segments=[{"id": "segment-1"}],
        outlineElements=[{"id": "element-1"}],
        mappings=[{"elementId": "element-1", "slotId": "slot-1"}],
        wireframe={"title": "입력 신청서", "slots": [{"id": "slot-1"}]},
    )


def _use_case(
    tmp_path: Path, reader: FakeReader
) -> tuple[DistillRecipeUseCase, FakeExtractor, LocalRecipeRepository, FakeRuntime]:
    repository = LocalRecipeRepository(tmp_path / "data" / "knowledge" / "recipes")
    extractor = FakeExtractor()
    runtime = FakeRuntime()
    use_case = DistillRecipeUseCase(
        reader=reader,
        extractor=extractor,
        repository=repository,
        runtime=runtime,
        telemetry=FakeTelemetry(),
        harness=FakeHarness(),
    )
    return use_case, extractor, repository, runtime


def test_readiness_reports_only_missing_recipe_sources(tmp_path: Path) -> None:
    use_case, _, _, _ = _use_case(
        tmp_path,
        FakeReader(None, ["채택된 세그먼트", "선택된 와이어프레임"]),
    )

    assert use_case.readiness("doc-1", None) == {
        "ready": False,
        "missing": ["채택된 세그먼트", "선택된 와이어프레임"],
        "snapshot": None,
    }


def test_distillation_commits_an_llm_recipe_head_immediately(tmp_path: Path) -> None:
    reader = FakeReader(_snapshot())
    use_case, extractor, repository, runtime = _use_case(tmp_path, reader)

    result = asyncio.run(use_case.execute("doc-1", "wireframe-1"))
    recipe = result["recipe"]
    head = repository.load_head(recipe["provenance"]["recipeId"])

    assert reader.calls == 1
    assert len(runtime.run_inputs) == 1
    assert len(extractor.snapshots) == 1
    assert head is not None
    assert head.provenance.origin == "llm"
    assert head.provenance.source_anchors.scaffold_id == "wireframe-1"
    assert head.spec["blocks"][0]["elementIds"] == ["element-1"]


def test_resume_uses_the_persisted_snapshot_without_rechecking_sources(tmp_path: Path) -> None:
    snapshot = _snapshot()
    reader = FakeReader(None, ["원본 문서"])
    use_case, extractor, repository, _ = _use_case(tmp_path, reader)

    result = asyncio.run(
        use_case.resume({"snapshot": snapshot.model_dump(mode="json", by_alias=True)})
    )
    recipe = result["recipe"]

    assert reader.calls == 0
    assert extractor.snapshots == [snapshot]
    assert repository.load_head(recipe["provenance"]["recipeId"]) is not None
