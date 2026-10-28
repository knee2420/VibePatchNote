<!-- source: langchain-ai/docs  src/snippets/code-samples/dynamic-subagents-fanout-configure-py.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
    ```python Google
    from deepagents import create_deep_agent
    from langchain_quickjs import CodeInterpreterMiddleware
    
    agent = create_deep_agent(
        model="google_genai:gemini-3.6-flash",
        subagents=[{
            "name": "reviewer",
            "description": "Reviews code for security issues, citing lines and severity",
            "system_prompt": "You are a security-focused code reviewer. Read the file carefully and report any authentication or authorization issues with line numbers and severity.",
        }],
        middleware=[CodeInterpreterMiddleware(ptc=["glob"])],
    )
    ```

    ```python OpenAI
    from deepagents import create_deep_agent
    from langchain_quickjs import CodeInterpreterMiddleware
    
    agent = create_deep_agent(
        model="openai:gpt-5.5",
        subagents=[{
            "name": "reviewer",
            "description": "Reviews code for security issues, citing lines and severity",
            "system_prompt": "You are a security-focused code reviewer. Read the file carefully and report any authentication or authorization issues with line numbers and severity.",
        }],
        middleware=[CodeInterpreterMiddleware(ptc=["glob"])],
    )
    ```

    ```python Anthropic
    from deepagents import create_deep_agent
    from langchain_quickjs import CodeInterpreterMiddleware
    
    agent = create_deep_agent(
        model="anthropic:claude-sonnet-4-6",
        subagents=[{
            "name": "reviewer",
            "description": "Reviews code for security issues, citing lines and severity",
            "system_prompt": "You are a security-focused code reviewer. Read the file carefully and report any authentication or authorization issues with line numbers and severity.",
        }],
        middleware=[CodeInterpreterMiddleware(ptc=["glob"])],
    )
    ```

    ```python OpenRouter
    from deepagents import create_deep_agent
    from langchain_quickjs import CodeInterpreterMiddleware
    
    agent = create_deep_agent(
        model="openrouter:z-ai/glm-5.2",
        subagents=[{
            "name": "reviewer",
            "description": "Reviews code for security issues, citing lines and severity",
            "system_prompt": "You are a security-focused code reviewer. Read the file carefully and report any authentication or authorization issues with line numbers and severity.",
        }],
        middleware=[CodeInterpreterMiddleware(ptc=["glob"])],
    )
    ```

    ```python Fireworks
    from deepagents import create_deep_agent
    from langchain_quickjs import CodeInterpreterMiddleware
    
    agent = create_deep_agent(
        model="fireworks:accounts/fireworks/models/glm-5p2",
        subagents=[{
            "name": "reviewer",
            "description": "Reviews code for security issues, citing lines and severity",
            "system_prompt": "You are a security-focused code reviewer. Read the file carefully and report any authentication or authorization issues with line numbers and severity.",
        }],
        middleware=[CodeInterpreterMiddleware(ptc=["glob"])],
    )
    ```

    ```python Baseten
    from deepagents import create_deep_agent
    from langchain_quickjs import CodeInterpreterMiddleware
    
    agent = create_deep_agent(
        model="baseten:zai-org/GLM-5.2",
        subagents=[{
            "name": "reviewer",
            "description": "Reviews code for security issues, citing lines and severity",
            "system_prompt": "You are a security-focused code reviewer. Read the file carefully and report any authentication or authorization issues with line numbers and severity.",
        }],
        middleware=[CodeInterpreterMiddleware(ptc=["glob"])],
    )
    ```

    ```python Ollama
    from deepagents import create_deep_agent
    from langchain_quickjs import CodeInterpreterMiddleware
    
    agent = create_deep_agent(
        model="ollama:north-mini-code-1.0",
        subagents=[{
            "name": "reviewer",
            "description": "Reviews code for security issues, citing lines and severity",
            "system_prompt": "You are a security-focused code reviewer. Read the file carefully and report any authentication or authorization issues with line numbers and severity.",
        }],
        middleware=[CodeInterpreterMiddleware(ptc=["glob"])],
    )
    ```
</CodeGroup>
