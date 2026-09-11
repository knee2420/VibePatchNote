<!-- source: langchain-ai/docs  src/snippets/code-samples/event-streaming-concurrent-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const stream = await agent.streamEvents(input, { version: "v3" });

await Promise.all([
  (async () => {
    for await (const message of stream.messages) {
      console.log("[coordinator]", await message.text);
    }
  })(),
  (async () => {
    for await (const subagent of stream.subagents) {
      void (async () => {
        for await (const message of subagent.messages) {
          console.log(`[${subagent.name}]`, await message.text);
        }
      })();
    }
  })(),
]);
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/467e4c96-80a0-42ba-9f5f-d869b74e5899/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
