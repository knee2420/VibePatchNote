<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-geturl-after-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python After
import asyncio

from langsmith import Client


async def main():
    client = Client()
    run_id = "<run-id>"
    run = client.read_run(run_id)
    response = await client.runs.get_url(
        run.id,
        project_id=str(run.session_id),
        trace_id=str(run.trace_id),
        start_time=run.start_time.isoformat(),  # Optional, but speeds up retrieval
    )
    print(response.url)


asyncio.run(main())
```
