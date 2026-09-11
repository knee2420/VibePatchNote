<!-- source: langchain-ai/docs  src/snippets/code-samples/rag-deep-print-documents-preview-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const totalChars = docs.reduce((sum, doc) => sum + doc.pageContent.length, 0);
console.log(`Total characters: ${totalChars}`);
console.log(docs[0].pageContent.slice(0, 500));
```
