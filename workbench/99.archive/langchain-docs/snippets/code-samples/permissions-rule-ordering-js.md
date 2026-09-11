<!-- source: langchain-ai/docs  src/snippets/code-samples/permissions-rule-ordering-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const correctPermissions: FilesystemPermission[] = [
  { operations: ["read", "write"], paths: ["/workspace/.env"], mode: "deny" },
  {
    operations: ["read", "write"],
    paths: ["/workspace/**"],
    mode: "allow",
  },
  { operations: ["read", "write"], paths: ["/**"], mode: "deny" },
];

const incorrectPermissions: FilesystemPermission[] = [
  {
    operations: ["read", "write"],
    paths: ["/workspace/**"],
    mode: "allow",
  },
  {
    operations: ["read", "write"],
    paths: ["/workspace/.env"],
    mode: "deny",
  },
  { operations: ["read", "write"], paths: ["/**"], mode: "deny" },
];
```
