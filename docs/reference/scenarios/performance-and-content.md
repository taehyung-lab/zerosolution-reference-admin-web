# 시나리오 카드 — 공연 목록과 콘텐츠 편집

읽기 전용 공연 목록과 변경 가능한 콘텐츠 목록, 섹션 단위 편집·반복 행·언어·파일 표면을 한 계열로
대조한다. 화면별 적용 결론은 #8·#9·#24·#25·#26·#27이 갖는다.

표기: `[확인]`은 2026-09-04 Figma 전수 판독과 정정된 인벤토리, `[추론]`은 그 사실에서 나온 설계,
`[미확인]`은 6절이다. 저장은 입력과 확인이 끝나 호출할 수 있는 지점까지만 다룬다.

## 1. 이 시나리오가 요구하는 것

콘텐츠와 공연목록은 같은 검색 골격을 쓰지만 콘텐츠만 checkbox와 `사용 상태 > 사용 / 사용안함` 변경을
가지며, 공연목록은 checkbox·우측 action 없이 `No.` 역순을 표시한다([05-performances.md](../zero-sol/05-performances.md):9-25). `[확인]`

공연 수정의 `입장안내정보`만 파일 업로드와 게이트·구역/등급 반복 행을 편집하고 섹션 안에서 저장·취소한다.
기본정보에는 한국어·일본어·영어 tab이 있다(:31-33). 콘텐츠 수정에는 회차, 대표 썸네일, 관람 등급
`전체관람가`·`만12세 이상`, 공개/미공개와 이미지·영상 미리보기 팝업이 관찰됐다(:31). `[확인]`

## 2. 상태와 전이

공연목록은 2026-09-06 사용자 확인으로 진입 즉시 조회한다. 기간 기준은 Notion의 공연일·등록일·최근업데이트일이다. 공연장은 한 개만 draft로 선택하고 삭제 후 재선택한다. 검색 시 URL에 commit하고 page를 초기화한다. 초기화는 Notion대로 조건을 비우고 검색 전 상태로 돌아간다(`searched: false`, 다시 검색하면 제거). 콘텐츠의 진입 정책은 이 답으로 확정하지 않는다.

