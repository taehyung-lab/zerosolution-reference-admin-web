---
name: specialized-screens
description: >
  Use when the screen does not close with the list/detail/form skeleton — 집계·통계 보드, 권한 matrix, 알림·발송 구성처럼 축과 셀이 화면의 본체인 화면. aggregation, statistics, dashboard board, permission matrix, notification settings.
  Do not use for 일반 목록 (list-contract), 상세 (detail-contract), 등록·수정 (form-contract), 그 화면의 축·권한 식별자 값 (product-evidence).
---

# 역할 계약 — 특수 화면 (집계 · 권한 matrix · 알림)

**답하는 질문**: 일반 목록·상세·폼 골격으로 닫히지 않는 화면에서 무엇이 feature 에 남는가.

**담지 않는 것**: 그 화면의 값·축·권한 식별자 — fact 다. 배치 — `source-structure.md` 다.

Read this file only for analytics, permission-matrix, or notification screens. Also read [screen-composition.md](../source-structure/SKILL.md) for their route/feature boundary.

- Analytics owns series, labels, interval, download mutation, and request boundaries. Do not choose a chart library before a confirmed screen supplies chart types, interaction, accessibility, export, and bundle requirements.
- Read timezone from the app provider. Do not append `Z` to local text or read browser timezone implicitly in a feature.
- Permission matrices keep rows, axes, propagation, required nodes, and payload in the feature. Shared UI may own only domain-neutral grid and checkbox mechanics.
- Permission UI uses the app baseline "권한이 있으면 이렇게 동작한다" and does not multiply every screen into allowed/denied variants. The measured model is `화면 × 기능`, with a different allowed capability set per screen; identifiers, evaluator metadata, visibility rules, and the matrix payload stay in the feature/app boundary, while denial converges on the single app-level access surface.
- `features/notifications` owns delivery, retention, mutations, and code-to-copy mapping. `app/shell` mounts its public entry; shared UI supplies domain-neutral surfaces.
