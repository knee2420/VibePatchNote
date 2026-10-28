<!-- source: langchain-ai/docs  src/snippets/code-samples/rag-deep-print-documents-preview-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
total_chars = sum(len(doc.page_content) for doc in docs)
print(f"Total characters: {total_chars}")
print(docs[0].page_content[:500])
```
