<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-list-root-as-traces-after-sh.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```bash
PROJECT_ID=$(curl -s "https://api.smith.langchain.com/api/v1/sessions?name=default&limit=1" \
  -H "x-api-key: $LANGSMITH_API_KEY" | jq -r '.[0].id')

MAX_START=$(date -u +%Y-%m-%dT%H:%M:%SZ)
MIN_START=$(date -u -d '-1 month' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-1m +%Y-%m-%dT%H:%M:%SZ)
curl -X POST "https://api.smith.langchain.com/api/v2/traces/query" \
  -H "x-api-key: $LANGSMITH_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg pid "$PROJECT_ID" --arg min "$MIN_START" --arg max "$MAX_START" '{
    "project_id": $pid,
    "min_start_time": $min,
    "max_start_time": $max,
    "page_size": 5,
    "selects": ["NAME"]
  }')" | jq '.items | map({trace_id: .root_run.trace_id, name: .root_run.name})'
```
