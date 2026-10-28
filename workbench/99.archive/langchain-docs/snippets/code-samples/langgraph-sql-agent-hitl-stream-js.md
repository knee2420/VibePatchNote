<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-sql-agent-hitl-stream-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const hitlQuestion = "Which genre on average has the longest tracks?";

const hitlStream = await agentWithHuman.streamEvents(
  { messages: [{ role: "user", content: hitlQuestion }] },
  { ...config, version: "v3" },
);

for await (const message of hitlStream.messages) {
  for await (const token of message.text) {
    process.stdout.write(token);
  }
}

// Check for interrupts
if (hitlStream.interrupted) {
  console.log("\nINTERRUPTED:");
  console.log(JSON.stringify(hitlStream.interrupts[0], null, 2));
}
```
