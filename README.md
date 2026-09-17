# ZERO PLUS+ Web Admin

공연·전시 티켓 운영 어드민(BOOSTER LAB)의 프런트엔드다. 내부 운영자가 회원·공연·발권·전시·프로모션·커뮤니티·통계·설정을 처리한다.

> **현재 상태: bootstrap.** 배포 환경과 Admin OpenAPI URL이 미확정이고, `openapi/admin.snapshot.json`은 제품 계약이 아니라 격리된 리허설 계약이다. 미확인 항목은 [제품 사실 색인](product/generated-index.md)이 연결한 제품 인벤토리의 `프로젝트 사실` 절이 소유한다.

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

생성 API의 HTTP 응답을 테스트용으로 대체하려면 `pnpm dev:mock`을 사용한다. 지원 범위와 실서버 전환 기준은 [API mock](src/api/mocks/README.md)이 소유한다.

서버가 아직 없으므로 목록·상세는 feature `fixtures/` 의 예시 응답을 Query 로 조회하고, 등록·수정·액션은 이름 붙은 요청 함수까지 연결해 그 로그와 성공 경로를 관찰할 수 있다. **화면은 실서버와 같은 흐름을 돌지만 실제 저장·발송·인증이 일어나지는 않는다** — fixture 는 바뀌지 않는다. 어떤 화면이 어디까지 구현됐는지는 [제품 사실 색인](product/generated-index.md)이 연결한 제품 인벤토리·시나리오가 소유한다.

## 주요 명령

| 명령 | 하는 일 |
| ---- | ------- |
| `pnpm dev` | 개발 서버 |
| `pnpm verify` | **단일 검증 진입점.** api:check → contracts:check → product:check → typecheck → lint → test:unit → i18n:check → gates:negative → build → test:e2e:verify |
| `pnpm api:check` | snapshot 검증 + Orval 생성 + 생성물 typecheck |
| `pnpm contracts:check` | 규범 문서와 저장소 설정의 기계적 정합성. verify 체인 투영, `pnpm` 명령·로컬 link 실존, 에이전트 문서 200줄 예산, 루트 포인터, 삭제 문서 이름·금지 추상화 근거 drift, 이관 sentinel, transport 포트 이음매 tripwire와 이름 붙은 요청 경로 상수의 계약 일치, seed 4-part 폐쇄·오염·부수 반출, 이관 manifest 실존. `--mode target`은 이관된 저장소용(코드 sentinel도 실패) |
| `pnpm transplant:plan` · `transplant:stage` · `transplant:apply` · `transplant:verify` | 신규 저장소 이관 명령(`--target <repo>`). plan은 copy/merge/conditional/template/exclude 분류만, stage는 ADR 재번호·예시 치환을 적용한 사본과 `PENDING.md`, apply는 대상에 없는 파일만 복사(덮어쓰기 없음), verify는 대상에서 `contracts:check --mode target`→typecheck→lint→test:unit |
| `pnpm api:pull` / `api:diff` | 원격 Swagger 수집·차이 분석. 네트워크가 필요하므로 `verify` 밖의 별도 작업이다 |
| `pnpm build` / `preview` | 프로덕션 빌드 및 미리보기 |
| `pnpm test:e2e:verify` | Chromium에서 smoke와 제품 시나리오의 요청 호출 경계(`@reference`) 검증 |
| `pnpm test:e2e:smoke` | Chromium에서 목록의 draft → URL → 조회 → 표 흐름과 폼의 검증 → 확인 → 요청 흐름 검증 |

전체 script는 `package.json`이 소유한다. CI(`.github/workflows/verify.yml`)는 `pnpm verify`와 같은 단계 집합을 static, unit 2개 shard, E2E의 네 runner로 병렬 실행하며, Chromium은 E2E runner만 설치한다. PR은 main과 합친 merge ref로 검사하므로 main push에서는 static만 다시 돌고, 문서(`**.md`, `docs/`, `.agents/`)만 바뀐 PR은 unit·E2E를 건너뛴다. pnpm store와 Chromium은 캐시한다.

