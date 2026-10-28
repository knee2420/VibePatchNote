<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-geturl-after-kt.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```kotlin After
import com.langchain.smith.client.LangsmithClient
import com.langchain.smith.client.okhttp.LangsmithOkHttpClient
import com.langchain.smith.models.runs.RunGetUrlParams

fun main() {
    val client: LangsmithClient = LangsmithOkHttpClient.fromEnv()

    var runId = "<run-id>"
    val run = client.runs().retrieve(runId)

    val response = client.runs().getUrl(
        run.id(),
        RunGetUrlParams.builder()
            .projectId(run.sessionId())
            .traceId(run.traceId())
            .startTime(run.startTime().get().toString()) // Optional, but speeds up retrieval
            .build()
    )
    println(response.url().get())
}
```
