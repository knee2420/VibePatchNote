<!-- source: langchain-ai/docs  src/snippets/code-samples/interpreters-quickstart-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
    ```python Google
    from deepagents import create_deep_agent
    from langchain_quickjs import CodeInterpreterMiddleware
    
    agent = create_deep_agent(
        model="google_genai:gemini-3.6-flash",
        middleware=[CodeInterpreterMiddleware()],
    )
    ```

    ```python OpenAI
    from deepagents import create_deep_agent
    from langchain_quickjs import CodeInterpreterMiddleware
    
    agent = create_deep_agent(
        model="openai:gpt-5.5",
        middleware=[CodeInterpreterMiddleware()],
    )
    ```

    ```python Anthropic
    from deepagents import create_deep_agent
    from langchain_quickjs import CodeInterpreterMiddleware
    
    agent = create_deep_agent(
        model="anthropic:claude-sonnet-4-6",
        middleware=[CodeInterpreterMiddleware()],
    )
    ```

    ```python OpenRouter
    from deepagents import create_deep_agent
    from langchain_quickjs import CodeInterpreterMiddleware
    
    agent = create_deep_agent(
        model="openrouter:z-ai/glm-5.2",
        middleware=[CodeInterpreterMiddleware()],
    )
    ```

    ```python Fireworks
    from deepagents import create_deep_agent
    from langchain_quickjs import CodeInterpreterMiddleware
    
    agent = create_deep_agent(
        model="fireworks:accounts/fireworks/models/glm-5p2",
        middleware=[CodeInterpreterMiddleware()],
    )
    ```

    ```python Baseten
    from deepagents import create_deep_agent
    from langchain_quickjs import CodeInterpreterMiddleware
    
    agent = create_deep_agent(
        model="baseten:zai-org/GLM-5.2",
        middleware=[CodeInterpreterMiddleware()],
    )
    ```

    ```python Ollama
    from deepagents import create_deep_agent
    from langchain_quickjs import CodeInterpreterMiddleware
    
    agent = create_deep_agent(
        model="ollama:north-mini-code-1.0",
        middleware=[CodeInterpreterMiddleware()],
    )
    ```
</CodeGroup>
