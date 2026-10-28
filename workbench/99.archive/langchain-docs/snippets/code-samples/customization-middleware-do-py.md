<!-- source: langchain-ai/docs  src/snippets/code-samples/customization-middleware-do-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langchain.agents.middleware import AgentMiddleware


class CustomMiddleware(AgentMiddleware):
    def __init__(self):
        pass

    def before_agent(self, state, runtime):
        return {"x": state.get("x", 0) + 1}  # Update graph state instead
```
