# 0010. 등록·수정 공용화 경계와 레퍼런스 검증

- 상태: 채택 — 등록·수정 폼의 공용 계약. Managers 등록/수정이 이 계약을 검증하는 consumer 다
- 날짜: 2026-09-01 · 개정 2026-09-03 ①: 저장 오케스트레이션을 `shared/ui/form/useSaveForm` 으로 승격(사용자 결정, Codex 교차 리뷰 반영) — §저장 오케스트레이션과 서버 오류의 거처 · 개정 2026-09-03 ②: Codex·Claude 독립 리뷰 → 교차 대조로 단순화 — §개정 ② 요약
- 근거 재확인: 2026-09-02 — 전체 인벤토리(폼·상세·팝업 판독)와 Notion Feature 문장으로 재판정. 판정 기록은 [ZEROsol 공용화 판정 §8](../reference/zero-sol-figma-analysis.md)
- 적용 범위: 레퍼런스 프로젝트의 등록·수정(form) mechanic
- 관찰 근거: [ZEROsol 인벤토리 11 설정](../reference/zero-sol/11-settings.md) 의 `11.1.3 운영자 등록`, `11.1.4 운영자 수정`(레이어 확인, 이번 인벤토리에서 미판독)
- 관련 결정: 목록·필터 경계는 [0009](0009-shared-boundaries.md), primitive 구현 선택은 [0008](0008-primitive-implementation-selection.md)

## 이 ADR 의 책임

등록/수정 공용화의 이유, 거부한 대안, 소유권 결정, 재검토 조건을 보존한다.
Managers 구현 가이드가 아니다. 반복 구현 절차는
`.agents/skills/feature-contract/references/form-workflow.md` 와
`.agents/skills/shared-ui-contract/references/form-fields.md` 가 소유한다. 선택·날짜·파일 control의 세부 계약은 해당 shared-ui reference가 소유한다.

0009 는 제목과 적용 범위가 목록·필터로 한정되어 form 경계를 의도적으로 다루지 않았다. 이 ADR 이
그 공백을 채운다.

## 맥락

Figma 의 등록/수정 프레임과 리허설 계약을 대조해 다음을 관찰했다.

- 등록과 수정은 **값이 아니라 필드 집합이 다르다.** 등록에만 아이디·비밀번호·비밀번호 확인이 있고, 수정의 아이디는 읽기 전용이며 `PUT` 본문에 없다.
- 반면 **저장 흐름의 모양은 같다.** `handleSubmit` → request mapper → mutation → 서버 field error 매핑 → 성공 후 이동.
- `1.3 Alert`·`1.4 공통화면`이 저장 확인·완료와 전체 화면 로딩·등록 중 카피를 확정한다.
- 리허설 계약의 8개 컬렉션이 같은 `POST` + `{id}` `PUT` topology 를 반복하지만 **보이는 필드·필수 여부·실패 semantics 의 반복은 증명하지 않는다.**

## 실측한 사실 (이 결정의 근거)

`SectionCard` 를 닫고 submit 하는 focused test 로 React Hook Form(이전 측정)과 TanStack Form 1.33.5
(재측정)를 비교했다.

| 측정 | React Hook Form(이전) | TanStack Form 1.33.5(재측정) |
| --- | --- | --- |
| 닫혀 언마운트된 필드 검증 | 전체 values 를 검증해 submit 차단 | Standard Schema 가 전체 values 를 검증해 submit 차단 |
| 언마운트된 값 | 기본값에서 form state 에 남음 | form state 에 남음 |
| 화면 오류 | control 이 없어 렌더되지 않음 | control 이 없어 렌더되지 않음 |

따라서 두 라이브러리 모두 submit 은 차단되지만 **오류 문구가 렌더되지 않아 저장이 조용히 실패한다.**
RHF 의 `shouldFocusError` 는 detached ref 에 포커스를 시도해도 아무 일이 없고(런타임 측정), TanStack
Form 코어에는 자동 focus API 가 없다(소스 근거). 섹션을 연 뒤 native Input·Radix Select 로 포커스를
옮기는 현재 동작은 회귀 테스트와 e2e 가 측정한다.

Chromium 실측: TanStack Form 1.33.5 는 field **unmount cleanup 이 validation error map 을 비운다.** 처음 구현은
remount 후 재검증하는 보상 절차를 두었고, `hidden` 만으로는 reveal 을 대체하지 못했다(Radix Accordion 도 동일, 0008 개정 2).

