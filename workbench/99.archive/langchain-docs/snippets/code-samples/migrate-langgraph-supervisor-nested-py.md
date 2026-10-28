<!-- source: langchain-ai/docs  src/snippets/code-samples/migrate-langgraph-supervisor-nested-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langchain.agents import create_agent
from langchain.tools import tool
from langgraph.checkpoint.memory import InMemorySaver

# Middle-tier agent with its own subagents
billing_team = create_agent(
    model=model,
    tools=[call_refunds_agent, call_invoices_agent],
    system_prompt="Coordinate billing specialists.",
)

@tool("billing_team", description="Handle billing, refunds, and invoices.")
def call_billing_team(query: str) -> str:
    result = billing_team.invoke({"messages": [{"role": "user", "content": query}]})
    return result["messages"][-1].content

# Top-level supervisor
top_supervisor = create_agent(
    model=model,
    tools=[call_billing_team, call_support_agent],
    system_prompt="Route billing to billing_team and general support to support_agent.",
    checkpointer=InMemorySaver(),
)
```
