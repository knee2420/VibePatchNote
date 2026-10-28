<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-list-root-as-traces-before-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python Before
from langsmith import Client

client = Client()
project = client.read_project(project_name="default")

root_runs = list(client.list_runs(project_id=project.id, is_root=True, limit=5))
for root_run in root_runs:
    print(root_run.trace_id, root_run.name)
```
