<!-- source: langchain-ai/docs  src/snippets/code-samples/subagents-troubleshooting-concise-prompt-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
system_prompt = """...

IMPORTANT: Return only the essential summary.
Do NOT include raw data, intermediate search results, or detailed tool outputs.
Your response should be under 500 words."""
```
