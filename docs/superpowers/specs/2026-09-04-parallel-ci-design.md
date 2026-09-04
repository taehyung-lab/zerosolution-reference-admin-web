# 병렬 CI 설계

상태: 구현됨 — `b5c16b4` 증거는 이전 검증이며, 리뷰 수정 SHA 원격 재검증 필요
근거일: 2026-09-04

## 1. 목표

현재 `pnpm verify`의 검증 범위를 줄이지 않고 PR과 `main`의 GitHub Actions 피드백을 안정적으로
3–4분 안에 끝낸다. 로컬·bootstrap의 단일 검증 진입점은 계속 `pnpm verify`이며, CI만 같은 단계를
병렬 실행한다.

## 2. 잠근 요구사항

1. 코드 PR과 `main`은 현재 `verify`의 9단계를 모두 실행한다.
2. PR과 `main`의 정상 실행 critical path는 4분 이하여야 한다.
3. feature branch `push`와 `pull_request`가 같은 SHA를 중복 실행하지 않는다.
4. 새 PR 커밋은 같은 PR의 이전 실행을 취소하지만 `main` 실행은 취소하지 않는다.
5. `pnpm verify`의 순서와 의미는 로컬·bootstrap 계약으로 유지한다.
6. CI job이 실행하는 단계 집합은 `verify` 단계 집합과 정확히 같아야 하며 검사가 이를 기계적으로 증명한다.
7. 검사기에는 누락 workflow가 실패하는 부정 대조군과 완전한 workflow가 통과하는 정상 대조군이 있다.
8. E2E의 기존 실패를 retry로 숨기지 않고 원인을 실측해 안정화한다.
9. 문서-only path filter와 negative-gate 내부 성능 개선은 이번 범위에서 제외한다.

## 3. 현재 증거

GitHub Actions run `33860859675`는 9분 32초가 걸렸다. 설치는 38초이고 `pnpm verify`가 8분
36초였다.

| 단계 | 실측 |
| --- | ---: |
| `api:check` | 6초 |
| `contracts:check` | 1초 미만 |
| `typecheck` | 9초 |
| `lint` | 26초 |
| `test:unit` | 286초 |
| `i18n:check` | 1초 미만 |
| `gates:negative` | 76초 |
| `build` | 2초 |
| `test:e2e:smoke` | 108초, retry 시 약 144초 |

초기 fan-out SHA `b65adf2`는 성공했지만 `unit (1)`이 4분 22초여서 목표를 넘었다. 원인은 unit
테스트 자체가 아니라 negative-control interruption 검사가 동기 child process 때문에 SIGTERM을
lint 종료까지 전달하지 못해 whole-gate 신호가 늦어진 것이었다. 이 SHA의 시간은 이후 수정으로
대체됐으므로 최종 성능 근거로 쓰지 않는다.

수정 SHA `b5c16b4`의 연속 5회 PR 검증은 아래와 같았다. 각 회차는 `static`, `unit (1)`,
`unit (2)`, `e2e` 네 job이 모두 성공했으며 job retry는 없었다.

| attempt | critical path | E2E | 병목 |
| --- | ---: | ---: | --- |
| 1 | 2분 37초 | 1분 21초 | `static` |
| 2 | 3분 01초 | 1분 18초 | `unit (1)` |
| 3 | 3분 01초 | 1분 18초 | `unit (1)` |
| 4 | 3분 02초 | 1분 19초 | `unit (1)` |
| 5 | 3분 04초 | 1분 31초 | `unit (1)` |

따라서 실제 병목은 E2E가 아니라 `unit (1)`이고, 두 unit shard는 4분 목표를 이미 만족하는 최소
fan-out이다. 다만 이 값은 `b5c16b4`의 이전 검증 증거다. concurrency와 계약 검사를 바꾸는 다음
SHA는 같은 원격 완료 조건을 새로 통과해야 한다.

## 4. 검토한 선택지

### A. 기존 직렬 `pnpm verify` 유지

구조는 가장 단순하지만 unit, negative gate, E2E 시간이 그대로 합산돼 목표를 달성할 수 없다.

### B. 변경 경로별 검사 생략

문서-only PR을 1분 이내로 만들 수 있지만 잘못된 분류가 검사를 조용히 건너뛸 수 있다. 현재 목표는
검사를 생략하지 않아도 달성 가능하므로 첫 변경에 넣지 않는다. 나중에 도입한다면 문서-only 파일을
모두 명시하는 fail-closed allow-list를 사용하고 `contracts:check`는 항상 실행한다.

### C. 전 단계 병렬 실행 — 채택

검사 범위를 유지하면서 critical path만 줄인다. 별도 캐시나 third-party path action 없이 현재 명령을
재조립하므로 동작 변화가 가장 작다.

## 5. CI 구조

