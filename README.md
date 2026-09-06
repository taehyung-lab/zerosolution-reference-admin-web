# ZERO PLUS+ Web Admin

공연·전시 티켓 운영 어드민(BOOSTER LAB)의 프런트엔드다. 내부 운영자가 회원·공연·발권·전시·프로모션·커뮤니티·통계·설정을 처리한다.

> **현재 상태: bootstrap.** 배포 환경과 Admin OpenAPI URL이 미확정이고, `openapi/admin.snapshot.json`은 제품 계약이 아니라 격리된 리허설 계약이다. 미확인 항목은 [`AGENTS.md`](AGENTS.md) §1이 소유한다.

## 요구 런타임

| 항목 | 버전 |
| ---- | ---- |
| Node | `24.19.0` (`.node-version`, `.nvmrc`; [ADR 0004](docs/decisions/0004-runtime-version-pin.md)) |
| pnpm | `10.33.0` (`packageManager` 필드, corepack) |

```bash
nvm use          # .nvmrc의 24.19.0
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

실서버 없이 제품 CRUD 입력 흐름을 확인하려면 `VITE_REFERENCE_SCENARIOS=true pnpm dev`로 실행한다.
회원·운영자 목록의 예시 행에서 상세·수정·연결 팝업으로 이동할 수 있다. 예시임을 화면에 표시하며,
검증·확인 후에도 실제 저장·발송·인증 성공이나 캐시 변경을 만들지 않는다. 기본값은 `false`다.

화면·업무 코드는 실제 제품과 동일한 `features/{domain}` 소유권을 따른다. 회원의 휴면·탈퇴·상담·소명·접속은 각각
`members/{dormant,withdrawn,counsel,appeals,access}`에 있으며, 예시 값은 각 feature의 `fixtures/`에 둔다.
회원 목록은 업무별 Filters·Result·Actions와 상태 훅·columns를 Screen이 조립한다. 여러 업무의 검색·조회 대용·다운로드 입력은 `members/records/`, 활성목록 전용 구현은 `members/list/`가 소유한다. 소명 상세는 처리 폼·통보 액션·읽기 sections로 분리하고, 회원 메시지 상태/수신자 해석은 feature 훅에 두어 route는 독립 메시지 UI와의 연결만 맡는다.
화면 타입은 `model/`, 데이터 읽기는 화면 옆 데이터 훅이 소유한다. 회원과 메시지 기능의 연결은 route에서 조립하고,
앱 전체 개발 안내만 `app/shell/DevelopmentNotice`에 둔다. 제품 운영자 목록은 `ManagerListScreen`, 기존 계약 검증용
API 소비 화면은 `ManagerApiListScreen`이다. 두 검색 계약의 통합은 신규 서버 계약에서 제품 필터·상태를 확정한 뒤 수행한다.

## 주요 명령

| 명령 | 하는 일 |
| ---- | ------- |
| `pnpm dev` | 개발 서버 |
| `pnpm verify` | **단일 검증 진입점.** api:check → contracts:check → typecheck → lint → test:unit → i18n:check → gates:negative → build → test:e2e:smoke |
| `pnpm api:check` | snapshot 검증 + Orval 생성 + 생성물 typecheck |
| `pnpm contracts:check` | 규범 문서와 저장소 설정의 기계적 정합성. verify 체인 투영, `pnpm` 명령·로컬 link 실존, 에이전트 문서 200줄 예산, 루트 포인터, 삭제 문서 이름·§번호·금지 추상화 근거 drift, 이관 sentinel, transport 포트 이음매 tripwire와 이름 붙은 요청 경로 상수의 계약 일치, seed 4-part 폐쇄·오염·부수 반출, 이관 manifest 실존. `--mode target`은 이관된 저장소용(코드 sentinel도 실패) |
| `pnpm transplant:plan` · `transplant:stage` · `transplant:apply` · `transplant:verify` | 신규 저장소 이관 명령(`--target <repo>`). plan은 copy/merge/conditional/template/exclude 분류만, stage는 ADR 재번호·예시 치환을 적용한 사본과 `PENDING.md`, apply는 대상에 없는 파일만 복사(덮어쓰기 없음), verify는 대상에서 `contracts:check --mode target`→typecheck→lint→test:unit |
| `pnpm api:pull` / `api:diff` | 원격 Swagger 수집·차이 분석. 네트워크가 필요하므로 `verify` 밖의 별도 작업이다 |
| `pnpm build` / `preview` | 프로덕션 빌드 및 미리보기 |
| `pnpm test:e2e:smoke` | Chromium에서 Managers 첫 consumer의 draft → URL → API → table 흐름 검증 |

전체 script는 `package.json`이 소유한다. CI(`.github/workflows/verify.yml`)는 `pnpm verify`와 같은 단계 집합을 static, unit 2개 shard, E2E의 네 runner로 병렬 실행하며, Chromium은 E2E runner만 설치한다.

`pnpm verify` 통과는 완성의 **필요조건이지 충분조건이 아니다.** 화면이 디자인과 같은지, 상호작용이 실제로 동작하는지는 검사하지 않는다. 판정 기준은 [`AGENTS.md`](AGENTS.md) §4에 있다.

## 기술 스택

React 19 + Vite SPA · TypeScript 5.9.3 ([ADR 0002](docs/decisions/0002-typescript-version-pin.md)) strict · TanStack Router/Query/Table v9/Form · Zod 4 · Zustand · source-owned Radix primitives + Tailwind CSS · Orval(type·endpoint만 생성) · Vitest + Testing Library + MSW + Playwright

## 디렉터리

```text
src/app/          provider, router, shell, app-level boundary
src/routes/       입력 검증, entry guard, loader, 화면 조립
src/features/     도메인 API 조합, model, 화면, workflow
src/api/          transport, 오류 정규화, OpenAPI 생성물
src/shared/       도메인·서버 계약을 모르는 UI와 순수 공용 코드
```

의존 방향과 예외는 [`AGENTS.md`](AGENTS.md) §3이 소유한다. 별도 `pages` 레이어는 만들지 않는다.

## 문서 지도

| 위치 | 내용 |
| ---- | ---- |
| [`AGENTS.md`](AGENTS.md) | 프로젝트 사실, 전역 경계, 스킬 라우팅, 완료 기준. 사람과 에이전트 모두 여기서 시작한다 |
| `.agents/skills/{api-contract,feature-contract,shared-ui-contract}/` | 반복 구현 절차의 정본. 편집 범위가 정해진 뒤 필요한 reference만 읽는다 |
| `docs/decisions/` | 결정 이유·대안·상태·재검토 조건을 보존하는 ADR |
| [`docs/decisions/0009-shared-boundaries.md`](docs/decisions/0009-shared-boundaries.md) | 목록 공용화의 결정과 provisional 검증 상태. 구현법은 연결된 Skill reference가 소유한다 |
| [`docs/decisions/0010-form-boundaries.md`](docs/decisions/0010-form-boundaries.md) | 등록·수정 공용화의 결정과 provisional 검증 상태. 0009는 목록·필터만 소유한다 |
| [`docs/decisions/0011-detail-data-and-update-history-boundaries.md`](docs/decisions/0011-detail-data-and-update-history-boundaries.md) | 상세 조회 상태 판정, API 소비 계층(선언/실행 분리, feature api 훅 금지), 업데이트 이력 2층 계약 |
| [`docs/reference/`](docs/reference/) | Figma 등 비규범적 관찰 증거. 그 자체로 구현 계약이 되지 않는다 |
| [`openapi/README.md`](openapi/README.md) | 현재 snapshot의 사용법·금지 사항·검증 명령. 채택 이유와 폐기 조건은 ADR 0001이 소유한다 |

활성 ADR은 번호 순서가 아니라 관련 작업의 Skill·README·다른 ADR에서 진입한다. 인증 토큰 결정(ADR 0006)은 api-contract `auth-session.md`, primitive 선택(ADR 0008)은 shared-ui-contract `disclosure-sections.md`가 연결한다.

`CLAUDE.md`와 `.github/copilot-instructions.md`는 런타임 포인터일 뿐이며 규칙을 복제하지 않는다.

## 기여

작업 전에 [`AGENTS.md`](AGENTS.md)를 읽는다. 확인되지 않은 제품 정책·서버 계약·권한·enum 의미는 추측하지 않고 미확인으로 보고한다.
