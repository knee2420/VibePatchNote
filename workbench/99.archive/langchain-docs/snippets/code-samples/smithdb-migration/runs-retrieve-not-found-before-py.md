<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-retrieve-not-found-before-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python Before
from langsmith import Client
from langsmith.utils import LangSmithNotFoundError

client = Client()
run_id = "<run-id>"

try:
    run = client.read_run(run_id)
except LangSmithNotFoundError:
    print(f"Run {run_id} not found")
```
