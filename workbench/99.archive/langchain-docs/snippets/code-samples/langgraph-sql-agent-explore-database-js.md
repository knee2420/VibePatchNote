<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-sql-agent-explore-database-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
import sqlite3 from "sqlite3";

const dialect = "sqlite";

async function runQuery(query: string, params: unknown[] = []): Promise<any[]> {
  const dbPath = await resolveDbPath();
  const db = new sqlite3.Database(dbPath);
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      db.close();
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

const tableRows = await runQuery(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
);
const tableNames = tableRows.map((row) => String(row.name));
console.log(`Dialect: ${dialect}`);
console.log(`Available tables: ${tableNames.join(", ")}`);
const sampleResults = await runQuery("SELECT * FROM Artist LIMIT 5;");
console.log(`Sample output: ${JSON.stringify(sampleResults)}`);
```
