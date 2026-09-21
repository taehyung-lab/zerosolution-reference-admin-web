# Task 3 report — routing 과잉 선택 관측

## RED → GREEN

- RED: `unexpectedContracts`가 없고 smoke 재표현에 `reject`가 없어 focused test 2건이 실패했다.
- RED: `requiredContracts: null`에서 과잉 선택을 비워야 한다는 경계를, 의도적으로 잘못된 fallback으로 확인해 1건 실패했다.
- GREEN: `observeCase`는 `expected`, `allowed`, `rejected`, `missingRequired`, `forbiddenRequired`, `unexpectedContracts`를 분리한다. `null` required에서는 forbidden·unexpected를 빈 배열로 남기고 load 관측값을 보존한다.

## Fixture mapping

| smoke case | reject |
| --- | --- |
| list/재표현 | api-wire |
| detail/재표현 | list-contract |
| form/재표현 | auth-session |
| collection/재표현 | logic |
| route/재표현 | shared-ui |
| screen-composition/재표현 | form-contract |
| file/재표현 | route-composition |
| specialized/재표현 | form-contract |
| shared-ui/재표현 | server-state |
| api-wire/재표현 | detail-contract |
| server-state/재표현 | product-evidence |
| auth/재표현 | collection-contract |
| logic/재표현 | form-contract |
| source-structure/재표현 | list-contract |
| product/재표현 | source-structure |

## Baseline and docs

- `baseline.json`의 기존 coverage 수치와 observations는 유지했다.
- routing 상태는 `pending-remeasurement`이며, 새 smoke reject/unexpected 오라클 때문에 과거 결과와 직접 비교할 수 없고 portable skill 정리 뒤 재측정한다.
- README는 required/forbidden/unexpected 계약 관측과 `actuallyLoadedSkills`의 actual-load 관측을 분리해 설명한다.

## Verification (Node 24.19.0)

| 요구 | 관측 가능한 성공 조건 | 실행한 명령 | 실제 출력 | 관찰 방법 | 판정 |
| --- | --- | --- | --- | --- | --- |
| R1 | expected·allowed 밖 required가 unexpected로 노출되고 reject도 별도 보존 | `pnpm vitest run scripts/skills/eval-triggers.test.mjs` | 18 passed | Unit test | 구현됨 |
| R2 | 15개 smoke 재표현 모두 reject 보유 | 같은 focused test | 18 passed | Fixture test | 구현됨 |
| R3 | README·baseline 변경이 계약 검사와 수치 보존을 해치지 않음 | `pnpm contracts:check`, `git diff --check` | exit 0 | Contract/diff check | 구현됨 |
| 회귀 | 전체 단위 테스트 | `pnpm test:unit` | 153 files, 1008 tests passed | Vitest | 구현됨 |

모든 pnpm 명령은 `rtk proxy npx -y -p node@24.19.0 -c '<command>'`로 실행했다. 실제 `pnpm eval:routing`은 실행하지 않았다.

## Concerns

- `pnpm test:unit`은 exit 0이었지만 jsdom의 `Window's scrollTo() method` 진단을 반복 출력한다.
- 독립 검토: 미검토.
