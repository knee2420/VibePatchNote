<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-filter-metadata-before-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python Before
from langsmith import Client

client = Client()
filter_str = 'and(eq(metadata_key, "user_id"), eq(metadata_value, "u_123"))'
runs = client.list_runs(project_name="default", filter=filter_str)
```
