<!-- source: langchain-ai/docs  src/snippets/code-samples/quickstart-search-tool-provider-anthropic-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts Anthropic
import { createDeepAgent } from "deepagents";

// Anthropic's built-in web search — no extra install or API key needed
const internetSearch = { type: "web_search_20250305", name: "web_search" };
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/51cb31a7-1665-4e62-a17c-342eeb1db53f/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
