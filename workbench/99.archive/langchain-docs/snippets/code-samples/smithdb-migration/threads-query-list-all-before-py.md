<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/threads-query-list-all-before-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python Before
from langsmith import Client

client = Client()
threads = client.list_threads(project_name="default")
for thread in threads:
    print(thread["thread_id"], thread["count"])
```
