# 시나리오 카드 — 회원 목록·조회·등록·수정

회원 계열 네 화면(목록 3 variant · 조회 · 등록 · 수정)이 **하나의 런타임 축을 공유한다**는 사실을 기록하고
그 축을 우리 공용 계약과 대조하는 카드다. 화면별 적용 결론은 각 이슈(#4·#5·#6·#7)가 갖는다(4절 끝).

표기: `[확인]` 저장소 안 `파일:줄`이나 스키마 원문으로 확인한 것. `[추론]` 그 사실에서 끌어낸 판단. `[미확인]` 6절. 저장소 밖 근거는 2026-09-04에 비교 가능한 운영 어드민의 결함·수정 이력이 명시한 **사용자에게 드러난 실패와 발생 조건**만 `[외부]`로 쓴다. 그 제품의 컴포넌트·훅·파일 구조·해결 코드는 증거에서 제외하고, ZERO PLUS+의 설계와 제품 정책은 Figma·Notion·우리 계약으로 다시 판정한다.

**회원 endpoint는 우리 계약에 없다.** 스냅샷 전체에 `/api/v1/member*` 경로가 0건이다(2026-09-04 `grep -o '"/api/v1/[a-z0-9/{}-]*"' openapi/admin.snapshot.json`). `watchlist`·`counsels`는 리허설 도메인이라 회원 화면의 제품 진실이 아니다([0001](../../decisions/0001-rehearsal-api-contract.md)). 이 카드는 payload·enum·권한·실패 코드를 만들지 않고 **각 상황에서 어느 계약이 그 표면을 소유하는가**만 판정한다. `[확인]`

## 1. 이 시나리오가 요구하는 것

대응 화면은 Figma `4.1.1 전체회원`·`4.1.2 일반회원`·`4.1.3 불량회원`·`4.1.4 공통(조회·등록·수정)`이며 인벤토리가 판독을 마쳤다([04-members.md](../zero-sol/04-members.md):5,23,35,77). **적용 가능**하다. `[확인]`

네 화면이 공유하는 사용자 목표는 하나다. **조건으로 회원 모집단을 좁히고, 고른 대상에 작업을 하거나, 한 명을 열어 사실을 확인·정정한다.** 목록에서 상세로 갔다 돌아오면 URL의 검색 조건을 복원하고 상세·폼에서는 입력 보존 계약을 지킨다. 행 선택은 예외로 현재 목록 route 안에서만 유효하며 route를 떠나면 해제한다. `[추론]`

화면마다 갈리는 지점은 셋뿐이다. `[확인]`

- **목록 3 variant** — 필터 그룹 집합과 컬럼만 다르다. 기간 기준·preset·검색어 대상·보기·정렬 option은 세 화면이 완전히 같다(:33). toolbar 우측 action 집합도 갈린다(전체·일반·불량은 `선택▾`+`변경`·SMS·이메일·등록, 휴면은 SMS·이메일만, 탈퇴는 action 없음: :55,:59).
- **조회** — 읽기 상세 하나가 아니라 **네 종류의 표면이 겹친다**: 읽기 dl, 자체 tab·검색·paging·삭제를 가진 자식 목록(활동정보), 확인 없이 즉시 저장되는 인라인 폼(회원상담), 이력 표(:41-44).
- **등록·수정** — 필드 집합이 다르다. 등록은 이메일·비밀번호·이름·생년월일·휴대폰, 수정은 이메일이 읽기 전용 텍스트가 되고 계정 상태·활동제한 설정이 추가된다(:81,:82).

## 2. 상태와 전이

### 2.1 요청 응답으로 오는 것과 그 밖에서 오는 것

| 사실 | 출처 |
| --- | --- |
| 목록 행·총건수, 상세 필드 값, 자식 목록, 업데이트 이력 | 요청 응답 `[추론]` — 회원 계약이 없어 스키마는 미확인 |
| 저장 성공·실패와 서버 필드 오류 | 요청 응답. 배치는 `fieldMeta.errorMap.onServer` |
| 커밋된 검색 조건·정렬·페이지·보기 / draft 필터 값 | 사용자 입력 → URL / 어디에도 커밋되지 않음 |
| **행 선택 집합** | 사용자 입력. 어떤 응답에도 없고, bulk 요청의 payload가 된다 |
| **보기·정렬의 "마지막으로 설정한 값"** | 어떤 응답에도 없다. Notion만 선언(:91). 저장 범위 미확인 |
| **마스킹 해제 값**(개인정보 전체보기) | 서버 재조회인지 클라이언트 보유인지 미확인(:19,:41) |
| **마케팅 정책 사용 여부** | **다른 화면의 서버 사실**([설정>정책>마케팅])이 이 화면의 발송 action 분기를 정한다(:95) |
| 인라인 폼의 담당자 기본값 | 세션 사실 — "로그인 계정 이름 자동 표기"(:97) |

이 계열에서 화면이 그리는 것 중 **셋은 요청 응답의 파생이 아니다**: 선택 집합, 보기/정렬 기억값, 다른 도메인의 정책 플래그. 이 셋을 서버 데이터처럼 다루면 캐시가 조용히 덮어쓴다. `[추론]`

### 2.2 상태 소유자 (AGENTS §3 표의 칸으로 지목)

| 상태 | AGENTS §3 칸 | 근거 |
| --- | --- | --- |
| 목록 행·상세·자식 목록·이력 | 서버 데이터와 캐시 → TanStack Query | [AGENTS.md](../../../AGENTS.md):94 |
| 커밋된 검색·정렬·페이지·보기 | 공유·복원할 화면 상태 → Router search | AGENTS.md:95 |
| 폼 값·dirty·검증 상태 | 폼 값과 검증 상태 → TanStack Form | AGENTS.md:96 |
| draft 필터 값, 섹션 접힘, tab 활성 | 임시 상호작용 상태 → 가장 가까운 component | AGENTS.md:97 |
| **행 선택 집합** | **표에 칸이 없다.** "임시 상호작용"으로 접기에는 bulk payload이자 갱신 후 리셋 정책의 대상이다. 다만 계약이 이미 소유자를 지목했다 | [list-workflow.md](../../../.agents/skills/feature-contract/references/list-workflow.md):33, [bulk-actions.md](../../../.agents/skills/feature-contract/references/bulk-actions.md):5 → **feature(목록 화면)** |
| **보기·정렬 기억값** | **표에 칸이 없다.** 저장 범위가 계정이면 서버 데이터(Query), 브라우저면 새 칸이다 | 미확인 3이 소유자를 정한다 |

### 2.3 전이

```text
검색 전 {} ──검색──▶ 검색 후 { 판별자, …기본값 아닌 값 } ──초기화──▶ 검색 전 {}   (Notion :90)
                        ▼
        notSearched → loading → error → empty → ready   (한 사실에서 파생)
                        │ 행 클릭(:93)
                        ▼
                  상세 = ID query ──[수정]──▶ 폼(dirty) ──확인→완료──▶ ?(목적지 미확인)
                    │                            └ 이탈 가드(dirty일 때만, 두 문장)
                    ├─ 자식 목록(활동정보 tab): 자체 검색·paging·선택삭제
                    └─ 인라인 폼(회원상담): 확인 없이 저장 → 상세 invalidate
```

목록에서 상세로 갈 때 **행 데이터를 넘기지 않는다.** 목록 행은 부분 값이고 컬럼도 화면마다 다르다(불량회원만 활동제한 컬럼: :30). 계약이 이미 그렇게 선언한다([detail-workflow.md](../../../.agents/skills/feature-contract/references/detail-workflow.md):7). `[확인]`

## 3. 관측된 실패

`[계약]`은 우리 계약이 실측해 이미 기록한 실패다. `[외부]` 행에서는 첫 열의 사용자-visible 증상과 발생 조건만 비교 입력의 결함 이력에서 가져오고, 뒤 두 열은 그 증상이 생길 수 있는 조건과 차단 규칙을 우리 계약에서 다시 도출한 `[추론]`이다.

| 무엇이 깨졌나 | 왜 | 애초에 무엇을 몰라서 |
| --- | --- | --- |
| **F1** `[계약]` 접힌 섹션 안의 필수 필드 때문에 submit이 차단되는데 **오류 문구가 렌더되지 않아 저장이 조용히 실패** | 닫힌 섹션을 unmount했다 | 두 폼 라이브러리 모두 전체 values를 검증하지만 control이 없으면 오류를 그리지 못한다는 것([0010](../../decisions/0010-form-boundaries.md):36-40) |
| **F2** `[계약]` 제출 실패한 필드에서 **벗어나기만 해도 오류가 사라졌다** | `validators: { onSubmit }`만 썼다 | non-submit 검증(blur·change)이 오류 없이 끝나면 `FieldApi.validateSync`가 `onSubmit` 오류를 지운다는 것(0010:53-56) |
| **F3** `[계약]` 저장 성공 후 폼 값이 **원래 defaults로 되돌아갔다** | `form.reset(values)`만 불렀다 | `useForm`이 매 렌더 `formApi.update(opts)`를 불러 `keepDefaultValues` 없이는 기준선이 갱신되지 않는다는 것(0010:146-147) |
| **F4** `[계약]` 저장 중 이동을 물었더니 **질문 dialog가 진행 overlay 아래 깔려 조작 불가**였다 | dirty 가드를 pending 중에도 질문으로 처리했다 | 전역 진행 overlay가 이미 "기다리라"는 메시지이고 그 아래 dialog는 조작될 수 없다는 것(0010:151) |
| **F5** `[계약]` 초기 요청이 401/403인데 **로컬 오류 화면과 incident overlay가 함께** 떴다 | 상세 상태를 `notFound\|error\|ready` 3항으로 화면마다 판정했다(같은 판정이 글자 그대로 3곳에 복제) | 세션·권한 실패는 로컬 표면을 만들지 않고 incident boundary가 소유해야 한다는 것([0011](../../decisions/0011-detail-data-and-update-history-boundaries.md):21,30) |
| **F6** `[계약]` 캐시된 상세가 있으면 background 404가 와도 **삭제된 레코드를 계속 표시**했다 | data 우선 규칙을 무조건 적용했다 | 서버가 방금 없다고 답한 사실은 캐시보다 우선이고 다른 실패는 반대라는 것(0011:32) |
| **F7** `[외부]` **목록 조회 실패가 "검색해주세요"로 위장**됐고, 다른 목록에서는 실패가 빈 결과로 보였다 | `[추론]` 요청 실패·재시도 사실이 결과 표면에 도달하지 않는 조건 | 검색 전·빈 결과·오류를 별도 사실로 전달한다 |
| **F8** `[외부]` 빈 결과 문구가 "등록된 데이터 없음"과 "검색 결과 없음"으로 갈리지 않았고, 검색 전 판정 기준을 나중에 바꿔야 했다 | `[추론]` 검색 전과 검색 후 빈 결과의 판별 조건이 분리되지 않는 조건 | 검색 전/후를 제품이 지정한 실제 필터 값 하나에서 판정한다 |
| **F9** `[외부]` 만료된 참조 ID가 옵션에서 안 잡히는 상태와 "이름 미등록"이 같은 표시로 합쳐졌고, 하위 칸이 데이터가 없다고 단정했다 | `[추론]` "찾지 못함"과 "값 없음"을 한 상태로 접는 조건 | 미해결 참조와 값 없음·하위 빈 결과를 분리한다 |
| **F10** `[외부]` **헤더 전체선택이 해제되지 않았다.** 선택 불가 행이 섞인 페이지에서 header checkbox가 계속 "전체선택"으로만 동작했다 | `[추론]` 행과 헤더가 서로 다른 선택 가능 판정을 쓰는 조건 | header 상태와 행 disabled를 하나의 선택 가능 판정에서 파생한다 |
| **F11** `[외부]` 상태가 바뀐 행의 checkbox가 잠겼고, checkbox 1회 조작이 과도한 DOM 변이를 만들었다 | `[추론]` 행 밖의 선택 가능 사실이 렌더 정체성에서 빠지거나 상위 입력이 불안정한 조건 | 행 밖 사실을 identity에 포함하고 실제 측정 없이 memo를 추가하지 않는다 |
| **F12** `[외부]` 권한으로 UI만 숨긴 뒤에도 **payload는 그대로 전송**됐고, 내비게이션 접근과 권한도 어긋났다 | `[추론]` 권한을 표시 정책으로만 다루는 조건 | 한 권한 사실에서 action·접근·payload 제외를 함께 파생한다 |
| **F13** `[외부]` 언어를 바꿔도 **이미 떠 있던 검증·서버 오류가 옛 언어로 남았다** | `[추론]` 이미 표시된 오류가 locale 변경 뒤 재계산되지 않는 조건 | locale 전환 시 client 오류를 재계산하되 서버 오류는 지우지 않는다 |

**대응 관측 없음**: 라우터 이탈 가드(비교 입력에 blocker 사용 0건), 권한 기반 마스킹 해제, 검색결과 전체 선택.
비교 입력에서 빌릴 실패 사례는 없으며, 이 제품의 전체선택은 2026-09-04 사용자 답으로 현재 페이지 한정이다. `[외부]` `[확인]`

## 4. 처음부터 알았다면 이렇게 설계한다

**(a) 검색 상태의 소유자는 URL 하나이고, 판별자도 하나다.** 커밋된 값만 URL에 있고 draft는 들어가지 않는다. **검색 전 `{}` / 검색 후 `{판별자, …}`의 union**이며 Query enablement와 `notSearched`가 **같은 한 사실**에서 파생한다(list-workflow.md:36,60). 두 번째 `searched` 플래그를 만들면 그 순간 두 값이 갈라질 자리가 생긴다. 그리고 판별자는 **제품이 지정한 실제 필터 값**이어야 한다 — "URL이 비었다"를 판별자로 쓰면 F8이 재현된다. 초기화는 기본값 복원이 아니라 `{}`로의 복귀다(:90). `[추론]`

**3 variant를 한 route에 `status` search로 얹지 않는다.** 그 값은 필터인 동시에 화면 정체성이라 초기화가 그것까지 지워야 하는지 답할 수 없고, 필터 그룹과 컬럼이 화면마다 다르다는 사실(:27,:29,:30)이 `variant` 분기로 숨는다. ADR 0009:42가 목록에서, 0010:128-130이 폼에서 이미 거부한 형태다. Figma·Notion의 별도 화면 정체성과 2026-09-04 사용자 답에 따라 전체·일반·불량은 각각 별도 route다. `[확인]`

**(b) 결과 상태는 화면이 쓰지 않고, 세 사실이 각자 표면에 닿는다.** feature는 plain facts만 만들고 `notSearched → loading → error → empty → ready` 판정은 한 곳에 있다([ListResult.tsx](../../../src/shared/ui/patterns/ListResult.tsx):27-33). **검색 전·빈 결과·오류 중 하나라도 그 표면에 도달하지 못하면 나머지로 위장된다**(F7·F8). 상세는 다른 대수라 같은 boundary를 쓰지 않고 `resolveRequiredQueryOutcome`의 우선순위를 쓴다([required-query.ts](../../../src/api/required-query.ts):22-41). **두 대수를 합치지 않는다** — F5·F6은 상세 축의 실패이고 목록에는 `not-found`·`delegated`가 없다. `[추론]`

**(c) 선택은 현재 보이는 결과 정체성에 종속되고, 선택 가능 여부의 소스는 하나다.** 헤더 전체선택은 2026-09-04 사용자 답에 따라 **현재 페이지에 보이는 선택 가능 행 전체**다. 페이지·page size·정렬·커밋된 검색 조건·목록 route가 바뀌면 선택을 지우고, draft 편집이나 같은 조건의 재검색·refetch에서는 여전히 존재하고 선택 가능한 ID만 남긴다. bulk 실패 시 재시도를 위해 유지하고 성공 후 cache consequence가 끝나면 지운다([bulk-actions.md](../../../.agents/skills/feature-contract/references/bulk-actions.md)). 그리고 **행이 선택 가능한가는 한 판정에서만 나오고**(F10), 그 판정이 행 밖 사실에 의존하면 그 사실이 렌더 identity에 들어가야 한다(F11). `[확인]` `[추론]`

**전체선택의 범위가 payload의 모양을 정한다.** "현재 페이지"면 선택은 ID 목록이지만 "검색결과 전체"면 ID를 셀 수 없어 선택이 **조건**이 되고, bulk 요청은 ID 배열이 아니라 검색 조건을 보내야 한다. 계약은 "안정 ID를 보내고 클라이언트 batching을 발명하지 않는다"고 선언했으므로(bulk-actions.md:6,7) 답이 후자면 서버 계약 자체가 달라진다. `[추론]`

**(d) 저장 오케스트레이션은 하나가 아니라 셋이고, 합치지 않는다.** `[확인]`

| 저장 | 흐름 | 이탈 계약 | 조립 |
| --- | --- | --- | --- |
| 페이지 폼(등록·수정) | 확인 alert → 저장 → 완료 alert(:81) | Router blocker, dirty일 때만, 두 문장 | `useSaveForm` |
| 상세 안 인라인 폼(회원상담) | 확인 없이 저장 후 갱신(:43) | **상세를 떠날 때의 계약이 미확인** | `useForm` + 어댑터 직접(0010:166) |
| dialog 안 폼(SMS·이메일 발송, 비밀번호 변경) | 보내기/확인 → 완료 alert(:83, notion/04-members.md:5) | **Router 이동이 아니라 닫기라 blocker가 닿지 않는다** | Dialog primitive의 feature 조립 |

셋을 한 훅의 옵션으로 흡수하면 `mode`가 생기고 그것이 곧 demotion 신호다([promotion.md](../../../.agents/skills/shared-ui-contract/references/promotion.md):40). 갈라 두는 것이 설계다. `[추론]`

**(e) 이탈 가드는 "무엇을 떠나는가"로 갈린다.** Router 이동은 blocker 하나가 두 문장을 고르고([form-workflow.md](../../../.agents/skills/feature-contract/references/form-workflow.md):40), 저장 중 이동은 묻지 않고 거부한다(F4의 해소, :46). 그러나 **dialog 닫기와 인라인 폼의 이탈은 Router 이동이 아니다.** 같은 "입력이 사라진다"는 결과인데 가드가 닿지 않는 자리이므로, blocker에 억지로 연결하지 말고 그 표면의 닫기 정책으로 푼다. `[추론]`

**(f) 오류 표면의 거처는 요청 하나가 아니라 요청의 자리가 정한다.** 배치 판정은 `resolveErrorOutcome(context, kind)` 하나다([error-outcome.ts](../../../src/api/error-outcome.ts):25-38). 이 계열의 자리는 다섯이다: 목록 결과 · 상세(DetailStateBoundary) · **자식 목록(그 절 안에서 끝나고 부모를 다시 쓰지 않는다** — [table-composition.md](../../../.agents/skills/feature-contract/references/table-composition.md):21) · 폼 필드(`onServer`) · 세션·권한(incident boundary). **여섯 번째가 이 계열에서 처음 생긴다: bulk의 부분 성공.** "20건 중 3건 실패"는 `ApiError`가 아니라 **성공 응답 안의 사실**이라 4-outcome의 대상이 아니다. 계약은 "응답이 행 단위 결과를 노출할 때만 보고한다"고 잠갔을 뿐(bulk-actions.md:9) 표면의 거처를 말하지 않는다. Notion이 확정한 것은 성공 경로의 3단계 alert뿐이다(:94). 서버 계약 전에는 표면을 만들지 않는다(미확인 3). `[추론]`

**(g) 만들지 않는 것.** ① 3 variant를 흡수하는 `variant`/`mode` 컴포넌트와 발송 dialog의 범용화(첫 consumer, promotion.md:7). ② 선택 집합을 Zustand나 shared Table에 두는 것(AGENTS.md:101, [data-table.md](../../../.agents/skills/shared-ui-contract/references/data-table.md):11). ③ 목록 행을 상세 데이터로 재사용하는 것(detail-workflow.md:7). ④ 권한을 표시에서만 적용하는 것 — 숨긴 필드는 payload에서도 빠져야 한다(F12). ⑤ 마스킹 해제를 클라이언트가 결정하는 것 — 값을 이미 받아 가리는 것과 다시 받아 오는 것은 감사 대상이 다르다(미확인 5).

### 각 이슈가 인라인할 "적용 결론"

| 이슈 | 채택할 행 |
| --- | --- |
| #4 목록 3 variant | 4(a) 판별자·별도 route, 4(b) 세 사실의 표면, 4(c) 현재 페이지 선택 수명·선택 가능 판정, 5절 `보기/정렬 기억값`·`bulk 부분 성공` 행, 미확인 3·6·9 |
| #5 회원 조회 | 4(b) 상세 대수 분리, 4(d)의 인라인 폼 행, 4(f) 자식 목록 격리, 5절 `자식 목록 실패 격리`·`인라인 폼`·`마스킹` 행, 미확인 5·8 |
| #6 회원 등록 | 4(d)의 페이지 폼 행, 4(e), 5절 `저장 오케스트레이션`·`dialog 폼` 행, 미확인 7 |
| #7 회원 수정 | #6과 같은 행 + 4(a)의 `mode` 금지 근거, 4(g)④, 5절 `조건부 필드 정리`·`권한` 행, 미확인 4 |

## 5. 우리 공용 계약과의 대조

판정 넷. **커버됨** = 기존 계약이 그대로 닿는다. **수정 필요** = 계약 문장 하나를 넓히면 닿는다. **아예 없음** = 공용 계약에 자리가 없다. **feature 소유** = 계약이 이미 이 결정을 feature에 넘겼으므로 공용 결손이 아니다. 마지막 판정은 결손을 지우는 것이 아니라 **소유자를 지목**한다.

| 이 시나리오가 요구하는 것 | 현재 공용 계약 | 근거 | 판정 |
| --- | --- | --- | --- |
| 검색 전/후 판별과 Query gate | 판별자 union이 선언돼 있고 `notSearched`와 enablement가 한 사실에서 나온다 | list-workflow.md:36,60 | 커버됨 — F8이 여기서 닫힌다 |
| 필터 행 조립(기간·검색어·다중선택 그룹) | `PeriodFilterField`·`KeywordFilterField`의 slot 조립, `CheckboxTree` + `emptyMeansAll` | [filter-fields.md](../../../.agents/skills/shared-ui-contract/references/filter-fields.md):11,12, [checkbox-group.md](../../../.agents/skills/shared-ui-contract/references/checkbox-group.md):22,24 | 커버됨 |
| 검색 전·빈 결과·오류가 서로를 위장하지 않기 | `ListResult`가 다섯 상태 판정과 공용 error/retry/trace를 한 곳에서 소유 | ListResult.tsx:27-33, [list-result.md](../../../.agents/skills/shared-ui-contract/references/list-result.md):5 | 커버됨 — F7이 여기서 닫힌다 |
| 상세 상태 판정과 결함 입력 4종 | `resolveRequiredQueryOutcome` 우선순위 + `DetailStateBoundary` | required-query.ts:22-41, detail-workflow.md:15 | 커버됨 — F5·F6이 여기서 닫힌다 |
| 자식 목록 실패가 부모를 덮지 않기 | kind B/C의 pending·error·retry는 그 절 안에 있고 자식 not-found는 부모의 notFound가 아니다 | table-composition.md:21 | 커버됨 |
| 저장 오케스트레이션(확인→완료 + 서버 필드 오류 + 이탈 가드) | `useSaveForm` 한 훅이 다섯 책임을 순서 결합으로 소유하고, `onServer`는 다음 submit 시작 시 전부 지운다 | form-workflow.md:12,36, 0010:158 | 커버됨 — F1~F4가 여기서 닫힌다 |
| 조건부 필드(수정의 활동제한) 값 정리 | 조건이 꺼질 때 feature가 명시적으로 정리하고 mapper whitelist는 dirty·검증을 지키지 못한다 | form-workflow.md:14, 0010:62-64 | 커버됨 |
| 업데이트 이력 3열 표 | `UpdateHistory`(provisional, 인벤토리 5화면·코드 consumer 1) | [page-and-detail-surfaces.md](../../../.agents/skills/shared-ui-contract/references/page-and-detail-surfaces.md):10, 0011:64 | 커버됨 — 회원 조회가 두 번째 consumer면 confirm/demote 대상(0011:96) |
| 상세 안 인라인 폼(회원상담) | 섹션 하나가 자기 폼이고 성공 시 상세를 invalidate한다고 이미 선언 | detail-workflow.md:11 | 커버됨 |
| locale 전환 시 이미 뜬 폼 오류 | 어댑터가 `fieldMeta.errors`를 그대로 읽고 `onServer`는 다음 submit까지 남는다. **오류 문자열의 locale 재계산을 다룬 문장이 없다** | [form-fields.md](../../../.agents/skills/shared-ui-contract/references/form-fields.md):7,10, form-workflow.md:36 | **수정 필요** — F13이 닿는 자리 |
| dialog 안 폼(SMS·이메일 발송) | Dialog primitive의 feature 조립. 제목 바 close 옵션이 "첫 dialog를 만들 때" 열기로 예약돼 있다 | [dialogs.md](../../../.agents/skills/shared-ui-contract/references/dialogs.md):7,10 | 수정 필요 — 예약된 `close`가 이 화면에서 처음 필요해진다 |
| **dialog·인라인 폼의 dirty 이탈** | `useUnsavedChangesGuard`는 **Router 이동만** 막는다. dialog 닫기와 상세 이탈은 blocker를 지나지 않는다 | form-workflow.md:30,40, [UnsavedChangesGuard.tsx](../../../src/shared/ui/form/UnsavedChangesGuard.tsx) | **아예 없음** |
| 행 선택과 전체선택 | 선택 소유자가 "목록 화면 또는 feature-local table adapter"로 이미 선언됐고 `DataTable`은 선택을 소유하지 않는다 | list-workflow.md:33, bulk-actions.md:5, data-table.md:11 | feature 소유 |
| **선택의 수명**(검색·정렬·페이지 전환 시 유지/폐기) | 현재 페이지의 선택 가능 행만 전체선택하고 결과 정체성 변경·bulk 성공 때 해제하며 같은 조건 refetch·bulk 실패 때 유효 ID를 유지한다 | [bulk-actions.md](../../../.agents/skills/feature-contract/references/bulk-actions.md) | 커버됨 — 2026-09-04 사용자 답 |
| bulk 실행 3단계 alert(미선택 오류→확인→완료) | Confirm·Alert primitive와 상호작용 선택 규칙은 있다. 인벤토리 15+ 화면 반복은 후보로만 기록됐다 | [mutation-actions.md](../../../.agents/skills/feature-contract/references/mutation-actions.md):11,12, [zero-sol-figma-analysis.md](../zero-sol-figma-analysis.md):52 | feature 소유 — 승격은 첫 코드 consumer 이후(promotion.md:16) |
| **bulk 부분 성공의 표면** | "응답이 행 단위 결과를 노출할 때만 보고한다"만 있고 거처는 없다. 4-outcome은 `ApiError` 축이라 성공 응답 안의 실패를 다루지 않는다 | bulk-actions.md:9, error-outcome.ts:25-38 | **아예 없음** (서버 계약 확정 전) |
| bulk·다운로드 실행 중 진행 표면 | 버튼 pending만으로 시작하고 overlay 여부는 미확인이라고 이미 선언 | [blocking-progress.md](../../../.agents/skills/shared-ui-contract/references/blocking-progress.md):8 | 커버됨(미확인으로 잠금) |
| 마스킹된 값의 렌더 | `DetailField`가 마스킹을 명시적으로 feature에 뒀고 컬럼 포맷도 feature다 | page-and-detail-surfaces.md:8, table-composition.md:26 | feature 소유 — 남은 것은 표시가 아니라 **해제 권한**(미확인 5) |
| **보기·정렬의 "마지막으로 설정한 값"** | `standardPageSizeOptions`는 값만 주고 **기본값을 선언하지 않는다.** 기억의 소유자·범위를 정한 문장이 없다 | shared-values.md:29, zero-sol-figma-analysis.md:62 | **아예 없음** |
| 중복 키워드 거부 | `useKeywordDraft`가 중복 정책을 caller에 남기고 **제품 규칙을 미확인으로 표기**했다 | shared-values.md:25, 04-members.md:92 | feature 소유 — 동일성 정의는 미확인 6 |
| **권한에 따른 action 노출과 payload 제외** | 진입 가드 절차는 있으나 **권한 사실의 소유자가 없다.** `navigation.ts`는 계약 미확인 자리표시자다 | [router.md](../../../.agents/skills/feature-contract/references/router.md):33, [navigation.ts](../../../src/app/config/navigation.ts):1-3 | **아예 없음** |
| shared/feature 경계 | shared는 feature·Router·Query·DTO·permission을 모르고 ESLint가 강제한다 | AGENTS.md:90, 0009:60 | 커버됨 |

요약: **공용 결손은 네 자리다.** ① dialog·인라인 폼의 dirty 이탈 계약, ② bulk 부분 성공의 표면, ③ 보기·정렬 기억값의 소유자, ④ 권한 사실의 소유자. ①만 순수 UI 결정이고 나머지 셋은 **제품 답 또는 서버 계약이 소유자를 정한다**(6절). 선택 수명은 2026-09-04 제품 답을 feature 계약 기본값으로 기록해 닫혔다. `[추론]`

나머지는 결손이 아니다. 필터·결과·상세·폼·이력 표면은 이미 닿아 있고, 선택·bulk alert·마스킹 렌더·중복 키워드 정책 넷은 계약이 이미 feature에 넘긴 결정이다. 이 넷을 공용 결손으로 세면 첫 회원 화면 하나로 공용 유형을 만드는 것이 되어 promotion.md:7의 "1회 사용은 feature-local"을 정면으로 어긴다. `[추론]`

## 6. 미확인

1. **목록 3 variant가 route인가 search인가.** 답(2026-09-04): Figma·Notion의 별도 화면 정체성대로 전체·일반·불량은
   각각 별도 route다. 공용화하는 것은 list mechanic이며 한 route의 `variant`/`mode`로 합치지 않는다.
2. **전체선택의 범위가 현재 페이지인가 검색결과 전체인가.** 답(2026-09-04): 헤더 checkbox는 현재 페이지에 보이는
   선택 가능 행 전체만 선택한다. 페이지·page size·정렬·커밋된 검색 조건·목록 route 변경 시 해제하고, 같은 조건 재검색·refetch는
   남아 있는 선택 가능 ID만 유지한다. bulk 실패 시 유지하고 성공 후 cache consequence가 끝나면 해제한다.
3. **일괄 변경의 부분 성공을 서버가 행 단위로 답하는가, 그리고 보기·정렬 기억값을 어디에 저장하는가.** 전자: 20건 중
   3건 실패의 응답 형태. "전부 아니면 전무"면 4(f)의 여섯 번째 자리가 사라지고, 행 단위면 완료 alert가 **선택 개수가
   아니라 처리 개수**를 말해야 한다. 후자: 저장 범위(화면/계정/브라우저)와 URL 공유 시 우선권 — 계정이면 서버 데이터,
   브라우저면 상태 소유권 표의 새 칸이다(zero-sol-figma-analysis.md:62).
4. **권한 식별자와 그 사실의 소유자.** 발생: `변경`·SMS·이메일·`탈퇴`·`개인정보 전체보기` 노출 판정. 기대: 권한 코드의
   형태와 그것을 어디서 읽는가. 지금은 서버 메뉴/권한 계약이 없어 `navigation.ts`가 로컬 자리표시자다(:1-3). 답
   전에는 action을 권한으로 감추지 않는다. 답이 오면 4(g)④에 따라 payload 제외까지 같은 사실에서 나와야 한다.
5. **마스킹의 소유자와 해제 절차.** 발생: 목록 이메일·휴대폰 셀, 상세 `개인정보 전체보기`. 기대: 서버가 마스킹한 값을
   주는지, 해제 시 재조회인지, 그 행위가 감사 대상인지. 값을 이미 받아 가리는 것과 다시 받는 것은 노출 위험이 다르다
   (04-members.md:19,41, zero-sol-figma-analysis.md:107, 0011:85).
6. **중복 키워드의 동일성 정의.** 대상 select를 포함하는지, 대소문자·공백을 무시하는지(:92,
   zero-sol-figma-analysis.md:65). 답에 따라 `addPending`의 거부 조건이 정해진다.
7. **저장 성공·취소의 목적지.** 등록·수정 완료 alert 이후 목록인지 상세인지 확인되지 않았다(0010:180).
8. **편집 중 상세 refetch와 폼 값의 충돌 정책, 그리고 인라인 폼 이탈.** 수정 화면이 재조회하면 입력 중 값을 덮을지가
   미확정이고(0010:186), 인라인 폼은 Router 이동이지만 `useSaveForm`을 쓰지 않아 가드가 배선돼 있지 않다. 둘 다
   "사용자가 이미 지불한 입력을 무엇이 이길 수 있는가"라는 한 질문이다.
9. **별도 목록 route 사이에서 검색 조건을 넘기는가.** 발생: 전체회원에서 조건을 검색한 뒤 일반회원·불량회원 LNB로 이동.
   기대: 공통 필터를 넘길지 각 route의 검색 전 상태로 진입할지. 답에 따라 LNB link search, route별 schema 초기값과
   page reset이 갈린다. 선택은 답과 무관하게 route 변경 시 해제한다.
