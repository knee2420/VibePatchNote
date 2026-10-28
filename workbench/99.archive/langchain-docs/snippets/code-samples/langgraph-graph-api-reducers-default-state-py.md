<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-graph-api-reducers-default-state-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from typing_extensions import TypedDict


class State(TypedDict):
    foo: int
    bar: list[str]
```
