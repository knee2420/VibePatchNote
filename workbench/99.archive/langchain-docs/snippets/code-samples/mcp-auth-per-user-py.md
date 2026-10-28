<!-- source: langchain-ai/docs  src/snippets/code-samples/mcp-auth-per-user-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from fastmcp.client import Client
from fastmcp.client.auth import BearerAuth

CONFIG = {
    "mcpServers": {
        "docs": { "url": "https://example.com/mcp" }
    }
}

async def make_graph(runtime):
    user = runtime.user.identity if runtime.user is not None else "anonymous"
    auth = BearerAuth(token_for(user))  # exchange for a per-user token
    async with MCPAdapter(Client(CONFIG, auth=auth)) as adapter:
        tools = await adapter.list_tools()
        return create_agent("claude-sonnet-5", tools)
```
