<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/feedback-create-after-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python After
from langsmith import Client

client = Client()
run_id = "<run-id>"
session_id = "<session-id>"
client.create_feedback(
    run_id=run_id,
    key="user_feedback",
    score=1,
    session_id=session_id,
)
```
