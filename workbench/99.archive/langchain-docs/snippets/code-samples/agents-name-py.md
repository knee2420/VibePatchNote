<!-- source: langchain-ai/docs  src/snippets/code-samples/agents-name-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
    ```python Google
    agent = create_agent(model="google_genai:gemini-3.6-flash", tools=tools, name="research_assistant")
    ```

    ```python OpenAI
    agent = create_agent(model="openai:gpt-5.5", tools=tools, name="research_assistant")
    ```

    ```python Anthropic
    agent = create_agent(model="anthropic:claude-sonnet-4-6", tools=tools, name="research_assistant")
    ```

    ```python OpenRouter
    agent = create_agent(model="openrouter:z-ai/glm-5.2", tools=tools, name="research_assistant")
    ```

    ```python Fireworks
    agent = create_agent(model="fireworks:accounts/fireworks/models/glm-5p2", tools=tools, name="research_assistant")
    ```

    ```python Baseten
    agent = create_agent(model="baseten:zai-org/GLM-5.2", tools=tools, name="research_assistant")
    ```

    ```python Ollama
    agent = create_agent(model="ollama:north-mini-code-1.0", tools=tools, name="research_assistant")
    ```
</CodeGroup>
