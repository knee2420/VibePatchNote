<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/traces-list-runs-basic-after-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python After
import asyncio
from datetime import datetime, timedelta, timezone

from langsmith import Client


async def main():
    client = Client()
    project = await client.aread_project(project_name="default")
    trace_id = "<trace-id>"
    response = await client.traces.list_runs(
        trace_id,
        project_id=str(project.id),
        selects=["NAME", "RUN_TYPE", "STATUS"],
    )
    for run in response.items:
        print(run.name, run.run_type, run.status)


asyncio.run(main())
```
