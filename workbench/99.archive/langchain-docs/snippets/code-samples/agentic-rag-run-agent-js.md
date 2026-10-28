<!-- source: langchain-ai/docs  src/snippets/code-samples/agentic-rag-run-agent-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { HumanMessage } from "@langchain/core/messages";

async function runAgenticRag() {
  const inputs = {
    messages: [
      new HumanMessage(
        "What does Lilian Weng say about types of reward hacking?",
      ),
    ],
  };

  for await (const chunk of await graph.stream(inputs, {
    streamMode: "values",
  })) {
    const lastMessage = chunk.messages.at(-1);
    const text =
      typeof lastMessage?.content === "string"
        ? lastMessage.content
        : lastMessage?.text;
    if (text) {
      console.log(text);
    }
  }
}
```
