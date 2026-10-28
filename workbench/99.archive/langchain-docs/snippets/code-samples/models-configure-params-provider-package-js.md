<!-- source: langchain-ai/docs  src/snippets/code-samples/models-configure-params-provider-package-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts Provider package
import { ChatGoogle } from "@langchain/google";
import { createDeepAgent } from "deepagents";

const model = new ChatGoogle({
  model: "gemini-3.1-pro-preview",
  reasoningEffort: "medium", // [!code highlight]
});
const agent = createDeepAgent({ model });
```
