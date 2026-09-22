# ZEROsol 원문 접근

이 문서는 현재 저장소의 Figma·Notion 원문을 다시 관찰할 때 쓰는 source 전용 절차다. 다른 제품으로
이관하지 않으며, 범용 근거 판독 규칙은 `product/policies/evidence.md`가 소유한다.

## 공통 진입점

Figma: [ZEROsol — For Kakao](https://www.figma.com/design/Ogb6WpSpwCVhKggQ1NLRlQ/ZEROsol--For-Kakao-).
Notion: 대상 page 주소는 [Notion 원문 색인](notion/00-index.md)과 각 원장 행이 소유한다.
화면별 관찰 위치·시점·범위는 해당 fact의 `sources`가 소유한다.

저장소의 fact·원장·`notion/` 전사는 기본 작업 입력인 관찰 snapshot 이다. 최신 확인이 필요한 조건과
신선도 판정은 [근거 정책](../../../product/policies/evidence.md#저장소-snapshot-과-원문을-구별한다)이
소유한다. 이 문서는 재관찰이 필요하다고 판정된 뒤의 접근 수단만 소유한다.

## 접근 절차

1. `aside-browser` skill을 읽고 `rtk proxy aside guide`, `rtk proxy aside guide repl`로 사용법을 확인한다.
2. 기존 로그인 세션이 있는 원문 탭을 `aside repl`로 직접 연다. 워커마다 자격증명이 다른 MCP의 성공·실패를
   기본 fallback 으로 사용하지 않는다. `aside exec`의 LLM 요약으로 렌더 판독을 대신하지 않는다.
3. Notion은 색인의 page 주소와 대상 절 제목을 대조하고, 필요한 절의 처음부터 끝까지 읽는다. 화면 범위가
   섞인 page 는 요청 feature 의 절만 판독한다. 수정 시각·revision 을 확인할 수 있으면 함께 기록한다.
4. Figma에서는 대상 frame을 선택한 다음 호출에서 URL과 node ID를 다시 읽는다. 선택 반영이 한 호출 늦기 때문이다.
5. `Shift+2`로 선택 영역을 확대하고 원본 해상도에서 필요한 영역을 잘라 라벨·구성·상태를 판독한다.
6. 확인한 원문 위치·시점·방법·범위와 얻지 못한 사실을 해당 fact에 기록한다.

구조화된 Notion 도구가 같은 page·절의 전체 내용과 수정 정보를 잘림 없이 반환한 경우에는 그 결과도
원문 관찰이다. 다만 한 작업 안에서는 접근 경로를 먼저 고정한다. 일부 워커만 MCP를 쓰거나, 실패한
워커만 snapshot 으로 전환해 서로 다른 근거 집합으로 범위를 정하지 않는다.

## 현재 계정 제약

현재 계정은 Figma View seat라 MCP가 두 번째 호출부터 tool call limit에 걸릴 수 있다. Notion MCP도
워커 profile 에 따라 접근 가능성이 달라진 관찰이 있다. 한 번 성공했더라도 다음 워커의 접근을 보장하지
않으므로 이 저장소의 기본 재관찰 경로는 로그인 세션을 사용하는 직접 렌더다.

원문을 읽지 못했으면 fact의 `sources.observed`를 갱신하지 않는다. 사용한 도구, 대상, 오류와 확인하지
못한 사실의 영향을 보고하고, 빈 출력이나 잘린 출력을 제품 사실의 부재로 해석하지 않는다. 이미 확정한
feature 범위는 줄이지 않고 영향받은 구성원을 `범위 내 보류`로 남긴다.
