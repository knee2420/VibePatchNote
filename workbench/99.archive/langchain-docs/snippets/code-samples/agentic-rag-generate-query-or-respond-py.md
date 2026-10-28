<!-- source: langchain-ai/docs  src/snippets/code-samples/agentic-rag-generate-query-or-respond-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langchain.chat_models import init_chat_model
from langgraph.graph import MessagesState

response_model = init_chat_model("openai:gpt-5.4-mini", temperature=0)


def generate_query_or_respond(state: MessagesState):
    """Call the model to generate a response based on the current state. Given
    the question, it will decide to retrieve using the retriever tool, or simply respond to the user.
    """
    response = response_model.bind_tools([retriever_tool]).invoke(state["messages"])
    return {"messages": [response]}
```
