<!-- source: langchain-ai/docs  src/snippets/code-samples/agentic-rag-visualize-graph-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from IPython.display import Image, display

display(Image(graph.get_graph().draw_mermaid_png()))
```
