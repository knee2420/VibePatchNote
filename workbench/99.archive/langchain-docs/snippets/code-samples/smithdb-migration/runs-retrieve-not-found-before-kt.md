<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-retrieve-not-found-before-kt.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```kotlin Before
import com.langchain.smith.client.LangsmithClient
import com.langchain.smith.client.okhttp.LangsmithOkHttpClient
import com.langchain.smith.errors.NotFoundException

val client: LangsmithClient = LangsmithOkHttpClient.fromEnv()

var runId = "<run-id>"
try {
    client.runs().retrieve(runId)
} catch (e: NotFoundException) {
    println("Run $runId not found")
}
```
