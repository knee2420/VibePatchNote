<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-filter-metadata-after-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python After
import asyncio

from langsmith import Client


async def main():
    client = Client()
    filter_str = 'and(eq(metadata_key, "user_id"), eq(metadata_value, "u_123"))'
    project = await client.aread_project(project_name="default")
    runs = client.runs.query(project_ids=[str(project.id)], filter=filter_str)


asyncio.run(main())
```
