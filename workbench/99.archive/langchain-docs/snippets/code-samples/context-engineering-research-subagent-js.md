<!-- source: langchain-ai/docs  src/snippets/code-samples/context-engineering-research-subagent-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const researchSubagent = {
  name: "researcher",
  description: "Conducts research on a topic",
  systemPrompt: `You are a research assistant.
    IMPORTANT: Return only the essential summary (under 500 words).
    Do NOT include raw search results or detailed tool outputs.`,
  tools: [webSearch],
};
```

<Card title="View example trace" icon="chart-line" href="https://smith.langchain.com/public/3f16f08a-46ef-4b67-9dab-5d2478341843/r" arrow horizontal>
  Open a public LangSmith run for this example.
</Card>
