<!-- source: langchain-ai/docs  src/snippets/code-samples/permissions-isolate-workspace-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const agent = createDeepAgent({
  model,
  backend,
  permissions: [
    {
      operations: ["read", "write"],
      paths: ["/workspace/**"],
      mode: "allow",
    },
    {
      operations: ["read", "write"],
      paths: ["/**"],
      mode: "deny",
    },
  ],
});
if (!agent) throw new Error("isolate-workspace: agent not created");
```
