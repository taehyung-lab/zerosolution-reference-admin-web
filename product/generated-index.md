<!-- 생성물이다. scripts/product/build-index.mjs 가 만든다. 손으로 고치지 않는다. -->
# 제품 사실 색인

요청이 제품 값에 의존하면 여기서 대상 ID 를 찾고 **그 fact 만** 연다. 관례로 여러 개를 열지 않는다.
여기 없으면 `미확인`이지 부재가 아니다 — 무엇을 누구에게 물어야 하는지 적고 그 부분만 보류한다.

이 표의 이름·역할·상태는 각 fact 파일의 frontmatter 가 소유한다. 이 파일을 고치지 말고 fact 를 고친 뒤
`pnpm product:index` 를 다시 돌린다.

| ID | 제목 | 역할 | 상태 | fact |
| --- | --- | --- | --- | --- |
| `PERF-DETAIL` | 공연 조회 | detail | 관찰됨 | [PERF-DETAIL.md](facts/PERF-DETAIL.md) |
| `PERF-EDIT-ADMISSION` | 공연 수정 — 입장안내정보 | form | 관찰됨 | [PERF-EDIT-ADMISSION.md](facts/PERF-EDIT-ADMISSION.md) |

총 2개.
