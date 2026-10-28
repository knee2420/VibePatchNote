<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-pagination-after-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python After
import asyncio

from langsmith import Client


async def main():
    client = Client()
    project = await client.aread_project(project_name="default")
    runs = []
    async for run in client.runs.query(
        project_ids=[str(project.id)],
    ):
        runs.append(run)
        if len(runs) >= 150:
            break


asyncio.run(main())
```
