import { useForm } from '@tanstack/react-form'
import { FormTextField } from './FormTextField'

function FieldNameTypeProof() {
  const form = useForm({ defaultValues: { email: '' } })
  return (
    <>
      <FormTextField form={form} label="Email" name="email" />
      {/* @ts-expect-error adapter names must remain constrained to the form data keys. */}
      <FormTextField form={form} label="Typo" name="typo_does_not_exist" />
      {/* @ts-expect-error read-only values do not register a form field */}
      <FormTextField readOnly form={form} label="ID" value="operator" />
    </>
  )
}

void FieldNameTypeProof