격리 worktree에서 검증할 때는 `PLAYWRIGHT_PORT=4184 pnpm verify`처럼 비어 있는 전용 포트를 지정한다. Playwright는 기존 서버를 재사용하지 않으므로 포트가 겹치면 바로 실패한다.

`pnpm verify` 통과는 완성의 **필요조건이지 충분조건이 아니다.** 화면이 디자인과 같은지, 상호작용이 실제로 동작하는지는 검사하지 않는다. 판정 기준은 [`AGENTS.md` 의 전역 완료 기준](AGENTS.md#전역-완료-기준)이 소유한다.

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

의존 방향과 예외는 `contracts/contract/source-structure.md`와 `eslint.config.js`가 소유한다. 별도 `pages` 레이어는 만들지 않는다.

## 문서 지도

| 위치 | 내용 |
| ---- | ---- |
| [`AGENTS.md`](AGENTS.md) | 전역 라우팅, 저장소 함정, 완료 기준. 사람과 에이전트 모두 여기서 시작한다 |
| [`contracts/direct/`](contracts/direct/) | 브라우저로 판정되는 결과의 역할 계약 — 목록·상세·폼·행 집합·route 조립·공용 UI |
| [`contracts/contract/`](contracts/contract/) | 시각 표면 밖의 계약 — API wire·서버 상태·인증 세션·소스 배치 |
| [`product/facts/`](product/facts/) | **이 제품의 사실.** 한 surface 의 관찰·정책·전이·미확인을 한 파일이 소유한다 |
| [`product/policies/`](product/policies/) | 여러 fact 에 걸친 판독 규칙과 근거 수명 |
| [`product/generated-index.md`](product/generated-index.md) | fact frontmatter 에서 생성한 색인. 손으로 고치지 않는다(`pnpm product:index`) |
| `docs/decisions/` | 결정 이유·대안·상태·재검토 조건을 보존하는 ADR |
| [`openapi/README.md`](openapi/README.md) | 현재 snapshot의 사용법·금지 사항·검증 명령. 채택 이유와 폐기 조건은 ADR 0001이 소유한다 |

**구현 입력은 셋이다.** `AGENTS.md`(안전·라우팅·완료 기준) → 두 질문이 고른 **계약** → 그 대상의 **fact 한 파일**. 계약은 "어떻게 나누고 연결하는가"만 정하고 "무엇을 구현하는가"는 그 fact 만 말한다. 다른 도메인의 문서·코드·값은 근거가 아니다.

활성 ADR은 번호 순서가 아니라 관련 작업의 Skill·README·다른 ADR에서 진입하며, 구현 중에 읽어야 하는 ADR 은 보통 없다. 인증 토큰 결정(ADR 0006)은 `contracts/contract/auth-session.md`, primitive 선택(ADR 0008)은 `contracts/direct/shared-ui.md`가 연결한다. 번호 0007·0009~0012는 결번이다 — 재사용하지 않고, 대체·삭제된 결정의 과거는 git history가 소유한다. 0002·0004는 설계가 아니라 버전 고정 기록이라 해당 버전을 바꾸는 작업에서만 읽는다.

`CLAUDE.md`와 `.github/copilot-instructions.md`는 런타임 포인터일 뿐이며 규칙을 복제하지 않는다.

## 기여

작업 전에 [`AGENTS.md`](AGENTS.md)를 읽는다. 확인되지 않은 제품 정책·서버 계약·권한·enum 의미는 추측하지 않고 미확인으로 보고한다.

파일 생성·이동과 폴더 배치 기준은 `contracts/contract/source-structure.md`가 소유한다. 루트 `AGENTS.md` 의 두 질문에서 진입하고, 화면·API·공용 코드의 동작 계약은 `contracts/` 의 해당 문서를 따른다.
