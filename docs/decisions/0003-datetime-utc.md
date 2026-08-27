# 0003. 날짜·시간 기준 timezone은 UTC

- 상태: 승인됨
- 날짜: 2026-08-27
- 결정자: 제품 소유자 (사용자)

## 맥락

목록 화면의 기간 필터는 프리셋(`전체 / 1주 / 1개월 / 3개월 / 6개월 / 1년`)과 `직접` 입력을
모두 제공한다(Figma `4.1.1`, `11.1.1`, `5.2.1` 공통).

서버 계약을 실측한 결과 **프리셋 개념은 서버에 없다.**

| 파라미터 | 실제 값 |
| --- | --- |
| `periodType` | `CREATED_AT` / `UPDATED_AT` 2개뿐 — 시안의 `[기간구분 ▾]`(어느 날짜 필드로 거를지) |
| `startDateTime` / `endDateTime` | 실제 날짜 범위 |
| `timezone` | IANA 형식 문자열 (`Asia/Seoul`, `UTC` 등) |

즉 `1개월`을 누르면 **클라이언트가 날짜를 계산해서** `startDateTime`/`endDateTime`으로 보낸다.
따라서 "어느 timezone으로 하루 경계를 자를 것인가"를 앱이 반드시 확정해야 한다.
설계 §5는 이 값을 app provider가 소유하고 브라우저 timezone을 암묵적 정책으로 쓰지 말라고 한다.

## 결정

**기준 timezone은 `UTC`로 고정한다.** 기간과 시간에 관련된 모든 처리를 UTC 기준으로 한다.

### 규칙

1. **app provider가 소유하는 앱 timezone은 `UTC`다.** feature나 컴포넌트가 각자 정하지 않는다.
2. **하루 경계를 UTC로 계산한다.** `1주`, `1개월` 같은 프리셋의 시작·끝, `오늘`의 범위 모두 UTC 기준이다.
3. **전송 형식**
   - instant: `Z`가 명시된 ISO string (`2026-08-27T00:00:00Z`). offset 생략 금지.
   - 날짜 전용 값: `YYYY-MM-DD`
   - 시간 전용 값: `HH:mm`
   - `timezone` 파라미터에는 `UTC`를 보낸다.
4. **`Date` 객체를 API 모델이나 form 모델에 보관하지 않는다.** 경계에서 문자열로 변환한다.
5. **브라우저 timezone(`Intl.DateTimeFormat().resolvedOptions().timeZone`)을 정책으로 쓰지 않는다.**
   표시용 포맷팅에도 앱이 확정한 zone을 명시적으로 넘긴다.
6. `shared/lib/datetime`의 변환 함수는 **timezone을 인자로 받는 순수 함수**다. 내부에서 zone을 추측하지 않는다.
   어떤 local-day boundary를 request에 넣을지는 feature가 소유한다(설계 §5).

### 소유권

| 대상 | 소유자 |
| --- | --- |
| 앱 기준 zone(`UTC`) | `src/app/providers/TimezoneProvider.tsx` |
| 순수 변환 함수 (zone을 인자로 받음) | `src/shared/lib/datetime.ts` |
| 프리셋 → `startDateTime`/`endDateTime` 계산, 경계 포함 여부 | `features/{domain}/list/*` |
| `timezone` 파라미터 전달 여부 | feature (35개 operation에만 존재하므로 transport 자동 주입 금지 — ADR 0001 §2.4) |

## 알아야 할 결과

기준이 UTC이므로 **한국 시간 오전 9시 이전에는 "오늘"이 한국 기준 어제를 가리킨다.**
예: KST `2026-08-27 08:00`은 UTC로 `2026-08-26 23:00`이며, `오늘` 프리셋은 UTC `08-26` 하루가 된다.

이는 UTC 고정의 정상적인 귀결이며 버그가 아니다. 운영자가 한국 시간 기준 날짜를 기대한다는
사실이 확인되면 그때 이 ADR을 개정하고 app provider의 zone 하나만 바꾼다.
계산은 전부 순수 함수에 있으므로 변경 지점은 한 곳이다.

## 폐기 조건

- 운영자가 현지 시간 기준 날짜 경계를 요구하는 것이 제품에서 확인되는 경우
- 다중 timezone 운영(해외 공연장 등)이 요구사항으로 확정되는 경우

두 경우 모두 `TimezoneProvider`의 zone 값과 이 ADR만 바꾼다. 순수 변환 함수와 feature 경계 코드는 유지된다.

## 검증

- `shared/lib/datetime` 단위 테스트에 DST gap/overlap과 UTC 왕복 회귀를 둔다.
- 목록 search schema 테스트에서 프리셋이 만들어내는 `startDateTime`/`endDateTime`이
  `Z` 명시 ISO string인지, 경계가 선언한 정책과 일치하는지 검사한다.
- 브라우저 timezone에 의존하는 코드가 없는지 확인한다(테스트 환경의 TZ를 바꿔도 결과가 동일해야 한다).
