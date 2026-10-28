<!-- source: langchain-ai/docs  src/snippets/code-samples/mcp-multimodal-tool-content-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langchain.mcp import MCPAdapter


async def access_multimodal_tool_content(server) -> None:
    async with MCPAdapter(server) as adapter:
        [screenshot] = await adapter.list_tools()

    # An MCP result arrives as LangChain content blocks. Image and file content
    # convert into standardized `image`/`file` blocks alongside `text`.
    message = await screenshot.ainvoke(
        {"name": "take_screenshot", "args": {}, "id": "1", "type": "tool_call"}
    )
    for block in message.content_blocks:  # [!code highlight]
        if block["type"] == "text":  # [!code highlight]
            print(f"Text: {block['text']}")  # [!code highlight]
        elif block["type"] == "image":  # [!code highlight]
            print(f"Image mime type: {block.get('mime_type')}")  # [!code highlight]
            print(  # [!code highlight]
                f"Image base64: {block.get('base64', '')[:20]}..."  # [!code highlight]
            )  # [!code highlight]
```
