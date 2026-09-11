<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-filter-time-range-after-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python After
import asyncio
from datetime import datetime, timedelta

from langsmith import Client


async def main():
    client = Client()
    project = await client.aread_project(project_name="default")
    runs = client.runs.query(
        project_ids=[str(project.id)],
        min_start_time=datetime.now() - timedelta(days=1),
        run_type="LLM",
    )


asyncio.run(main())
```
