<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-add-to-queue-after-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python After
from langsmith import Client

client = Client()
queue_id = "<queue-id>"
runs = list(client.list_runs(project_name="default", limit=5))
client.add_runs_to_annotation_queue(
    queue_id,
    runs=[
        {
            "run_id": run.id,
            "session_id": run.session_id,
            "start_time": run.start_time,
        }
        for run in runs
    ],
)
```
