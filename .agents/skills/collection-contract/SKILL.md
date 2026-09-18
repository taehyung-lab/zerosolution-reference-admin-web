---
name: collection-contract
description: >
  자기 route 없이 다른 화면에 들어간 표·목록·반복 행·다이얼로그 선택기를 바꿀 때 사용한다. 독립 URL 목록은 list-contract, 제품 값은 product-evidence로 보낸다.
---

# 역할 계약 — 화면 안의 행 집합

**답하는 질문**: 상세 섹션의 표, 폼의 반복 행, 다이얼로그의 검색 결과처럼 **화면 안에 호스팅된**
행 집합의 행·params·실패를 누가 소유하는가.

**담지 않는 것**: 자기 route 로 들어가는 목록 — `.agents/skills/list-contract/SKILL.md` 다.

화면 어디에든 있는 **행 집합의 상태 topology** 를 소유한다: 행이 어디서 오는가, 누가 그 상태를 들고 있는가, 실패가 어디서 끝나는가. 목록 화면의 결과도 이 분류의 한 종류이고, 상세 섹션 안의 표·폼 안의 반복 행·다이얼로그의 검색 결과도 같은 분류를 거친다.

이 문서가 소유하지 않는 것: **어떻게 그리는가**(→ [catalog](../shared-ui/SKILL.md) 의 `DataTable`·`ListResult`·`Pagination` 행), **파일이 어디 사는가**(→ 그것을 품은 화면의 역할 문서 `형태` 절), **컬럼·문구·옵션**(→ 그 화면의 제품 원장).

## 데이터 소유자로 분류한다

순서대로 묻는다: 행이 어디서 오는가, 무엇이 행을 바꾸는가, 어떤 상태가 화면 이동에도 살아남아야 하는가. 한 화면이 종류가 다른 집합을 여럿 가질 수 있고, 각각 따로 분류한다.

| 종류 | 행의 출처 | 상태 소유자 | 다음에 읽을 것 |
| --- | --- | --- | --- |
| **A. 부모 응답 안의 배열** | 부모 상세 응답 | 부모 ID query 하나. 두 번째 key·Router·Form·선택 없음 | [detail](../detail-contract/SKILL.md) |
| **B. 독립 자식 query** | 부모 ID 로 여는 자식 endpoint, 사용자 입력 params 없음 | 자식 query key. Router·Form·선택 없음 | key 는 [query-cache](../server-state/SKILL.md) |
| **C. 필터·정렬·페이지가 있는 집합** | params 를 받는 endpoint | query key = 해소된 params. 확정 params 는 독립 route 면 URL, 화면 안이면 가장 가까운 host | [list](../list-contract/SKILL.md) 를 그 surface 에 적용 |
| **D. 폼이 소유하는 편집 행** | TanStack Form 배열 필드 | Form(값·dirty·행별 오류). Query 는 선택지만 | [form](../form-contract/SKILL.md) |
| **E. 검색 뒤 고르는 후보** | 로컬 검색 입력이 여는 검색 endpoint | 검색 key + host 의 후보 하나. 확정 값만 밖으로 | host 의 역할 문서 |

- 독립 route 로 진입하는 목록은 C 이며 [list](../list-contract/SKILL.md) 가 그 **전체 lifecycle**(URL 계약·초안·결과 상태·액션·파일 자리)을 소유한다. 화면 안에 중첩된 C 는 URL 을 쓰지 않는 것이 기본이고, **공유·복원이 제품에서 확정될 때만** URL 로 올린다. 확정되지 않았으면 그것이 보류 사유이지 로컬·URL 중 하나를 추측할 근거가 아니다.
- B·C·E 는 endpoint·params·실패 의미가 확인돼야 시작한다. A 는 부모 응답만으로 확정된다.

## 상태 규칙

