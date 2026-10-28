<!-- source: langchain-ai/docs  src/snippets/code-samples/context-engineering-research-subagent-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
research_subagent = {
    "name": "researcher",
    "description": "Conducts research on a topic",
    "system_prompt": """You are a research assistant.
    IMPORTANT: Return only the essential summary (under 500 words).
    Do NOT include raw search results or detailed tool outputs.""",
    "tools": [web_search],
}
```
