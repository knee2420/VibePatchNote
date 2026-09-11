<!-- source: langchain-ai/docs  src/snippets/code-samples/threads-continue-first-message-kt.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```kotlin Kotlin
val messages =
    listOf(
        ChatCompletionMessageParam.ofUser(
            ChatCompletionUserMessageParam.builder()
                .content("What was the first message I sent you?")
                .build(),
        ),
    )

chatPipeline(ChatRequest(messages, getChatHistory = true))
```
