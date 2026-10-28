<!-- source: langchain-ai/docs  src/snippets/code-samples/permissions-composite-backend-invalid-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
# Raises NotImplementedError: /workspace/** hits the sandbox default
try:
    create_deep_agent(
        model=model,
        backend=composite,
        permissions=[
            FilesystemPermission(
                operations=["write"],
                paths=["/workspace/**"],
                mode="deny",
            ),
        ],
    )
except NotImplementedError:
    pass

# Also raises: /** covers both routes and the default
try:
    create_deep_agent(
        model=model,
        backend=composite,
        permissions=[
            FilesystemPermission(
                operations=["read"],
                paths=["/**"],
                mode="deny",
            ),
        ],
    )
except NotImplementedError:
    pass
```
