<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/experiment-runs-query-basic-before-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python Before
from langsmith import Client

client = Client()
experiment_id = client.read_project(project_name=experiment_name).id
results = client.get_experiment_results(
    project_id=experiment_id,
    limit=20,
    preview=True,
)
examples_with_runs = list(results["examples_with_runs"])
```
