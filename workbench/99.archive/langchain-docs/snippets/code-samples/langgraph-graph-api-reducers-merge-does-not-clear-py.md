<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-graph-api-reducers-merge-does-not-clear-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from operator import add
from typing import Annotated

from typing_extensions import TypedDict


class State(TypedDict):
    errors: Annotated[list[str], add]


# node A returns {"errors": ["bad sql"]}
# node B returns {"errors": []}
# state["errors"] is still ["bad sql"]; the empty list is merged in, not cleared
```
