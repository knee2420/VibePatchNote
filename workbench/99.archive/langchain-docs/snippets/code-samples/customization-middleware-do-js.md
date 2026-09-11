<!-- source: langchain-ai/docs  src/snippets/code-samples/customization-middleware-do-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const customMiddleware = createMiddleware({
  name: "CustomMiddleware",
  beforeAgent: async (state) => {
    return { x: (state.x ?? 0) + 1 }; // Update graph state instead
  },
});
```
