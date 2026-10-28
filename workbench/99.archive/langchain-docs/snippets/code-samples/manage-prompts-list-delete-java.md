<!-- source: langchain-ai/docs  src/snippets/code-samples/manage-prompts-list-delete-java.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```java Java
import com.langchain.smith.client.LangsmithClient;
import com.langchain.smith.client.okhttp.LangsmithOkHttpClient;
import com.langchain.smith.models.repos.RepoDeleteParams;
import com.langchain.smith.models.repos.RepoListPage;
import com.langchain.smith.models.repos.RepoListParams;
import com.langchain.smith.models.repos.RepoWithLookups;

LangsmithClient client = LangsmithOkHttpClient.fromEnv();

// List all prompts in my workspace
RepoListPage prompts = client.repos().list();
for (RepoWithLookups prompt : prompts.repos()) {
    System.out.println(prompt.repoHandle());
}

// List my private prompts that include "joke"
RepoListPage jokePrompts = client.repos().list(
    RepoListParams.builder()
        .query("joke")
        .isPublic(RepoListParams.IsPublic.FALSE)
        .build()
);

// Delete a prompt
client.repos().delete(
    RepoDeleteParams.builder()
        .owner("-")
        .repo("joke-generator")
        .build()
);
```
