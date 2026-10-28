<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-fetch-by-id-before-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python Before
from langsmith import Client

client = Client()
runs = client.list_runs(id=["<run-id-1>", "<run-id-2>"])
```
