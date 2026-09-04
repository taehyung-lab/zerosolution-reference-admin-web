# Pagination rendering

Read this file only for shared Pagination or page-size control rendering and accessibility.

Pagination and page-size controls are fully controlled. They receive calculated page/total/options and callbacks. URL state, default page size, reset policy, out-of-range recovery, and route navigation stay in the feature.

- `Pagination({ page, totalPages, onPageChange, ariaLabel, previousLabel, nextLabel })` renders nothing when `totalPages <= 1` and shows `← Previous 1 2 3 … 67 68 Next →` (a window around the current page plus anchors). The window and the Previous/Next boundaries use the page clamped into range, but `aria-current` marks only the raw `page`; an out-of-range page therefore renders no current marker, and the feature must canonicalize or redirect it before rendering (list-workflow).
- `PageSizeControl({ label, value: number, options: readonly number[], onValueChange })` and `SortControl({ label, value, options: { value, label }[], onValueChange })` are controlled selects named by their `label`. `SortControl` carries the sort **field** only; the product has no standalone direction control, so direction is a column-header policy in the feature.

Never render a false `aria-current`. Keep pagination separate from DataTable and do not hide route policy in a shared hook. Test accessible current-page state, disabled boundaries, and controlled callbacks actually changed.
