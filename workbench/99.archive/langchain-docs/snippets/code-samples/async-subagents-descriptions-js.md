<!-- source: langchain-ai/docs  src/snippets/code-samples/async-subagents-descriptions-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
```typescript Good
// Good
{
  name: "researcher",
  description: "Conducts in-depth research using web search. Use for questions requiring multiple searches and synthesis.",
  graphId: "researcher",
}
```

```typescript Bad
// Bad
{
  name: "helper",
  description: "helps with stuff",
  graphId: "helper",
}
```
</CodeGroup>
