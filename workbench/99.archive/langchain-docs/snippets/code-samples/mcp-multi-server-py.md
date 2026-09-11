<!-- source: langchain-ai/docs  src/snippets/code-samples/mcp-multi-server-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langchain.agents import create_agent
from langchain.mcp import MCPAdapter

CONFIG = {
    "mcpServers": {
        "weather": {"command": "python", "args": ["/path/to/weather_server.py"]},
        "calc": {"command": "python", "args": ["/path/to/calc_server.py"]},
    }
}


async def fleet_agent(config):
    async with MCPAdapter(config) as adapter:
        # Every tool is prefixed with its config key (`weather_...`, `calc_...`),
        # so two servers exposing the same tool name stay distinguishable.
        tools = await adapter.list_tools()
        return create_agent("claude-sonnet-5", tools)
```
