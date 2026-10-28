<!-- source: langchain-ai/docs  src/snippets/code-samples/sql-agent-create-agent-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langchain.agents import create_agent


agent = create_agent(
    model,
    tools,
    system_prompt=system_prompt,
)
```
