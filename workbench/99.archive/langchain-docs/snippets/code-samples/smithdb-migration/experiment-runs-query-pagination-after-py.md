<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/experiment-runs-query-pagination-after-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python After
from langsmith import Client
import asyncio


async def main():
    client = Client()
    experiment_id = client.read_project(project_name=experiment_name).id
    page = await client.datasets.experiment_runs.query(
        str(dataset_id),
        experiment_ids=[str(experiment_id)],
        page_size=1,
    )
    runs = []
    async for run in page:
        runs.append(run)
        if len(runs) >= 100:
            break
    return runs


examples_with_runs = asyncio.run(main())
```
