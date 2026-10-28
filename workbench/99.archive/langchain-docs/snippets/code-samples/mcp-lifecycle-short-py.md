<!-- source: langchain-ai/docs  src/snippets/code-samples/mcp-lifecycle-short-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langchain.agents import create_agent
from langchain.mcp import MCPAdapter


async def build_agent(target):
    # Discover and build the agent inside the adapter's context. The tools hold
    # the client, so the agent stays usable after the context exits.
    async with MCPAdapter(target) as adapter:
        tools = await adapter.list_tools()
        return create_agent("claude-sonnet-5", tools)
```
