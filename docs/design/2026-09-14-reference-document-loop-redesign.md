# 현재 저장소의 문서 루프 설계

2026-09-14 · ZERO PLUS+ 레퍼런스용 현행 기준과 보정 설계

이 문서는 현재 프로젝트의 구조·내용·적용 상태를 설명하는 설계 정본이다. 실행 규칙은 링크된 AGENTS·skill·검사가 소유한다. 기존의 미적용 교체 초안과 후속 제안을 이 문서로 대체했다. 소유자는 레퍼런스 관리자이며, 실행 계약·게이트·이관 방식 또는 수용 결과가 바뀔 때 갱신한다.

## 1. 목적과 현재 판정

**목표는 요청 한 문장에서 필요한 근거·설계·구현·검증·실패 복귀가 이어지고, 실제 다른 제품에서도 절차를 다시 설명하지 않는 것이다.** 같은 완성도는 요구사항·공용 경계·상태 소유권·실패 동작의 일치를 뜻한다. 파일 모양을 무조건 같게 만들거나 Manager를 보편적인 정답으로 삼지 않는다.

일반 구현에서 강제 checkpoint/review 파일을 제거하고, 공통 루트·구현 skill과 제품 사실을 분리하는 운영 변경을 적용했다. 기록 재현이 필요한 세션만 prepare/review를 사용한다. 일부 기계적 연결과 stage/apply 안전성은 구현·검증됐지만, 선택 bundle 의존 계약·테스트의 누락도 추가 확인됐다. 문서·게이트를 만들었다는 사실은 자율 구현 루프의 성립을 뜻하지 않는다. **전체 목표는 미검증이다.** 모든 크기의 신규 구현을 새 에이전트가 완주한 증거, 혼합 요청 전체의 자율 완료, 실제 다른 제품의 수용과 총토큰 절감 실험이 아직 없다. 기존 로직 채택 시험은 Kelvin 문자 반례로 일부 요구 충족 판정을 철회했다.

## 2. 하나의 구조와 소유권

```text
AGENTS.md → screen-loop/SKILL.md → 현재 요청에 필요한 전문 skill/reference
    │              │
    │              └─ 드릴·답지 대조일 때만 references/drill.md
    ├─ product.json → 대상 색인 → 원장·판정·시나리오의 필요한 절
    └─ scripts/agents/README.md → 탐색 도구 / 선택한 기록 절차의 schema

구현·타입·검사 ↔ 전문 계약     결정 이유 → ADR
일반 작업 → 대화·diff·실행 결과    재현할 기록만 → .ai-work
```

| 단일 소유자 | 내용과 읽는 시점 |
| --- | --- |
| [AGENTS](../../AGENTS.md) | 공통 태도·제품 근거 진입·전역 경계·라우팅·완료/안전/수명. 세션 시작에 읽음 |
| [screen-loop](../../.agents/skills/screen-loop/SKILL.md) | 범위가 미확정인 구현 요청의 크기·진입·설계·실행·복귀. CLI 필드 정의를 복제하지 않음 |
| [drill reference](../../.agents/skills/screen-loop/references/drill.md) | 드릴의 답지 차단·대조표·결과 기록. 드릴이나 형제 답지 대조 전에만 읽음 |
| 4개 contract skill | API, feature, shared UI/logic, folder/import 계약. 범위 확정 뒤 해당 skill과 관련 reference만 읽음 |
| [product.json](../reference/product.json) | 원장·판정·시나리오·색인 네 경로. 제품 정책 본문을 복제하지 않는 기계 포인터 |
| [제품 원장](../reference/zero-sol/README.md)·[시나리오](../reference/scenarios/README.md)·[판정](../reference/zero-sol-figma-analysis.md) | 화면 구성·정책, 전이·실패·복구, 공용 판정·확정 답·미확인. 대상 및 부모 맥락에 맞춰 읽음 |
| [agents README](../../scripts/agents/README.md) | 탐색 CLI·선택한 기록 절차의 schema·완료 수준·수용 시험·인계. 일반 구현은 schema를 읽지 않음 |
| [contracts README](../../scripts/contracts/README.md) | 검사 보장·이관 절차. 코드 경계나 대상 이관 작업일 때 읽음 |
| [runtime adapters](../../scripts/agents/runtime-adapters.md) | Claude/Codex/Copilot의 실제 지원 경로·훅·원문 읽기 한계. 런타임 연결/차단 문제일 때 읽음 |
| ADR | 선택 이유·유효 조건·재평가 계기. 계약 실행 절차의 복사본이 아님 |
| [observations](../../.agents/skills/screen-loop/references/observations.md) | 과거 드릴과 반례의 실제 도달 단계. 루프 감사·해당 실패 조사 때만 읽음 |

