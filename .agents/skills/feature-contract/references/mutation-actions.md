# Mutation actions and feedback

Read this file for mutation pending/result, confirmation, alert, toast, dialog closure, or post-success navigation.

## Ownership

The feature mutation owns the server call and declared cache consequence. The calling screen owns safe feedback copy, navigation, dialog closure, and focus restoration. Disable the initiating action with `isPending`; do not create a loading store or feature overlay. App-wide progress derives directly from Query/Mutation state when the confirmed product contract requires it.

## Interaction choice

- Consequential yes/no decision: shared Confirm.
- Explicit completion acknowledgement: shared Alert.
- Incidental non-blocking feedback: toast.
- Form or rich interaction: feature composition of the shared Dialog primitive. A dialog that hosts a search/selection table is kind E in [table-composition.md](table-composition.md).

Render dialogs declaratively. Keep intent and open state near the caller. Confirmation does not catch and hide mutation errors, and pending cannot be bypassed by close behavior. Do not create a global imperative confirm service or a hook returning hidden JSX.

Do not infer the destination or feedback channel from a generic “success” label. Product policy determines whether success stays, returns, enters detail, closes a dialog, resets selection, or requires acknowledgement.

Read the API mutation reference when changing payload/cache behavior. Read [form-workflow.md](form-workflow.md) only for form values, validation, dirty state, or field-error mapping.
