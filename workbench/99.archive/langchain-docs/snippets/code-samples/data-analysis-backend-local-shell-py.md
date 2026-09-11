<!-- source: langchain-ai/docs  src/snippets/code-samples/data-analysis-backend-local-shell-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from deepagents.backends import LocalShellBackend

backend = LocalShellBackend(
    root_dir=".",
    virtual_mode=True,
    env={"PATH": "/usr/bin:/bin"},
)
```