위 표는 현재 소유 위치를 설명하며, 유지해야 할 파일 목록이 아니다. 목표 구조는 공통 실행 규칙·제품 근거·실행 도구의 책임 분리다. **공통 실행 정본에서는 제품명·특정 도메인·대표 화면을 필수 기준으로 지목하지 않는다.** 현재 제품의 실제 원장·코드 경로는 이 프로젝트의 근거 진입점에서 찾는다. 이 감사 문서의 파일 링크는 현황 증거이며 다른 제품의 실행 기준이 아니다.

루트 §1의 제품 사실은 기존 제품 인벤토리 README의 **프로젝트 사실** 절로 이동했다. AGENTS와 screen-loop는 product.json으로 대상 근거를 찾으며 특정 제품명·대표 화면을 진입 기준으로 삼지 않는다. 새 PROJECT.md·descriptor·skill은 만들지 않았다. 전문 reference 전체의 제품명 관찰 분리까지 완료했다는 주장은 하지 않는다.

요청을 workflow라는 고정 절차에 맞추는 대신, 요청 크기에 맞게 아래 근거를 선택한다. 색인에 대상이 없으면 저장소 검색·원문 관찰로 확인한다. 현재 evidence 전달 CLI는 그 탐색을 돕는 도구이며 사용 자체가 설계의 정답이나 완료 조건은 아니다.

## 3. 요청 크기와 최소 읽기

| 크기 | 진입·필수 근거 | 구현 및 완료 범위 |
| --- | --- | --- |
| 화면 | context의 workflow 전체, 원장·원문·시나리오, 내부 액션·다음 화면, 해당 역할 형태 | 시작·입력·실행·실패·복구·후속 연결 |
| 부분 | 부모 context의 입출력·상태 경계 + 선택 행/역할 형태 | 요청 부분과 부모에 대한 직접 영향; 화면 전체 재구현 금지 |
| 컴포넌트 | 실제 소비자에서 공용/feature-local 판단. 공용은 bundle/UI 계약, local은 부모/역할 | 상호작용·접근성·소비자 책임 |
| 로직·훅·유틸 | 실제 호출자·입출력·전이·실패. 공용은 bundle/logic-promotion, local은 해당 역할 | 부작용·복구·상태 소유권. 화면 원장 강제 없음 |
| 구조 | import·공개 경계·조립 책임, folder 계약과 역할 형태 | 책임 추적·의존 방향·기존 동작 |
| 혼합 | 전체 요구 ID와 현재 단위의 위 근거 | 한 단위씩 실행·검증하고 끝에 전체 연결 대조. 기록 모드만 units/currentUnit 사용 |

기록 모드의 `grain`은 위 다섯 단일 크기 중 하나다. 혼합은 grain 값이 아니라 units로 표현한다. `work.kind`와 `mode`는 별도 축이며 infrastructure라는 선언은 실제 동작 검증의 면제 사유가 아니다.

색인은 위치 탐색 수단이다. 실제 제품 사실은 원문·확정 답으로 확인한다. `slice`는 `parentReferences`가 있을 때만 부모 원장 절을 해당 정책 절로 줄인다. 없으면 부모 절을 보존한다. **자동화 장치는 있지만 실제 제품 색인의 부모 정책 분해 효과는 아직 입증하지 않았다.** 관련성이 불명확한 부모 정책을 토큰 절감 때문에 버리지 않는다.

## 4. 설계와 실패 복귀

