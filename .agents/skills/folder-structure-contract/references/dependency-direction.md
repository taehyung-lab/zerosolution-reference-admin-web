# 의존 방향

파일을 만들거나 옮기면서 import 경계를 새로 긋거나 넘을 때만 읽는다. 배치 위치 자체는 [SKILL.md 배치 판단](../SKILL.md#배치-판단)이 정한다. 기계 검사는 `eslint.config.js`의 import 경계 규칙이 소유하며, 여기 문장은 그 규칙이 왜 그렇게 그어졌는가다.

```text
app / routes → features → shared / api
screens → mechanics → domain api / model / lib / config
screens → domain api / model / lib / config
ui → 해당 소유자의 model / lib / config
```

- domain api/model/lib/config/fixtures는 screens나 mechanics 내부를 역참조하지 않는다.
- mechanics는 screens를 참조하지 않는다. 서로 다른 screens의 내부 파일을 import하지 않는다.
- model/lib/config는 feature ui를 역참조하지 않는다. UI가 정의한 데이터 타입을 API/model도 쓰면 그 타입의
  의미에 맞는 model 또는 API 계약으로 옮긴다. 렌더 전용 props까지 옮기지는 않는다.
- domain model은 React와 실행 훅을 모른다. screens/mechanics model은 React·Query를 사용할 수 있다.
- domain api는 옵션 선언과 API-only 훅을 소유한다. URL·폼·선택·확인·navigation·mutation 뒤 캐시
  후속 처리는 workflow가 소유한다. lib/config는 React·Query 실행 훅을 소유하지 않는다.
- fixture는 예시 데이터의 소유자다. 화면의 URL schema나 UI 타입에 기대지 않고 공통 입력·값을 소비한다.
- 기존 feature 간 import와 generated 접근 제한은 유지한다. API leaf 예외의 적용 조건은
  [API 계약](../../api-contract/references/query-cache.md)이 소유한다.

API 입력 타입과 URL 정규화는 소유가 다르다. 공통 입력 타입은 api/model에 두고 URL schema는
소비 화면 또는 실제 공유 mechanic의 model에 둔다. 타입을 옮기면서 미확정 서버 DTO를 새로 정의하거나 캐시 identity를 바꾸지 않는다.
