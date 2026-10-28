<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-add-to-queue-before-sh.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```bash
QUEUE_ID="<queue-id>"
RUN_ID="<run-id>"

curl -X POST "https://api.smith.langchain.com/api/v1/annotation-queues/$QUEUE_ID/runs" \
  -H "x-api-key: $LANGSMITH_API_KEY" \
  -H "Content-Type: application/json" \
  -d "[\"$RUN_ID\"]"
```
