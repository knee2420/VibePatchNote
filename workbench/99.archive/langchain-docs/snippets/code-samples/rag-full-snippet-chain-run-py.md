<!-- source: langchain-ai/docs  src/snippets/code-samples/rag-full-snippet-chain-run-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
def run_rag_chain(agent_instance):
    query = "What is task decomposition?"
    stream = agent_instance.stream_events(
        {"messages": [{"role": "user", "content": query}]},
        version="v3",
    )
    for message in stream.messages:
        for token in message.text:
            print(token, end="", flush=True)

    return stream.output
```
