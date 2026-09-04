# 0008. 공용 primitive 구현 선택

- 상태: 승인됨
- 날짜: 2026-08-27
- 개정: 2026-09-01 (`Select`, `Collapsible` 판정 변경), 2026-09-02 (shadcn/ui CLI 금지 해제)

| Primitive                | 선택             | 근거                                                                                                             |
| ------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| Popover, Dialog          | Radix            | focus trap, Escape/outside dismiss, trigger focus 복원                                                           |
| **Select**               | **Radix**        | **드롭다운 패널의 디자인 대조와 다른 선택 control 과의 시각 일관성. 아래 "개정 1" 참조**                          |
| **Accordion (섹션 개폐)**| **Radix**        | **trigger–content 의 `aria-controls`·`region` 연결. 아래 "개정 2" 참조**                                          |
| Checkbox, RadioGroup     | native           | 브라우저가 완전한 단일-control 키보드/접근성 의미를 제공. RadioGroup은 모든 item을 하나의 `name`으로 묶어야 한다 |
| Calendar                 | react-day-picker | 날짜 그리드와 키보드 탐색                                                                                        |
| MultiSelect, CheckboxTree| 직접 구현        | 도메인 없는 controlled 선택 대수                                                                                 |
| Table, Badge             | native/직접 구현 | semantic markup 또는 token 표현                                                                                  |

선택은 `shared-ui-contract` primitive 소유권과 `select.md`·`form-fields.md` 의 명시적 public contract 를 따른다.
구현 선택이 바뀌어도 public contract 는 바뀌지 않는다. `Select` 는 교체 전후로 동일하게
`value: string | null`, `onValueChange`, `options`, `placeholder` 만 노출한다.

## 이 저장소의 primitive 는 이미 source-owned Radix + Tailwind 다

`shadcn/ui` 와 같은 모델이다. 컴포넌트 소스를 저장소가 소유하고, Radix 가 동작을, Tailwind 토큰이
표현을, `shared/lib/cn` 이 class 병합을 담당한다. 처음에는 `components.json` 과 CLI 를 두지 않았다.
카탈로그 전체를 미리 가져오는 것이 `shared-ui-contract` 의 "Do not prebuild a component catalog" 와
충돌한다고 봤기 때문인데, 이 금지는 개정 3에서 철회했다. 채택 단위는 여전히 **현재 화면이 실제로
요구하는 primitive 하나**다.

## 개정 1 — `Select`: native → Radix

최초 판단의 근거는 "브라우저가 완전한 단일-control 접근성을 제공한다"였고 그 자체는 지금도 옳다.
다음 두 사실이 그 이점보다 크다고 판정한다.

1. **native `<select>` 의 드롭다운 패널은 OS 가 그린다.** 옵션 목록의 모서리, hover, 선택 표시,
   chevron 을 디자인과 대조할 수 없다. 디자인 대조가 완료 증거인 이 저장소에서 "대조 불가"는
   구현 선택의 결격 사유다.
2. **이미 시각 일관성이 깨져 있다.** `Combobox` 는 Radix Popover 조립, `MultiSelect` 는 직접 구현으로
   커스텀 표면인데 `Select` 만 native 다. 같은 필터 행이나 폼 행에 나란히 놓이면 서로 다르게 보인다.

제품이 내부 운영자용 데스크톱 어드민이므로 native select 의 남은 이점(모바일 OS 선택 휠)은
현재 확인된 사용 맥락에 해당하지 않는다. 모바일 운영 화면이 제품 요구로 확인되면 이 판정을
다시 연다.

Radix `Select` 는 빈 문자열 value 를 금지한다. placeholder 는 옵션이 아니라 `Select.Value` 의
placeholder 로 표현하고, 공개 계약의 `null` 은 Root 의 controlled empty-string 값으로 매핑한다. 이 매핑은
primitive 안에 갇히고 호출부는 알지 않는다.

## 개정 2 — 폼 섹션 개폐: 직접 구현 → Radix Accordion

최초 판단의 근거는 "단일 disclosure 의 `button`/`aria-expanded` 상태만 필요"였다. 등록/수정 화면이
섹션을 여러 개 갖는 화면 유형으로 확인되면서 그 전제가 깨졌다.

