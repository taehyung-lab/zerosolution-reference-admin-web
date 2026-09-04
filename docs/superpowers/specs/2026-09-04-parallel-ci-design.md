# 병렬 CI 설계

상태: 구현 전 승인안  
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

오늘 `Verify`에 도달한 attempt-1 11건 중 4건이 실패했다. 확인한 `main` 실패 2건은 모두
`tests/e2e/error-boundaries.smoke.spec.ts`의 같은 dialog/navigation 구간에서 retry 후에도
timeout됐다. dev server의 lazy transform이 원인일 수 있으나 trace로 확인하기 전에는 가설이다.

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

| Runner job | 단계 | 예상 시간 |
| --- | --- | ---: |
| `static` | api, contracts, typecheck, lint, i18n, build, negative gates | 약 142초 |
| `unit (1/2)` | Vitest shard 1 | 약 164초, 불균형 허용 시 약 197초 |
| `unit (2/2)` | Vitest shard 2 | 약 164초, 불균형 허용 시 약 197초 |
| `e2e` | build/serve, Chromium smoke, CI worker 1 | 약 156–192초 |

unit은 2개 shard가 최적이다. 4개로 늘려도 E2E가 156–192초라 critical path가 줄지 않는다.
Playwright worker는 현재 1개를 유지해 병렬 브라우저가 flake를 키우는 변수를 추가하지 않는다.

각 job은 checkout, Node/Corepack 설정과 frozen install을 독립 수행한다. Chromium 설치는 E2E job에만
둔다. 중간 setup/artifact job은 의존성과 복잡도를 늘리므로 만들지 않는다.

```yaml
on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
```

`main`은 실제 병합 트리를 다시 검증하므로 생략하거나 이전 실행을 취소하지 않는다.

## 6. 단계 커버리지 계약

CI가 더는 `pnpm verify` 한 줄을 직접 실행하지 않으므로 새 drift 가능성이 생긴다. package script가
선언하는 CI stage 그룹의 합집합과 `parseVerifyChain(packageJson.scripts.verify)` 결과를 집합 동등으로
검사한다.

- 빠진 단계와 CI에만 추가된 단계를 모두 실패로 보고한다.
- 한 CI 그룹이 여러 단계를 실행할 수 있다.
- workflow가 선언된 CI script를 실제로 호출하는지도 확인한다.
- 기존 README 투영 검사와 함께 실행한다.
- 완전한 fixture와 단계 하나를 뺀 fixture로 검사기 자체를 대조한다.

README와 AGENTS의 “CI가 `pnpm verify`를 직접 실행한다”는 표현은 “같은 단계 집합을 병렬 실행한다”로
고친다. `pnpm verify` 자체는 바꾸지 않는다.

## 7. E2E 안정화

속도 변경과 E2E 원인 진단은 병행하되 원인을 추측해 timeout이나 retry만 늘리지 않는다.

1. 실패 run의 trace와 실패 지점 전후 navigation/dialog 상태를 확인한다.
2. 같은 SHA에서 현재 dev server 구성을 반복 실행해 재현한다.
3. production `build + preview` 실행으로 같은 시나리오를 대조한다.
4. dev transform이 원인이 아니면 단일 test가 공유하는 route/dialog 상태와 대기 조건을 추적한다.
5. 필요한 최소 owner만 수정하고 focused 반복과 전체 E2E로 검증한다.

production preview는 실제 배포 bundle을 검사한다는 별도 이점이 있지만, 원인으로 확정하지 않는다.
긴 error-boundary test의 분할은 독립 상태가 결합돼 실패 폭발 범위를 키운다는 증거가 있을 때만 한다.

## 8. 검증과 완료 판정

- `pnpm verify` 전체 통과
- CI coverage 정상·부정 대조군 통과
- 두 unit shard의 전체 파일 합집합이 단일 unit run과 일치
- PR과 `main`에서 9단계 집합이 모두 실행됨
- 같은 PR SHA에 push/PR 중복 run이 없음
- 정상 CI critical path 4분 이하
- E2E 원인과 수정 증거가 있으며 retry에 의존하지 않는 연속 실행이 통과

한 번의 green이나 예상 시간 계산만으로 완료하지 않는다. 실제 GitHub Actions 실행 시간과 job별 결과를
기록하고, E2E flake가 재현되지 않는 연속 실행 증거를 함께 남긴다.

## 9. 제외

- 문서-only fast path
- larger runner 또는 유료 runner
- Playwright worker 증가
- negative fixture 22개의 단일 ESLint batch 전환
- 제품 코드와 테스트 범위 변경
