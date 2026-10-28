<!-- source: langchain-ai/docs  src/snippets/code-samples/rag-deep-load-documents-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
async function loadLangchainDocs(
  docPaths: string[] = DOC_PATHS,
): Promise<Document[]> {
  const docs: Document[] = [];
  for (const path of docPaths) {
    const url = `${DOCS_BASE}/${path}.md`;
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const text = await response.text();
      docs.push(
        new Document({
          pageContent: text,
          metadata: { source: `${DOCS_BASE}/${path}` },
        }),
      );
    } catch {
      continue;
    }
  }
  return docs;
}

const docs = await loadLangchainDocs();
console.log(`Loaded ${docs.length} documentation pages.`);
```
