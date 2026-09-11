<!-- source: langchain-ai/docs  src/snippets/create-deep-agent-config-options-js.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```typescript
const agent = createDeepAgent({
  backend?: AnyBackendProtocol | (config: __type) => AnyBackendProtocol,
  checkpointer?: boolean | BaseCheckpointSaver<number>,
  contextSchema?: ContextSchema,
  interruptOn?: Record<string, boolean | __type>,
  memory?: string[],
  middleware?: TMiddleware,
  model?: string | BaseLanguageModel<any, BaseLanguageModelCallOptions>,
  name?: string,
  permissions?: FilesystemPermission[],
  responseFormat?: TResponse,
  skills?: string[],
  stateSchema?: TStateSchema,
  store?: BaseStore,
  streamTransformers?: TStreamTransformers,
  subagents?: TSubagents,
  systemPrompt?: string | SystemMessage<MessageStructure<MessageToolSet>> | SystemPromptConfig,
  tools?: TTools | StructuredTool<ToolInputSchemaBase, any, any, any, unknown>[]
});
```
