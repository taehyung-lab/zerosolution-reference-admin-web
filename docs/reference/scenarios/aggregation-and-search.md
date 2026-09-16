# 시나리오 카드 — 통계 집계와 통합검색

통계의 interval·회차 선택·전치 표와 통합검색의 다섯 독립 결과 축을 대조한다. 화면별 적용 결론은
#34·#39·#40·#41이 갖는다.

표기: `[확인]`은 2026-09-04 Figma 전수 판독과 정정된 인벤토리, `[추론]`은 그 사실에서 나온 설계,
`[미확인]`은 6절이다. 검색·다운로드는 호출 입력이 확정되는 지점까지만 다룬다.

## 1. 이 시나리오가 요구하는 것

통계 interval은 시간·일·주·월·연도 5종이다. 회원 통계의 기간 기본값은 1개월 전이고, 발권·출입·APP
콘텐츠는 공연 lookup 뒤 `회차` select와 `추가`를 둔다. 회차 option에는 숫자 회차뿐 아니라
`사운드체크`·`팬이벤트부스` 같은 이름 있는 세션도 있다([10-statistics.md](../zero-sol/10-statistics.md):7-18). `[확인]`

집계 결과는 차트와 행=지표·열=시간의 전치 표이며 섹션별 다운로드가 있다(:11,14). 통합검색은 회원·공연·
발권·입장·커뮤니티 5개 top-level frame이 각각 결과 수·보기·정렬·table·paging을 갖고, 일치 문자열을
하이라이트한다([12-search.md](../zero-sol/12-search.md):7-11). 다섯 frame이 tab인지 별도 화면인지는 미확인이다. `[확인]`

## 2. 상태와 전이

| 상태 | 소유자 |
| --- | --- |
| 기간 draft와 채택 preset | 통계/통합검색 feature |
| interval | 결과 축을 소유한 통계 feature |
| 공연 lookup·회차 candidate·추가된 회차 집합 | 해당 통계 화면 local state |
| 집계 facts | Query 결과의 feature projection |
| 통합검색 공통 keyword | route search |
| 종류별 sort·page·보기와 결과 facts | 각 결과 surface |

```text
통계 기간 또는 공연 lookup 확정 → 회차 option 선택 → 추가 → 선택 집합 갱신
  └ 필수 입력 검증 → 집계 호출 직전
interval 변경 → 같은 집계 facts의 요청 입력 확정 → 호출 직전
섹션 다운로드 → 그 섹션·현재 조건 확정 → 호출 직전
통합검색 keyword commit → 다섯 결과 축의 검색 입력 확정 → 호출 직전
결과 종류 전환 → 그 종류의 sort·page·보기 상태 표시
```

## 3. 추론한 실패 위험

| 무엇이 깨질 수 있나 | 왜 | 차단 규칙 |
| --- | --- | --- |
| `[추론]` 이름 있는 세션을 숫자 회차 parser가 거부 | 회차 label을 `{n}회차`로만 모델링 | option은 opaque ID와 서버 label을 보존한다 |
| `[추론]` `추가`가 있는데 단일 select로 덮어씀 | cardinality를 화면 없이 추정 | 확정 전에는 다중 가능성으로 질문을 남기고 request를 만들지 않는다 |
| `[추론]` 종류 전환 때 다른 결과의 sort·page가 섞임 | 다섯 결과를 하나의 table state로 공유 | 결과 종류별 상태 정체성을 분리한다 |
| `[추론]` 목록 기본값 `전체`를 통계에도 적용 | `PeriodField`가 default를 고른다고 가정 | caller가 화면별 preset과 기본값을 준다 |

## 4. 처음부터 알았다면 이렇게 설계한다

`PeriodField`는 채택하되 통계는 1개월 전, 로그는 7일 전, 일반 목록은 전체라는 각 화면의 default를
feature가 소유한다. interval도 feature enum이며 shared chart/table mode로 만들지 않는다. `[확인]`

공연·회차 선택은 lookup과 local candidate/commit으로 조립한다. `추가` 후 다중인지 확정되기 전에는
선택 집합이나 payload 모양을 고정하지 않는다. 이름 있는 세션은 label을 해석하지 않고 표시한다. `[추론]`

통합검색은 다섯 결과 surface가 독립 sort·page·보기 값을 소유한다. 실제 tab이면 controlled `Tabs` 후보를
채택할 수 있지만 URL/local 소유와 panel 수명은 feature가 정한다. 각 결과가 동시에 조회되는지도 계약 전
가정하지 않는다. 하이라이트는 feature column renderer가 맡는다. `[추론]`

## 5. 우리 공용 계약과의 대조

| 요구 | 현재 계약 | 판정 |
| --- | --- | --- |
| 화면별 기간 기본값 | `PeriodField`, preset/default는 caller 소유 | 채택 — [catalog.md](../../../.agents/skills/shared-ui-contract/references/catalog.md#filter):11,19 |
| 집계 summary/section | `ResultSummary.groups`는 문장형 summary만 소유 | 필요 없음 — chart·전치 표는 feature-local |
| lookup·회차 candidate | kind E local draft/commit/candidate | 커버됨 — [collection.md](../../../.agents/skills/feature-contract/references/collection.md):15,19 |
| 결과 종류 tab | 다섯 shared 후보 중 `Tabs` | 후보 유지 — [primitives-and-tokens.md](../../../.agents/skills/shared-ui-contract/references/primitives-and-tokens.md):21 |
| 결과별 table·paging | list mechanic은 Router/Query를 읽지 않는 shared surface를 조립 | 커버됨 — [list.md](../../../.agents/skills/feature-contract/references/list.md#result) |
| 빈 집계 값 `-` | 다섯 shared 후보 중 빈 값 표현 | 후보 유지 — primitives-and-tokens.md:25 |

## 6. 미확인

1. `회차`의 `추가`가 실제 다중 선택인지, 최대 개수와 제거·중복 정책 및 request 모양.
2. interval별 기간 상한과 변경 시 재조회인지 client 재집계인지.
3. 통계 섹션별 다운로드 형식·권한·입력 범위.
4. 통합검색 5종이 tab인지 별도 화면인지, 종류별 count를 동시에 조회하는지.
5. 통합검색 각 결과의 정확한 sort option과 결과 간 상태 보존 규칙.
