<!-- source: langchain-ai/docs  src/snippets/code-samples/agents-tools-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
    ```python Google
    from langchain.agents import create_agent
    from langchain.tools import tool
    
    
    @tool
    def search(query: str) -> str:
        """Search for information."""
        return f"Results for: {query}"
    
    
    agent = create_agent(model="google_genai:gemini-3.6-flash", tools=[search])
    ```

    ```python OpenAI
    from langchain.agents import create_agent
    from langchain.tools import tool
    
    
    @tool
    def search(query: str) -> str:
        """Search for information."""
        return f"Results for: {query}"
    
    
    agent = create_agent(model="openai:gpt-5.5", tools=[search])
    ```

    ```python Anthropic
    from langchain.agents import create_agent
    from langchain.tools import tool
    
    
    @tool
    def search(query: str) -> str:
        """Search for information."""
        return f"Results for: {query}"
    
    
    agent = create_agent(model="anthropic:claude-sonnet-4-6", tools=[search])
    ```

    ```python OpenRouter
    from langchain.agents import create_agent
    from langchain.tools import tool
    
    
    @tool
    def search(query: str) -> str:
        """Search for information."""
        return f"Results for: {query}"
    
    
    agent = create_agent(model="openrouter:z-ai/glm-5.2", tools=[search])
    ```

    ```python Fireworks
    from langchain.agents import create_agent
    from langchain.tools import tool
    
    
    @tool
    def search(query: str) -> str:
        """Search for information."""
        return f"Results for: {query}"
    
    
    agent = create_agent(model="fireworks:accounts/fireworks/models/glm-5p2", tools=[search])
    ```

    ```python Baseten
    from langchain.agents import create_agent
    from langchain.tools import tool
    
    
    @tool
    def search(query: str) -> str:
        """Search for information."""
        return f"Results for: {query}"
    
    
    agent = create_agent(model="baseten:zai-org/GLM-5.2", tools=[search])
    ```

    ```python Ollama
    from langchain.agents import create_agent
    from langchain.tools import tool
    
    
    @tool
    def search(query: str) -> str:
        """Search for information."""
        return f"Results for: {query}"
    
    
    agent = create_agent(model="ollama:north-mini-code-1.0", tools=[search])
    ```
</CodeGroup>
