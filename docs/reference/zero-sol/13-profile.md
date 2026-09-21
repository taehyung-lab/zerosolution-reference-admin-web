# 13. 내정보

**이 화면의 관찰·정책·미확인은 fact 가 소유한다** — [`product/facts/PROFILE-DETAIL.md`](../../../product/facts/PROFILE-DETAIL.md)
와 [`product/facts/PROFILE-EDIT.md`](../../../product/facts/PROFILE-EDIT.md). 아래 표는 옛 원장의
자리이며 fact 로 옮긴 뒤에는 어디를 읽어야 하는지만 말한다.

정책 문장의 Notion 원문은 [Notion 동작·정책 원장](notion/13-profile.md)에 그대로 남아 있다.

표 형식은 [README.md](README.md).

| 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |
| --- | --- | --- | --- | --- | --- |
| 13 | 조회 | `13.1. 내정보 조회`(`129:84555`) — 판독 완료, [PROFILE-DETAIL](../../../product/facts/PROFILE-DETAIL.md) | [notion/13-profile.md](notion/13-profile.md) 조회 절 | fact 의 `미확인` 표 | `src/features/profile/screens/profile-detail/` |
| 13 | 수정 | `13.2. 내정보 수정`(`129:84538`) — 판독 완료, [PROFILE-EDIT](../../../product/facts/PROFILE-EDIT.md) | [notion/13-profile.md](notion/13-profile.md) 수정 절 | fact 의 `미확인` 표 | `src/features/profile/screens/profile-form/` |

두 frame 은 제목·breadcrumb 을 11.1 운영자 화면에서 그대로 복제하고 있다. 그 충돌과 해소는 fact 가
소유한다 — 여기서 다시 판정하지 않는다.
