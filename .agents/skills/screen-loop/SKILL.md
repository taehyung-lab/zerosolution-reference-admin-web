---
name: screen-loop
description: Use for any request to implement or change a screen, part of a screen, component, hook, utility, API behavior, or source structure, before its edit scope is settled. Owns the request→design→verify→return loop and the completion rubric, then routes to the contract skill that owns the boundary being changed. Not for a question, a read-only review, or a command run.
---

# Screen Loop

한 문장 구현 요청이 완료 보고에 닿기까지의 **단계·갈림·복귀**를 소유한다. 제품 근거의 경로는
[제품 포인터](../../../docs/reference/product.json)가 소유하며, 요청에 필요한 원장만 따라간다 —
`inventory`·`judgment`·`scenarios`·`index` 네 경로를 관례로 모두 열지 않는다.

**이 루프는 파일을 만들지 않는다.** 단계의 산출물은 대화에 공개하는 판단과 실제 diff다.
기록을 저장소에 남기는 것은 사용자가 요청했거나 세션을 넘겨야 할 때뿐이다.

## 요청의 종류

| 종류 | 단서 | 하지 않는 일 |
| --- | --- | --- |
| **screen** | 목록·상세·조회·등록·수정 화면 | 형제 화면의 제품 값 복사. 빈 역할 파일 |
| **slice** | 한 surface (필터만, 이력만, 팝업만) | 화면 나머지 재구현 |
| **component** | 컴포넌트·패턴 이름 | 한 호출자 때문에 공용 확대 |
| **logic** | 훅·순수 유틸·mechanic 이름 | 도메인 차이를 인자로 흡수 |
| **structure** | 파일 집합·폴더·import 경계 | 원장 옵션·문구·권한 판단 |

종류가 갈리지 않으면 화면 이름→screen, 컴포넌트 이름→component, `use*`·유틸 이름→logic,
`형태`·`구조`·`폴더`→structure. 이 표는 **읽을 계약을 고르는 분류**이지 완료 범위를 자르는 규칙이 아니다.

### 종류별로 읽는 문서 — 하나씩

문서 비용은 요청 크기에 맞춘다. 화면 하나는 그 역할의 계약 문서 **한 개**를 전부 읽고, 나머지는 필요한 절만 링크로 연다. 버튼 하나·로직 하나는 화면 문서를 열지 않는다.

