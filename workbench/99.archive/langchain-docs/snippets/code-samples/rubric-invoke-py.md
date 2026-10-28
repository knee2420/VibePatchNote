<!-- source: langchain-ai/docs  src/snippets/code-samples/rubric-invoke-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langchain.messages import HumanMessage

config = {"configurable": {"thread_id": "my-rubric-thread"}}
result = agent.invoke(
    {
        "messages": [HumanMessage("Write a haiku about spring.")],
        "rubric": (
            "- The poem has three lines\n"
            "- Lines follow a 5-7-5 syllable pattern\n"
            "- The theme is spring"
        ),
    },
    config=config,
)
```
