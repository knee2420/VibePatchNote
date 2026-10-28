<!-- source: langchain-ai/docs  src/snippets/code-samples/long-term-memory-storage-postgres-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";

const embed = (texts: string[]): number[][] => {
  return texts.map(() => [1.0, 2.0]);
};

const DB_URI =
  process.env.POSTGRES_URI ??
  "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable";
const store = PostgresStore.fromConnString(DB_URI, {
  index: { embed, dims: 2 },
});
await store.setup();

const userId = "my-user";
const applicationContext = "chitchat";
const namespace = [userId, applicationContext];

await store.put(namespace, "a-memory", {
  rules: [
    "User likes short, direct language",
    "User only speaks English & TypeScript",
  ],
  "my-key": "my-value",
});

const item = await store.get(namespace, "a-memory");
const items = await store.search(namespace, {
  filter: { "my-key": "my-value" },
  query: "language preferences",
});
```
