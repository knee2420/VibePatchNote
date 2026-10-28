<!-- source: langchain-ai/docs  src/snippets/code-samples/rag-run-chain-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
query = "What is task decomposition?"
stream = agent.stream_events(
    {"messages": [{"role": "user", "content": query}]},
    version="v3",
)
for message in stream.messages:
    for token in message.text:
        print(token, end="", flush=True)

final_state = stream.output
```
