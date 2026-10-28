<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/threads-query-list-all-after-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python After
import asyncio
from datetime import datetime, timedelta, timezone

from langsmith import Client


async def main():
    client = Client()
    project = await client.aread_project(project_name="default")
    async for thread in client.threads.query(
        project_id=str(project.id),
        min_start_time=datetime.now(timezone.utc) - timedelta(days=30),
        max_start_time=datetime.now(timezone.utc),
    ):
        print(thread.thread_id, thread.count)


asyncio.run(main())
```
