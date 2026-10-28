<!-- source: langchain-ai/docs  src/snippets/code-samples/mda-quickstart-search-tool-provider-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
```ts OpenAI
import { defineDeepAgent } from "managed-deepagents";

// OpenAI's built-in web search — no extra install or API key needed
export const agent = defineDeepAgent({
  name: "research-assistant",
  model: "openai:gpt-5.5",
  tools: [{ type: "web_search_preview" }],
});
```

```ts Google
import { defineDeepAgent } from "managed-deepagents";

// Google's built-in search — no extra install or API key needed
export const agent = defineDeepAgent({
  name: "research-assistant",
  model: "google-genai:gemini-3.6-flash",
  tools: [{ google_search: {} }],
});
```

```ts Anthropic
import { defineDeepAgent } from "managed-deepagents";

// Anthropic's built-in web search — no extra install or API key needed
export const agent = defineDeepAgent({
  name: "research-assistant",
  model: "anthropic:claude-sonnet-4-6",
  tools: [{ type: "web_search_20250305", name: "web_search" }],
});
```
</CodeGroup>