일반 작업은 흐름·소유권·재사용·단순성과 관련 계약의 `채택 / 수정 / 제외`를 필요한 길이로 설명한다. 네 개 JSON 필드는 기록 모드에서만 작성한다. 작성 방법은 [screen-loop의 그래프](../../.agents/skills/screen-loop/SKILL.md#그래프), 필드는 agents README가 소유한다. 문장을 채웠다는 사실은 설계 승인이나 의미적 타당성의 증거가 아니다.

경계 변경에서는 실제 문제를 정의하고 현행안을 포함한 대안을 비교한다. 상태 복제가 필요한가, 소비자의 정책이 공용 prop으로 들어가는가, wrapper를 빼도 같은 결과가 되는가처럼 선택을 뒤집을 반례를 코드·실제 소비자·작은 실험으로 확인한다. 결과를 기존 설계 선언에 담으며 별도의 장문 사고 보고서를 만들지 않는다.

| 검증에서 발견한 것 | 복귀 |
| --- | --- |
| 누락 요구·혼합 단위 소실 | N0 분류와 전체 요구 대조 |
| 원문 오독·미확인 정책·부모 맥락 누락 | N2 근거 |
| 소비자 전용 공용 API·상태 중복·불필요한 계층 | N3 설계, 공용 승격은 admission 심사 |
| 선언과 다른 실제 구현 | N4 구현 |
| 잘못된 구현도 통과하는 시험 | N5 검증 설계 |

미확인은 영향 요구사항만 보류하고 해소 조건을 남긴다. 같은 실패를 원인 변경 없이 반복하거나 완료 대조에서 지우지 않는다.

## 5. 게이트가 증명하는 것과 검토가 증명할 것

**일반 모드는 준비·완료 JSON을 생성하지 않는다.** checkEdit는 준비 상태와 준비된 조상이 없으면 통과하고, noteWrite/PostToolUse/Stop은 상태·receipt를 만들지 않는다. 요구사항 대조·실제 검증·고위험 독립 검토는 실행 지시이며 hook의 자동 보장으로 표현하지 않는다. 명시적 prepare 이후에는 아래 기존 기록 검사가 적용된다. 준비된 모든 조상 prefix를 확인하므로 손자 작업도 무준비로 기록 의무를 회피할 수 없다.

기록은 시작 시점 이전 변경을 인증하지 않는다. 최초 prepare가 scope 내 기존 Git 변경을 알리고, Git 열거 실패도 공개한다. 일반 세션의 동시 변경은 기록 세션의 쓰기 구간에 잘못 귀속될 수 있으므로 재현 작업은 쓰기 세션을 분리한 워크트리에서 수행한다. 새 귀속 파일이나 불완전한 shell denylist를 추가하지 않았다. 일반 모드에는 명령별 준비 차단도 없으며, 런타임이 권한 검사를 우회하는 설정이라면 별도 자동 안전 차단이 있다고 주장하지 않는다.

| 실제 소유자·시험 | 구현된 보장 | 남은 의미적 한계 |
| --- | --- | --- |
| [preflight](../../scripts/agents/preflight.mjs) `prepare/recordReview`와 [시험](../../scripts/agents/preflight.test.mjs) | 파일 실존·삭제 baseline·요구 귀속, 실제 전달 entry, 선언/검토 digest | 선택한 근거가 충분한지·요구 본문이 올바른지는 자동 판정 못 함 |
| [request-units](../../scripts/agents/request-units.mjs) `validateUnits/activeCheckpoint` | 전체 요구 보존·현재 단위 scope/계약 선택·미검토 단위 Stop 차단 | 사람이 잘못 나눈 업무 의미까지 증명 못 함 |
| [surface-context](../../scripts/agents/surface-context.mjs) `sliceRowDelivery`와 [시험](../../scripts/agents/context.test.mjs) | 선택 행·부모 references 전달, 제품 포인터 활용 | 명시하지 않은 부모 정책 관계를 추론하는 장치가 아님 |
| preflight 행·미확인 대조 | 행→파일→판정, 미확인→영향 요구/해소 근거/무관 사유 | 거짓 `일치`를 써도 사실의 진위를 보장하지 못 함 |
| [review-checks](../../scripts/agents/review-checks.mjs)와 [시험](../../scripts/agents/review-checks.test.mjs) | 실제 명령·종료 코드·출력·fingerprint receipt | 테스트의 충실성·사용자 관찰·쓰기 가능한 기록의 위변조 방지를 보장하지 않음 |
| `exportDriftFailure` + 독립 검토 | export 이름 변화 감지, 현재 diff의 검토 기록 요구 | 같은 이름의 prop·인자에 정책이 유입되는 것은 실제 API/소비자 리뷰 필요 |
| [transplant](../../scripts/transplant/transplant.mjs)와 [시험](../../scripts/transplant/transplant.test.mjs) | 코드 import 폐쇄·선택 카탈로그 축소·stage hash·기존 파일 보존 | 다른 bundle의 코드만 따라오고 선언/전용 테스트는 빠지는 경우 확인. 대상 채택의 의미·실제 제품 수용은 보장하지 않음 |

의미 검토자는 실제 diff·정본·소비자를 열어 요구 충족, 공용 경계, 상태 전이, 단순성을 판정한다. 다른 화면 컬럼, 소비자 전용 prop, URL/Query/Form 중복 상태, 불필요한 wrapper, 남은 혼합 단위 소실을 반례로 사용한다. 독립 검토 기록이나 Orca 출처도 올바른 이해를 보장하지 않는다.

## 6. 영상·글에서 반영한 결정

원자료는 [조사 문서](../research/2026-09-14-claude-codex-efficiency-design.md)가 보존한다. 6개 영상 자막·2개 글·사고 프롬프트 고정댓글을 분석했으며 영상 프레임은 검증하지 않았다.

| 자료 | 채택·수정·제외 | 현재 적용 위치·검증 상태 |
| --- | --- | --- |
| [큰 파일 읽기](https://www.youtube.com/watch?v=_V1cjKmbJd8) | 선택 탐색과 판단용 원문 보존 채택; Shunt 설치·일률적 줄 수 차단 보류 | context/prepare, runtime-adapters. 전달량 실측 존재; 전체 비용 우위 미검증 |
| [남은 스킬 6개](https://www.youtube.com/watch?v=UClLUoGaCxU) | 정확한 진입·중복 절차 축소 채택; 설치 목록 일괄 도입 제외 | AGENTS §2, screen-loop와 조건부 drill reference. 전역 플러그인 자동 진입 충돌 해소는 미검증 |
| [천재적 사고](https://www.youtube.com/shorts/o1TucehYZuk) | 문제 재정의·대안·반례만 수정 채택; 글자 수·10개 아이디어·수식 점수 제외 | screen-loop의 설계 선택에 통합. 결과 품질 향상률은 미측정 |
| [영상으로 공부](https://www.youtube.com/shorts/kYnNTl1BWOk) | 원문→주장→근거→적용 판단을 연구 경로로 채택 | 조사 원문/출처 보존. 자동 학습 서비스나 모델 학습을 설치한 것은 아님 |
| [Ruflo 쇼츠](https://www.youtube.com/shorts/D7S-Cl9oHz8)·[가이드](https://lazyowen.com/guides/ruflo) | 독립 작업·검토의 조건부 위임 채택; Ruflo 전체 설치 보류 | AGENTS §5, 실제 Orca 교차 검토. 전체 worker 비용 절감은 미측정 |
| [플러그인 5개](https://lazyowen.com/guides/claude-skills-top5-0815) | 교훈을 기존 소유자에 환류. 추가 압축·메모리·모델 프록시는 병목 실측 후 개별 실험 | AGENTS §7와 회귀 검사. 추가 도구 효과·자동 모델 교체 품질은 미검증 |
| [스킬과 실행 코드](https://www.youtube.com/watch?v=HIRDzMtuWFk) | 필요한 skill·검증된 script 재사용·실행 검증 채택 | 4개 계약 skill, context/prepare/review/check/transplant. 매번 새 프레임워크 생성 제외 |

## 7. 효과와 비용은 결과로 비교한다

불필요한 반복 읽기·탐색·재작업을 줄이는 것이 목표다. 제품 사실을 짧은 요약으로 대체하거나 필수 관찰을 생략하는 것은 절감이 아니다. 이번 변경에서 공통 첫 읽기 두 파일은 AGENTS 22,440→17,135 bytes, screen-loop 18,191→8,483 bytes로 합계 40,631→25,618 bytes(약 36.9%)가 됐다. 실제 UTF-8 파일 크기 비교이며 제품 근거·전문 skill·출력·추론을 포함한 총토큰 절감률은 아니다. 일반 세션의 Write→실제 수정→PostToolUse→Stop fixture와 별도 새 session ID의 실제 hook CLI 실행에서 새 감사 artifact 0개를 확인했다. 후자는 작은 clamp 구현의 경계 3건을 실행했으며, 새 모델의 자율 구현 시험은 아니다.

기존 혼합 첫 단위의 전달량 104,839→66,373 bytes는 게이트의 단위 선택과 소비자 reference 축소가 함께 기여한 한 사례이며 총토큰 절감률이 아니다.

현재 구조와 가벼운 대체안을 비교할 때는 같은 요구·revision·모델·제품 근거를 사용한다. 작은 로직/컴포넌트와 실제 화면/부분 요청에서 누락·재작업·필수 읽기·사람의 절차 재설명·성공 결과당 총 usage를 기록한다. 비교를 위한 새 영구 보고서 체계는 만들지 않는다. 기존 검증이 이미 확인한 조건은 새 변화나 실패가 없으면 다시 검사하지 않는다.

성공은 파일·규칙·테스트 수가 늘었다는 뜻이 아니다. 에이전트가 관련 근거에 도달하고, 올바른 소유권으로 구현하고, 결과를 검증하고, 실패 원인을 고친 뒤 같은 요구를 충족하는 것이다. 작은 요청은 짧은 설명과 직접 검증으로 끝나야 한다. 실제 정책이나 접근 권한이 없는 경우만 영향 요구를 미확인으로 남기며, 절차를 사람이 매번 다시 설명해야 한다면 이 설계의 실패로 본다.

## 8. 새 프로젝트 이관과 수용

앞선 추가 감사에서 확인한 이관 문제는 세 가지다. `draft-commit`만 stage하면 period/search/keyword 공용 코드가 따라오지만 해당 bundle 선언과 전용 테스트는 빠진다. source feature examples는 대상에 파일이 없어도 카탈로그에 남는다. `--with-ledger`는 원본 제품 포인터·원장을 대상 활성 경로에 넣고 경고가 있는 PENDING은 apply하지 않는다. 실제 stage 재현과 소유 코드 확인으로 판정했으며 아직 미수정이다. 단순 파일 import 폐쇄 통과로 이 문제를 덮지 않는다.

해결은 기존 stage/catalog 변환에서 의존 계약의 지위를 명확히 하고, 없는 예제는 실제 소비자 안내에서 제외하며, 참고 근거와 활성 제품 사실을 분리하는 방향을 먼저 본다. 검증 도구 의존으로 반출하는 ApiError 때문에 인증 bundle 전체를 자동 채택시키지는 않는다. transport의 원본 제품 인증 정책과 리허설 endpoint/body도 보편 계약이 아니므로 새 제품 정책과 분리해야 한다. 이름만 두 bundle로 바꾸면 import 폐쇄로 다시 결합된다.

이관 기록·게이트를 새로 만드는 것보다 **최소 target에서 실제 실행 체인이 돌아가는 시험**이 우선이다. 기존 transplant 테스트 25개는 통과했지만 verifyTarget 자체를 끝까지 호출하는 시험은 확인되지 않았다. 필요한 설정 병합과 하나의 계약 소비를 포함해 실제 명령을 실행하고, 관련 결함을 잡는 음성 사례만 기존 시험에 통합한다. 이 합성 target 시험은 실제 신규 제품 수용을 대신하지 않는다.

## 9. 현재 남은 수정과 수용 기준

이번 운영 변경은 기존 preflight/context/workspace 테스트에서 일반 모드 0 artifact, 기록 활성화 후 범위 차단, 준비된 조상·하위 작업 책임, 런타임 native payload의 정상·오류 경로를 실행했다. 제품 사실 분리와 target FACTS sentinel은 기존 transplant 시험에서 확인한다. 실제 다른 제품의 완결된 vertical slice와 전체 usage 비교는 미실행이다. 이번 집중 실행은 scripts/agents·contracts·transplant의 218개 시험, 기존 음성 검증 38개, 문서·계약 검사를 통과했다. 전체 단위 재실행에서는 1,152개 시험이 통과했지만 동시 작업의 SortableList.test.tsx가 구현 모듈을 찾지 못해 1개 suite가 실패했다. 따라서 현재 저장소 전체 검증 통과를 주장하지 않는다.

이전 구현 최종 검사는 Node 24.19.0에서 `CI=1 PLAYWRIGHT_PORT=4191 pnpm verify` exit 0이었다. 단위 1,149개, 음성 검증 38개, E2E 113개가 통과했다. 이 수치는 이전 구현 검사 기록이며 이번 문서 재구성의 신규 시험 숫자가 아니다. 원본·실패 이력·리뷰 출처는 `.ai-work/document-loop-implementation/implementation-results.md` 및 같은 디렉터리의 `verify-final-closure.txt`에 있다.

5개 grain의 정상 경로 5/5는 스크립트 fixture 성공이다. 실제 새 Claude 세션은 기존 로직 채택과 혼합 첫 단위 N6까지 기록했으나, `src/shared/lib/ascii-triplet.ts`가 비ASCII Kelvin sign을 소문자 k로 바꾼 뒤 검사하는 반례로 R3 충족을 철회했다. `KKK`, `Klm`, `jKl`이 true가 되는 직접 재현은 기존 16개 테스트 통과와 구별한다. 이 함수 수정은 별도 제품 코드 작업이며 여기서 고쳤다고 주장하지 않는다.

**현재도 수정·검증할 부분이 남아 있다.** 아래는 현재 구조에서 관찰한 결함과 미검증이지, 모든 게이트를 보존하며 보완하라는 구현 목록이 아니다. 기존 절차 제거·통합·외부 스킬 대체가 같은 실패를 더 적은 비용으로 막으면 그 안을 택한다.

| 우선순위·상태 | 실제 근거와 판정 | 수정할 소유자·방법 | 닫는 증거 |
| --- | --- | --- | --- |
| P0 · 코드 결함 확인, 미수정 | [ascii-triplet](../../src/shared/lib/ascii-triplet.ts)에서 전체 입력을 `toLowerCase()`한 뒤 ASCII 검사. `KKK`, `Klm`, `jKl`이 true | 원본 문자 범위를 보존한 채 ASCII 대소문자만 비교하도록 수정. 제품 요구가 비ASCII 제외임을 유지 | 세 Kelvin 반례 false, 기존 ASCII 반복·정방향/역방향·경계 사례 유지. 회귀 테스트와 실제 호출자 검증 후 채택 판정 재실행 |
| 기록 모드 한계 · 추가 구현은 필요성 재판정 | [preflight](../../scripts/agents/preflight.mjs)의 `fingerprintOf/activePaths`는 작성한 파일 집합을 hash. 수정 없이 채택한 코드가 그 집합에 자동 포함되지 않음 | 일반 작업은 실제 채택 코드와 결과를 검토한다. 기록 receipt로 0-diff 채택까지 인증할 필요가 있을 때만 기존 document hash·검토 범위를 통합하는 안을 평가; 새 manifest를 기본 추가하지 않음 | 0-diff 채택을 검토한 뒤 채택 소스만 바꾸면 완료가 무효화되는 음성 시험. 관련 없는 파일 변경은 과잉 차단하지 않음. 현재 발견은 hash 범위의 한계이며 모든 Stop 경로 우회가 재현됐다는 뜻은 아님 |
| P1 · 기능은 있고 제품 적용 미검증 | [실제 context 색인](../reference/zero-sol/context.json)에 `parentReferences` 선언 0개. [context 시험](../../scripts/agents/context.test.mjs)은 합성 parent 문서 사용 | 실제 부분 요청 하나의 부모 입출력·상태·정책 절을 관찰해 색인에 연결. 불명확한 부모 정책을 삭제하지 않음 | 같은 부분 요청에서 불필요한 원장 전달은 줄고 필수 정책·실패 시나리오는 유지되는 실제 드릴 |
| P1 · 완료 차단과 순서 강제를 구별 | [request-units](../../scripts/agents/request-units.mjs)에는 다음 단위 전 이전 review 필수 조건이 없음. preflight `checkStop`은 미검토 단위를 차단하고 `unitEvidenceFailure`는 이미 검토한 단위의 변경을 확인 | prepare마다 선형 진행 잠금을 더하지 않는다. 여러 단위가 stale일 때 각 단위를 수리할 수 있어야 한다. 문서의 순차 실행 기본값과 Stop의 전체 대조 보장을 구별하고 실제 혼합 요청을 끝까지 실행 | 누락 단위는 Stop 차단, 여러 stale 단위는 교착 없이 각각 수리, 마지막 전체 연결 검증. 현재 소비자 기록의 u1 N6는 전체 완주 증거가 아님 |
| P1 · 런타임 충돌 미검증 | 루트 §2의 선택 로딩과 활성 전역 플러그인의 강제 진입은 다른 층. 프로젝트 루트만으로 상위 지시가 사라지지 않음 | Claude/Codex 활성 skill·hook·전역 설정을 각각 기록하고 중복된 진입·승인·위임 기본값을 사용 프로필에서 정리. cache 원본 수정 금지 | 동일 요청이 두 런타임에서 불필요한 승인/전체 skill 선로딩 없이 진행하고 실제 적용 출처를 남김 |
| P2 · 목표 수용 미입증 | 정상 grain 5/5는 fixture. 실제 다른 제품의 독립 신규 구현·성공 작업당 usage 실험 없음 | 루프 정본을 더 늘리기 전에 실제 새 제품에서 필요한 계약만 채택/수정/제외. 각 크기의 신규 구현과 혼합 전체를 독립 세션으로 검증 | 제품 수용, 사람이 절차를 다시 설명한 횟수, 결함·재작업·전체 worker 비용을 포함한 기록. 실패가 있으면 원인 소유자만 수정 |

P0는 “지금 완료 판정의 신뢰도를 바로 높이는 순서”이며 서비스 장애 등급을 의미하지 않는다. 이번 작업에서는 일반/기록 실행 분리와 공통 진입 정리를 운영 파일에 적용했다. 위 Kelvin 코드 수정·이관 결함 수정·실제 신규 제품 수용을 수행한 것은 아니다. 확인이 필요한 제품 정책은 문서 설계 결함과 구별하며, 임의 값으로 해소하지 않는다.

## 10. 현재 구조와 ECC를 대체 관계로 비교한다

사용자가 ECC를 제안한 이유는 스킬을 더 설치하기 위해서가 아니라, 자체 문서·검증 도구를 계속 관리하는 비용을 줄일 수 있는지 보기 위해서다. 따라서 현재 구조 보존 + ECC 추가를 기본값으로 삼지 않는다. 신규 프로젝트뿐 아니라 이 프로젝트의 실행 방식도 교체 후보이다.

| 책임 | 현재 수단 | 더 가벼운 대안과 판단 |
| --- | --- | --- |
| 요청 크기·근거·설계·복귀 | 루트 + screen-loop + prepare/review 절차 | 작은 공통 루트와 필요한 전문 skill로 같은 결과가 나오면 중복 절차와 산출물을 제거. 파일 이름이나 노드 수를 보존하지 않음 |
| 기존 해법 탐색 | 에이전트 검색·문서 안내 | ECC search-first가 탐색 누락을 줄이면 해당 역할을 대체. 기존 지시와 두 번 실행하지 않음 |
| 기술·제품 계약 | 4개 contract skill과 reference | 의미가 필요한 계약은 보존하되 제품별 근거와 분리. ECC contract-first가 범용 절차를 더 잘 소유하면 그 부분을 교체; 기존 파일 자체가 보존 대상은 아님 |
| 실제 품질 검사 | 타입·lint·unit·브라우저/API 검증 | 관련 검사는 계속 필요. ECC가 실행을 안내할 수는 있어도 제품 동작의 실측을 대신하지는 못함 |
| 세션 선언·귀속·receipt·Stop | 선택한 기록 모드의 scripts/agents와 runtime hooks | 일반 모드의 강제 기록 제거 적용. 고위험 독립 검토는 실행 지시로 유지하며 기록이 필요한 재현 작업만 prepare 사용 |
| 대상 채택 기록 | bundle 선택 + 작업 checkpoint | 기존 요구사항/검토 기록의 참조로 해결하는 안을 먼저 평가. 별도 adoption manifest는 세션을 넘는 채택 누락을 더 단순하게 막을 때만 선택 |
| 이관 검사 | seed/manifest/stage/apply | 레퍼런스 코드를 이관할 때만 사용. 외부 스킬만 사용하는 신규 프로젝트의 필수 구조로 복사하지 않음 |

검토한 ECC 원본도 큰 작업의 researcher 호출, 고정 검증 단계·coverage·주기적 실행을 포함한다. 따라서 ECC 전체 설치가 자동으로 더 편하거나 저렴하다는 결론은 근거가 없다. [신규 프로젝트 설계](2026-09-14-portable-agent-document-system.md)는 필요한 스킬의 선택·수정·설치 경로를 제시하며, 기본 사용을 강제하지 않는다.

현재 가장 먼저 비교할 안은 **작은 공통 루프 + 필요한 전문 계약 + 기존 실행 검사**다. 이 구조에서 부족한 역할만 ECC로 대체한다. 새 파일/게이트를 만드는 안은 기존 소유자 수정·통합·삭제로 같은 문제를 해결할 수 없을 때 비교한다. 이에 따라 현행 hook의 일반/기록 분리와 AGENTS·screen-loop의 구조 변경을 적용했다. ECC 설치 없이 이 비용을 줄일 수 있었으므로 ECC 전체 설치를 필수로 삼지 않는다. 품질·총토큰 우위는 실제 동일 조건의 요청 수용 시험으로 계속 판단한다.
