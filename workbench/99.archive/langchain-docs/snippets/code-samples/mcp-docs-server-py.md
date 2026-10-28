<!-- source: langchain-ai/docs  src/snippets/code-samples/mcp-docs-server-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langchain.agents import create_agent
from langchain.mcp import MCPAdapter


async def main():
    async with MCPAdapter("https://docs.langchain.com/mcp") as adapter:  # [!code highlight]
        tools = await adapter.list_tools()
        agent = create_agent("claude-sonnet-5", tools)
        return await agent.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": "How do I add short-term memory to a LangChain agent?",
                    }
                ]
            }
        )
```
