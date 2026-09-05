# Dialogs, Confirm, and Alert

Read this file only for the Dialog primitive, Confirm, Alert, modal focus, or pending close behavior.

- Build one Radix Dialog primitive and domain-neutral Confirm and Alert patterns.
- Render them declaratively in the owning JSX. The caller owns intent/open state, pending, failure, close policy, mutation, copy, navigation, and focus destination.
- Form/rich-content modals are feature compositions of Dialog, not universal modal APIs. A dialog hosting a search/selection table keeps candidate selection in the feature; classification lives in [feature-contract table-composition](../../feature-contract/references/table-composition.md).
- Confirm handles consequential yes/no decisions. Alert handles explicit acknowledgement.
- `ConfirmDialog({ open, onOpenChange, title, description?, confirmLabel, cancelLabel, onConfirm, pending? })`: while `pending`, both buttons are disabled and a close request is ignored. `AlertDialog({ open, onOpenChange, title, description?, acknowledgeLabel, onAcknowledge? })`: one button that acknowledges and closes; it has no pending state. `title` is normally `shared:alert.title` ("알림"); description and labels are caller copy (or `shared` copy when a shared pattern such as `FormSaveDialogs` owns the interaction).
- Form dialogs in the product (SMS/이메일 발송, 댓글등록) carry a title bar with an explicit close affordance; the primitive may expose it through one labelled `close` option when the first such dialog is built. Section headings inside the dialog are plain headings, not `SectionCard`.
- Pending disables the initiating action and cannot be bypassed by Escape/outside close. Keep controlled `onOpenChange` present and guard closure there.

**Known gap (measured 2026-09-05).** The caller is told to own the focus destination and to test restoration, but `Dialog` exposes no path for it: it renders a controlled `Radix Dialog.Root` with no `Trigger` and no close-focus option, and its own doc comment claims to own focus. Measured in Chromium on the member and manager lists, closing the Select menu restores focus to its trigger, while closing the missing-selection alert and the confirm dialog leaves focus on `BODY`. Do not read the sentences above as satisfied. Adding the wording without an API and a check would make the next reader assume Radix restores focus to any external button. The primitive API, its check, and that stale comment are one follow-up.

Do not create an imperative global confirm service, a hook returning hidden JSX, router-typed props, CRUD copy, or mutation/error handling inside shared Dialog. Test title/description, initial focus, restoration, Escape/outside policy, pending, and the action actually changed.
