<!-- source: langchain-ai/docs  src/snippets/code-samples/mcp-auth-bearer-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from fastmcp.client import Client
from langchain.mcp import MCPAdapter


async def load_tools_with_bearer(url: str, token: str) -> list:
    # `auth` accepts a bearer-token string, the literal "oauth" (full OAuth 2.1
    # with dynamic client registration), or any `httpx.Auth`.
    async with MCPAdapter(Client(url, auth=token)) as adapter:
        return await adapter.list_tools()
```
