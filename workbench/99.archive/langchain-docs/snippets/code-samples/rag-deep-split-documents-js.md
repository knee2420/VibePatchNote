<!-- source: langchain-ai/docs  src/snippets/code-samples/rag-deep-split-documents-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```ts
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const allSplits = await textSplitter.splitDocuments(docs);
console.log(`Split documentation into ${allSplits.length} chunks.`);
```
