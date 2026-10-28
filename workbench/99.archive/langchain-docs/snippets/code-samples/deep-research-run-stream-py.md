<!-- source: langchain-ai/docs  src/snippets/code-samples/deep-research-run-stream-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langchain.messages import HumanMessage

if __name__ == "__main__":
    stream = agent.stream_events(
        {
            "messages": [
                HumanMessage(content="Compare Python vs JavaScript for web development")
            ]
        },
        version="v3",
    )
    for message in stream.messages:
        for token in message.text:
            print(token, end="", flush=True)
```
