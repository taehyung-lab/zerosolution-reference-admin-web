# Specialized screens

Read this file only for analytics, permission-matrix, or notification screens. Also read [screen-composition.md](screen-composition.md) for their route/feature boundary.

- Analytics owns series, labels, interval, download mutation, and request boundaries. Do not choose a chart library before a confirmed screen supplies chart types, interaction, accessibility, export, and bundle requirements.
- Read timezone from the app provider. Do not append `Z` to local text or read browser timezone implicitly in a feature.
- Permission matrices keep rows, axes, propagation, required nodes, and payload in the feature. Shared UI may own only domain-neutral grid and checkbox mechanics.
- Permission UI uses the app baseline "권한이 있으면 이렇게 동작한다" and does not multiply every screen into allowed/denied variants. The measured model is `화면 × 기능`, with a different allowed capability set per screen; identifiers, evaluator metadata, visibility rules, and the matrix payload stay in the feature/app boundary, while denial converges on the single app-level access surface.
- `features/notifications` owns delivery, retention, mutations, and code-to-copy mapping. `app/shell` mounts its public entry; shared UI supplies domain-neutral surfaces.