| 종류 | 먼저 읽는 것(전체) | 필요할 때만 여는 절 |
| --- | --- | --- |
| screen — 목록 | [list.md](../feature-contract/references/list.md) | [router 형태](../feature-contract/references/router.md#형태), [catalog](../shared-ui-contract/references/catalog.md) 의 해당 행, [mutations 시나리오 요청](../api-contract/references/mutations.md#시나리오-요청) |
| screen — 상세 | [detail.md](../feature-contract/references/detail.md) | 위와 같음 |
| screen — 등록·수정 | [form.md](../feature-contract/references/form.md) | 위와 같음 |
| slice | 그 surface 가 속한 역할 문서의 **해당 절** | 그 절이 가리키는 catalog 행 |
| slice — 화면 안의 행 집합(상세 섹션 표, 폼 반복 행, 다이얼로그 검색 결과) | host 역할 문서의 섹션 절 + [collection.md](../feature-contract/references/collection.md) | 렌더는 [catalog](../shared-ui-contract/references/catalog.md) 의 그 행 |
| component | [catalog.md](../shared-ui-contract/references/catalog.md) 의 그 행 | 계약을 바꾸면 [promotion.md](../shared-ui-contract/references/promotion.md), primitive 내부면 [primitives-and-tokens.md](../shared-ui-contract/references/primitives-and-tokens.md) |
| logic — 화면 workflow 훅(`use{X}ListFilter`·`use{X}ListData`·`use{X}ListActions`·`use{X}ListResult` 등 `screens/`·`mechanics/` 안) | **그 훅을 품은 역할 문서의 해당 절**(필터면 [list Filter](../feature-contract/references/list.md#filter), 조회면 [Query](../feature-contract/references/list.md#query), 액션이면 [Selection and actions](../feature-contract/references/list.md#selection-and-actions), 저장이면 [form Save lifecycle](../feature-contract/references/form.md#save-lifecycle)) | 실제 호출자, 배치가 갈리면 [folder-structure-contract](../folder-structure-contract/SKILL.md) |
| logic — 공용 순수 함수·headless mechanic(`shared/`·`src/api`) | 실제 호출자 + catalog 의 그 행(있으면) | 공용화 여부면 [promotion.md](../shared-ui-contract/references/promotion.md), wire·cache 면 [api-contract](../api-contract/SKILL.md) 의 해당 reference |
| structure | [folder-structure-contract](../folder-structure-contract/SKILL.md) | 역할별 `형태` 절 |

화면 workflow 훅은 파일 이름이 `use*` 여도 그 화면의 URL·검색·선택·저장 정책을 소유하므로 역할 문서를 건너뛰지 않는다. catalog 에 행이 없으면 공용 단위가 아니라는 뜻이고, 그러면 host 역할 문서가 소유자다.

요청이 여러 종류에 걸쳐도 임의로 하나만 남기지 않는다. 요청한 성공 조건에 필요한
요청의 기본 범위는 요청 결과와 그것을 실제 수행하는 데 필요한 최소 연결이다.
`screen`의 최소 연결에는 앱에서 도달 가능한 실제 route나 기존 host에서 그 화면을 여는 조립이 포함된다.
둘 다 없으면 요청을 수행하는 최소 route나 host를 같은 작업에서 만든다. 사용자가 명시적으로
component·slice만 요청한 경우에만 진입점 연결을 범위에서 뺀다. 화면 파일을 직접 render한 테스트는
component·slice의 증거일 뿐, 진입점이 없는 screen을 구현 완료로 바꾸지 않는다.
**결과가 `render`면 요청 크기와 무관하게 브라우저로 실측한다.** screen이든 버튼 하나든 같다 — 가르는 것은
요청 문장의 크기가 아니라 결과가 렌더로만 판정되는가다. 직접 render한 unit test·typecheck·lint·build는
그 실측을 대신하지 않는다.

실측은 이미 떠 있는 로컬 앱의 실제 route나 host에 **그 저장소가 선언한 브라우저 수단**으로 진입한다 —
이 저장소에서는 `aside-browser`로 `http://localhost:5174`에 들어간다 — 인증 API의 CORS 허용 목록에 있는 origin이고, `5173`은 이관 대상 저장소가 쓴다. 포트를 바꿀 때는 그 저장소의 dev 서버가 실제로 그 포트를 서비스하는지 먼저 확인한다.
실 세션·실 토큰으로 보는 것이 실측이며, 이관 대상에서는 그 제품이 선언한 수단과 origin으로 바꾼다.
실행 명령은 README와 `package.json`이 소유한다.

`tests/e2e/`의 Playwright는 **실측 수단이 아니라 회귀 그물**이다. 가짜 토큰과 mock으로 돌아 로그인·실
서버를 타지 않으므로 수용을 증명하지 못한다(아래 [도달 상태](#도달-상태)). 실측한 것 중 되돌아올 전이
하나를 그 화면·전이를 만든 같은 작업에서 spec으로 남기고, 단언은 전이·URL·상태 보존 같은 제품 동작으로
한정한다 — fixture의 id·값에 걸면 이관에서 죽는다. 이미 앵커가 없는 기존 화면을 소급해 채우지 않는다.
원장의 진입·실행·취소·다음 이동을 성공 조건에 넣고, 기존 구현을 먼저 재사용한다.
목적지가 없다는 사실은 범위 질문의 사유가 아니다. 확정된 전이에 필요한 실제 목적지를 같은 작업에서 구현한다.
목적지의 구성·정책은 그 목적지 원문으로 확인하며 요청 화면이나 다른 도메인에서 복사하지 않는다.
확인한 흐름에 필요한 만큼만 연결한다. 목적지의 독립 액션·다른 화면까지 재귀적으로 구현하지 않는다.
데이터·query options·params·route 조립은 화면보다 먼저 기존 책임 위치에서 확정한다. 빈 route·stub는 목적지가 아니다.
기본 범위를 줄이거나 넓히는 명시적 사용자 지시가 있으면 그 지시를 따른다.
원문에도 없는 제품 동작·목적지·권한만 영향 요구와 해소 조건을 적고 그 부분을 보류한다. 확인된 나머지는 진행한다.

**같은 feature 는 한 요청, 한 소유자다.** 한 feature 를 화면 단위로 병렬 분할하면 `model/`·`api/` 의 데이터 계약이 작업마다 갈린다. 데이터 계약(model 타입·query options·mutation 입력)을 먼저 한 곳에서 확정하고, 그 위에서 화면을 잇는다. 병렬로 나눌 수 있는 것은 서로 다른 feature 다.

## 화면인가 아닌가 — 2단계의 유일한 갈림

**결과 계약이 기준이지 파일 형태가 아니다.**

- 결과를 판정하려면 렌더·포커스·키보드·문구·navigation·부모 화면 상태를 봐야 하면 → [render](references/render.md)
- 시각 surface 없이 호출자·입출력·부작용·실패로 닫을 수 있으면 → [nonrender](references/nonrender.md)

화면 workflow 결정을 소유하는 headless hook은 파일 형태가 logic이어도 `render`다.
서버 wire나 cache identity가 바뀌면 둘과 무관하게 [api-contract](../api-contract/SKILL.md)를 함께 조립한다.

**공용 계약이 없는 control은 그것을 품은 surface의 workflow가 소유한다.** 버튼처럼 catalog 에 행이
없는 control은 폼 안이면 form, 목록 툴바면 list, 상세 액션이면 detail의 절을 읽는다. control 이름만
보고 [shared-ui-contract](../shared-ui-contract/SKILL.md)로 가지 않는다 — 그쪽은 그 control 자체의
공용 계약(catalog 에 행이 있는 것)을 바꿀 때다.

## 7단계

| 단계 | 읽는 것 | 공개하는 것 | 다음 | 실패 시 복귀 |
| --- | --- | --- | --- | --- |
| **1 요청 고정** | 요청 본문. 루트 기준은 [AGENTS.md](../../../AGENTS.md)이며 런타임이 주입하지 않았을 때만 연다 | 요구 번호, 관측 가능한 성공 조건, 현재 흐름·영향 범위, 편집 후보, 검증 방법 | 2 | 요청 오해·새 요구 → **1** |
| **2 라우팅·근거** | `render` 또는 `nonrender` → 제품 값 변경이면 [제품 포인터](../../../docs/reference/product.json)가 연결한 inventory README 의 판독·근거 수명 규칙을 먼저 읽고, 그 규칙에 따라 요청에 필요한 원장·원문과 연결 목적지만 연다. 아니면 호출자·설치 타입·가까운 테스트 → 위 종류별 표의 계약 문서. 신규 조회는 [query-cache](../api-contract/references/query-cache.md#서버-연결-전후의-책임)의 단일 raw owner를 먼저 확정 | 확인/추론/가정/미확인, 연결 범위, 계약 `채택 / 수정 / 제외`. 자기 구현 설명으로 제품 사실을 갱신하지 않음 | 3 | 종류 오판 → **1**, 접근·제품·wire 부족 또는 책임 오판 → **2** |
| **3 설계** | 2의 근거, 변경 경계 코드, 설치된 버전의 타입 | 호출 흐름, 단일 상태 소유자, 재사용 근거, 파일·API·cache 영향, 실패·복구, vertical slice, 검사 계획 | 4 | 근거 부족 → **2**, 범위가 바뀌면 → **1**에서 확인 |
| **4 요구 대조** | 1의 성공 조건 + 3의 설계 | 요구별 `충족 / 불충족 / 다르게 설계 / 미확인`과 근거. 불필요한 파일·계층 제거 | 5 | 요청 오해 → **1**, 근거 오류 → **2**, 설계 누락 → **3** |
| **5 구현** | 변경 지점, 가까운 호출자·테스트, 선택한 reference | 최소 코드 + 소유자 옆 테스트 | 6 | 계약·제품 사실 발견 → **2**, 소유권·흐름 → **3** |
| **6 검증** | 변경 diff, 성공 조건, `package.json`의 검사 | 아래 완료 rubric의 각 열 | 7 | 요청 불일치 → **1**, 잘못된 사실·잘못된 계약 절 → **2**, 설계 결함 → **3**, 구현 결함 → **5** |
| **7 보고** | 실제 diff, 정본, 검사 원출력 | 채워진 rubric + 남은 차단 조건. 멈추거나 제외한 것은 그렇게 만든 정본을 파일·절로 지목한다 | 종료 | 검토가 찾은 원인 단계 |

**단계는 복귀 지점이지 제출물이 아니다.** 요청이 작으면 여러 단계가 한 문장으로 닫힌다 — 버튼 하나의
문구를 바꾸는 요청에 일곱 문단을 쓰는 것은 이 표의 오용이다. 각 단계가 요구하는 것은 그 판단을 **했는가**이고,
공개는 판단이 갈릴 때만 길어진다. 무엇을 읽을지도 마찬가지라 위 종류별 표가 문서 하나를 가리킨다.

루트·skill·공용 계약을 바꾸는 작업은 7단계에서 **독립 검토**를 받는다. 검토자는 보고서가 아니라
실제 diff와 정본을 열어 동의·반박·놓친 것을 낸다.

그리고 문서 변경은 **효과를 실측해야 채택된다.** 기존 검사 통과는 코드의 회귀 여부만 말하고, 바뀐
문서로 더 잘 구현되는지는 증명하지 않는다. 같은 요구를 같은 조건에서 다시 구현하게 하고 전후를
비교한다 — 같은 질문이 다시 나오는지, 같은 예외가 다시 생기는지, 검사가 실제 잘못된 결과를 잡는지,
다른 도메인을 정답으로 삼지 않고 흐름이 닫히는지. 비교 중에는 요구·평가 기준·실행 조건을 바꾸지
않으며, 기준을 바꿨다면 이전 결과와 점수를 비교하지 말고 기준선을 다시 잰다.

## 완료 rubric

6단계에서 요구마다 이 표를 채운다. **빈 칸은 미확인이지 통과가 아니다.**

| 요구 | 성공 조건 | 실행한 명령 | 실제 출력 | 관찰 방법 | 판정 |
| --- | --- | --- | --- | --- | --- |
| R1 | 관측 가능한 문장 | 실제 명령 | exit·핵심 출력 | 화면이면 무엇을 열어 무엇을 눌렀는지, 로직이면 어떤 입력으로 어떤 출력을 봤는지 | `구현됨 / 미구현 / 다르게 구현됨 / 미확인` |

- `실제 출력`이 비면 그 행은 자동으로 `미확인`이다. 선언으로 채우지 않는다.
- `미구현`·`다르게 구현됨`이 하나라도 있으면 원인 단계로 복귀한다.
- `screen` 요청을 앱에서 도달 가능한 실제 route나 host에서 열지 못했으면 그 요구는 `미구현`이다. 미연결 사실을
  정확히 보고했거나 컴포넌트를 직접 render한 검사가 통과했어도 판정은 바뀌지 않는다.
- 실 서버가 연결되지 않은 저장소에서 `완료`라고 쓰면 다음 사람이 고칠 게 없다고 읽는다. 실제로 그렇게 됐다.
  도달 가능한 상한은 아래 [도달 상태](#도달-상태)가 정한다.
- 실측할 수 없으면 추측으로 채우지 말고 **무엇을 왜 확인하지 못했는지** 적는다.

### 도달 상태

rubric의 행 판정과 별개로, 보고는 이 요청이 어디까지 실측됐는지를 아래 네 단어 중 하나로 말한다.
시나리오 카드·[mutations](../api-contract/references/mutations.md#시나리오-요청)·ADR이 이 어휘를 쓴다. 상태는 검증된 사실을 말하는 단어이지 새 산출물
요구가 아니며, component·logic·structure에는 화면 상태 기계를 씌우지 않고 각자의 요구 증거로 닫는다.

| 상태 | 뜻 |
| --- | --- |
| **시나리오 확정됨** | 관련 상호작용·입력·결과·실패·복구 조건이 확정된 제품 근거에 닿았다 |
| **시나리오 구현 완료** | screen은 앱에서 도달 가능한 실제 route나 host에서 열고, 구현된 상호작용과 내부 전이를 실제 렌더 상태(URL이 바뀌는 전이면 그 URL까지)로 눌러 봤다. API가 mock·미연결이면 그 사실을 적는다. 요청 함수 로그는 그 호출 하나만 증명한다 |
| **완료** | 요청의 실제 수용 조건(필요한 시각 결과·실 API 동작 포함)이 통과했다. 제품 사실 부재, mock-only, 미실행 검사가 하나라도 있으면 쓰지 못한다 |
| **이관 검증됨** | 대상 제품의 첫 실제 소비자와 필수 실행 검사가 채택을 증명했다. 원본 fixture와 staged 복사만으로는 아니다 |

실제 backend가 연결되지 않은 환경의 상한은 **시나리오 구현 완료**(요청 함수 도달과 내부 전이의
URL·상태까지)다. fixture·mock은 실제 backend 수용을 증명하지 못한다. `완료`·`이관 검증됨`을 쓰기 전에
원장 README의 프로젝트 사실(배포 환경·API 계약의 미확인)을 다시 확인한다. 시각 작업을 제외한 이전
시험이 새 요청의 시각 수용 조건을 없애지 않는다.

## 막혔을 때

어긋남을 실제로 만났을 때만 [references/return.md](references/return.md) 를 연다 — 어느 단계로 돌아가는지와 어느 문서가 고쳐야 하는지가 거기 있다. 만나지 않은 실패를 미리 읽지 않는다.

## 한계

- 이 루프는 의미를 증명하지 않는다. 기계가 잡는 것은 타입·lint·테스트·`contracts:check`이고,
  요구 해석·범위 관련성·단순성·공용화 판단·"없다"의 직접 확인은 3~7단계의 대조와 독립 검토가 본다.
- 계약 skill은 **이번 변경에 해당하는 절만** 읽는다. 전체를 읽는 것이 기본값이 아니다 — 위 종류별 표가 예외(화면 하나 = 역할 문서 하나)를 정한다.
- 도구가 원문을 잘라 내거나 거부를 성공 종료로 되돌릴 수 있다. 빈 출력은 부재가 아니라 미확인이다.
