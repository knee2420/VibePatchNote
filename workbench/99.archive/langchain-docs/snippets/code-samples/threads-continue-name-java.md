<!-- source: langchain-ai/docs  src/snippets/code-samples/threads-continue-name-java.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```java Java
List<ChatCompletionMessageParam> messages =
    Collections.singletonList(
        ChatCompletionMessageParam.ofUser(
            ChatCompletionUserMessageParam.builder()
                .content("What is my name")
                .build()));

ThreadsChatPipeline.chatPipeline().apply(new ThreadsChatPipeline.ChatRequest(messages, true));
```
