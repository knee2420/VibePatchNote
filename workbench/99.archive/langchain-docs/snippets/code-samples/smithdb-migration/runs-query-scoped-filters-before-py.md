<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-scoped-filters-before-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python Before
from langsmith import Client

client = Client()
runs = client.list_runs(
    project_name="default",
    filter='eq(name, "RetrieveDocs")',
    trace_filter='and(eq(feedback_key, "user_score"), eq(feedback_score, 1))',
    tree_filter='eq(name, "ExpandQuery")',
)
```
