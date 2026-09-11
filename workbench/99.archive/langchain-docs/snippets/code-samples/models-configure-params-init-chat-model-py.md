<!-- source: langchain-ai/docs  src/snippets/code-samples/models-configure-params-init-chat-model-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python init_chat_model
from langchain.chat_models import init_chat_model
from deepagents import create_deep_agent

model = init_chat_model(
    model="google_genai:gemini-3.6-flash",
    thinking_level="medium",  # [!code highlight]
)
agent = create_deep_agent(model=model)
```
