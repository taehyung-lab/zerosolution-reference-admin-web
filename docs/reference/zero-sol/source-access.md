# ZEROsol 원문 접근

이 문서는 현재 저장소의 Figma·Notion 원문을 다시 관찰할 때 쓰는 source 전용 절차다. 다른 제품으로
이관하지 않으며, 범용 근거 판독 규칙은 `product/policies/evidence.md`가 소유한다.

## 공통 진입점

Figma: [ZEROsol — For Kakao](https://www.figma.com/design/Ogb6WpSpwCVhKggQ1NLRlQ/ZEROsol--For-Kakao-).
파일 진입 주소이며, 화면별 관찰 위치·시점·범위는 해당 fact의 `sources`가 소유한다.

## 접근 절차

1. `aside-browser` skill을 읽고 `rtk proxy aside guide`, `rtk proxy aside guide repl`로 사용법을 확인한다.
2. 기존 로그인 세션이 있는 원문 탭을 `aside repl`로 직접 연다. `aside exec`의 LLM 요약으로 렌더 판독을 대신하지 않는다.
3. Figma에서는 대상 frame을 선택한 다음 호출에서 URL과 node ID를 다시 읽는다. 선택 반영이 한 호출 늦기 때문이다.
4. `Shift+2`로 선택 영역을 확대하고 원본 해상도에서 필요한 영역을 잘라 라벨·구성·상태를 판독한다.
5. 확인한 원문 위치·시점·방법·범위와 얻지 못한 사실을 해당 fact에 기록한다.

## 현재 계정 제약

현재 계정은 Figma View seat라 MCP가 두 번째 호출부터 tool call limit에 걸릴 수 있다. 한 번 성공했더라도
재관찰이 중간에 끊길 수 있으므로 이 저장소에서는 로그인 세션을 사용하는 직접 렌더 경로를 쓴다.

원문을 읽지 못했으면 fact의 `sources.observed`를 갱신하지 않는다. 사용한 도구, 대상, 오류와 확인하지
못한 사실의 영향을 보고하고, 빈 출력이나 잘린 출력을 제품 사실의 부재로 해석하지 않는다.
