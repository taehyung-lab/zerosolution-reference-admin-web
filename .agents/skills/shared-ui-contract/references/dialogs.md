# Dialogs, Confirm, and Alert

Read this file only for the Dialog primitive, Confirm, Alert, modal focus, or pending close behavior.

- Build one Radix Dialog primitive and domain-neutral Confirm and Alert patterns.
- Render them declaratively in the owning JSX. The caller owns intent/open state, pending, failure, close policy, mutation, copy, navigation, and focus destination.
- Form/rich-content modals are feature compositions of Dialog, not universal modal APIs. A dialog hosting a search/selection table keeps candidate selection in the feature; classification lives in [feature-contract table-composition](../../feature-contract/references/table-composition.md).
- Confirm handles consequential yes/no decisions. Alert handles explicit acknowledgement.
- `ConfirmDialog({ open, onOpenChange, title, description?, confirmLabel, cancelLabel, onConfirm, pending? })`: while `pending`, both buttons are disabled and a close request is ignored. `AlertDialog({ open, onOpenChange, title, description?, acknowledgeLabel, onAcknowledge? })`: one button that acknowledges and closes; it has no pending state. `title` is normally `shared:alert.title` ("알림"); description and labels are caller copy (or `shared` copy when a shared pattern such as `FormSaveDialogs` owns the interaction).
- The common alert catalogue (Figma `1.3 Alert` frames `1.1.3.1.x`/`1.1.3.2.x`, `docs/reference/zero-sol/01-common.md`) is `shared` namespace copy: `formSave.confirmDescription` (저장 확인), `unsavedChanges.description` (화면 이동), `bulkAction.confirm` (선택 변경), `deleteConfirm.description` (삭제 확인, 2026-09-11), and the 완료 sentences. A feature does not re-declare one of these sentences in its own namespace; a sentence that differs from the catalogue stays feature copy with its ledger row (examples: [이 저장소의 관찰](#이-저장소의-관찰)).
- Form dialogs in the product (a send form, a comment form) carry a title bar with an explicit close affordance; `Dialog.closeLabel` exposes a labelled × button through the same controlled close request as Escape/outside dismissal. Section headings inside the dialog are plain headings, not `SectionCard`.
- Pending disables the initiating action and cannot be bypassed by Escape/outside close. Keep controlled `onOpenChange` present and guard closure there.

`Dialog` records the focused element before its initial autofocus and restores it on close when that
element is still connected. This fixes the external-opener → BODY loss reproduced by `dialogs.test.tsx`.
If navigation removes the opener, the destination owns focus. This is focus restoration, not a domain
action policy. Dialog only reports a close request; the feature owns whether that request needs confirmation.
The 2026-09-07 cancellation scenario excludes detail-inline/action-dialog forms from dirty close questions;
eligibility and consumer wiring are owned by [form-workflow.md](../../feature-contract/references/form-workflow.md#cancel-and-tabs).
The app's `UnsavedChangesProvider` currently owns one route confirmation for concurrent dirty forms;
cancel-only scope changes do not remove route protection. No form value or pending destination is copied into it.

Do not create an imperative global confirm service, a hook returning hidden JSX, router-typed props, CRUD copy, or mutation/error handling inside shared Dialog. Test title/description, initial focus, restoration, Escape/outside policy, pending, and the action actually changed.

## 이 저장소의 관찰

규칙이 아니라 이 저장소 화면에서 위 규칙을 적용한 기록이다. 신규 프로젝트는 이 절을 비우고 자기 화면으로 다시 채운다.

- 카탈로그와 다른 문장이 feature 카피로 남은 예: `members:bulk.confirmDelete` "선택 항목을 삭제하시겠습니까?".
- 2026-09-11 운영자·상담 삭제 확인이 `shared` 키(`deleteConfirm.description`)로 옮겨졌다.