**2026-09-02 개정 — 폼 섹션은 닫혀도 mount 를 유지한다.** 사용자가 오류 섹션을 다시 접어도 헤더에
"오류 N개"를 보여주기로 결정하면서(Claude·Codex 독립안 → 교차 리뷰), 폼 섹션은 `forceMount + hidden`
(`SectionCard keepMounted`, `useFormSections.sectionProps` 가 항상 켠다)으로 error map 을 보존한다.
개수의 원천이 `FormField` 가 보여주는 `fieldMeta.errors` 와 같아 서버 `onServer` 오류도 자동 포함되고,
위 재검증 보상 절차와 서버 오류의 "reveal 뒤 기록" 순서 제약이 사라졌다. 같은 날 배지가 드러낸 기존 결함:
`FieldApi.validateSync` 는 non-submit 검증(blur·change)이 오류 없이 끝나면 `onSubmit` 오류를 지우므로,
`validators: { onSubmit }` 만 쓰면 실패한 필드를 벗어나기만 해도 오류가 사라졐다(form-core 1.33.5 소스·
node 재현). 결정: `validationLogic: revalidateLogic()` + `validators: { onDynamic: schema }` — 첫 제출까지는
submit 에만, 제출 시도 뒤에는 change 마다 같은 스키마로 재검증하며 오류는 `onDynamic` 키에 남아 blur 로
지워지지 않는다. 거부한 대안: values 스키마
재파싱(클라이언트만 세고 서버 오류 집합을 따로 관리), 오류 시 접기 금지(사용자 제어 박탈), 상단 오류
요약(field·헤더와 3중 표현, Figma 에 없음). 상세·설정의 읽기 섹션은 닫힌 child query 가 observer 로
살아 overlay·fetch 를 일으키지 않게 기본 unmount 를 유지한다.

2번은 조건부 필드에도 적용된다. 조건이 꺼져 컨트롤이 사라져도 값은 남으므로, 조건이 꺼질 때
feature 가 값을 명시적으로 정리해야 한다. request mapper 의 whitelist 는 payload 만 지키고
`isDirty`·`isValid`·cross-field 검증은 지키지 못한다.

## 검토한 대안

| 대안 | 판정 | 이유 |
| --- | --- | --- |
| 등록/수정을 하나의 스키마와 `mode` 로 처리 | 거부 | "수정에는 비밀번호가 없다"가 스키마에서 안 드러나고 타입이 합집합이 되어 mapper 에 방어 코드가 생긴다 |
| 두 화면을 완전히 독립 | 거부 | submit 오케스트레이션 40줄 복붙, "오류 섹션 열기" 배선을 화면마다 다시 해 한 곳만 빠져도 조용한 저장 실패 재발 |
| 범용 폼 프레임워크(`FormPage`, `useCrud`, config renderer) | 거부 | Router·Query·API·권한을 한 추상화에 넣어 shared 를 두 번째 애플리케이션으로 만든다 |
| 차이는 분리, 같은 것만 조립 | **채택** | 스키마·defaults·mapper 는 분리하고 submit 오케스트레이션과 섹션 개폐/오류 노출만 공유 |

## 결정

### 소유권 경계

| shared 가 소유할 수 있음                                | feature 가 반드시 소유                                      |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| primitive 의 접근성·토큰·키보드 동작                     | Zod 스키마, defaults, request mapper                        |
| `FormField` 의 등록·오류 정규화·label/control/error 연결   | 필드 집합, 조건부 필드, 검증 문구                           |
| TanStack 어댑터의 `form` + typed `name` → primitive 연결  | option Query, enum 의미, endpoint, cache 결과               |
| 섹션 개폐 상태 대수와 "오류 있는 섹션 열기" 알고리즘      | 어떤 필드가 어느 섹션에 속하는지                            |
| confirm/alert dialog 의 상호작용 mechanic                 | 저장 흐름의 문구·목적지·권한·실패 workflow                  |

shared 는 feature, Query, endpoint, server DTO, permission 을 알지 않는다. `useUnsavedChangesGuard`(`UnsavedChangesGuard.tsx`)만 dirty navigation의 pending destination을 복제하지 않기 위해 Router blocker를 직접 쓰는 이름 붙은 예외이며, ESLint가 그 파일 하나만 허용한다. 특히 섹션 개폐
mechanic 은 form errors 객체나 스키마를 받지 않는다. 필드↔섹션 매핑은 caller 가 준다.

### 폼 라이브러리 경계

