# 0003. 표시 timezone과 request timezone을 분리한다

- 상태: 승인됨 — 구현 및 단위 검증 완료, 실제 서버 계약 대기
- 날짜: 2026-08-27
- 개정: 2026-09-02
- 결정자: 제품 소유자 (사용자)

## 맥락

서버가 주고받는 instant와 사용자가 보는 날짜는 같은 기준이 아니다. 서버 요청은 UTC instant를
사용하지만, 화면의 날짜와 기간 달력은 사용자의 브라우저 timezone과 일치해야 한다. 기존 구현은
`APP_TIMEZONE = 'UTC'` Context 하나가 표시와 기간 변환을 함께 맡아 서울 브라우저에서도 UTC 날짜를
보여 줬고, 비어 있거나 파싱할 수 없는 날짜 하나가 목록 전체를 `RangeError`로 중단시켰다.

리허설 OpenAPI의 `timezone` 파라미터 의미는 신규 서버 계약이 아니다. Managers 요청은 현재 이
파라미터를 보내지 않으며, UTC instant를 보낸다는 사실만으로 값을 추론해 추가하지 않는다.

## 결정

1. `REQUEST_TIMEZONE = 'UTC'`는 request boundary의 instant 직렬화 기준이다. API에 보내는
   `startDateTime`과 `endDateTime`은 `Z`가 명시된 ISO string이다.
2. `displayTimeZone()`은 `Intl.DateTimeFormat().resolvedOptions().timeZone`으로 브라우저 IANA
   timezone을 반환한다. 언어와 timezone은 다른 축이므로 locale에서 timezone을 추정하지 않는다.
3. 표시 기준을 Context로 주입하지 않는다. 브라우저 환경이 단일 소유자이므로 `TimezoneProvider`와
   `useTimezone`을 제거한다. 공연장 timezone이 제품 기준으로 확정되면 호출부가 아니라
   `displayTimeZone()`만 교체할 수 있도록 함수 경계는 유지한다.
4. 서버 instant 표시는 브라우저 timezone으로 변환한다. 값이 없거나 파싱할 수 없으면 빈 문자열을
   반환하며 한 셀의 결함이 화면 전체를 중단시키지 않는다.
5. 사용자가 고른 `YYYY-MM-DD`는 브라우저 timezone의 그 날을 뜻한다. 시작 `00:00:00.000`과 끝
   `23:59:59.999`를 그 zone에서 계산한 뒤 UTC instant로 변환한다. 달력 표시 zone과 day-boundary
   해석 zone을 다르게 두지 않는다.
6. 날짜 전용 값은 `YYYY-MM-DD`, 시간 전용 값은 `HH:mm`, instant는 `Z` ISO string으로 구분한다.
   local text에 `Z`를 붙여 UTC처럼 만들지 않는다.
7. API `timezone` 파라미터 전달 여부와 의미는 신규 서버 계약이 확정된 feature가 소유한다.
   transport가 `REQUEST_TIMEZONE`이나 브라우저 zone을 자동 주입하지 않는다.

## 변환 예시

브라우저 timezone이 `Asia/Seoul`이면 다음 두 방향이 서로 같은 달력 기준을 사용한다.

```text
서버 응답 instant:      2026-08-27T15:00:00Z
화면 날짜:              2026-08-28

사용자가 선택한 날짜:   2026-08-28
startDateTime request:   2026-08-27T15:00:00.000Z
endDateTime request:     2026-08-28T14:59:59.999Z
```

## 소유권

| 대상 | 소유자 |
| --- | --- |
| request UTC 상수, 브라우저 zone 확인, 안전한 표시, day-boundary 변환 | `src/shared/lib/datetime.ts` |
| 기간 preset/custom draft와 UTC range 조립 | `src/shared/lib/use-period-draft.ts` |
| 표시 셀과 기간 필터 조립 | 각 feature |
| API `timezone` 파라미터 전달 | 신규 서버 계약이 확인된 feature |

## 검증

- 빈 날짜 row 렌더가 예외 없이 빈 셀을 만든다.
- 같은 UTC instant가 `Asia/Seoul`과 `UTC`에서 서로 다른 날짜로 표시된다.
- 서울과 DST zone의 local-day 시작·끝이 올바른 UTC instant로 변환되고 표시 날짜로 왕복한다.
- Chromium에서 `/managers?periodType=CREATED_AT`의 날짜 열과 root error 부재를 확인한다.

## 재검토 조건

- 표시 기준이 브라우저가 아니라 계정·공연장 timezone으로 확정될 때
- 신규 서버가 date-only, instant, `timezone` 파라미터의 결합 의미를 확정할 때
- 브라우저가 IANA zone을 반환하지 못하는 환경의 fallback 정책이 필요할 때
