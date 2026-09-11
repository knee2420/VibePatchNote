<!-- source: langchain-ai/docs  src/snippets/code-samples/multimodal-user-input-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What is in this screenshot?" },
        { type: "image", url: "https://example.com/screenshot.png" },
      ],
    },
  ],
});
```
