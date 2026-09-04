export interface IdName {
  readonly id?: string | number
  readonly name?: string
}

export function toSelectOption({ id, name }: IdName) {
  return { value: String(id ?? ''), label: name ?? '' }
}
