<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-sql-agent-visualize-graph-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
import pathlib

pathlib.Path("graph.png").write_bytes(agent.get_graph().draw_mermaid_png())
```
