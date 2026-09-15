import { Table, TableCell, TableHead } from '../primitives/Table';

/** Already localized, safe display values. The caller resolved server vocabulary, dates, and redaction. */
export interface UpdateHistoryEntry {
  readonly id: string;
  readonly date: string;
  readonly lines: readonly string[];
  readonly actor: string;
}

/**
 * Owns the three-column update-history table and one semantic line per change.
 * Does not own the enclosing section, its title, the entry mapping, or any server field vocabulary.
 */
export function UpdateHistory({
  entries,
  labels,
  emptyText,
}: {
  readonly entries: readonly UpdateHistoryEntry[];
  readonly labels: {
    readonly date: string;
    readonly change: string;
    readonly actor: string;
  };
  readonly emptyText: string;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-neutral-600">{emptyText}</p>;
  }
  return (
    <Table>
      <thead>
        <tr>
          <TableHead>{labels.date}</TableHead>
          <TableHead>{labels.change}</TableHead>
          <TableHead>{labels.actor}</TableHead>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id}>
            <TableCell className="whitespace-nowrap">{entry.date}</TableCell>
            <TableCell>
              <ul className="space-y-1">
                {entry.lines.map((line, index) => (
                  <li key={`${entry.id}:${index}`}>{line}</li>
                ))}
              </ul>
            </TableCell>
            <TableCell className="whitespace-nowrap">{entry.actor}</TableCell>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
