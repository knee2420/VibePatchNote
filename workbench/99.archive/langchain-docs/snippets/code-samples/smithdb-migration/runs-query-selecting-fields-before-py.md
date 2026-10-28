<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-selecting-fields-before-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python Before
from langsmith import Client

client = Client()
# returns a default set of fields; no explicit selection needed
runs = client.list_runs(project_name="default")
for run in runs:
    print(run.id, run.name, run.run_type, run.status, run.start_time, run.inputs, run.error)
```
