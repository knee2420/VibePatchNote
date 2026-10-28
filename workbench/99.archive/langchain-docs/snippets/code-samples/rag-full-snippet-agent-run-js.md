<!-- source: langchain-ai/docs  src/snippets/code-samples/rag-full-snippet-agent-run-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
async function runRagAgent(agent: ReturnType<typeof createAgent>) {
  const inputMessage = "What is Task Decomposition?";
  const agentInputs = { messages: [{ role: "user", content: inputMessage }] };

  const stream = await agent.streamEvents(agentInputs, { version: "v3" });
  await Promise.all([
    (async () => {
      for await (const message of stream.messages) {
        for await (const token of message.text) {
          process.stdout.write(token);
        }
      }
    })(),
    (async () => {
      for await (const call of stream.toolCalls) {
        console.log(`\nTool call: ${call.name}(${JSON.stringify(call.input)})`);
        console.log(`Tool result: ${await call.output}`);
      }
    })(),
  ]);

  return stream.output;
}
```
