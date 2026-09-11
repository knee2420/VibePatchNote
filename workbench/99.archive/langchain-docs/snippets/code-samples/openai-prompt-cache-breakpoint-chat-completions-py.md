<!-- source: langchain-ai/docs  src/snippets/code-samples/openai-prompt-cache-breakpoint-chat-completions-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-5.6-sol",
    prompt_cache_options={"mode": "explicit"},
)

messages = [
    {
        "role": "system",
        "content": [
            {
                "type": "text",
                "text": (
                    "You are a helpful assistant with access to a large knowledge base."
                ),
                "prompt_cache_breakpoint": {"mode": "explicit"},  # [!code highlight]
            }
        ],
    },
    {"role": "user", "content": "Summarize the key points."},
]

response = llm.invoke(messages, prompt_cache_key="docs-breakpoint-v1")
```
