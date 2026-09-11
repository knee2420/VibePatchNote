<!-- source: langchain-ai/docs  src/snippets/code-samples/context-engineering-system-prompt-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
    ```python Google
    from deepagents import create_deep_agent
    
    agent = create_deep_agent(
        model="google_genai:gemini-3.6-flash",
        system_prompt=(
            "You are a research assistant specializing in scientific literature. "
            "Always cite sources. Use subagents for parallel research on different topics."
        ),
    )
    ```

    ```python OpenAI
    from deepagents import create_deep_agent
    
    agent = create_deep_agent(
        model="openai:gpt-5.5",
        system_prompt=(
            "You are a research assistant specializing in scientific literature. "
            "Always cite sources. Use subagents for parallel research on different topics."
        ),
    )
    ```

    ```python Anthropic
    from deepagents import create_deep_agent
    
    agent = create_deep_agent(
        model="anthropic:claude-sonnet-4-6",
        system_prompt=(
            "You are a research assistant specializing in scientific literature. "
            "Always cite sources. Use subagents for parallel research on different topics."
        ),
    )
    ```

    ```python OpenRouter
    from deepagents import create_deep_agent
    
    agent = create_deep_agent(
        model="openrouter:z-ai/glm-5.2",
        system_prompt=(
            "You are a research assistant specializing in scientific literature. "
            "Always cite sources. Use subagents for parallel research on different topics."
        ),
    )
    ```

    ```python Fireworks
    from deepagents import create_deep_agent
    
    agent = create_deep_agent(
        model="fireworks:accounts/fireworks/models/glm-5p2",
        system_prompt=(
            "You are a research assistant specializing in scientific literature. "
            "Always cite sources. Use subagents for parallel research on different topics."
        ),
    )
    ```

    ```python Baseten
    from deepagents import create_deep_agent
    
    agent = create_deep_agent(
        model="baseten:zai-org/GLM-5.2",
        system_prompt=(
            "You are a research assistant specializing in scientific literature. "
            "Always cite sources. Use subagents for parallel research on different topics."
        ),
    )
    ```

    ```python Ollama
    from deepagents import create_deep_agent
    
    agent = create_deep_agent(
        model="ollama:north-mini-code-1.0",
        system_prompt=(
            "You are a research assistant specializing in scientific literature. "
            "Always cite sources. Use subagents for parallel research on different topics."
        ),
    )
    ```
</CodeGroup>
