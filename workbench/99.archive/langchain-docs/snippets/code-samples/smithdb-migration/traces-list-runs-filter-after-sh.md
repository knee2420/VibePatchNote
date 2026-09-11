<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/traces-list-runs-filter-after-sh.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```bash
PROJECT_ID=$(curl -s "https://api.smith.langchain.com/api/v1/sessions?name=default&limit=1" \
  -H "x-api-key: $LANGSMITH_API_KEY" | jq -r '.[0].id')
TRACE_ID="<trace-id>"

curl -G "https://api.smith.langchain.com/api/v2/traces/$TRACE_ID/runs" \
  -H "x-api-key: $LANGSMITH_API_KEY" \
  --data-urlencode "project_id=$PROJECT_ID" \
  --data-urlencode "filter=eq(run_type, \"llm\")" \
  --data-urlencode "selects=NAME" \
  --data-urlencode "selects=STATUS"
```
