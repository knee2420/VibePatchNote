<!-- source: langchain-ai/docs  src/snippets/code-samples/long-term-memory-storage-postgres-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from collections.abc import Sequence

from langgraph.store.base import IndexConfig
from langgraph.store.postgres import PostgresStore  # type: ignore[import-not-found]


def embed(texts: Sequence[str]) -> list[list[float]]:
    # Replace with an actual embedding function or LangChain embeddings object
    return [[1.0, 2.0] for _ in texts]


DB_URI = "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable"

with PostgresStore.from_conn_string(
    DB_URI,
    index=IndexConfig(embed=embed, dims=2),  # type: ignore[arg-type]
) as store:
    store.setup()
    user_id = "my-user"
    application_context = "chitchat"
    namespace = (user_id, application_context)
    store.put(
        namespace,
        "a-memory",
        {
            "rules": [
                "User likes short, direct language",
                "User only speaks English & python",
            ],
            "my-key": "my-value",
        },
    )
    item = store.get(namespace, "a-memory")
    items = store.search(
        namespace, filter={"my-key": "my-value"}, query="language preferences"
    )
```
