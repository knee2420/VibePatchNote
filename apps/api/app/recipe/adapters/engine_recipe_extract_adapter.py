from __future__ import annotations

import asyncio

from scaffold_engine.recipe import RecipePipeline

from ..models import RecipeInputSnapshot


class EngineRecipeExtractAdapter:
    def __init__(self, pipeline: RecipePipeline) -> None:
        self._pipeline = pipeline

    async def extract(self, snapshot: RecipeInputSnapshot) -> dict:
        return await asyncio.to_thread(self._pipeline.distill, snapshot.model_dump(mode="json", by_alias=True))
