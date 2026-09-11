<!-- source: langchain-ai/docs  src/snippets/code-samples/customization-middleware-dont-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
class CustomMiddlewareBad(AgentMiddleware):
    def __init__(self):
        self.x = 1

    def before_agent(self, state, runtime):
        self.x += 1  # Mutation causes race conditions
```
