# 0004. Node.js 런타임 버전 고정

- 상태: 승인됨
- 날짜: 2026-08-27
- 결정자: 구현 지시 확정안

## 맥락

재현 가능한 설치·검증을 위해 `engines.node: ">=22"`보다 좁은 런타임 계약이 필요하다.
로컬에는 Node.js 26.7.0이 설치돼 있지만, 로컬 설치값 자체는 채택 근거가 아니다.

2026-08-27 기준 Node.js 공식 다운로드 페이지는 26.7.0을 **Current**, 24.19.0을
**Latest LTS**로 표시한다. 공식 릴리스 일정도 Node.js 26이 2026년 10월에 LTS에 진입한다고
명시한다.

- https://nodejs.org/en/download/current/
- https://nodejs.org/en/blog/announcements/evolving-the-nodejs-release-schedule

## 결정

`.node-version`은 개발 버전 매니저와 CI가 읽는 정확한 값 `24.19.0`으로 유지한다.
`package.json#engines.node`는 같은 LTS major 안의 호환 patch 업데이트를 허용하도록
`>=24.19.0 <25`로 선언한다. pnpm은 기존 `packageManager: "pnpm@10.33.0"` 고정을 유지한다.

`engine-strict`는 채택하지 않으며 `.npmrc`도 추가하지 않는다. 로컬 설치를 경고 수준으로 두어
호환성 조사나 긴급 보안 patch 적용을 막지 않는 대신, 재현성의 강제 지점은 `.node-version`을
직접 읽는 CI로 둔다. CI는 정확한 Node 버전에서 frozen lockfile 설치와 전체 verify를 수행하므로
merge 기준은 경고를 무시할 수 없다.

## 결과와 갱신 조건

기본 개발·CI는 동일한 Node.js patch 버전을 사용하고, `engines`는 지원 가능한 LTS major 경계를
알린다. 최소 지원 patch를 올리거나 다음 major를 채택할 때 `.node-version`, `engines` 범위와 이
ADR을 함께 갱신하고 `pnpm install --frozen-lockfile && pnpm verify`를 다시 통과시킨다.
