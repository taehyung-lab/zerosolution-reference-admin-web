const ANCHOR_COUNT = 2;
const WINDOW_SIZE = 3;
const ELLIPSIS = 'ellipsis';
const ELLIPSIS_GLYPH = '…';

/**
 * Confirmed shape is `← Previous 1 2 3 … 67 68 Next →`: a window around the current page
 * plus anchored pages at the ends, with the gap collapsed. Only the leading case is read
 * from Figma, so one anchor count is applied at both ends rather than guessing two.
 */
function pageWindow(
  currentPage: number,
  totalPages: number
): readonly (number | typeof ELLIPSIS)[] {
  const windowStart = Math.min(
    Math.max(currentPage - Math.floor(WINDOW_SIZE / 2), 1),
    Math.max(1, totalPages - WINDOW_SIZE + 1)
  );
  const shown = new Set<number>();
  for (let page = 1; page <= Math.min(ANCHOR_COUNT, totalPages); page += 1)
    shown.add(page);
  for (
    let page = windowStart;
    page < windowStart + WINDOW_SIZE && page <= totalPages;
    page += 1
  ) {
    shown.add(page);
  }
  for (
    let page = Math.max(1, totalPages - ANCHOR_COUNT + 1);
    page <= totalPages;
    page += 1
  ) {
    shown.add(page);
  }

  const slots: (number | typeof ELLIPSIS)[] = [];
  let previous = 0;
  for (const page of [...shown].sort((a, b) => a - b)) {
    if (previous > 0 && page - previous > 1) slots.push(ELLIPSIS);
    slots.push(page);
    previous = page;
  }
  return slots;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  ariaLabel,
  previousLabel,
  nextLabel,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  ariaLabel: string;
  previousLabel: string;
  nextLabel: string;
}) {
  if (totalPages <= 1) return null;
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const slots = pageWindow(currentPage, totalPages);
  return (
    <nav
      aria-label={ariaLabel}
      className="mt-4 flex items-center justify-start gap-2"
    >
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        {previousLabel}
      </button>
      {slots.map((slot, index) =>
        slot === ELLIPSIS ? (
          <span
            aria-hidden="true"
            className="px-1 text-neutral-400"
            key={`${ELLIPSIS}-${index}`}
          >
            {ELLIPSIS_GLYPH}
          </span>
        ) : (
          <button
            aria-current={slot === page ? 'page' : undefined}
            className={
              slot === page
                ? 'h-8 w-8 rounded-full bg-neutral-900 text-white'
                : 'h-8 w-8 rounded-full'
            }
            key={slot}
            onClick={() => onPageChange(slot)}
          >
            {slot}
          </button>
        )
      )}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        {nextLabel}
      </button>
    </nav>
  );
}
