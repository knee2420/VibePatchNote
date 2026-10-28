<!-- source: langchain-ai/docs  src/snippets/code-samples/data-analysis-create-agent-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langchain_core.utils.uuid import uuid7

from deepagents import create_deep_agent
from langchain.agents.middleware import TodoListMiddleware
from langgraph.checkpoint.memory import InMemorySaver

checkpointer = InMemorySaver()

agent = create_deep_agent(
    model="google_genai:gemini-3.6-flash",
    tools=[slack_send_message],
    backend=backend,
    checkpointer=checkpointer,
    middleware=[TodoListMiddleware()],
)

thread_id = str(uuid7())
config = {"configurable": {"thread_id": thread_id}}
```
