import { Input } from './Input';

export function InlineSearchSelect({
  value, selectedLabel, options, searchValue, onSearchValueChange,
  onValueChange, id, searchLabel, placeholder, clearLabel,
}: {
  readonly value: string | undefined;
  readonly selectedLabel: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly searchValue: string;
  readonly onSearchValueChange: (value: string) => void;
  readonly onValueChange: (value: string | undefined) => void;
  readonly id?: string;
  readonly searchLabel: string;
  readonly placeholder: string;
  readonly clearLabel: string;
}) {
  const query = searchValue.trim().toLocaleLowerCase();
  const matches = query
    ? options.filter((option) => option.label.toLocaleLowerCase().includes(query))
    : [];

  return (
    <>
      <Input id={id} aria-label={searchLabel} placeholder={placeholder}
        value={searchValue} disabled={value !== undefined}
        onChange={(event) => onSearchValueChange(event.target.value)} />
      {value !== undefined ? (
        <div>
          <span>{selectedLabel}</span>
          <button type="button" aria-label={clearLabel} onClick={() => {
            onValueChange(undefined);
            onSearchValueChange('');
          }}>×</button>
        </div>
      ) : (
        <ul>
          {matches.map((option) => (
            <li key={option.value}>
              <button type="button" onClick={() => {
                onValueChange(option.value);
                onSearchValueChange('');
              }}>{option.label}</button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
