<!-- source: langchain-ai/docs  src/snippets/code-samples/async-subagents-hybrid-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from deepagents import AsyncSubAgent

async_subagents = [
    AsyncSubAgent(
        name="researcher",
        description="Research agent",
        graph_id="researcher",
        # No url → ASGI (co-deployed)
    ),
    AsyncSubAgent(
        name="coder",
        description="Coding agent",
        graph_id="coder",
        url="https://coder-deployment.langsmith.dev",
        # url present → HTTP (remote)
    ),
]
```
