<!-- source: langchain-ai/docs  src/snippets/code-samples/permissions-subagent-js.mdx -->
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
    { operations: ["read", "write"], paths: ["/**"], mode: "deny" },
  ],
  subagents: [
    {
      name: "auditor",
      description: "Read-only code reviewer",
      systemPrompt: "Review the code for issues.",
      permissions: [
        { operations: ["write"], paths: ["/**"], mode: "deny" },
        { operations: ["read"], paths: ["/workspace/**"], mode: "allow" },
        { operations: ["read"], paths: ["/**"], mode: "deny" },
      ],
    },
  ],
});
if (!agent) throw new Error("subagent: agent not created");
```
