# Dialogs, Confirm, and Alert

Read this file only for the Dialog primitive, Confirm, Alert, modal focus, or pending close behavior.

- Build one Radix Dialog primitive and domain-neutral Confirm and Alert patterns.
- Render them declaratively in the owning JSX. The caller owns intent/open state, pending, failure, close policy, mutation, copy, navigation, and focus destination.
- Form/rich-content modals are feature compositions of Dialog, not universal modal APIs. A dialog hosting a search/selection table keeps candidate selection in the feature; classification lives in [feature-contract table-composition](../../feature-contract/references/table-composition.md).
- Confirm handles consequential yes/no decisions. Alert handles explicit acknowledgement.
- `ConfirmDialog({ open, onOpenChange, title, description?, confirmLabel, cancelLabel, onConfirm, pending? })`: while `pending`, both buttons are disabled and a close request is ignored. `AlertDialog({ open, onOpenChange, title, description?, acknowledgeLabel, onAcknowledge? })`: one button that acknowledges and closes; it has no pending state. `title` is normally `shared:alert.title` ("알림"); description and labels are caller copy (or `shared` copy when a shared pattern such as `FormSaveDialogs` owns the interaction).
- Form dialogs in the product (SMS/이메일 발송, 댓글등록) carry a title bar with an explicit close affordance; `Dialog.closeLabel` exposes a labelled × button through the same controlled close request as Escape/outside dismissal. Section headings inside the dialog are plain headings, not `SectionCard`.
- Pending disables the initiating action and cannot be bypassed by Escape/outside close. Keep controlled `onOpenChange` present and guard closure there.

`Dialog` records the focused element before its initial autofocus and restores it on close when that
element is still connected. This fixes the external-opener → BODY loss reproduced by `dialogs.test.tsx`.
If navigation removes the opener, the destination owns focus. This is focus restoration, not a domain
action policy. Dirty close protection remains in the form's guard; Dialog only reports a close request.
The app's `UnsavedChangesProvider` owns one route confirmation for concurrent dirty forms. Local
popup cancellation remains scoped to that popup; no form value or pending destination is copied into it.

Do not create an imperative global confirm service, a hook returning hidden JSX, router-typed props, CRUD copy, or mutation/error handling inside shared Dialog. Test title/description, initial focus, restoration, Escape/outside policy, pending, and the action actually changed.
