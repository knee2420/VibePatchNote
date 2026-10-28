<!-- source: langchain-ai/docs  src/snippets/code-samples/rubric-stream-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langchain.messages import HumanMessage
from langgraph.stream import CustomTransformer

config = {"configurable": {"thread_id": "my-rubric-thread"}}
stream = agent.stream_events(
    {
        "messages": [HumanMessage("Write a haiku about spring.")],
        "rubric": (
            "- The poem has three lines\n"
            "- Lines follow a 5-7-5 syllable pattern\n"
            "- The theme is spring"
        ),
    },
    config=config,
    version="v3",
    transformers=[CustomTransformer],
)

for event in stream.custom:
    event_type = event.get("type")
    if event_type == "rubric_evaluation_start":
        print(
            f"Grading iteration {event['iteration']} "
            f"(run {event['grading_run_id']})"
        )
    elif event_type == "rubric_evaluation_end":
        print(f"Verdict: {event['result']} — {event.get('explanation', '')}")
```
