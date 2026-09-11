<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/traces-query-filters-before-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python Before
from langsmith import Client

client = Client()
project = client.read_project(project_name="default")

# v1 has no root-run-only filter concept — is_root plus a regular filter is
# the closest equivalent, still scanning every run to match.
error_traces = client.list_runs(
    project_id=project.id,
    is_root=True,
    filter='eq(status, "error")',
    limit=5,
)
for run in error_traces:
    print(run.trace_id)
```
