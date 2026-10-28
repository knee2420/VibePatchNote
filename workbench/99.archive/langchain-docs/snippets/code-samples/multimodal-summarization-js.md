<!-- source: langchain-ai/docs  src/snippets/code-samples/multimodal-summarization-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
// Before — model receives image blocks in older turns
void {
  role: "user",
  content: [
    { type: "text", text: "What trends do you see in this chart?" },
    { type: "image", url: "https://example.com/chart.png" },
  ],
};
void {
  role: "tool",
  content: [
    { type: "text", text: "Updated chart:" },
    { type: "image", url: "https://example.com/chart-v2.png" },
  ],
};

// After — those turns collapse to text; image blocks are gone
void {
  content:
    "User asked about trends in a chart screenshot. " +
    "Tool returned an updated chart. Agent identified Q3 revenue growth.",
};
```
