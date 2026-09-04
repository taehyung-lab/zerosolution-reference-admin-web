# Toast and notification surfaces

Read this file only for shared toast or notification-panel rendering.

- Toast presents caller-decided incidental non-blocking feedback; it owns no mutation, navigation, or domain copy policy.
- Shared notification UI exposes domain-neutral list, clear-all, row-action, unread, and empty slots.
- `features/notifications` owns delivery, retention, read/delete mutations, code-to-copy mapping, and feature states.
- Raw server messages are diagnostic unless the contract declares them safe display copy.

Use translated accessible action names and live regions appropriate to the interaction. Test the surface and focus/announcement behavior changed.
