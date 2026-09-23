# 7. 전시

표 형식은 [README.md](README.md). Notion 열의 `(대기)`는 아래 **Notion 요점**과 `notion/` 원문으로 대체한다.

| 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |
| --- | --- | --- | --- | --- | --- |
| 7.1 배너 (`129:51223`) | 검색 전 상태 | 검색전 frame 없음(`7.1.1.1 배너 리스트` 단일) — 진입 즉시 조회 | [BANNER-LIST](../../../product/facts/BANNER-LIST.md) | — | `src/features/exhibitions/screens/banner-list` |
| 7.1 배너 | 기간 | 기준 등록일·최근업데이트일·게시일 | [BANNER-LIST](../../../product/facts/BANNER-LIST.md) | `게시일` 기준 의미(BANNER-LIST 미확인 2) | `PeriodField` |
| 7.1 배너 | 검색어 | 대상 **배너명 1개** + chip("배너명 : 5월 광고") | [BANNER-LIST](../../../product/facts/BANNER-LIST.md) | — | `src/features/exhibitions/screens/banner-list` |
| 7.1 배너 | 다중선택 | 구분(홈 1개), 이동경로 유형(전체·APP 내부·외부 경로), 게시 상태(전체·대기·게시중·종료) | [BANNER-LIST](../../../product/facts/BANNER-LIST.md) | — | `src/features/exhibitions/screens/banner-list` |
| 7.1 배너 (`129:51150` Case) | toolbar 우 | `선택▾`+`변경`(cascade `게시 상태 > 대기 / 게시중 / 종료`) · `미리보기` · `등록` — **미리보기** 신규 action(선택과 무관, `190:10638` 팝업) | [BANNER-LIST](../../../product/facts/BANNER-LIST.md) | 미리보기 빈 상태·순서(BANNER-LIST 미확인 5) | `src/features/exhibitions/screens/banner-list` |
| 7.1 배너 | table | checkbox. 게시순서·구분·배너명·이동경로 유형·게시기간(2줄 "~")·게시 상태·등록일/최근업데이트일(정렬). 정렬 옵션에 `순서`가 있다 | [BANNER-LIST](../../../product/facts/BANNER-LIST.md) | 게시순서 정렬 규칙(BANNER-LIST 미확인 1) | `src/features/exhibitions/screens/banner-list` |
| 7.1 배너 | 상세·등록·수정 | 조회 `129:51109` · 등록 `129:51082` · 등록 Case `190:10466` · 수정 `129:51055` · 팝업 미리보기 `190:10638` (2026-09-23 판독) | [BANNER-DETAIL](../../../product/facts/BANNER-DETAIL.md) · [BANNER-FORM](../../../product/facts/BANNER-FORM.md) | 즉시중단 동작(BANNER-DETAIL 미확인 1), 등록 게시 상태(BANNER-FORM 미확인 1) | `src/features/exhibitions/screens/banner-detail`, `banner-form` |
| 7.1 배너 | 이미지 업로드 hint | `권장 사이즈 : 가로 {n}px * 세로 {n}px 지원확장자 : png, 1MB 이하` | [BANNER-FORM](../../../product/facts/BANNER-FORM.md) | 가로·세로 실제 값 | `src/features/exhibitions/screens/banner-form` |
| 7.2 APP Splash | 목록·cascade | 리스트·Case·조회·등록·Case·수정. cascade `게시상태 > 대기 / 게시중 / 종료`; 정렬은 등록일·최근업데이트일·게시시작일·게시종료일·타이틀·게시 상태 | (대기) | table 실제 컬럼 | — |
| 7.2 APP Splash | 파일 업로드 | 배너와 같은 hint, 업로드 후 `file_name.png` + ⓧ 제거 | (대기) | 이미지 크기 실제 값 | — |

## Notion 요점 (원문: [notion/07-exhibition.md](notion/07-exhibition.md))

- 초기화·보기(100)·정렬(등록일) 정책 회원과 동일. 행 클릭 → 배너 조회. 일괄변경 3단계 alert 동일. 저장/삭제 확인·완료 alert 존재.