- **자식의 실패는 부모를 다시 쓰지 않는다.** B·C 는 pending·error·retry 를 자기 섹션 안에서 끝낸다. 자식의 not-found 는 부모의 not-found 가 아니고, 부모의 상태 경계는 `ready` 로 남는다.
- **서버 행은 Query 캐시에만 산다.** 컴포넌트 상태·전역 store·폼 값으로 복사하지 않는다. 반대로 임시 검색어·후보 선택·폼 배열은 캐시 데이터가 아니다.
- **확정 params 와 초안을 섞지 않는다.** query key 와 요청은 같은 해소된 값을 쓰고 초안은 들어가지 않는다.
- **행 identity 는 서버 계약이 확인한 stable ID 다.** 모든 DTO 에 `id` 가 있다고 가정하지 않고 배열 index 를 identity 로 쓰지 않는다. 폼 행은 insert·remove 를 넘겨 살아남는 key 가 따로 필요하다.
- **선택 수명은 보이는 결과에 종속된다.** 확정된 조건이 바뀌면 선택이 사라지고, 같은 조건의 재조회는 남아 있는 선택 가능 행만 유지한다.
- 비어 있음·없음·사용 불가 문구는 업무 의미를 담으므로 feature 가 소유한다.

## 자리

중첩 집합은 기본적으로 **그것을 품은 화면**의 `ui/` 에 산다. 상태가 있으면 같은 화면의 `model/` 에 그 훅을 둔다. 같은 도메인의 여러 화면이 같은 의미·전이·실패로 쓸 때만 `mechanics/{capability}` 로 올리고, 도메인·Router·Query·permission 을 모르는 렌더만 남을 때 `shared/ui` 로 올린다([promotion](../source-structure/references/promotion.md)).

**표가 있다는 이유로 목록 화면 폴더를 만들지 않는다.** 독립 route 로 진입하지 않으면 그것은 host 화면의 일부다.

## 렌더 표면 고르기

분류가 끝난 뒤 집합마다 따로 고른다.

1. **맞으면 그대로 쓴다.** 공용 단위의 계약과 의미·상호작용 수명·실패 동작·public API 가 모두 맞을 때만 [catalog](../shared-ui/SKILL.md) 의 그 행을 소비한다.
2. **안 맞으면 feature-local 로 조립한다.** `Table` primitive·`Dialog`·`Input` 으로 그 자리에서 만든다. 한 호출자를 맞추려고 공용 단위에 prop·mode·callback 을 더하지 않는다.
3. **공용 계약 자체를 바꿔야 할 때만** [promotion](../source-structure/references/promotion.md) 을 따른다. 첫 소비자가 계약을 넓히고 그것을 확정이라 부르지 않는다.

`DataTable` 은 읽기 전용 행·feature 컬럼·stable `getRowId`·전달된 `aria-sort` 를 덮는다. 선택·편집 셀·행 확장·페이지·정렬 정책·문구는 덮지 않는다. 표시 전용 배열(A)은 `DataTable` 도 `Table` primitive 도 될 수 있고, 가르는 사실은 **컬럼·정렬 계약이 필요한가**이지 그 행이 상세 안에 있다는 것이 아니다. 편집 행(D)은 focus·identity 를 Form 이 들고 있으므로 계약이 이미 덮지 않는 한 primitive 로 조립한다. 후보 선택(E)은 공용 단위가 소유하지 않는 후보 상태를 더하므로 host 가 들고 렌더 표면만 고른다.

endpoint·resource 이름·mode 를 받아 여러 종류를 한꺼번에 처리하는 집합 컴포넌트·훅·다이얼로그를 만들지 않는다. 종류마다 명시적 조립이다.

## 검증

바뀐 소유자 전이만 실측한다: 자식 실패가 부모 상태를 건드리지 않음(B·C), key·params 동일성과 페이지 리셋(C), 행 추가·삭제와 행별 오류·dirty(D), 후보 확정·취소(E), 그리고 모든 종류의 stable row identity. 브라우저 증거는 어느 화면의 어느 집합을 어떤 상태로 열었는지 적는다.
