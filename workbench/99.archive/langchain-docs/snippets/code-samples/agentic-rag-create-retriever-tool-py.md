<!-- source: langchain-ai/docs  src/snippets/code-samples/agentic-rag-create-retriever-tool-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langchain.tools import tool


@tool
def retrieve_blog_posts(query: str) -> str:
    """Search and return information about Lilian Weng blog posts."""
    retriever = _get_retriever()
    retrieved_docs = retriever.invoke(query)
    return "\n\n".join([doc.page_content for doc in retrieved_docs])


retriever_tool = retrieve_blog_posts
```
