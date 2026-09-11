<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-filter-root-before-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python Before
from langsmith import Client

client = Client()
runs = client.list_runs(project_name="default", is_root=True)
```
