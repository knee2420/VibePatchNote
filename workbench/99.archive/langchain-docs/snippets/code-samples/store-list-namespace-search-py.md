<!-- source: langchain-ai/docs  src/snippets/code-samples/store-list-namespace-search-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
# Return up to 100 items stored under ("alice", "memories").
items = store.search(("alice", "memories"), limit=100)
```
