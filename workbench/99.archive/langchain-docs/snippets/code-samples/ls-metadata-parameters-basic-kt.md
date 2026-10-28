<!-- source: langchain-ai/docs  src/snippets/code-samples/ls-metadata-parameters-basic-kt.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```kotlin Kotlin
import com.langchain.smith.tracing.RunType
import com.langchain.smith.tracing.TraceConfig
import com.langchain.smith.tracing.traceable

val myCustomLlm =
    traceable(
        { prompt: String -> callCustomApi(prompt) },
        TraceConfig.builder()
            .runType(RunType.LLM)
            .metadata(
                mapOf(
                    "ls_provider" to "my_provider",
                    "ls_model_name" to "my_custom_model",
                ),
            )
            .build(),
    )
```
