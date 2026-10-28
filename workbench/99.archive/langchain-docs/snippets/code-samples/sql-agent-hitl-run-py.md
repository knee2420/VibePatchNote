<!-- source: langchain-ai/docs  src/snippets/code-samples/sql-agent-hitl-run-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
question = "Which genre on average has the longest tracks?"
config = {"configurable": {"thread_id": "1"}} # [!code highlight]

stream = agent.stream_events( # [!code highlight]
    {"messages": [{"role": "user", "content": question}]},
    config, # [!code highlight]
    version="v3",
)
for kind, item in stream.interleave("messages", "tool_calls"):
    if kind == "messages":
        for token in item.text:
            print(token, end="", flush=True)
    elif kind == "tool_calls":
        print(f"\nTool call: {item.tool_name}({item.input})")
if stream.interrupted: # [!code highlight]
    print("INTERRUPTED:") # [!code highlight]
    interrupt = stream.interrupts[0] # [!code highlight]
    for request in interrupt.value["action_requests"]: # [!code highlight]
        print(request["description"]) # [!code highlight]
```
