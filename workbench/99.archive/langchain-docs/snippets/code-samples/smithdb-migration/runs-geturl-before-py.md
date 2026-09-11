<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-geturl-before-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python Before
from langsmith import Client

client = Client()
run_id = "<run-id>"
run = client.read_run(run_id)
url = client.get_run_url(run=run)
print(url)
```
