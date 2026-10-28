<!-- source: langchain-ai/docs  src/snippets/code-samples/smithdb-migration/runs-query-fetch-by-id-after-kt.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```kotlin After
import com.langchain.smith.client.LangsmithClient
import com.langchain.smith.client.okhttp.LangsmithOkHttpClient
import com.langchain.smith.models.runs.RunQueryV2Params
import com.langchain.smith.models.sessions.SessionListParams

val client: LangsmithClient = LangsmithOkHttpClient.fromEnv()

val project = client.sessions().list(
    SessionListParams.builder().name("default").limit(1L).build()
).items().first()
val runs = client.runs().queryV2(
    RunQueryV2Params.builder()
        .addProjectId(project.id())
        .addId("<run-id-1>")
        .addId("<run-id-2>")
        .build()
).items()
```
