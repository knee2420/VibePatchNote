<!-- source: langchain-ai/docs  src/snippets/code-samples/content-builder-entry-point-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const task =
  process.argv.slice(2).join(" ") ||
  "Write a blog post about how AI agents are transforming software development";

const agent = createContentWriter();
const result = await agent.invoke({
  messages: [{ role: "user", content: task }],
  config: { configurable: { threadId: "content-builder-demo" } },
});

const messages = result.messages ?? [];
for (const msg of messages) {
  if (msg.content) console.log(msg.content);
}
```
