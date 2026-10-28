<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/feedback-create-before-kt.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```kotlin Before
import com.langchain.smith.client.LangsmithClient
import com.langchain.smith.client.okhttp.LangsmithOkHttpClient
import com.langchain.smith.models.feedback.FeedbackCreateSchema

val client: LangsmithClient = LangsmithOkHttpClient.fromEnv()

var runId = "<run-id>"
client.feedback().create(
    FeedbackCreateSchema.builder()
        .runId(runId)
        .key("user_feedback")
        .score(1.0)
        .build()
)
```
