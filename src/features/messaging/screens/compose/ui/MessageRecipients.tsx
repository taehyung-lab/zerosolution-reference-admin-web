import { FormField, type FieldForm } from "@/shared/ui/form/FormField";
import { FormArrayField } from "@/shared/ui/form/FormArrayField";
import { Button } from "@/shared/ui/primitives/Button";
import { Input } from "@/shared/ui/primitives/Input";
import { useTranslation } from "react-i18next";
import type { MessageDraft } from "../model/message-schema";

export function MessageRecipients({
  form,
  formatAddress,
}: {
  readonly form: FieldForm<MessageDraft>;
  readonly formatAddress?: (value: string) => string;
}) {
  const { t } = useTranslation("messaging");
  return (
    <FormArrayField form={form} name="recipients" minItems={1}>
      {(recipients) => (
        <>
          {recipients.items.map((row, index) => (
            <form.Field key={row.key} name={`recipients[${index}].name`}>
              {(nameField) => (
                <FormField
                  form={form}
                  name={`recipients[${index}].address`}
                  label={t("messages.recipient", { number: index + 1 })}
                  required
                >
                  {(field, control) => (
                    <div>
                      {row.name === "" ? null : <span>{row.name}</span>}
                      <Input
                        {...control}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(formatAddress?.(event.target.value) ?? event.target.value);
                          nameField.handleChange("");
                        }}
                      />
                      {recipients.canRemove ? (
                        <Button type="button" onClick={() => recipients.remove(index)}>
                          {t("messages.remove", { number: index + 1 })}
                        </Button>
                      ) : null}
                    </div>
                  )}
                </FormField>
              )}
            </form.Field>
          ))}
          {recipients.errors.length > 0 && recipients.items.length === 0 ? (
            <p role="alert">{t("messages.errors.recipients")}</p>
          ) : null}
          <Button
            type="button"
            onClick={() =>
              recipients.append({
                key: crypto.randomUUID(),
                name: "",
                address: "",
              })
            }
          >
            {t("messages.add")}
          </Button>
        </>
      )}
    </FormArrayField>
  );
}
