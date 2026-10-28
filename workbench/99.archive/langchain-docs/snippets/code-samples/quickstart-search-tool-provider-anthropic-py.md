<!-- source: langchain-ai/docs  src/snippets/code-samples/quickstart-search-tool-provider-anthropic-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python Anthropic
from deepagents import create_deep_agent

# Anthropic's built-in web search — no extra install or API key needed
internet_search = {"type": "web_search_20260209", "name": "web_search"}
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/23ede352-9014-4dd9-8ee4-6b65a5ad7e80/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
