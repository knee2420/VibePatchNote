<!-- source: langchain-ai/docs  src/snippets/code-samples/skills-invoke-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
result = agent.invoke(
    {"messages": [{"role": "user", "content": "What is LangGraph?"}]},
    config={"configurable": {"thread_id": "1"}},
)
```
