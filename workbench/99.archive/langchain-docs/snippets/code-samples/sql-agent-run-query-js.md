<!-- source: langchain-ai/docs  src/snippets/code-samples/sql-agent-run-query-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import sqlite3 from "sqlite3";

// Below are minimal tools for demonstration purposes.
async function runQuery(query: string): Promise<any[]> {
  const dbPath = await resolveDbPath();
  const db = new sqlite3.Database(dbPath);
  return new Promise((resolve, reject) => {
    db.all(query, [], (err, rows) => {
      db.close();
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function getSchema() {
  const tables = await runQuery(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
  );
  return tables.map((row) => row.sql).join("\n\n");
}
```
