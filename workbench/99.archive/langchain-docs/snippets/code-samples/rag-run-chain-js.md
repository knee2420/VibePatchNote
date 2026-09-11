<!-- source: langchain-ai/docs  src/snippets/code-samples/rag-run-chain-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const chainInputMessage = `What is Task Decomposition?`;
const chainInputs = {
  messages: [{ role: "user", content: chainInputMessage }],
};

const chainStream = await agent.streamEvents(chainInputs, { version: "v3" });
for await (const message of chainStream.messages) {
  for await (const token of message.text) {
    process.stdout.write(token);
  }
}

finalState = await chainStream.output;
```
