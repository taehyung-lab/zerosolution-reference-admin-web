# 12. 통합검색

표 형식은 [README.md](README.md). Notion 열의 `(대기)`는 아래 **Notion 요점**과 `notion/` 원문으로 대체한다.

| 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |
| --- | --- | --- | --- | --- | --- |
| 12 | 진입 | 상단 바 통합검색 input → 결과 화면(breadcrumb 통합검색 > 검색결과) | (대기) | — | 없음 |
| 12 | 기간 | **기준 select 없음**, preset(기본 전체) + range | (대기) | — | `PeriodField` |
| 12 | 검색어 | **대상 select 없음** — 입력 + `⊕ 추가` + chip("ive" ⓧ) | (대기) | — | `KeywordChipField`(대상 없이 사용 가능) |
| 12 | 결과 tab | 회원·공연·발권·입장·커뮤니티 5 tab, tab별 검색결과 수·보기·정렬·table·paging 독립 | (대기) | tab별 count 동시 조회 여부 | 없음 |
| 12 | table | 검색어 일치 부분 **하이라이트**("ive") | (대기) | — | `DataTable` 셀 렌더 caller 소유 → 가능 |

## Notion 요점 (원문: [notion/12-search.md](notion/12-search.md))

- 초기화·보기(100)·다중 키워드 정책 목록과 동일.
