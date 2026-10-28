<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/public-runs-before-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
# Share a trace.
share_url = client.share_run(run_id)

# Read the shared runs and one specific run.
runs = list(client.list_shared_runs(share_token))
run = client.read_shared_run(share_token, run_id=run_id)

# Check whether the run is shared.
share_url = client.read_run_shared_link(run_id)

# Remove public access.
client.unshare_run(run_id)
```
