# 0017. 기본 이관은 Foundation만 선택한다

- 상태: 채택 — 첫 실제 대상의 API·auth·브라우저 수용은 미확인
- 날짜: 2026-09-21

## 결정

기본 plan·stage는 코드가 선언한 Foundation bundle만 고른다. 다른 bundle은 `--bundles`로 명시한다.
fact는 빈 구조만 만들며 현재 제품 원장은 `--with-ledger`에서만 이동한다.

## 결정 당시의 관찰과 이유

변경 전 기본 stage는 copy 256·merge 17·conditional 2·exclude 1·generate 2·template 2였고,
pending sentinel 11·미이관 ADR 인용 6·제품 어휘 4·source 근거 링크 10이 남았다. 대상 검사는 루트
5,465자의 5,400자 상한 초과, 생성 색인 negative control 누락, credential·locale production 등록 부재도
드러냈다. 범용인 구현과 새 프로젝트 시작에 반드시 필요한 구현은 같은 집합이 아니므로 기본값을 좁힌다.

## 대가

화면별 구현은 bundle을 명시해서 골라야 하므로 선택 비용이 생긴다. 실 API·실 auth·대상 UI의 브라우저
수용 전까지 검증 상한은 `경계까지 확인됨`이다. Foundation을 지나치게 좁히면 첫 대상이 시작하지 못할
위험이 있으므로 첫 소비자의 양성 검증으로 재검토한다.

## 버린 대안

- 전체 bundle 기본 복사: 현재 제품의 구현 선택과 소비 예시가 대상 기본값이 된다.
- 문서 표현만 수정: 실행 결과가 달라지지 않아 같은 오염이 계속 반출된다.
- 도메인 중립 bundle 전부를 Foundation으로 지정: 범용성과 시작 필요성을 혼동해 기본 비용이 다시 커진다.

## 재검토 조건

- 첫 실제 대상이 fact·계약·bundle 선택과 검증을 시작하지 못한다.
- 서로 다른 대상이 같은 opt-in 집합을 반복 선택해 기본 비용보다 선택 비용이 커진다.
- bundle 하나를 선택해도 code·skill·결정 근거·focused test 폐쇄가 닫히지 않는다.
