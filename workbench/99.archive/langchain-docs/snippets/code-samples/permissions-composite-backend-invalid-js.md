<!-- source: langchain-ai/docs  src/snippets/code-samples/permissions-composite-backend-invalid-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const sandbox = new StateBackend();
const memoriesBackend = new StateBackend();
const composite = new CompositeBackend(sandbox, {
  "/memories/": memoriesBackend,
});

createDeepAgent({
  model,
  backend: composite,
  permissions: [
    { operations: ["write"], paths: ["/workspace/**"], mode: "deny" },
  ],
});

createDeepAgent({
  model,
  backend: composite,
  permissions: [{ operations: ["read"], paths: ["/**"], mode: "deny" }],
});
```
