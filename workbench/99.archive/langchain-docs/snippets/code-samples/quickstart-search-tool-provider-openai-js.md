<!-- source: langchain-ai/docs  src/snippets/code-samples/quickstart-search-tool-provider-openai-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts OpenAI
import { createDeepAgent } from "deepagents";

// OpenAI's built-in web search — no extra install or API key needed
const internetSearch = { type: "web_search_preview" };
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/0fcaa18f-5d7a-4f4a-a64e-109391575671/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
