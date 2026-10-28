<!-- source: langchain-ai/docs  src/snippets/code-samples/tool-return-values-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langchain.tools import tool


@tool
def get_weather(city: str) -> str:
    """Get weather for a city."""
    return f"It is currently sunny in {city}."
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/29f72020-12be-4cfc-8cc4-e9d8bdfae60b/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
