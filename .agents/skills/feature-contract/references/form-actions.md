# Forms, dialogs, mutations, and files

Read this file for create/edit forms, RHF, Zod, dialogs, mutations, server field errors, navigation, or file workflows.

## Form ownership

- RHF is the single owner of values, dirty/touched state, and field errors.
- A feature-owned Zod schema defines UI input; `z.infer` defines its value type.
- Create and edit share one schema only when their fields and validation rules are identical. When requiredness, range, or field presence differs, share stable field fragments only and keep separate schemas. Defaults and request mappers are always explicit and separate; do not add a schema `mode` switch.
- Do not mirror RHF fields in `useState`, mutate Query cache as form state, or build a schema-driven universal form renderer.
- Map only confirmed server field errors. Preserve entered values after failure.
- Native fields use `register`; controlled composites use `useController`. A consequential field change keeps one candidate outside RHF until declarative confirmation; this candidate is not a mirror of the committed value. Confirm calls `setValue` with `shouldDirty: true` and validation when the field contract requires it. Field/control details are in [field-and-select.md](../../shared-ui-contract/references/field-and-select.md).

## Submit and mutation

The feature mutation owns the server call and cache consequence. The calling screen owns toast wording, navigation, dialog closure, and focus restoration because those outcomes depend on the use case.

Disable the initiating action with `isPending`. Do not create a global loading store or context. Use a blocking overlay only when the entire surface truly cannot remain interactive, such as session restoration or an indivisible workflow. A pending create, edit, or delete is not sufficient by itself.

## Dialog choice

- Acknowledgement only: shared alert.
- Consequential yes/no decision: shared confirm.
- Form or rich interaction: feature composition of the shared Dialog primitive.

Keep dialog state close to its owner. A discriminated union is useful when one screen has mutually exclusive dialog intents; do not mandate it for one boolean dialog. Confirmation components do not catch and hide mutation errors.

If the product or design explicitly requires completion acknowledgement, use Alert; use toast for incidental, non-blocking feedback. Dirty-leave confirmation uses the Router blocker and Confirm. Blocking overlay, access/session, status, and notification rules are in [dialog-and-status.md](../../shared-ui-contract/references/dialog-and-status.md).

Render alert/confirm patterns declaratively so pending, failure, focus restoration, and close policy remain visible to the feature. Do not add a global imperative `await confirm()` service or a hook that returns a hidden component and mutates refs during render. App-level auth incidents belong to the app incident boundary, not ordinary feature dialogs.

## Files

Treat upload as a separate mutation unless the server contract defines one atomic multipart form. Validate only confirmed client constraints such as size, MIME, and extension; the server validates content. Preserve the selected file on recoverable failure. Client parsing, preview, header mapping, large-file jobs, progress polling, cancellation, and rejection reports require explicit product behavior and server support.
