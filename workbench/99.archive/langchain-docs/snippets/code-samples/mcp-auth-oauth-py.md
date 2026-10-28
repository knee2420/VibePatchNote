<!-- source: langchain-ai/docs  src/snippets/code-samples/mcp-auth-oauth-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
async def load_tools_with_oauth(url: str) -> list:
    # "oauth" runs discovery, dynamic client registration, the browser redirect,
    # and the token exchange. Pass `OAuth(..., token_storage=...)` to persist
    # tokens across runs instead of repeating the browser step each time.
    async with MCPAdapter(Client(url, auth="oauth")) as adapter:
        return await adapter.list_tools()
```