2026-09-07 검색 계약 확장: 공연도 공용 closed-range 정규화와 sparse URL → 화면 1회 기본값 해소를 채택한다. `searched: false`는 초기화 상태만 나타내며 실제 검색 입력·Query 키에는 넣지 않는다. 한쪽 날짜 입력은 draft에서 허용하고 제출·직접 URL에서는 양쪽을 제거한다. 실행 규칙은 [list-search-contract](../../../.agents/skills/feature-contract/references/list.md#url)가 소유한다.

`PerformanceListScreen`은 이 전이를 reference query source와 검증한다. 2026-09-08 목록 행 → ID 상세 이동과 history back의 검색 조건 복원을 통합 테스트로 확인했다. 상세의 입력전/후·읽기 언어 탭·기본정보·이력은 임시 단건 Query로 구현됐고 실 API·공연장 원격 조회·5.2 입장안내정보 편집 폼(입력전 → 수정 → 저장)은 미구현이다. 원장은 이 admin에 공연 자체를 등록하는 화면을 적지 않는다(원장 재판독 기준, 2026-09-13; "공연은 DTsol에 등록된 값을 읽는다"는 원문 미관찰의 추론이다). fixture 결과는 제품 데이터나 서버 계약의 증거가 아니다. 상세 재관찰·sentinel 해소 조건은 [5.2 상세 경계](../zero-sol/05-performances.md#52-상세-재관찰구현-경계-2026-09-08)가 소유한다.

| 상태 | 소유자 |
| --- | --- |
| 목록 결과·상세 facts | Query |
| 검색·정렬·page | route search |
| 콘텐츠 행 선택·변경 intent | 콘텐츠 목록 feature |
| 입장안내 반복 행·파일·dirty·검증 | 섹션의 TanStack Form |
| 언어 tab·미리보기 open | 가장 가까운 화면 component |

```text
콘텐츠 행 선택 → 사용 상태 선택 → 미선택/필수 입력 검사 → 변경 호출 직전
공연목록 행 활성화 → 해당 ID 상세 → 브라우저 뒤로 가기로 검색 목록 복원
입장안내 편집 → 파일·반복 행 변경 → 검증 → 저장 확인 → 호출 직전
독립 수정 화면의 취소 → dirty일 때 확인 → 이동 또는 유지
상세 안 local 편집 종료·팝업 닫기 → 추가 dirty 취소 경고 없이 기존 동작
미리보기 열기 → 현재 화면이 가진 이미지·영상 표시 → 닫기
```

## 3. 추론한 실패 위험

| 무엇이 깨질 수 있나 | 왜 | 차단 규칙 |
| --- | --- | --- |
| `[추론]` 공연목록에 checkbox·변경 action이 생김 | 두 목록을 외형만 보고 한 variant로 합침 | selection/action 부재를 화면 계약에 명시한다 |
| `[추론]` 다른 읽기 섹션 값까지 저장 입력에 섞임 | 페이지 전체를 하나의 mapper로 취급 | 입장안내 섹션이 자기 필드와 mapper만 소유한다 |
| `[추론]` 반복 행 삭제 뒤 오류가 다른 행으로 이동 | 배열 index를 정체성으로 사용 | form row에 insert/remove를 견디는 render key를 둔다 |
| `[추론]` 언어 tab 전환으로 dirty 입력이 사라짐 | tab panel 수명을 primitive가 임의 결정 | panel 보존은 feature가 정하고 tab은 controlled value만 받는다 |

## 4. 처음부터 알았다면 이렇게 설계한다

콘텐츠·공연목록은 공통 list mechanic을 각각 조립한다. `No.` 역순, checkbox 부재, cascade 값과 권한은
feature가 소유하며 하나의 `mode`로 숨기지 않는다. `[추론]`

입장안내정보는 form-owned editable rows(kind D)다. `SectionCard(collapsible)` 안에서 파일과 반복 행의
values·dirty·per-row error를 한 폼이 소유하고, caller가 row schema·추가/삭제 정책을 정한다
([list.md](../../../.agents/skills/feature-contract/references/list.md#collections-elsewhere):14,27-30). 저장은
섹션 입력 검증과 확인 뒤 호출 직전에서 끝난다. `[확인]`

언어 tab은 source-owned controlled `Tabs` 후보를 쓸 수 있지만 값의 소유자와 panel 수명은 이 화면에
남는다. 미리보기는 dialog 표면이고 파일 제약은 확인된 확장자·용량만 쓴다. `[추론]`

## 5. 우리 공용 계약과의 대조

| 요구 | 현재 계약 | 판정 |
| --- | --- | --- |
| 기간 입력 | `PeriodField` 구현, preset/default는 caller 소유 | 채택 — [catalog.md](../../../.agents/skills/shared-ui-contract/references/catalog.md#filter):11,19 |
| 다중선택 필터 | `CheckboxTree(emptyMeansAll)` 구현 | 채택 — [list.md](../../../.agents/skills/feature-contract/references/list.md#filter) |
| 섹션 disclosure | `SectionCard(collapsible)` 구현 | 채택 — form.md:19,28 |
| 취소와 dirty 이탈 | 독립 등록·수정 화면에만 dirty 취소 확인; 상세 inline/dialog local 닫기는 제외 | 2026-09-07 시나리오 채택 — [form-workflow](../../../.agents/skills/feature-contract/references/form.md#cancel-and-dirty-leave). 해당 공연 편집 surface의 실제 조립·검증은 미완료 |
| 반복 행·파일 workflow | kind D와 file boundary가 feature 소유 | 커버됨 — list.md:14, file-workflow.md:3-13 |
| 언어 tab | 다섯 shared 후보 중 `Tabs` | 후보 유지 — [primitives-and-tokens.md](../../../.agents/skills/shared-ui-contract/references/primitives-and-tokens.md):21 |
| 미리보기 없음의 `-` | 다섯 shared 후보 중 빈 값 표현 | 후보 유지 — primitives-and-tokens.md:25 |

## 6. 미확인

1. 실제 mutation 계약과 반복 행 최대 개수. 원문은 입장안내 섹션 입력과 최소 1개 게이트를 명시한다.
2. 업로드 지원확장자 원문과 파일 크기 상한.
3. 구역↔등급 전환 시 입력 보존/초기화와 등록 범위의 사용자 확인. 현재 기본정보 언어 tab은 읽기 전용 로컬 표시이며 입력 보존을 판정하지 않는다.
4. 콘텐츠 `등록전`/`등록후` 상태의 의미와 미리보기 대상.
