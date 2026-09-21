# 0005. locale을 모든 API Query key에 포함

- 상태: 승인됨
- 날짜: 2026-08-27
- 결정자: 구현 지시 확정안

## 맥락

UI locale은 `ko`, `en`, `ja`지만 어떤 신규 제품 응답군이 locale에 따라 달라지는지는 확인되지
않았다. 격리 계약 서버가 `ko`, `ja`만 지원한다는 사실은 신규 제품 정책이 아니며, UI locale과
서버 응답 locale이 같다고 가정할 근거도 없다.

locale을 key에서 빼면 언어 전환 후 이전 언어 응답을 재사용할 수 있다. 일부 응답군만 넣는
정책은 응답군이 확정되기 전에는 안전하게 분류할 수 없다.

## 결정

보수적으로 모든 API-backed Query key에 UI locale을 포함한다. 응답군을 분류할 근거가 없는 동안은
locale 전환 뒤 이전 언어 응답을 재사용하는 결함을 확실히 막는 쪽을 택했고, helper 하나가 prefix를
소유하므로 폐기 조건이 성립했을 때 좁히는 비용도 한 곳에 머문다.

key 형태·helper·feature 적용 규칙은 `.agents/skills/server-state/SKILL.md`의 "Locale and cache identity"가 소유한다.

## 폐기 조건

신규 백엔드가 locale에 따라 달라지는 응답군과 그렇지 않은 응답군을 명시하고 실제 계약 테스트로
확인되면, 비현지화 응답군만 locale 없는 별도 root로 옮길 수 있다. 그때 활성 query key, loader
prefetch, invalidation과 locale 전환 시 cache 동작을 함께 검토한다.