`AGENTS.md` §3 의 상태 소유권 표가 폼 값과 검증 상태의 소유자를 TanStack Form 으로 선언한다. Query·Router·Table 과
같은 TanStack 계열로 맞추고, Zod 4 Standard Schema 를 resolver 없이 직접 연결하며, 호출부 제네릭 없이
`form` + `DeepKeys` name 을 검사할 수 있어 React Hook Form 에서 전환했다. `FormField` 가
`form.Field` 등록과 Zod issue/server string 오류 정규화, label/control/error ARIA 연결을 한 곳에서
소유한다. primitive 는 폼 라이브러리를 모르고, schema/defaults/workflow 는 feature 에 남는다.

Standard Schema 성공 output 은 submit value 를 치환하지 않으므로 유효 submit 직후 feature schema 의
`parse` 로 output 을 만든 뒤 mapper 에 넘긴다. `AnyFormApi` 는 React `Field` 가 없어 쓰지 않고,
strict dependency 해석 경계를 지키기 위해 `@tanstack/form-core` 를 직접 import 하지 않는다.

### 전역 진행 상태

Figma `1.4.1/1.4.2`가 동일한 전체 화면 진행 표면을 확정했으므로 `AppShell`이 `useIsMutating()`과
관찰 중인 pending Query의 명시적 progress meta만 읽어 `BlockingProgress`를 연다. 화면 진입에 필요한
primary Query만 `blocking`, 이미 마운트된 화면의 검색·정렬·필터·페이지 전환은 `content`다. 후자는
이전 결과를 유지하고 결과 영역의 `aria-busy`로 표현한다. 시간 경과로 content 요청을 blocking으로
승격하지 않는다. observer가 없는 warming은 제외하며 동시에 발생하면 mutation 카피가 우선한다.

**옵션·lookup 조회는 overlay를 열지 않는다(2026-09-02).** select 선택지 같은 보조 데이터는 `meta.progress: 'inline'`
(`src/api/query-meta.ts`의 `inlineProgress`)을 선언해 shell predicate에서 제외되고, 필드 자체의 inline 상태
(`AsyncFieldBoundary`·disabled select)가 로딩을 표현한다. route loader가 진입·preload intent 시 옵션을 warm 해
대부분 필드가 마운트되기 전에 준비된다. overlay는 **화면 진입 primary data**(searched URL의 최초 목록 결과·상세·수정 조회)와 mutation만 덮고,
mutation을 시작한 버튼은 자기 pending 상태(`FormSubmitButton pending`)도 함께 보인다. 다운로드·일괄 작업이 overlay를
여는지는 Figma에 frame이 없어 미확인이며 버튼 pending만으로 시작한다.

### create/edit 분리 판정

| 항목                    | 판정      | 이유                                                       |
| ----------------------- | --------- | ---------------------------------------------------------- |
| Zod 스키마              | **분리**  | 필드 집합과 필수 여부가 다르다. 안정 field fragment 만 공유 |
| defaults                | **분리**  | 상수 vs 서버 응답 평탄화로 출처가 다르다                   |
| request mapper          | **분리**  | 본문 필드가 다르다. 각각 whitelist                          |
| 필드 JSX                | **feature-local 공통 component** | `ManagerForm` 이 공통 7 필드와 껍데기를 그리고, 등록·수정 화면이 각자 `identity` slot(아이디·비밀번호 / 읽기 전용 아이디)을 넘긴다 |
| **submit 오케스트레이션** | **공유** | 모양이 같다. mutation 함수와 성공 후 목적지만 주입한다     |
| **섹션 개폐·오류 노출**   | **공유** | 도메인 없는 상태 대수다                                    |

shared와 workflow 대상에 `mode` 를 넣지 않는다. 등록·수정 스키마가 다르므로 하나의 필드 컴포넌트에 `mode` 플래그를 두면
수정 폼 값에 없는 비밀번호 필드를 그릴 수 없다(타입 오류). 차이는 화면이 `identity` slot 으로 소유하고, `useSaveForm` 은
호출부가 이미 소유한 schema, defaults, 섹션↔필드, 저장 함수·pending, `mapError`, 완료 callback 만 받는다. 이 값들은 분기 조건이 아니다.
등록·수정이 공유하는 옵션·유형 정책·공통 필드·껍데기는 `ManagerForm` 하나가 소유한다(개정 ②). 이 컴포넌트에 mode, query/mutation
객체, route destination, field descriptor 가 필요해지면 공유를 넓히지 말고 좁히거나 되돌린다.

### 저장 오케스트레이션과 서버 오류의 거처 (2026-09-03 개정)

