<!-- source: langchain-ai/docs  src/snippets/code-samples/skills-invoke-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const result = await agent.invoke(
  { messages: [{ role: "user", content: "What is LangGraph?" }] },
  { configurable: { thread_id: "1" } },
);
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/637067d5-ee65-481b-a13e-3b3944551e9a/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
