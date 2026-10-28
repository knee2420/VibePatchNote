<!-- source: langchain-ai/docs  src/snippets/code-samples/langgraph-sql-agent-hitl-resume-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langgraph.types import Command

stream = agent.stream_events(
    Command(resume={"type": "accept"}),
    # Command(resume={"type": "edit", "args": {"query": "..."}}),
    config,
    version="v3",
)
for message in stream.messages:
    for token in message.text:
        print(token, end="", flush=True)
if stream.interrupted:
    action = stream.interrupts[0]
    print("INTERRUPTED:")
    for request in action.value:
        print(json.dumps(request, indent=2))
```
