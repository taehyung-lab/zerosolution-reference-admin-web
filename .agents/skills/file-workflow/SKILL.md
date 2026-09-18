---
name: file-workflow
description: >
  파일 업로드·다운로드·첨부·파싱·진행률·미리보기·재시도 흐름을 바꿀 때 사용한다. 허용 확장자·용량은 product-evidence, cache는 server-state로 보낸다.
---

# 역할 계약 — 파일 workflow

**답하는 질문**: 업로드·다운로드·파일 필드 transport·재시도·파싱·미리보기·작업 진행을 누가 소유하는가.

**담지 않는 것**: 어떤 파일을 허용하는가(확장자·용량) — 그 화면의 fact 다. 요청 payload 와 캐시 —
`.agents/skills/server-state/SKILL.md` 다.

Read this file only for upload, download, file-field transport, retry, parsing, preview, or job progress.

- Treat upload as a separate mutation unless the server contract declares one atomic multipart form.
- Validate only confirmed client constraints such as size, MIME, and extension; server validation remains authoritative.
- Preserve a selected file after recoverable failure.
- Client parsing, preview, header mapping, multiple selection, large-file jobs, progress polling, cancellation, and rejection reports require explicit product behavior and server support.
- A shared file field owns selection/removal UI and its domain-neutral value contract, not transport, storage type, retry, or workflow policy.

The consuming screen keeps upload/download scope, selected-versus-all meaning, format options, prerequisite validation, payload, permission, pending surface, retry, and post-success result. A list download is a selection-gated action ([list Selection and actions](../list-contract/SKILL.md#selection-and-actions)); a form file is a `FormFileField` ([form Fields](../form-contract/SKILL.md#필드)). Do not create a generic file controller because an issue omitted this wiring.

Read [mutations](../server-state/SKILL.md) for payload and cache consequences.
