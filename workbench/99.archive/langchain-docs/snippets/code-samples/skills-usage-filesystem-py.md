<!-- source: langchain-ai/docs  src/snippets/code-samples/skills-usage-filesystem-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```python
from urllib.request import urlopen
from deepagents import create_deep_agent
from deepagents.backends.filesystem import FilesystemBackend
from langgraph.checkpoint.memory import MemorySaver

# Checkpointer is REQUIRED for human-in-the-loop
checkpointer = MemorySaver()

skill_url = "https://raw.githubusercontent.com/langchain-ai/deepagents/refs/heads/main/libs/code/examples/skills/langgraph-docs/SKILL.md"
with urlopen(skill_url) as response:
    skill_content = response.read().decode('utf-8')

backend = FilesystemBackend(root_dir="/Users/user/{project}", virtual_mode=True)
backend.upload_files(
    [("/skills/langgraph-docs/SKILL.md", skill_content.encode("utf-8"))]
)

agent = create_deep_agent(
    model="google_genai:gemini-3.6-flash",
    backend=backend,
    skills=["/skills/"],
    interrupt_on={
        "write_file": True,
        "read_file": False,
        "edit_file": True,
    },
    checkpointer=checkpointer,  # Required for filesystem operations!
)

result = agent.invoke(
    {"messages": [{"role": "user", "content": "What is langgraph?"}]},
    config={"configurable": {"thread_id": "12345"}},
)
```
