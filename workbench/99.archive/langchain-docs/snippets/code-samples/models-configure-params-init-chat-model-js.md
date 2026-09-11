<!-- source: langchain-ai/docs  src/snippets/code-samples/models-configure-params-init-chat-model-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts initChatModel
import { initChatModel } from "langchain/chat_models/universal";
import { createDeepAgent } from "deepagents";

const model = await initChatModel("google-genai:gemini-3.6-flash", {
  reasoningEffort: "medium", // [!code highlight]
});
const agent = createDeepAgent({ model });
```
