import { useMemo, useState } from 'react'
import { Popover } from './Popover'
// Unverified: retain until the second list screen (performance list) confirms this contract.

export interface ComboboxOption {
  readonly value: string
  readonly label: string
}

export function Combobox({
  value,
  onValueChange,
  options,
  searchValue,
  onSearchValueChange,
  placeholder,
  searchLabel,
  emptyLabel,
  id,
  ariaDescribedby,
  ariaInvalid,
  ariaLabelledby,
  onBlur,
}: {
  readonly value: string | null
  readonly onValueChange: (value: string | null) => void
  readonly options: readonly ComboboxOption[]
  readonly searchValue: string
  readonly onSearchValueChange: (value: string) => void
  readonly placeholder: string
  readonly searchLabel: string
  readonly emptyLabel: string
  readonly id?: string
  readonly ariaDescribedby?: string
  readonly ariaInvalid?: boolean
  readonly ariaLabelledby?: string
  readonly onBlur?: () => void
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)
  const visibleOptions = useMemo(
    () => options.filter((option) => option.label.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase())),
    [options, searchValue],
  )

  return (
    <Popover contentLabel={searchLabel} open={open} onOpenChange={setOpen} trigger={<button aria-describedby={ariaDescribedby} aria-invalid={ariaInvalid} aria-labelledby={ariaLabelledby} id={id} onBlur={onBlur} type="button">{selected?.label ?? placeholder}</button>}>
      <div className="grid gap-2">
        <input aria-label={searchLabel} value={searchValue} onChange={(event) => onSearchValueChange(event.target.value)} />
        {visibleOptions.length === 0 ? <span>{emptyLabel}</span> : visibleOptions.map((option) => <button key={option.value} type="button" onClick={() => { onValueChange(option.value); setOpen(false) }}>{option.label}</button>)}
      </div>
    </Popover>
  )
}
