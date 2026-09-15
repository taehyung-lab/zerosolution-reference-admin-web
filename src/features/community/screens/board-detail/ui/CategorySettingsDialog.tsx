import { revalidateLogic, useForm, useSelector } from '@tanstack/react-form'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BOARD_CATEGORY_NAME_MAX_LENGTH, boardUsages, type BoardCategoryItem } from '@/features/community/model/board'
import { categorySettingsSchema, type CategorySettingsValues } from '../model/category-settings-schema'
import { FormArrayField } from '@/shared/ui/form/FormArrayField'
import { FormSelectField } from '@/shared/ui/form/FormSelectField'
import { FormTextField } from '@/shared/ui/form/FormTextField'
import { useUnsavedChangesGuard } from '@/shared/ui/form/UnsavedChangesGuard'
import { SortableList } from '@/shared/ui/list/SortableList'
import { Button } from '@/shared/ui/primitives/Button'
import { Dialog } from '@/shared/ui/primitives/Dialog'

export function CategorySettingsDialog({ open, categories, onOpenChange, onSave }: {
  readonly open: boolean
  readonly categories: readonly BoardCategoryItem[]
  readonly onOpenChange: (open: boolean) => void
  readonly onSave: (categories: readonly BoardCategoryItem[]) => void
}) {
  const { t } = useTranslation('community')
  const { t: shared } = useTranslation('shared')
  const [defaultValues] = useState<CategorySettingsValues>(() => ({ categories: [...categories] }))
  const schema = categorySettingsSchema(t('board.categories.required'))
  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
    onSubmit: ({ value }) => onSave(schema.parse(value).categories),
  })
  const dirty = useSelector(form.store, (state) => state.isDirty && !state.isDefaultValue)
  const valid = useSelector(form.store, (state) => schema.safeParse(state.values).success)
  const guard = useUnsavedChangesGuard({ when: dirty })
  const close = () => guard.close(() => onOpenChange(false))
  const usageOptions = boardUsages.map((value) => ({ value, label: t(`board.values.usage.${value}`) }))

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => { if (!next) close() }}
        title={t('board.categories.title')}
        closeLabel={t('board.categories.close')}
        footer={<>
          <Button type="button" disabled={!valid} onClick={() => void form.handleSubmit()}>{shared('formAction.save')}</Button>
          <Button type="button" className="bg-neutral-200 text-neutral-900" onClick={close}>{shared('formAction.cancel')}</Button>
        </>}
      >
        <FormArrayField form={form} name="categories" minItems={1}>
          {(array) => <>
            <div className="flex items-center justify-between rounded-md bg-neutral-100 px-3 py-2">
              <span className="text-sm font-medium">{t('board.categories.heading')}</span>
              <Button type="button" onClick={() => array.prepend({ id: `new-${crypto.randomUUID()}`, name: '', usage: 'IN_USE' })}>
                {t('board.categories.add')}
              </Button>
            </div>
            <table className="mt-3 w-full text-sm">
              <thead><tr className="text-left text-neutral-600">
                <th scope="col" className="w-32 py-2">{t('board.categories.order')}</th>
                <th scope="col" className="py-2">{t('board.categories.name')}</th>
                <th scope="col" className="w-40 py-2">{t('board.categories.usage')}</th>
                <th scope="col" className="w-12 py-2"><span className="sr-only">{t('board.categories.remove')}</span></th>
              </tr></thead>
              <tbody>
                <SortableList
                  items={array.items.map((item) => item.id)}
                  onMove={array.move}
                  getItemLabel={(_, index) =>
                    array.items[index]?.name.trim() || t('board.categories.nameFor', { order: index + 1 })
                  }
                >
                  {({ index, isDragging, itemProps, handleProps }) => (
                    <tr {...itemProps} className={`border-t border-neutral-200${isDragging ? ' opacity-60' : ''}`}>
                      <td className="py-2"><span className="inline-flex items-center gap-1">
                        <button {...handleProps} type="button" aria-label={t('board.categories.move', { order: index + 1 })} className="cursor-grab px-1 text-neutral-500">≡</button>
                        <span className="w-5 text-center">{index + 1}</span>
                      </span></td>
                      <td className="py-2 pr-3 [&>div>label]:sr-only"><FormTextField
                        form={form}
                        name={`categories[${index}].name`}
                        label={t('board.categories.nameFor', { order: index + 1 })}
                        maxLength={BOARD_CATEGORY_NAME_MAX_LENGTH}
                        placeholder={t('board.categories.namePlaceholder', { max: BOARD_CATEGORY_NAME_MAX_LENGTH })}
                      /></td>
                      <td className="py-2 pr-3 [&>div>label]:sr-only"><FormSelectField
                        form={form}
                        name={`categories[${index}].usage`}
                        label={t('board.categories.usageFor', { order: index + 1 })}
                        options={usageOptions}
                      /></td>
                      <td className="py-2">{array.canRemove ? <button
                        type="button"
                        aria-label={t('board.categories.removeFor', { order: index + 1 })}
                        className="text-neutral-500"
                        onClick={() => array.remove(index)}
                      >ⓧ</button> : null}</td>
                    </tr>
                  )}
                </SortableList>
              </tbody>
            </table>
          </>}
        </FormArrayField>
      </Dialog>
      {guard.dialog}
    </>
  )
}
