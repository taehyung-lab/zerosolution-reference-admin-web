# 0002. TypeScript 5.9.3 고정

- 상태: 승인됨
- 날짜: 2026-08-27

## 맥락

bootstrap 시점의 npm `latest`는 TypeScript **7.0.2**이고 6.0.3도 정식 릴리스되어 있다.
그러나 `typescript-eslint@8.68.0`의 peer 범위는 `typescript >=4.8.4 <6.1.0`이다.

TypeScript 7에서는 typescript-eslint가 동작하지 않으며, 그러면 `AGENTS.md` §3(아키텍처)과 §4(완료 증거)가 요구하는
**레이어 import 경계 lint 게이트 자체가 성립하지 않는다.** 이는 이 프로젝트에서
타입 최신성보다 우선하는 요구사항이다.

## 결정

TypeScript를 **5.9.3**으로 고정한다.

- 6.0.3도 typescript-eslint 범위 안이지만 생태계 검증이 얕아 Day 1 기준선으로 두지 않는다.
- `strict`, `noUncheckedIndexedAccess`는 5.x에 모두 있으므로 프로젝트 타입 요구에 손실이 없다.

## 폐기 조건

`typescript-eslint`가 TypeScript 6.1+ 또는 7을 공식 지원하면 재검토한다.
승격은 `pnpm verify` 전체가 통과하는 것을 조건으로 한다.