- 직접 구현한 헤더 버튼에는 `aria-controls` 가 없고 콘텐츠에 `region` 역할이 없다. 실제 접근성 결함이다.
- 이 연결은 손으로 다시 만들 이유가 없는, primitive 가 이미 소유한 동작이다.

현재 `Accordion` primitive 는 인스턴스당 섹션 하나다. Radix 의 형제 trigger 간 화살표 이동은 여러
item 이 하나의 Root 아래 있어야 하는데, 그 배치를 요구하는 확인된 화면이 아직 없다. 그런 화면이
확인되면 다시 연다. 지금 얻은 것은 연결과 역할이지 다중 섹션 키보드 이동이 아니다.

`Collapsible` primitive 는 **삭제했다**(2026-09-01). `SectionCard` 가 `Accordion` 기반으로 바뀌면서
폼 밖의 단일 disclosure 소비자가 하나도 남지 않았고, 위 유지 조건이 스스로 삭제를 지시했다.
자기 테스트만 참조하는 primitive 는 계약이 아니라 재고다.

같은 시점에 `Combobox`·`MultiSelect`·`RadioGroup`·`Calendar`·`CheckboxTree` 는 반대 판정을 받았다.
소비자가 0이었지만 form 어댑터(`FormComboboxField`, `FormMultiSelectField`, `FormRadioGroupField`,
`FormDateField`/`FormDateRangeField`, `FormPermissionTreeField`)가 생기며 실제 소비자를 얻었다.
**"소비자 0"은 삭제 근거가 아니고, "소비자가 생길 예정도 없음"이 삭제 근거다.**

**Radix Accordion 도 닫히면 콘텐츠를 언마운트한다.** 따라서 교체만으로 "닫힌 섹션의 검증 오류가
보이지 않는" 문제가 해결되지 않는다. 그 책임의 소재는 `0010-form-boundaries.md` 가 소유한다.

## 개정 3 — shadcn/ui CLI 금지 해제 (2026-09-02)

"`components.json` 과 CLI 를 두지 않는다"는 판정을 철회한다. 신규 프로젝트는 shadcn/ui CLI 로 primitive
소스를 가져오는 것을 구현 모델로 삼으며 이미 그렇게 진행 중이다. CLI 는 소스를 가져오는 **수단**이지
카탈로그 선구축 허가가 아니다. 유지되는 것은 다음이다.

- Radix 판정과 그 근거(focus trap, `aria-controls`·`region` 연결 등). shadcn/ui 컴포넌트는 같은 Radix 위의 소스 복사물이다.
- 채택 단위는 현재 화면이 요구하는 primitive 하나. CLI 로 한 번에 여러 컴포넌트를 가져오는 것은 여전히 금지다.
- 공개 계약은 구현체 이름을 쓰지 않는다. `SectionCard` 가 요구하는 controlled 개폐·`keepMounted`(`forceMount` + `hidden`)·
  `errorCount` 배지·trigger/content 연결은 `disclosure-sections.md` 가 소유하고, 직접 조립한 `Accordion` 이든 shadcn 의
  `Accordion/AccordionItem/AccordionTrigger/AccordionContent` 이든 같은 계약을 구현한다.

이 레퍼런스 저장소에서는 `init`·CLI 를 돌리지 않는다. 여기가 신규 프로젝트에 넘기는 것은 구현체가 아니라 계약과
그 검증(테스트·ADR)이며, 현재 코드의 Radix 직접 조립은 그 계약의 한 구현으로 남긴다. shadcn 의 semantic CSS 변수 토큰 층
(`--background` 등)은 신규 프로젝트의 토큰 소유자가 결정하고, 이 저장소의 raw Tailwind 클래스는 이관 대상이 아니다.

## 재검토 조건

- 모바일 또는 터치 운영 화면이 제품 요구로 확인될 때 (`Select`)
- Radix 가 소유한 동작을 우회하려고 primitive 에 prop 이 늘기 시작할 때
- public contract 를 바꾸지 않고는 디자인을 대조할 수 없는 primitive 가 새로 생길 때
