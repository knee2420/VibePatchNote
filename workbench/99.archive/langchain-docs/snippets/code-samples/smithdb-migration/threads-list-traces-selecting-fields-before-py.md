<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/threads-list-traces-selecting-fields-before-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python Before
from langsmith import Client

client = Client()
thread_id = "<thread-id>"
for run in client.read_thread(
    thread_id=thread_id,
    project_name="default",
    select=["id", "total_tokens", "total_cost"],
):
    print(run.id, run.total_tokens, run.total_cost)
```