`useSaveForm`(shared)이 `useForm` 생성, `onSubmit`/`onSubmitInvalid`(섹션 reveal + 첫 오류 focus), 저장 stage 하나
(`idle | confirming{values} | saved | failed{root}`), 서버 오류 배치, dirty 이탈 가드를 소유한다. 입력은 전부 opaque
값·콜백이라 도메인 지식이 없다. 이전 기록 "shared 는 api 를 알 수 없으므로 feature 안에 둔다"는 `mapError` 주입으로
해소했다: `src/api/form-error.ts` 의 `classifyFormError` 가 `ApiError` 를 `{ fields, root? } | undefined` 로 바꾸고
(`undefined` = transport 가 이미 incident 로 발행했거나 cancelled), shared 는 같은 세 root 이름을 구조적으로 선언한다.
옮긴 것은 mechanic 이고 Manager 정책(필드·옵션·종속 초기화)은 `ManagerForm`·`useManagerFormOptions` 에 남는다(사용자 결정).
Codex 는 consumer 수를 이유로 반대했고 그 이견을 기록으로 남긴다.

실측으로 폐기한 두 안: ① 루트 오류를 `form.setErrorMap({ onServer })` 에 두는 것 — form-level `onServer` validator 가
없으면 `TOnServer=undefined` 로 추론되어 `string` 이 컴파일되지 않는다(tsc 재현). 루트 오류는 stage 의 `failed` variant.
② 성공 후 `form.reset(values)` — `useForm` 이 매 렌더 `formApi.update(opts)` 를 부르므로 원래 defaults 로 값이 되돌아간다
(form-core 1.33.5 재현). `reset(values, { keepDefaultValues: true })` 로 저장값을 dirty 기준선으로 만들어 가드가 풀린다.

서버 field error 는 `fieldMeta.errorMap.onServer` 에 쓰고 reveal → 첫 rejected field focus 순으로 처리한다. 일반 검증은
`onServer` 를 절대 지우지 않아 다음 submit 을 영구 차단하므로, **submit 시작 시 모든 `onServer` 를 지운다**(서버가 다시
판단). 이탈 가드의 `when` 은 `isDirty` 하나다: 저장 중 이동은 **묻지 않고 거부**한다(`refuseSilently: isPending` — Chromium 실측에서
질문 dialog 가 진행 overlay 아래 깔려 조작 불가였다; 이전 `!isPending` 우회는 폐기), 성공 시 기준선 갱신으로 풀린다. 이 계약은 실제 Router(memory history) 위의 `useSaveForm.test.tsx` 가 검증하며, `useBlocker` mock 테스트는 잡지 못한다.

## 개정 ② (2026-09-03)

방향(shared mechanic 의 소유 범위)은 바꾸지 않았다. 결정:

- `useSaveForm` 은 한 훅으로 shared 에 둔다. 다섯 책임(submit 시 `onServer` 삭제 → reveal/focus → confirm → `reset(keepDefaultValues)` → 실패 시 배치·focus)이 순서 결합돼 있어 나누면 caller 가 그 순서를 다시 보장해야 하고, 그것이 곧 "40줄 복붙·조용한 저장 실패" 재발이다. 훅은 `dialogs` 노드 하나(이탈 질문 + 저장 확인·완료 쌍)를 돌려주고 `FormSaveDialogs` 는 이 훅 안에서만 렌더된다.
- 한 도메인의 등록·수정은 **하나의 feature 폼 컴포넌트**(`ManagerForm`)가 옵션 Query·유형 정책·공통 필드·섹션/action 껍데기를 소유하고, 화면은 `useSaveForm` 선언(스키마·defaults·mutation·목적지)과 다른 필드 slot(`identity`)만 갖는다. 결정 없는 domain-free layout 은 만들지 않는다.
- 종속 값 초기화("유형 변경시 권한은 초기화됨")는 `useEffect` 가 아니라 유형 select 의 `onValueChange` 에 배선하고, 옵션 select 는 로딩·실패·재시도를 `FormSelectField state/onRetry` 로 표현한다.

공용 계약 단위는 `useSaveForm`(+ 내부 `FormSaveDialogs`), `useUnsavedChangesGuard`, `useFormSections`, `SectionCard keepMounted/errorCount`, `FormField` 와 승인된 어댑터, `FormSubmitButton`/`FormCancelButton`, `DetailStateBoundary`, `BlockingProgress` 다. `DetailStateBoundary` 는 `ready | error | notFound` 렌더와 error live/retry/trace slot 만 소유하고 caller 가 state 와 safe copy 를 고른다(pending 은 app progress 소유). 그 외 서명과 소유 한계는 `form-workflow.md`(저장 흐름)와 `form-fields.md`(어댑터)가 한 곳씩 소유하며 이 ADR 은 반복하지 않는다.

