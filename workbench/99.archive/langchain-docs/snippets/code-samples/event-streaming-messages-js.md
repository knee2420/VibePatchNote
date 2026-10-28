<!-- source: langchain-ai/docs  src/snippets/code-samples/event-streaming-messages-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const stream = await agent.streamEvents(input, { version: "v3" });

const coordinatorMessages: string[] = [];
for await (const message of stream.messages) {
  const text = await message.text;
  console.log("[coordinator]", text);
  coordinatorMessages.push(text);
}

for await (const subagent of stream.subagents) {
  for await (const message of subagent.messages) {
    console.log(`[${subagent.name}]`, await message.text);
  }
}

await stream.output;
```
