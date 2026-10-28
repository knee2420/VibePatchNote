<!-- source: langchain-ai/docs  src/langsmith/self-host-ui-customization.mdx -->
<!-- commit: 3e4afc107f12c31131662fa178b53d7a14b7e681 -->
<!-- fetched: 2026-09-11 -->

---
title: Customize the error support message
sidebarTitle: Customize the UI
description: Customize support contact information in the LangSmith frontend for self-hosted deployments.
---

## Custom error support message

By default, error messages in LangSmith direct users to the [Support Portal](https://support.langchain.com). You can replace this with your own support contact information.

When set, all error and support messages throughout the UI will display your custom text instead of the default LangChain support email.

<Note>
The custom message is rendered as **plain text** only. HTML tags will not be interpreted and will display as literal text.
</Note>

```yaml Helm
config:
  customErrorSupportMessage: "For help, contact your internal IT team at helpdesk@example.com"
```

To revert to the default behavior, remove the setting or set it to an empty string.
