<!-- source: langchain-ai/docs  src/snippets/code-samples/rag-deep-run-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { HumanMessage } from "@langchain/core/messages";

const EXAMPLE_QUERY =
  "How do I stream intermediate tool results from a subagent?";

if (import.meta.main) {
  const result = await agent.invoke({
    messages: [new HumanMessage(EXAMPLE_QUERY)],
  });

  for (const msg of result.messages ?? []) {
    if (msg.text) {
      console.log(msg.text);
    }
  }
}
```
