<!-- source: langchain-ai/docs  src/snippets/code-samples/subagents-email-tools-bad-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
# ❌ Bad: Too many tools
email_agent = {
    "name": "email-sender",
    "tools": [send_email, web_search_tool, database_query, format_document],  # Unfocused
}
```
