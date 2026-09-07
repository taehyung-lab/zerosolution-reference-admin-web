import { FormField, type FieldForm } from "@/shared/ui/form/FormField";
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
    <form.Field name="recipients" mode="array">
      {(recipients) => (
        <>
          {recipients.state.value.map((row, index) => (
            <FormField
              key={row.key}
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
                      const address =
                        formatAddress?.(event.target.value) ??
                        event.target.value;
                      recipients.handleChange(
                        recipients.state.value.map((entry, position) =>
                          position === index
                            ? { ...entry, address, name: "" }
                            : entry,
                        ),
                      );
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => recipients.removeValue(index)}
                  >
                    {t("messages.remove", { number: index + 1 })}
                  </Button>
                </div>
              )}
            </FormField>
          ))}
          {recipients.state.meta.errors.length > 0 &&
          recipients.state.value.length === 0 ? (
            <p role="alert">{t("messages.errors.recipients")}</p>
          ) : null}
          <Button
            type="button"
            onClick={() =>
              recipients.pushValue({
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
    </form.Field>
  );
}
