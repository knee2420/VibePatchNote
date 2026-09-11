<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/feedback-create-after-sh.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```bash
RUN_ID="<run-id>"
SESSION_ID="<session-id>"

curl -X POST "https://api.smith.langchain.com/api/v1/feedback" \
  -H "x-api-key: $LANGSMITH_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg run "$RUN_ID" --arg session "$SESSION_ID" '{"run_id": $run, "key": "user_feedback", "score": 1, "session_id": $session}')"
```
