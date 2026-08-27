# Dialog, async, status, and notification surfaces

Read this file when creating or changing a dialog, blocking overlay, access/session state, status badge, toast, or notification panel.

## Dialog contract

- Build one Radix Dialog primitive and two domain-neutral patterns: `ConfirmDialog` and `AlertDialog`.
- Render them declaratively in the owning JSX. The caller owns open state, candidate intent, pending, failure, close policy, focus restoration, mutation, toast, and navigation.
- A form or rich-content modal is feature composition of the Dialog primitive, not another universal modal API.
- Confirm covers a consequential yes/no decision. Alert covers an acknowledgement that the product explicitly requires. Routine non-blocking feedback uses toast.
- Pending disables the initiating action. Escape/outside close is explicit and cannot bypass a pending indivisible action.
- Guard pending closure inside the controlled `onOpenChange` handler while keeping the handler present; setting it to `undefined` must not become the close policy.

Do not create an imperative global `await confirm()` service, a hook returning a hidden component, router-typed props, CRUD-coded copy, or a shared dialog that performs mutation/error handling itself.

## Loading, access, and session

- Initial area loading uses a skeleton; background refetch preserves content; ordinary submit uses button-level pending.
- A shared `BlockingOverlay` may exist because confirmed workflows use it, but each call site must state why the entire surface is indivisible or unsafe to interact with. A create/edit/delete method name alone is not evidence.
- Access denial and session termination are app incident screen states, not ordinary feature dialogs.
- The app session boundary owns remaining-time display, extension action, expiry warning, and terminal incident. It does not duplicate the Query session response.

## Status and notification

- Shared `Badge` accepts semantic `tone` and visible content only. A feature maps confirmed server status to tone and translated label in `features/{domain}/model/status.ts` with exhaustive typing.
- Do not put domain/status strings into a global shared registry or silently fall back to raw server values.
- Shared notification UI may expose a toaster and a panel with list, clear-all, row-action, unread, and empty slots. `features/notifications` owns delivery, retention contract, read/delete mutation, and code-to-copy mapping; `app/shell` only mounts its public entry.
- User-facing notification copy is resolved from a confirmed code. Raw server messages are diagnostic data unless the contract declares them safe display copy.
