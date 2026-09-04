# React Compiler and rendering

Read this file only when work concerns React Compiler, rerenders, memoization, effects, subscriptions, TanStack Table, virtualization, or bundle loading.

TanStack Table 9 names: `useTable` (v8 `useReactTable`), `tableFeatures` for feature slots, and instance `table.FlexRender` (v8 free `flexRender`).

## Compiler default

Enable React Compiler for the React 19 app and keep the official hooks/compiler lint rules active. Do not add `memo`, `useMemo`, or `useCallback` by habit.

Manual identity stabilization is justified only when:

- the compiler skips the component or file
- an external API requires a stable reference
- code must also run outside the compiled boundary
- profiling demonstrates a material regression

Keep exhaustive dependencies correct for every remaining hook. The compiler does not repair stale dependency arrays.

## TanStack Table v9

Use v9; do not create a v8 `use no memo` island in a new project. Stable data and column identity still matters when compilation is absent or skipped.

The shared `DataTable` calls v9's official `useTable` API internally. Do not wrap it in project hooks such as `useListTable` or return the Table instance to feature code; pass rows, columns, stable row identity, and controlled callbacks through the pattern contract.

At the first `DataTable` implementation, choose one explicit owner for the v9 `features`/`TFeatures` contract. A stable app-level feature set may be owned by the shared pattern, and the official `createTableHook` may pre-bind that infrastructure contract. Keep the resulting hook internal to the shared pattern. It must not absorb route search, Query data, server pagination policy, permissions, columns, or workflow behavior; those project use-case wrappers remain prohibited.

A nested component receiving only stable Table objects can miss internal state changes. Add the narrowest `Subscribe` boundary inside the component that reads changing table state, or pass the selected value as a prop. Test the state slice that changes the rendered result. Do not subscribe every row or cell by default.

Virtualization is opt-in after row volume and profiling justify its focus, height, scroll, and test complexity.

## Selected React practices

- Prefetch independent route data and avoid request waterfalls.
- Derive values during render; use effects only for external synchronization.
- Subscribe to the smallest Query/store/Table state needed by the rendered output.
- Import modules directly instead of broad barrel files.
- Lazy-load heavy editors, charts, or workflow dialogs when bundle evidence supports it.

Next.js, RSC, Server Actions, and platform-specific rules are not part of this Vite SPA contract.

ESLint/compiler diagnostics must confirm that changed components are not silently skipped. Profiling-based exceptions record the interaction, before/after trace, and retained identity requirement in the change report; intuition is not evidence.
