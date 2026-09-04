# Consequential selection confirmation

Read this file only when a selection change requires explicit confirmation before becoming the committed value.

Keep the committed value unchanged and store one local candidate. Open a declarative Confirm dialog. Confirm commits through the caller (`setFieldValue` for a form); cancel discards the candidate. The candidate is not a mirror of committed form or URL state.

The feature owns which changes are consequential, confirmation copy, pending behavior, and downstream reset. Shared controls expose controlled values/callbacks and do not open workflow dialogs themselves.
