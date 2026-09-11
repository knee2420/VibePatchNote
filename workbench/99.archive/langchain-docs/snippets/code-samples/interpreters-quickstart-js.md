<!-- source: langchain-ai/docs  src/snippets/code-samples/interpreters-quickstart-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

<CodeGroup>
    ```ts Google
    import { createDeepAgent } from "deepagents";
    import { createCodeInterpreterMiddleware } from "@langchain/quickjs";
    
    const agent = createDeepAgent({
      model: "google-genai:gemini-3.6-flash",
      middleware: [createCodeInterpreterMiddleware()],
    });
    ```

    ```ts OpenAI
    import { createDeepAgent } from "deepagents";
    import { createCodeInterpreterMiddleware } from "@langchain/quickjs";
    
    const agent = createDeepAgent({
      model: "openai:gpt-5.5",
      middleware: [createCodeInterpreterMiddleware()],
    });
    ```

    ```ts Anthropic
    import { createDeepAgent } from "deepagents";
    import { createCodeInterpreterMiddleware } from "@langchain/quickjs";
    
    const agent = createDeepAgent({
      model: "anthropic:claude-sonnet-4-6",
      middleware: [createCodeInterpreterMiddleware()],
    });
    ```

    ```ts OpenRouter
    import { createDeepAgent } from "deepagents";
    import { createCodeInterpreterMiddleware } from "@langchain/quickjs";
    
    const agent = createDeepAgent({
      model: "openrouter:openrouter:z-ai/glm-5.2",
      middleware: [createCodeInterpreterMiddleware()],
    });
    ```

    ```ts Fireworks
    import { createDeepAgent } from "deepagents";
    import { createCodeInterpreterMiddleware } from "@langchain/quickjs";
    
    const agent = createDeepAgent({
      model: "fireworks:accounts/fireworks/models/glm-5p2",
      middleware: [createCodeInterpreterMiddleware()],
    });
    ```

    ```ts Baseten
    import { createDeepAgent } from "deepagents";
    import { createCodeInterpreterMiddleware } from "@langchain/quickjs";
    
    const agent = createDeepAgent({
      model: "baseten:zai-org/GLM-5.2",
      middleware: [createCodeInterpreterMiddleware()],
    });
    ```

    ```ts Ollama
    import { createDeepAgent } from "deepagents";
    import { createCodeInterpreterMiddleware } from "@langchain/quickjs";
    
    const agent = createDeepAgent({
      model: "ollama:north-mini-code-1.0",
      middleware: [createCodeInterpreterMiddleware()],
    });
    ```
</CodeGroup>