feature-local 인 것: `useManagerFormOptions(type)`, 유형 select 의 `onValueChange` 에 배선된 종속 값 초기화, `classifyFormError` 연결 한 줄, Manager 의 스키마·defaults·mapper·필드 JSX·문구.

`useSaveForm` 은 확인→완료 쌍이 있는 페이지 저장 전용이다. 회원상담·발권 상담 같은 상세 안 인라인 저장은 확인 없이 저장 후 갱신하므로(2026-09-02) 이 훅을 쓰지 않고 `useForm` + 어댑터로 직접 조립한다(`LoginScreen` 이 그 형태). 다른 저장 흐름은 이 훅에 옵션을 넓혀 흡수하지 않고 feature 에서 직접 조립한다.

이탈 확인 문장은 둘이다. 취소 버튼은 "취소할 경우 입력된 정보는 모두 삭제됩니다. 입력을 취소하시겠습니까?"(Notion 20+ 화면,
운영자 포함), 폼 밖 이동(LNB·뒤로가기)은 "화면을 이동할 경우 입력된 정보는 모두 삭제됩니다. 화면으로 이동하시겠습니까?"
(Figma `1.1.3.1.2 화면 이동`). Notion 은 취소 alert 를 조건 없이 적지만 문장이 입력을 전제해 dirty 아닌 경우를 다루지 않았다고 읽었고, **2026-09-02 사용자 결정으로 둘 다 dirty일 때만 뜬다.**
결과가 같으므로(입력 삭제) 취소 버튼은 별도 dialog 없이 `useUnsavedChangesGuard().leave(navigate)` 로 같은 Router blocker를
지나가고, 가드가 진입 경로에 따라 두 문장 중 하나를 고른다. 이전 구현(항상 확인 → 확인 뒤 가드를 끄고 effect로 이동)은 그
순서 보장 코드를 폼마다 요구해 폐기했다. 문장 두 개는 모두 확인된 것이라 하나로 합치지 않는다.

## 미확인

리허설 계약과 Figma 만으로는 확정할 수 없어 `[가정]` 으로 구현하거나 보류한 항목이다.

- `agencyId` 의 제품 정책. Figma 등록/수정에 기획사 필드가 없는데 리허설 계약은 `type=AGENCY` 일 때 필수라고 한다
- 저장 성공·취소의 실제 목적지는 미확인이다. 저장 확인·완료 acknowledgement 자체와 한국어 카피는 Figma `1.3 Alert`와 Notion 에서 확인됐다. 설정 폼은 "저장 완료 → 화면 갱신"
- 아이디 중복확인의 trigger 와 상태 표현. endpoint 는 있으나 Figma·Notion 에 UI 가 없다
- 이메일 최대 길이: UI 제약은 Figma placeholder "3~100자 내외"(회원·운영자 등록 동일)로 확인. 서버 제약은 신규 OpenAPI 가 확정. 비밀번호 규칙 "영문 대/소문자+숫자+특수문자 중 3종류 이상, 8~20자"(Figma placeholder + Notion Case01) 확인
- 권한 옵션은 "[설정 > 접근권한] 중 사용 상태이고 선택한 유형에 속한 권한" 이며 "유형 변경시 권한은 초기화됨"(Notion) — 현재 종속 option query 와 clearing 은 리허설 가정이 아니라 확인된 정책
- 운영자 조회 5 상태(대기·거절·활성·비활성·잠금)별 action 집합과 서버 계약. Figma 대기 = 승인·거절
- 서버 오류 코드와 Manager 필드의 대응. 매핑 메커니즘(`ApiError.fieldErrors`)은 확인됐다
- 수정 조회 refetch 와 편집 중 폼의 충돌 정책
- 수정 저장 중 별도 카피는 미확인이라 확인된 등록 중 카피를 임시 재사용한다. edit counterpart가 확인되면 분리한다

## 재검토 조건

- 신규 제품 계약(OpenAPI·Figma·정책)이 리허설 가정과 다를 때 — §미확인의 항목이 확정되면 해당 `[가정]` 구현을 교체한다
- 공용 단위가 `mode`, resource config, callback override 를 요구받을 때 — 요구를 shared 에 넣지 않고 그 화면을 feature 에서 직접 조립한다
- 다중 섹션 폼(회원 설정 4 섹션·마케팅 조건부 섹션·공연 수정 섹션 단위 저장, 2026-09-02 인벤토리 확인)을 조립할 때 — 섹션↔필드 매핑은 그 화면이 선언하고, 섹션 단위 저장은 섹션 하나를 폼 하나로 둔다(form-workflow)
