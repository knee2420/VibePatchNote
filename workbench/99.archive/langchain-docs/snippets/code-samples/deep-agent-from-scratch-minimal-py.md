<!-- source: langchain-ai/docs  src/snippets/code-samples/deep-agent-from-scratch-minimal-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
    ```python Google
    from langchain.agents import create_agent
    
    agent = create_agent(model="google_genai:gemini-3.6-flash", tools=[])
    ```

    ```python OpenAI
    from langchain.agents import create_agent
    
    agent = create_agent(model="openai:gpt-5.5", tools=[])
    ```

    ```python Anthropic
    from langchain.agents import create_agent
    
    agent = create_agent(model="anthropic:claude-sonnet-4-6", tools=[])
    ```

    ```python OpenRouter
    from langchain.agents import create_agent
    
    agent = create_agent(model="openrouter:z-ai/glm-5.2", tools=[])
    ```

    ```python Fireworks
    from langchain.agents import create_agent
    
    agent = create_agent(model="fireworks:accounts/fireworks/models/glm-5p2", tools=[])
    ```

    ```python Baseten
    from langchain.agents import create_agent
    
    agent = create_agent(model="baseten:zai-org/GLM-5.2", tools=[])
    ```

    ```python Ollama
    from langchain.agents import create_agent
    
    agent = create_agent(model="ollama:north-mini-code-1.0", tools=[])
    ```
</CodeGroup>
