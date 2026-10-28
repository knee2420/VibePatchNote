<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-sql-agent-download-chinook-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import fs from "node:fs/promises";
import path from "node:path";

const url =
  "https://storage.googleapis.com/benchmarks-artifacts/chinook/Chinook.db";
const localPath = path.resolve("Chinook.db");

async function resolveDbPath() {
  const exists = await fs
    .access(localPath)
    .then(() => true)
    .catch(() => false);
  if (exists) {
    console.log(`${localPath} already exists, skipping download.`);
    return localPath;
  }
  const resp = await fetch(url);
  if (!resp.ok)
    throw new Error(`Failed to download DB. Status code: ${resp.status}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  await fs.writeFile(localPath, buf);
  console.log(`File downloaded and saved as ${localPath}`);
  return localPath;
}
```
