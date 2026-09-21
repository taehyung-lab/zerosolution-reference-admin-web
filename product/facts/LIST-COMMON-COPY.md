---
id: LIST-COMMON-COPY
title: 목록 공통 문구 — 검색 패널·결과 컨트롤
role: policy
status: 관찰됨
related: [PRINTER-LIST]
sources:
  - kind: figma
    ref: "https://www.figma.com/design/Ogb6WpSpwCVhKggQ1NLRlQ/ZEROsol--For-Kakao- 의 5.2 `43656:2077` 안 `5.2.1. 공연목록`"
    observed: 2026-09-21
    how: aside-browser 로 레이어 선택 후 확대 렌더 판독
  - kind: figma
    ref: "같은 파일 6.7.1 목록 Case `173:14291`(PRINTER-LIST 관찰), 11.1 운영자 목록 frame"
    observed: 2026-09-15
    how: PRINTER-LIST·운영자 원장의 기존 aside 실측을 재인용. 이 fact 를 위해 다시 열지 않았다
---

# 목록 공통 문구

여러 목록 화면의 검색 패널과 결과 컨트롤이 **같은 한국어 문장**으로 그리는 라벨. 이 문장들은
`shared` namespace(`filter.*`·`list.pageSize`·`list.sort`·`list.pagination.*`·`checkboxTree.selectAll`)가
소유하고 공용 단위가 직접 읽는다. 화면이 넘기는 도메인 라벨(행 이름·기준/대상 옵션·enum 라벨)은
각 화면의 fact 가 소유한다.

## 관찰 (ko)

| 자리 | 관찰된 문구 | 어디서 |
| --- | --- | --- |
| 검색 패널 제목 / 검색 버튼 | 검색 | 5.2.1 패널 상단 `검색`, 하단 검정 버튼 `검색` |
| 초기화 버튼 | 초기화 | 5.2.1 하단 흰 버튼 |
| 기간 행 이름 | 기간 | 5.2.1. 회원접속은 `접속일`(화면 fact 소유) |
| 검색어 행 이름 / 입력 | 검색어 | 5.2.1 |
| 검색어 추가 버튼 | 추가 | 5.2.1 `⊕ 추가` |
| 다중선택의 "조건 없음" 항목 | 전체 | 5.2.1 구분·공연유형·예매처 첫 항목, 기간 preset 첫 항목 |
| 결과 건수 | 검색결과 : {{n}} | 5.2.1 (`shared:list.total`, 기존) |
| 보기 select 라벨 | 보기 | 5.2.1 표 위 왼쪽 |
| 정렬 select 라벨 | 정렬 | 5.2.1 표 위, 보기 오른쭉 |
| 페이지 이전/다음 | Previous / Next | 5.2.1 하단 `← Previous 1 2 3 … 67 68 Next →` — 화면 문구가 영문이다. 코드는 ko `이전`·`다음`을 쓴다([미확인](#미확인) 3) |

접기/펼치기 버튼의 접근 이름(`검색 접기`·`검색 펼치기`), 달력 트리거(`달력 열기`), preset 그룹 이름
(`기간 빠른 선택`), 기준/대상 select 의 접근 이름(`기간 기준`·`검색 대상`), chip 삭제(`{{value}} 삭제`)는
frame 에 글자로 없는 보조기술 전용 이름이다. 값은 구현이 정했고 제품 문장이 아니다(**추론**).

## 정책

- 위 문구는 한 곳(`src/shared/i18n/locales/*/shared.json`)에만 있다. 화면 namespace 가 같은 문장을 다시 갖지 않는다.
- 대상 제품이 문구를 바꾸면 그 한 곳을 바꾼다. 특정 화면만 다른 문장을 쓴다는 원장이 나오면 그 화면은 공용 단위 대신 직접 조립한다(카탈로그 List·Filter 행).

## 미확인

| # | 무엇 | 답에 따라 달라지는 것 | 누구에게 |
| --- | --- | --- | --- |
| 1 | en·ja 문구. Figma 는 ko 만 그린다. 2026-09-21 이동 전 feature 별로 갈려 있던 번역 중 다수안을 채택했다: 초기화 `Reset`/`初期化`, 전체 `All`/`すべて`, 이전·다음 `Previous`·`Next`/`前へ`·`次へ`, 정렬 `Sort`/`並び替え`(ja 3:3 동률 — 임의 선택), 달력 `Open calendar`/`カレンダーを開く`, preset 그룹 `Quick period`/`期間クイック選択`, 검색어 `Keyword`/`検索語`, 기준 `Period criterion`/`期間基準`, 대상 `Search target`/`検索対象` | 각 locale 의 표시 문구 | 제품 소유자·번역 담당 |
| 2 | 보기 select 의 en. 이동 전 `View`·`Rows`·`Page size`·`Per page` 로 갈려 있었고 **2026-09-21 제품 소유자가 `Page size` 로 정했다**(확정). ja 는 `表示`(다수안, 미확인) | en 표시 문구 | — (en 확정) / ja 제품 소유자 |
| 3 | 페이지 이전/다음 버튼이 ko 화면에서 `Previous`/`Next` 영문 그대로인지, `이전`/`다음` 인지. frame 은 영문을 그리고 코드는 ko 를 쓴다 | 페이지 컨트롤 문구 | 디자인 원문 소유자 |
| 4 | 검색 패널 제목이 모든 목록에서 `검색` 인지. 5.2.1·6.7.1·11.1 은 `검색`. 나머지 목록 frame 은 이 fact 를 위해 다시 열지 않았다 | 다른 제목을 쓰는 화면이 있으면 그 화면은 `FilterPanel` 대신 직접 조립 | 각 화면 frame |
