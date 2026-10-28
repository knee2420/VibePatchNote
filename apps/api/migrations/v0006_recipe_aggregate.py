"""v6 — reserve the new independent DocumentRecipe aggregate root."""
from pathlib import Path


def run(base_dir: Path) -> None:
    (base_dir / "data" / "knowledge" / "recipes").mkdir(parents=True, exist_ok=True)
