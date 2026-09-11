<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-functional-api-stream-custom-data-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const config = {
  configurable: { thread_id: "functional-api-stream-custom-data" },
};

const stream = await main.streamEvents({ x: 5 }, { ...config, version: "v3" });
for await (const chunk of stream.values) {
  console.log(chunk);
}
// 10
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/8737a21a-1a44-47ce-b3bd-880a15fc7375/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
