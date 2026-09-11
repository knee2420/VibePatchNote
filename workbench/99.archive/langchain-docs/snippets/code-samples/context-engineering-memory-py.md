<!-- source: langchain-ai/docs  src/snippets/code-samples/context-engineering-memory-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
    ```python Google
    agent = create_deep_agent(
        model="google_genai:gemini-3.6-flash",
        memory=["/project/AGENTS.md", "~/.deepagents/preferences.md"],
    )
    ```

    ```python OpenAI
    agent = create_deep_agent(
        model="openai:gpt-5.5",
        memory=["/project/AGENTS.md", "~/.deepagents/preferences.md"],
    )
    ```

    ```python Anthropic
    agent = create_deep_agent(
        model="anthropic:claude-sonnet-4-6",
        memory=["/project/AGENTS.md", "~/.deepagents/preferences.md"],
    )
    ```

    ```python OpenRouter
    agent = create_deep_agent(
        model="openrouter:z-ai/glm-5.2",
        memory=["/project/AGENTS.md", "~/.deepagents/preferences.md"],
    )
    ```

    ```python Fireworks
    agent = create_deep_agent(
        model="fireworks:accounts/fireworks/models/glm-5p2",
        memory=["/project/AGENTS.md", "~/.deepagents/preferences.md"],
    )
    ```

    ```python Baseten
    agent = create_deep_agent(
        model="baseten:zai-org/GLM-5.2",
        memory=["/project/AGENTS.md", "~/.deepagents/preferences.md"],
    )
    ```

    ```python Ollama
    agent = create_deep_agent(
        model="ollama:north-mini-code-1.0",
        memory=["/project/AGENTS.md", "~/.deepagents/preferences.md"],
    )
    ```
</CodeGroup>
