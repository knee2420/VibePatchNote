<!-- source: langchain-ai/docs  src/snippets/code-samples/agents-model-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
    ```ts Google
    import { createAgent } from "langchain";
    
    var agent = createAgent({ model: "google-genai:gemini-3.6-flash", tools });
    ```

    ```ts OpenAI
    import { createAgent } from "langchain";
    
    var agent = createAgent({ model: "openai:gpt-5.4", tools });
    ```

    ```ts Anthropic
    import { createAgent } from "langchain";
    
    var agent = createAgent({ model: "anthropic:claude-sonnet-4-6", tools });
    ```

    ```ts OpenRouter
    import { createAgent } from "langchain";
    
    var agent = createAgent({ model: "openrouter:anthropic/claude-sonnet-4-6", tools });
    ```

    ```ts Fireworks
    import { createAgent } from "langchain";
    
    var agent = createAgent({ model: "fireworks:accounts/fireworks/models/qwen3p5-397b-a17b", tools });
    ```

    ```ts Baseten
    import { createAgent } from "langchain";
    
    var agent = createAgent({ model: "baseten:zai-org/GLM-5.2", tools });
    ```

    ```ts Ollama
    import { createAgent } from "langchain";
    
    var agent = createAgent({ model: "ollama:devstral-2", tools });
    ```
</CodeGroup>
