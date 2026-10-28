<!-- source: langchain-ai/docs  src/snippets/code-samples/store-list-namespace-paginate-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
page_size = 50
offset = 0
while True:
    page = store.search(("alice", "memories"), limit=page_size, offset=offset)
    if not page:
        break
    for item in page:
        pass
    offset += page_size
```
