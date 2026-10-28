<!-- source: langchain-ai/docs  src/snippets/code-samples/subagents-troubleshooting-differentiate-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
subagents = [
    {
        "name": "quick-researcher",
        "description": "For simple, quick research questions that need 1-2 searches. Use when you need basic facts or definitions.",
        "system_prompt": "You are the quick-researcher subagent.",
    },
    {
        "name": "deep-researcher",
        "description": "For complex, in-depth research requiring multiple searches, synthesis, and analysis. Use for comprehensive reports.",
        "system_prompt": "You are the deep-researcher subagent.",
    },
]
```
