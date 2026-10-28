<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-sql-agent-stream-agent-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const question = "Which genre on average has the longest tracks?";

const stream = await agent.streamEvents(
  { messages: [{ role: "user", content: question }] },
  { version: "v3" },
);

for await (const message of stream.messages) {
  for await (const token of message.text) {
    process.stdout.write(token);
  }
}

const finalState = await stream.output;
```
