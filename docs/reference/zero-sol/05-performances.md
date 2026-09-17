# 5. 공연

> **이 문서는 5.2 공연 조회·수정에 대해 대체됐다.** 그 surface 의 관찰·정책·미확인은
> [`product/facts/PERF-DETAIL.md`](../../../product/facts/PERF-DETAIL.md) 와
> [`product/facts/PERF-EDIT-ADMISSION.md`](../../../product/facts/PERF-EDIT-ADMISSION.md) 가 소유한다.
> 아래 5.2 서술은 이관 원본이며 근거로 쓰지 않는다.

표 형식은 [README.md](README.md). Notion 열의 `(대기)`는 아래 **Notion 요점**과 `notion/` 원문으로 대체한다.

## 5.1 콘텐츠 · 5.2 공연목록 — 리스트

| id | 종류 | 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `performance-content.entry` | 서술 | 5.1 (`129:21882`) | 검색 전 상태 | 검색전 frame 없음(`5.1.1 콘텐츠 리스트` 단일). 2026-09-17 원본 해상도 재판독: 기간 기준 닫힌 값 `공연일`·preset `전체`, 보기 `100`, 정렬 `등록일` | 「공연 리스트를 조회할 수 있다.」 절이므로 [README 진입 판독 규칙](README.md#현재-제품의-공통-정책)이 **진입 즉시 조회**로 읽는다. 「초기화 → 검색 조건을 default로 설정값을 변경 및 검색 전 상태로 변경」은 2026-09-15 확정대로 최초 진입 계약의 재적용이다 | 실제 API 계약 | `PerformanceContentListScreen` · `content-list-search.ts` |
| `performance-content.period` | 열거 | 5.1 | 기간 | 기준 공연일·등록일·최근업데이트일. preset·range는 회원과 동일. 2026-09-17 재판독: preset 전체·1년 전·6개월 전·3개월 전·1개월 전·7일 전·어제·오늘 | 「검색 영역 → 기간 : 공연일, 등록일, 최근업데이트일」 | — | `PeriodField` + `ContentListFilters` |
| `performance-content.keyword` | 열거 | 5.1 | 검색어 | 대상 공연명·출연자·주최/기획 + 추가 chip("공연명 : 팬미팅") | 「검색 영역 → 검색어 : 공연명, 출연자, 주최/기획」·「다중 키워드 검색 허용」 | — | `KeywordChipField` + `ContentListFilters` |
| `performance-content.filters` | 열거 | 5.1 (`129:21800` Case) | 다중선택 | 구분(전체·일일권·기간권), 공연유형(전체·콘서트·뮤지컬·전시·…), 사용상태(전체·사용·사용안함). 2026-09-17 재판독: 공연유형 7개(콘서트·뮤지컬·전시·페스티벌·연극·스포츠·멤버십), **예매처 없음**(5.2 와 다름) | 「구분 → default : 전체」·「공연유형 → default : 전체」·「사용상태 → default : 전체」 | API 식별자 | `ContentListFilters` + `CheckboxTree(emptyMeansAll)` |
| `performance-content.venue-lookup` | 서술 | 5.1 | **lookup 필터** | 공연장: 검색 input(placeholder "공연장 검색", 🔍) + 하단 결과 행("올림픽공원/티켓링크아레나홀") — 비동기 검색 후 선택 | 「공연장 검색 → 키워드 검색 → 택1」·「삭제 후 재선택 가능」·키워드는 사용 상태가 사용인 공연장명 | 검색 API·사용상태 식별자. 다중 선택 가능 여부, 선택 표시 형태(원문 미기재) | `InlineSearchSelect`, fixture 입력만 |
| `performance-content.view-sort` | 열거 | 5.1 | toolbar 좌 | 보기(100…1000) + 정렬(등록일·최근업데이트일·공연기간·구분·공연유형·공연명·출연자·주최/기획·사용 상태). 2026-09-17 재판독: 닫힌 기본값은 보기 `100`·정렬 `등록일` | 「보기 → default : 100 or 마지막으로 설정한 값」·「정렬 → default : 등록일 or 마지막으로 설정한 값」 — `or` 는 [판정 질문 1](../zero-sol-figma-analysis.md) 2026-09-09 확정대로 URL 값 우선·없으면 상수, 방문 간 기억 없음 | — | `content-list-search.ts`, `contentSortKeys` |
| `content-bulk.control` | 열거 | 5.1 (`129:21800` Case) | toolbar 우 | `선택▾` + `변경`만. cascade는 `사용 상태 > 사용 / 사용안함`. **등록 없음**(2026-09-17 `129:21882` 원본 해상도 재확인 — 우측에 다른 action 없음) | 「일괄변경 → 변경 버튼 클릭」 3단계: Case01 미선택 오류 「변경할 항목을 선택해주세요. / 확인」 → Case02 「선택 항목을 변경하시겠습니까? / 확인, 취소」 → 「변경되었습니다. / 확인」 → 「확인 : alert 닫히고, 변경 상태로 화면 갱신됨」. 취소는 현상태 유지 | 콘텐츠 등록 진입 위치. 변경 API 계약과 성공 이후 계약 | `ContentListActions` + `useContentListActions`; 호출은 `scenarioRequest('콘텐츠 사용상태 일괄변경')` 까지 |
| `performance-content.result-summary` | 열거 | 5.1 (`129:21882`) | 결과 요약 | `검색결과 : 1,000`(2026-09-17 원본 해상도 신규 관찰 — 이전 판독에 이 행이 없었다) | 빈 결과: 「일치하는 검색결과가 없습니다.」 | — | `ResultTotal` + `shared:list.total` |
| `performance-content.table` | 열거 | 5.1 (`129:21882`) | table | checkbox. 구분·공연유형·공연명·총회차·출연자(콤마 결합, 말줄임)·주최/기획·공연기간·사용 상태·미리보기(link 셀, 없으면 `-`)·등록일/최근업데이트일(2줄 셀, 정렬 아이콘). 2026-09-17 원본 해상도 재판독으로 열 이름·`-` 셀·2줄 값(`YYYY-MM-DD HH:MM:SS / …`)을 확인했다 | 「DTsol에 등록된 공연 중 [티켓 유형 : 카드 - NTAG]로 등록된 공연 리스트만 제공된다.」·「특정 행 클릭시, 콘텐츠 조회 화면으로 이동」·「미리보기 버튼 → 콘텐츠가 등록된 경우 버튼 제공」 | 미리보기 팝업 대상. 2줄 셀의 정렬 아이콘이 등록일·최근업데이트일 중 어느 키인지. NTAG 필터의 서버 식별자 | `content-list-columns.tsx` + `DataTable`; 방향 기본 `desc`(2026-09-11). 5.1 은 2줄 셀 헤더가 활성 날짜 키를 따라가 첫 렌더 `aria-sort=descending` 을 붙인다(2026-09-17 브라우저 실측). **미구현**: 5.2 에서는 인벤토리의 등록일 컬럼이 `performance-columns.tsx` `fields`(ticketKind…updatedAt)에 없어 기본 sortType `registeredAt` 의 첫 렌더 `aria-sort` 를 붙일 헤더가 없다(2026-09-11 실측) |
| `content-preview.dialog` | 열거 | 5.1 (`129:21393`) | 팝업 : 미리보기 | 2026-09-17 원본 해상도 판독: 제목 `미리보기` + 닫기 ⓧ / 회차 select(`1회차`) + 언어 select(`한국어`) / 타이틀(굵은 자리표시자) / `IMAGE AREA` + 이미지 타이틀 / `VIDEO THUMBNAIL AREA`(▶) + 영상 타이틀. 402×874, 스크롤 | 「미리보기 버튼 → 클릭시, 미리보기 팝업 활성화」·「회차 셀렉박스 → [입력방식 : 회차별 개별 등록]인 경우 제공 / [전체 회차 일괄 등록]인 경우 제공 안함」·「언어 셀렉박스 → 선택시, 해당 언어의 콘텐츠 조회 가능」 | 실제 미리보기 대상(이미지·영상 파일)과 그 계약 | `ContentPreviewDialog`; 내용은 예시 값 |
| `performance-content.detail-entry` | ref | 5.1 | 상세·수정 (→ `content-edit` surface 소유) | `콘텐츠 조회 : default(등록전)`/`등록후`, `콘텐츠 수정 : default/등록후` + Case (미판독). 2026-09-17 `5.1.2.1. 등록후` 를 50% 축소로만 훑었고 구성은 판독하지 않았다 | 「특정 행 클릭시, 콘텐츠 조회 화면으로 이동」 | 등록전/후 상태 의미 | 없음 — 목록의 행 활성화는 목적지가 생길 때 잇는다 |
| `performance-list.entry` | 서술 | 5.2 | 검색 전 상태 | 검색전 frame 없음 | 진입 즉시 조회(2026-09-06 사용자 확정). 초기화는 Notion대로 검색 전 상태 | 실제 API 계약 | `PerformanceListScreen` reference source |
| `performance-list.period` | 열거 | 5.2 | 기간 | 기준 공연일·최근업데이트일 | **공연일·등록일·최근업데이트일 채택**(2026-09-06 사용자: Notion 기준). 초기 선택 공연일·preset 전체(2026-09-07 Aside에서 5.2.1 원본 재관찰) | — | `PeriodFilterField` + feature options |
| `performance-list.venue-lookup` | 서술 | 5.2 | 공연장 lookup | 검색 input + 결과 행 | **택1, 삭제 후 재선택**, 사용 중인 공연장명 검색(원문 및 사용자 확인) | 검색 API·사용상태 식별자 | `InlineSearchSelect` + feature 옵션·라벨, fixture 입력만 |
| `performance-list.filters` | 열거 | 5.2 (`43656:5808` Case) | 검색어·다중선택 | 5.1과 동일 대상. 구분·공연유형·공연장 lookup + **예매처**(원본 전체 집합은 Notion 열 참조) | 공연유형 7개·예매처 6개 + 전체. [원문 선택지](notion/05-performances.md) | API 식별자 | `PerformanceListFilters` |
| `performance-list.result-summary` | 열거 | 5.2 (`43656:2077`) | 결과 요약 | `검색결과 : 1,000` | 빈 결과: `일치하는 검색결과가 없습니다.` | — | `PerformanceListResult` + `shared:list.total` |
| `performance-list.view-sort` | 열거 | 5.2 | toolbar 좌 보기·정렬 | 컨트롤 구성은 5.2 기준 미기록(5.1 관찰은 위 `toolbar 좌` 행) | 보기: URL 값 우선, 없으면 상수 기본값 100(화면 Notion이 다른 값을 표기하면 그 값), 방문 간 기억 없음 — [판정 질문 1](../zero-sol-figma-analysis.md) 2026-09-09 사용자 확정, 목록 공통 | 정렬 방향 전환 UI (`Q3`) | `search-schema.ts`(보기·정렬 기본값), `performanceSortTypes` |
| `performance-list.toolbar-right` | n/a | 5.2 | toolbar 우 | **action 없음** | (대기) | — | — |
| `performance-list.table` | 열거 | 5.2 | table | **checkbox 없음**, `No.` 역순 번호 컬럼. 구분·공연유형·공연명·총회차·출연자·주최/기획·공연기간·장소·예매처·최근업데이트일(정렬) | (대기) | 행 클릭→조회 | `performance-columns.tsx` + `DataTable` |
| `performance-list.detail-entry` | ref | 5.2 | 상세·수정 (→ `performance-edit`·`performance-language` surface 소유) | `공연 조회 : 입력전(default)`/`입력후`, `공연 수정` + Case (미판독) | (대기) | — | `screens/detail/` |

관찰: 공연 도메인은 회원과 같은 filter/toolbar/table 골격을 쓰되 (1) 검색전 상태가 없고 (2) 비동기 lookup 필터(공연장)가 등장하며 (3) toolbar 우측 action 집합이 화면마다 다르다(변경만 / 없음).

현재 5.2 목록은 공용 filter/result/table을 조립한 reference consumer다. 조회는 격리된 fixture이며 실제 API·공연장 원격 검색은 sentinel로 남는다. 행 활성화는 ID 기반 상세 route로 연결됐다. 초기 URL은 기간 기준 공연일·기간 전체·보기 100·등록일 정렬을 해석하고 정렬 방향은 미지정한다. 보기 기본값과 마지막 값 기억 여부는 `performance-list.view-sort` 행과 [판정 질문 1](../zero-sol-figma-analysis.md)이 소유한다. 이 결정은 5.1의 진입 정책을 확정하지 않는다.

2026-09-17 5.1 재판독: `aside repl` 로 Figma 파일의 `5. 공연 > 5.1. 콘텐츠` page 를 열어 레이어를 선택하고
선택이 반영된 뒤 URL 을 다시 읽어 node ID 를 확정했다 — `5.1.1. 콘텐츠 리스트` `129:21882`,
`5.1.1.1. Case 정의` `129:21800`(기존 기록과 일치), `5.1.4.1. 팝업 : 미리보기` `129:21393`(`129-21393`
직접 진입으로 역확인). 같은 호출에서 읽은 URL 은 선택보다 늦게 갱신되므로 근거로 쓰지 않았다. 컬럼·건수·
팝업 라벨은 원본 해상도 clip 캡처로 읽었다. 5.1 은 예매처가 없고 사용상태와 checkbox·일괄변경이 있다는
점에서 5.2 와 갈린다. 5.1 목록은 진입 즉시 조회로 구현됐고 행 활성화 목적지(`content-edit`)는 아직 없다.

## 상세·폼·팝업 판독 (2026-09-02 ①′)

| 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |
| --- | --- | --- | --- | --- | --- |
| 5.1 콘텐츠 조회 | 긴 상세(2473px, 저해상 판독) | 접이식 섹션 다수: 공연정보(읽기) · 기본정보 · **회차/콘텐츠 반복 섹션**(공개/공개안함 라디오, `미리보기`) · 태그 · 수정이력. 콘텐츠 수정에는 `1회차`·대표 썸네일·관람 등급(전체관람가·만12세 이상)·공개/미공개가 있다. `등록전`/`등록후` 두 상태 frame. 팝업 미리보기 = 이미지·영상 카드 | (notion/05 참조) | 섹션별 저장 단위 | — |
| 5.2 공연 수정 | **섹션 단위 편집** | 편집 섹션 `입장안내정보`: **파일 업로드**(`파일선택` + 지원확장자 hint + 파일 chip ⓧ) · 구역/등급별 안내: 입력방식 select(구역/등급) → **반복 행**(게이트* select + 구역* input 또는 등급* multi-select, 행별 `삭제`·`추가`) · 섹션 안 `저장`·`취소`. 나머지 섹션(기본정보·공연일 회차·이벤트·공연장·좌석수·등급)은 읽기. 기본정보에 **언어 tab(한국어·일본어·영어)** | (notion/05 참조) | 섹션별 저장의 mutation 범위, 파일 크기 상한 | `screens/detail/`, `Tabs`·`FileInput` primitive |
| 5.2 공연 조회 | 상태 | `입력전(default)`/`입력후` 두 frame — 입장안내정보 입력 여부 | — | — | — |

## Notion 요점 (원문: [notion/05-performances.md](notion/05-performances.md))

### 5.2 상세 재관찰·구현 경계 (2026-09-08)

- `aside-browser`에서 [입력전 43656:6312](https://www.figma.com/design/Ogb6WpSpwCVhKggQ1NLRlQ/ZEROsol--For-Kakao-?node-id=43656-6312), 같은 페이지의 `5.2.2.1. 입력후`를 선택 영역 확대 후 시각 대조했다. 입력전은 `등록된 정보가 없습니다.`와 수정 버튼, 입력후는 도면 다운로드·입력방식·게이트/구역과 업데이트 이력을 표시한다.
- 기본정보 순서: 구분/공연유형 → 한국어·일본어·영어 탭(공연명·부제·출연자·기획/주관) → 회차별 공연일 → 이벤트명/입퇴장일시 → 공연장 → 좌석수/회차별 판매·미판매 → 등급. 모두 읽기 전용이다.
- [Notion 원문](https://app.notion.com/p/Feature-3c85169ef2f080a1a2a9c65db1982def)을 직접 재대조했다. 수정 대상은 입장안내정보이며, 안내 도면은 필수 1개·최종 선택 파일로 교체, 구역은 필수·20자 이하·문자 제한 없음, 게이트는 공연장 소속 중 택1·최소 1행, 등급은 공연 소속 중 다중선택이다. 추가/삭제·검증 후 저장 확인·취소 흐름이 있다.
- 코드 포인터는 위 표의 `현재 코드` 열이 소유한다. 여기서 다시 열거하면 두 시점이 생긴다. 회차·이벤트·가이드·이력은 현재 임시 상세 응답 소유의 kind A이며 실제 DTO 소속·ID 계약은 미확정이다. 입력전 예시에는 이력 행이 없어 이력 절을 렌더하지 않는다. 빈 이력 절의 제품 표시 정책은 미확정이다.
- 상세 계약은 미확정이다. [교체 표식과 모델](../../../src/features/performances/model/performance-detail.ts)의 DTO·단건/이력 API·권한·실제 파일 URL과 서버 언어 정책을 확인해 fixture 공급을 교체한다. 두 번째 예시의 `.txt` 다운로드는 브라우저 연결 검증용이며 허용 업로드 확장자나 실제 안내 도면의 증거가 아니다. 이력은 확인한 도면명 변경을 표시하고 미확정 필드·구조의 원문 값은 표시하지 않는다.
- 편집 정책은 미확정이다. [편집 요청 지점의 교체 표식](../../../src/routes/_app/performances/$performanceId/index.tsx)에 등록 범위의 사용자 확인, 업로드 확장자·용량, 구역↔등급 전환 시 입력 보존/초기화 답변 대기를 남겼다. 수정 버튼은 대상 ID를 전달하는 요청 지점까지이며 편집 route·폼·저장 성공은 미구현이다. 기본정보 언어 탭의 읽기 검증은 폼 입력 보존의 증거가 아니다.

- 초기화 → default 복원 + 검색 전 상태. 보기 default 100 or 마지막 값, 정렬 default 등록일 or 마지막 값. 다중 키워드 허용.
- 행 클릭 → 공연 조회 화면으로 이동(콘텐츠·공연목록).
- 콘텐츠 일괄변경: 미선택 오류 → 확인 alert → 완료 alert (회원과 동일 3단계). 사용상태 default: 사용·사용안함 각각 문장 존재.

2026-09-07 기간 초기 선택 재관찰: [Figma 5.2.1 공연목록](https://www.figma.com/design/Ogb6WpSpwCVhKggQ1NLRlQ/ZEROsol--For-Kakao-?node-id=43656-2077)의 닫힌 기간 기준 선택 상자는 `공연일`, preset 체크는 `전체`다. 옵션 확장 Case와 초기 화면을 구분해 관찰했다. 서버의 실제 period enum은 이 관찰로 확정하지 않는다.
