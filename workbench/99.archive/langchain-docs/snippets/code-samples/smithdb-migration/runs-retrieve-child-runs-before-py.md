<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-retrieve-child-runs-before-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python Before
from langsmith import Client

client = Client()
run_id = "<run-id>"

run = client.read_run(run_id, load_child_runs=True)

# `child_runs` holds the direct children, each with its own nested `child_runs`.
# `child_run_ids` holds every descendant, at any depth.
for child in run.child_runs or []:
    print(child.name, child.run_type, len(child.child_runs or []))
print(len(run.child_run_ids or []), "descendants")
```
