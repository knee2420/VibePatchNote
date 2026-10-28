<!-- source: langchain-ai/docs  src/snippets/code-samples/permissions-read-only-memory-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const store = new InMemoryStore();
const agent = createDeepAgent({
  model,
  backend: new CompositeBackend(new StateBackend(), {
    "/memories/": new StoreBackend({
      namespace: (rt) => [rt.serverInfo.user.identity],
    }),
    "/policies/": new StoreBackend({
      namespace: (rt) => [rt.context.orgId],
    }),
  }),
  permissions: [
    {
      operations: ["write"],
      paths: ["/memories/**", "/policies/**"],
      mode: "deny",
    },
  ],
  store,
});
if (!agent) throw new Error("read-only-memory: agent not created");
```
