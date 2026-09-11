<!-- source: langchain-ai/docs  src/snippets/code-samples/agentic-rag-setup-env-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
import getpass
import os


def _set_env(key: str) -> None:
    if key not in os.environ:
        os.environ[key] = getpass.getpass(f"{key}:")


_set_env("OPENAI_API_KEY")
```
