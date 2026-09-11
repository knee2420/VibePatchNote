<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-retrieve-basic-after-sh.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```bash
PROJECT_ID=$(curl -s "https://api.smith.langchain.com/api/v1/sessions?name=default&limit=1" \
  -H "x-api-key: $LANGSMITH_API_KEY" | jq -r '.[0].id')

RUN_ID="<run-id>"
START_TIME="2026-06-01T12:00:00Z"

curl "https://api.smith.langchain.com/api/v2/runs/$RUN_ID?project_id=$PROJECT_ID&start_time=$START_TIME&selects=NAME&selects=STATUS&selects=TOTAL_TOKENS" \
  -H "x-api-key: $LANGSMITH_API_KEY"
```
