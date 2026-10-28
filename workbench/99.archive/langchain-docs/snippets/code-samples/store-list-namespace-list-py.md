<!-- source: langchain-ai/docs  src/snippets/code-samples/store-list-namespace-list-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
# All namespaces that start with ("alice",), truncated to two levels deep.
namespaces = store.list_namespaces(prefix=("alice",), max_depth=2)
```
