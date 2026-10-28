<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/experiment-runs-query-pagination-before-sh.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```bash Before
curl -X POST "https://api.smith.langchain.com/api/v1/datasets/$DATASET_ID/runs" \
  -H "x-api-key: $LANGSMITH_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg eid "$EXPERIMENT_ID" '{
    "session_ids": [$eid],
    "limit": 20,
    "offset": 20
  }')"
```
