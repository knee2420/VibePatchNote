<!-- source: langchain-ai/docs  src/snippets/code-samples/manage-prompts-pull-commit-java.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

```java Java
String commitHash = "12344e88";
Prompt promptAtCommit = promptClient.pull("joke-generator:" + commitHash);
```
