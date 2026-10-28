<!-- source: langchain-ai/docs  src/snippets/code-samples/permissions-interrupt-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from deepagents import FilesystemPermission, create_deep_agent
from langgraph.checkpoint.memory import InMemorySaver

agent = create_deep_agent(
    model=model,
    permissions=[
        # Pause for approval before writing anything under /secrets.
        FilesystemPermission(
            operations=["write"],
            paths=["/secrets/**"],
            mode="interrupt",
        ),
    ],
    # Interrupt mode requires a checkpointer to pause and resume.
    checkpointer=InMemorySaver(),
)
```
