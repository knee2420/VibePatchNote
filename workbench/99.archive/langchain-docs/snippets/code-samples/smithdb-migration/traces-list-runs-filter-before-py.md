<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/traces-list-runs-filter-before-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python Before
from langsmith import Client

client = Client()
project = client.read_project(project_name="default")
trace_id = "<trace-id>"
llm_runs = list(
    client.list_runs(
        project_id=project.id,
        trace_id=trace_id,
        filter='eq(run_type, "llm")',
    )
)
```