workflow는 `pull_request`와 `main` push에서 같은 4개 runner job을 실행한다.

| Runner job | 단계 | `b5c16b4` 5회 실측 범위 |
| --- | --- | ---: |
| `static` | api, contracts, typecheck, lint, i18n, build, negative gates | 2분 12초–2분 37초 |
| `unit (1/2)` | Vitest shard 1 | 2분 28초–3분 04초 |
| `unit (2/2)` | Vitest shard 2 | 1분 25초–1분 30초 |
| `e2e` | build/preview, Chromium smoke, CI worker 1 | 1분 18초–1분 31초 |

unit은 2개 shard가 최소 fan-out이다. 이미 4분 목표를 만족하므로 4개로 늘리는 runner 비용과
조립 복잡도를 정당화할 시간 이득이 없다. Playwright worker는 1개를 유지해 병렬 브라우저가
flake를 키우는 변수를 추가하지 않는다.

각 job은 checkout, Node/Corepack 설정과 frozen install을 독립 수행한다. Chromium 설치는 E2E job에만
둔다. 중간 setup/artifact job은 의존성과 복잡도를 늘리므로 만들지 않는다.

```yaml
on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.event_name == 'pull_request' && github.ref || github.run_id }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

PR은 안정적인 `github.ref` 그룹으로 같은 PR의 이전 실행만 취소한다. `main`을 포함한 비-PR은
`github.run_id`로 실행마다 고유한 그룹을 가져 pending 상태에서도 서로 취소하지 않는다. `main`은
실제 병합 트리를 다시 검증하므로 생략하거나 이전 실행을 취소하지 않는다.

## 6. 단계 커버리지 계약

CI가 더는 `pnpm verify` 한 줄을 직접 실행하지 않으므로 새 drift 가능성이 생긴다. package script가
선언하는 CI stage 그룹의 합집합과 `parseVerifyChain(packageJson.scripts.verify)` 결과를 집합 동등으로
검사한다.

- 빠진 단계와 CI에만 추가된 단계를 모두 실패로 보고한다.
- 한 CI 그룹이 여러 단계를 실행할 수 있다.
- 세 CI script 이름이 모두 존재하고 비어 있지 않아야 하며, 단계를 다른 script로 옮겨도 누락을 숨기지 못한다.
- workflow가 선언된 CI script를 호출하고 PR 전용 취소 계약을 유지하는지도 확인한다.
- 기존 README 투영 검사와 함께 실행한다.
- 정상 fixture와 단계·script·concurrency 위반 fixture로 검사기 자체를 대조한다.

README와 AGENTS의 “CI가 `pnpm verify`를 직접 실행한다”는 표현은 “같은 단계 집합을 병렬 실행한다”로
고친다. `pnpm verify` 자체는 바꾸지 않는다.

## 7. E2E 안정화

실패 run `33851145016`은 두 attempt 모두 마지막 access-denial dialog에서 overlay가 pointer event를
가로막아 timeout됐다. 그러나 workflow가 trace artifact를 업로드하지 않아 `show-trace` 실측은
불가능했고 overlay가 남은 내부 원인은 미확인이다.

격리된 current-worktree dev server는 focused 시나리오 5/5를 41.5초에, production preview는
5/5를 24.6초에 통과했다. CI preview mode는 retry 없이 focused 10/10을 49.4초에, 전체 smoke
12/12를 14.1초에 통과했다. 이 대조와 실제 배포 bundle 검증 이점을 근거로 CI에서만
`build + preview`를 채택했고, local은 `dev`를 유지했다. retry, timeout, worker, spec은 바꾸지 않았다.
이 증거는 preview 선택을 지지하지만 overlay의 내부 원인을 확정하지 않는다.

## 8. 검증과 완료 판정

- 변경 SHA에서 `pnpm verify` 전체 통과
- CI coverage 정상·부정 대조군 통과
- 두 unit shard의 전체 파일 합집합이 단일 unit run과 일치
- PR과 `main`에서 9단계 집합이 모두 실행됨
- 같은 PR SHA에 push/PR 중복 run이 없음
- 정상 CI critical path 4분 이하인 연속 5회 실행
- E2E가 retry 없이 통과하고, 확인하지 못한 내부 원인은 미확인으로 유지

한 번의 green이나 예상 시간 계산, 이전 SHA의 성공으로 완료하지 않는다. 실제 GitHub Actions 실행
시간과 job별 결과를 기록하고, 리뷰 수정 SHA마다 연속 실행 증거를 새로 만든다. `b5c16b4`의 5회
성공은 설계 타당성의 이전 검증 증거이지 다음 SHA의 최종 완료 증거가 아니다.

## 9. 제외

- 문서-only fast path
- larger runner 또는 유료 runner
- Playwright worker 증가
- negative fixture 22개의 단일 ESLint batch 전환
- 제품 코드와 테스트 범위 변경
