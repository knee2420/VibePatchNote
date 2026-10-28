<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-sql-agent-hitl-resume-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const resumeStream = await agentWithHuman.streamEvents(
  new Command({ resume: { type: "accept" } }),
  // new Command({ resume: { type: "edit", args: { query: "..." } } }),
  { ...config, version: "v3" },
);

for await (const message of resumeStream.messages) {
  for await (const token of message.text) {
    process.stdout.write(token);
  }
}
```
