<!-- source: langchain-ai/docs  src/snippets/code-samples/context-engineering-skills-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
    ```python Google
    agent = create_deep_agent(
        model="google_genai:gemini-3.6-flash",
        skills=["/skills/"],
    )
    ```

    ```python OpenAI
    agent = create_deep_agent(
        model="openai:gpt-5.5",
        skills=["/skills/"],
    )
    ```

    ```python Anthropic
    agent = create_deep_agent(
        model="anthropic:claude-sonnet-4-6",
        skills=["/skills/"],
    )
    ```

    ```python OpenRouter
    agent = create_deep_agent(
        model="openrouter:z-ai/glm-5.2",
        skills=["/skills/"],
    )
    ```

    ```python Fireworks
    agent = create_deep_agent(
        model="fireworks:accounts/fireworks/models/glm-5p2",
        skills=["/skills/"],
    )
    ```

    ```python Baseten
    agent = create_deep_agent(
        model="baseten:zai-org/GLM-5.2",
        skills=["/skills/"],
    )
    ```

    ```python Ollama
    agent = create_deep_agent(
        model="ollama:north-mini-code-1.0",
        skills=["/skills/"],
    )
    ```
</CodeGroup>
