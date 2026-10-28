<!-- source: langchain-ai/docs  src/snippets/code-samples/mcp-auth-per-server-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from fastmcp.client.group import ClientGroup


async def load_with_per_server_auth(
    billing_url: str, docs_token: str, docs_url: str
) -> list:
    # Each server carries its own credential. A `ClientGroup` keeps one
    # connection per server, so each authenticates independently.
    group = ClientGroup(
        {
            "billing": Client(billing_url, auth="oauth"),
            "docs": Client(docs_url, auth=docs_token),
        }
    )
    async with MCPAdapter(group) as adapter:
        return await adapter.list_tools()
```
