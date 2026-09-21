# 11. 설정

표 형식은 [README.md](README.md). Notion 열의 `(대기)`는 아래 **Notion 요점**과 `notion/` 원문으로 대체한다. 11.1 운영자는 현재 Managers 구현의 원본 화면이다. 제품 route `/managers`는 `ManagerListScreen`을 사용하며, `ManagerApiListScreen`은 별도의 리허설 API 예제다.

2026-09-06 구현 대조: 아래 운영자 현재 코드는 제품 기본 경로의 **API 호출 직전 입력 경계**를 가리킨다. 기본값 false의 리허설 API 화면은 별도로 유지된다. 예시 옵션·행은 제품 서버 데이터가 아니다. 미연결 action은 업무별 요청 함수의 한글 로그까지 연결하고, 그 함수가 성공으로 끝나므로 화면은 실서버와 같은 성공 경로(저장 완료 alert → 이동 → 캐시 무효화)를 돈다. **실제 저장·발송·재인증이 서버에서 일어났다는 뜻은 아니다** — fixture 는 바뀌지 않으므로 재진입하면 이전 값이 보인다. 도달 상한은 `AGENTS.md` 의 도달 상태가 정한다. 구현·검증 상태는 [설정 시나리오](../scenarios/settings-and-permissions.md)가 소유한다.

## 11.1 운영자 — 목록

surface: `manager-list`

| id | 종류 | 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `manager-list.entry` | 열거 | 11.1 | 검색 전 상태 | 검색전(`126:61627`)·검색후(`126:61392`)·Case(`126:61314`) 3 frame | (대기) | — | `src/features/managers/screens/manager-list/ui/ManagerListScreen.tsx` |
| `manager-list.period` | 열거 | 11.1 | 기간 | 기준 가입일·최근접속일 + preset(기본 전체) + range | (대기) | — | `src/features/managers/screens/manager-list/ui/ManagerListFilters.tsx` |
| `manager-list.keyword` | 열거 | 11.1 | 검색어 | 대상 아이디·이름·휴대폰번호·이메일 + chip("이름 : 김영영") | (대기) | — | `src/features/managers/screens/manager-list/ui/ManagerListFilters.tsx` |
| `manager-list.permission-filter` | 서술 | 11.1 | **option-source select** | 권한: 단일 select, 옵션 = 서버 권한명 목록(`{권한명}` 반복) | 목록은 사용 상태인 전체 권한 중 택1; 등록·수정만 선택 유형에 종속 | 실제 옵션 계약 | `src/features/managers/api/useManagerOptions.ts` |
| `manager-list.filters` | 열거 | 11.1 | 다중선택 | 유형(전체·기획사·매표처), 가입경로(전체·WEB·APP), 계정 상태(전체·대기·거절·활성·비활성·잠금…) | (대기) | 리허설 `INACTIVE`와 거절·비활성·잠금 대응 | `src/features/managers/screens/manager-list/ui/ManagerListFilters.tsx` |
| `manager-list.toolbar` | 열거 | 11.1 | toolbar | 보기·정렬(가입일·최근접속일·유형·소속·아이디·이름·휴대폰번호·이메일·권한·가입경로·계정 상태). 우측 `선택▾`+`변경` · `등록` | 변경 대상은 계정 상태 > 활성/비활성, 대기·거절·잠금은 제외 | 전부 변경 불가인 선택의 후속 UX | `src/features/managers/screens/manager-list/ui/useManagerListResult.ts` · `src/features/managers/screens/manager-list/ui/ManagerListActions.tsx` |
| `manager-list.table` | 열거 | 11.1 | table | checkbox. 유형·소속·아이디·이름·휴대폰번호·이메일·권한·가입경로·계정 상태·가입일(정렬)·최근접속일 | 행 클릭→상세 | 실제 정렬·검색 응답 계약 | `src/features/managers/screens/manager-list/ui/manager-list-columns.tsx` · `src/features/managers/screens/manager-list/ui/ManagerListScreen.tsx`(`PagedListResult`) |
| `manager-list.empty` | 서술 | 11.1 | 빈 결과 | (미판독) | 메시지 `일치하는 검색결과가 없습니다.` — [원문](notion/99-cross-screen.md) 등장 화면에 설정 > 운영자 | — | `src/features/managers/screens/manager-list/ui/ManagerListScreen.tsx`(`PagedListResult`) |

## 11.1 운영자 — 상세

surface: `manager-detail`

| id | 종류 | 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `manager-detail.states` | 열거 | 11.1 | 상세 상태 | 운영자 조회 **5 variant**: 대기(`126:61280`)·거절(`126:61243`)·활성(`126:61199`)·비활성(`216:24789`)·잠금(`216:24996`) | 아래 상태별 action 표 참조 | 서버 상태 enum 대응 | `src/features/managers/screens/manager-detail/ui/ManagerDetailScreen.tsx` |
| `manager-detail.alerts` | 열거 | 11.1 | alert | 개인정보 전체보기(`126:61153`)·회원 탈퇴(`126:61146`)·탈퇴 알림(`126:61138`)·계정잠금해제(`126:61132`)·가입거절 사유(`216:25221`) | 재인증 입력·잠금해제 비밀번호·거절 사유 | 재인증 성공 이후 공개/탈퇴 처리 | `src/features/managers/screens/manager-detail/ui/ManagerActionForm.tsx` |

## 11.2 약관 · 11.3.2 접근권한 — 리스트

| 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |
| --- | --- | --- | --- | --- | --- |
| 11.2 약관 | 구조 | 리스트(검색전 없음)·Case·조회·등록·수정. 미판독 | (대기) | — | — |
| 11.3.2 접근권한 | 리스트 | 검색전 없음. 기간 등록일·최근업데이트일, 검색어 권한 1개, 유형(기획사·매표처)·사용 상태. toolbar `선택▾`+`변경` · `선택복사` · `등록`. table 유형·권한·사용 상태·등록일/최근업데이트일 | (대기) | — | — |
| 11.3.2 접근권한 | 상세·등록·수정 | 조회·등록·수정 frame. 권한은 화면 행마다 가능한 기능 집합이 다른 `화면 × 기능` 조합 | (대기) | 서버 권한 식별자 | `CheckboxTree`가 `nodes/values/onValueChange/selectAllLabel/emptyMeansAll`로 controlled leaf 선택을 소유하며 matrix 의미는 소유하지 않음 |

## 11.1 운영자 field-level 증거 (2026-08-31 원장에서 이관, `126:61627` 검색전 / `126:61392` 검색후 직접 대조)

| surface | Figma에서 관찰한 내용 | 레퍼런스 반영·경계 |
| --- | --- | --- |
| 기간 | 기준 선택, 빠른 기간 선택, 하나의 compact range surface와 calendar affordance | feature가 기준·채택 preset·검증 문구를 소유. `PeriodField`는 caller가 준 preset만 렌더하고 두 date input을 하나의 시각 surface로 묶으며 선택된 반대쪽 날짜로 native input과 calendar 선택 범위를 제한 |
| 검색어 | 검색 대상 선택, 입력, 추가 action, 선택된 검색 조건의 사람이 읽는 label | keyword enum과 번역 label은 Managers가 소유하고 shared chip mechanic에는 완성된 표시 문자열을 준다 |
| 유형·가입경로·상태 | 복수 선택과 전체 선택 | option source와 enum 의미는 feature 소유. rehearsal `INACTIVE`를 Figma의 거절·비활성 의미로 확정하지 않는다 |
| 결과 toolbar | 결과 수, 보기 수, 정렬과 방향 | 각 control은 독립 shared mechanic. **2026-09-02 재판정: 방향 컨트롤은 Figma에 없음**(위 표). 방향 전환은 활성 헤더 클릭(`DataTable.meta.sort`) |
| table | 유형, 소속, 아이디, 이름, 휴대폰번호, 이메일, 권한, 가입경로, 계정상태, 가입일, 최근접속일 | Managers column이 순서와 copy를 소유. rehearsal DTO의 `updatedAt` 매핑은 제품 최근접속일 계약이 아님 |
| paging | 결과 table 아래 page navigation | URL page와 out-of-range 정책은 feature, 버튼·`aria-current` mechanic은 shared |
| 등록·수정 | `11.1.3 운영자 등록`, `11.1.4 운영자 수정` frame — ADR 0014의 관찰 근거. 등록은 아래 상세·폼·팝업 판독 절 참조. 수정 전체 구성은 이 절에서 미확인 | form 경계는 ADR 0014와 `form.md` |

## 11.3.x 정책 · 11.4 로그 — 설정 폼 유형

| 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |
| --- | --- | --- | --- | --- | --- |
| 11.3.3 회원 | **페이지 tab** | 헤더 아래 tab(회원 설정 · 회원 등급 · SNS 로그인 연동) — tab별 별도 frame | (대기) | tab이 URL인지 | 없음 |
| 11.3.3 회원 | 접이식 섹션 폼 | 섹션 4개(APP 회원가입 및 본인인증 관리 / 아이디 저장 및 탈퇴 관리 / 불량회원 관리 / Admin 회원가입) 각 `^`. 필드: select(사용/사용안함, `*` 필수), 문장 속 숫자 input("…기준으로 이의제기는 [14] 일까지 가능하다"), **반복 목록 필드**(`⊕ 사유 추가` + 행별 input·`⊖ 삭제`, placeholder "사유 (100자 내외)") | (대기) | 반복 목록 상한 | `SectionCard`, `FormField` |
| 11.3.3 회원 | 폼 action | 하단 중앙 `저장`(primary) `취소` | (대기) | 취소 확인 alert | Managers form의 취소 경로는 `useUnsavedChangesGuard.leave()` |
| 11.3.3 회원 | 회원 등급 tab | `회원 등급 리스트` + Case + 등록·수정 — 설정 안의 소규모 CRUD list | (대기) | — | — |
| 11.3.1 메뉴/기능 · 11.3.5 전시 · 11.3.6 다국어 | 구조 | 단일 frame(전시는 +Case). 미판독 | (대기) | — | — |
| 11.3.4 마케팅 | 구조 | 메시지 설정(+Case)·자동 발송 등록(+Case)·수정·팝업 메시지 변수. 미판독 | (대기) | — | — |
| 11.4 로그 | 구조 | 6개 리스트 frame(로그인·조회·다운로드·등록·수정·삭제) + 각 Case. 한 화면 안의 종류별 리스트(tab 추정, 미판독) | Notion 요점 참조 | tab vs 별도 route | — |

## 11.1 운영자 — 등록

surface: `manager-create`

| id | 종류 | 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `manager-create.form` | 열거 | 11.1 운영자 등록 | 단일 접이식 섹션 폼 | "운영자정보" `^`. 2열: 유형*·권한*(select) / 아이디* / 비밀번호*·비밀번호 확인* / 이름* / 휴대폰번호*·이메일* / 소속. `저장`·`취소` | 유형 옵션은 정책 설정 목록; 권한은 선택 유형에 종속되고 유형 변경 시 초기화 | 실제 옵션·서버 중복검사 계약 | `src/features/managers/screens/manager-form/ui/ManagerCreateScreen.tsx` · `src/features/managers/screens/manager-form/ui/ManagerForm.tsx` |

## 11.1 운영자 — 수정

surface: `manager-edit`

| id | 종류 | 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `manager-edit.form` | 열거 | 11.1 운영자 수정 | 단일 접이식 섹션 폼 | 등록과 같은 필드 골격, 아이디 읽기 전용 | 등록과 같은 option-source 계약 | 수정 전체 구성·실제 저장 API | `src/features/managers/screens/manager-form/ui/ManagerEditScreen.tsx` · `src/features/managers/screens/manager-form/ui/ManagerForm.tsx` |

## 기타 설정 — 상세·폼·팝업 판독 (2026-09-02 ①′)

| 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |
| --- | --- | --- | --- | --- | --- |
| 11.3.2 접근권한 등록 (`129:72959`) | 폼 + **권한 matrix** | 기본정보(유형*·권한*·사용 상태*) + "ZEROPLUS Admin" 섹션. 헤더 `기능1~8`은 익명 슬롯이며 실제 기능 집합은 행마다 다르다: 대시보드=조회, 전체·일반·불량회원=조회·등록·수정·탈퇴·SMS/이메일·일괄변경, 휴면회원=조회·수정·탈퇴·SMS/이메일, 탈퇴회원=조회, 회원상담=조회·등록·수정·삭제·다운로드, 회원접속=조회·다운로드 등 | Notion: 상위 레벨 선택 시 하위 전체 선택/해제 | 서버 권한 식별자 | `CheckboxTree`가 controlled leaf 선택과 `emptyMeansAll` 표현을 소유; 화면별 기능 집합은 caller 소유 |
| 11.3.4 마케팅 | **page tab + 조건부 섹션 + sub-tab** | tab(메시지 설정·자동 발송). 자동 발송 설정(SMS·카카오 알림톡·이메일 select). Case: 사용 시 "메시지 사용 설정" 섹션 노출 + sub-tab(SMS·카카오 알림톡·이메일) + 조건부 필수 필드(발송 예외설정*, 이름*, 발신용 연락처* / 채널*, 업종 카테고리* cascade, 휴대폰번호* + `인증` + 인증코드*) | (notion/11 참조) | 인증 흐름 | 없음 |
| 11.3.6 다국어 | **편집 가능 테이블 폼** | 검색어(chip) + 검색/초기화 → 표(No.·KEY·한국어·일본어·영어 input) → 하단 `저장`·`취소`. paging 없음(`- 이하 생략 -`) | Notion: 초기화 문장 존재 | 행 수 상한·저장 단위 | `list.md` kind D |
| 11.4 로그인 | list/Case | `129:77782`/`129:77731`. 정렬 `접속일시·아이디·구분·결과·IP`. `구분`·`결과` 필터는 로그인에만 있다 | (notion/11 참조) | tab이 URL인지 | 기간 기본값 세 번째 변형(전체/1개월/7일) |
| 11.4 조회 | list/Case | `129:77583`/`129:77548`. 정렬 `수행일시·아이디·IP·메뉴·경로` | (notion/11 참조) | — | — |
| 11.4 다운로드 | list/Case | `129:77400`/`129:77365`. 정렬 `수행일시·아이디·IP·메뉴·경로` | (notion/11 참조) | — | — |
| 11.4 등록 | list/Case | `129:77217`/`129:77182`. 정렬 `수행일시·아이디·IP·메뉴·경로` | (notion/11 참조) | — | — |
| 11.4 수정 | list/Case | `129:77034`/`129:76999`. 정렬 `수행일시·아이디·IP·메뉴·경로` | (notion/11 참조) | — | — |
| 11.4 삭제 | list/Case | `129:76851`/`129:76816`. 정렬 `수행일시·아이디·IP·메뉴·경로` | (notion/11 참조) | — | — |

관찰: 로그 6종은 각각 list/Case top-level frame이며 모두 `다운로드` action을 가진다. 정렬 축은 로그인 1종과 나머지 5종으로 갈리고 `메뉴`·`경로`가 신규 surface다. 목록의 렌더 값 `등록일`은 컴포넌트 기본값이라 정렬 옵션이 아니다. 한 화면의 tab인지 별도 route인지는 미확인이다.

## Notion 요점 (원문: [notion/11-settings.md](notion/11-settings.md))

- 운영자: gate 명시. 보기 100·정렬 가입일 or 마지막 값. 일괄변경 Case02에 **예외**: "[계정 상태 : 대기, 거절, 잠금]은 변경되지 않음 → '[대기, 거절, 잠금]은 상태를 변경할 수 없습니다.'" 확인 alert에 병기.
- 유형 옵션: "[설정 > 정책 > 회원]의 admin 회원가입 > 유형으로 설정된 유형 리스트" (운영자·접근권한·회원가입 공통 option source).
- 선택복사(스마트프린터·약관·접근권한): "1개 이상 선택시, 복사 완료 alert". 삭제 불가 alert(스마트프린터·접근권한·정책 회원).
- 로그: 로그인·조회·다운로드·등록·수정·삭제 6 리스트, 기간 접속일/수행일, 검색어 아이디·IP, 결과 다중선택(성공·실패·계정잠금·잠금해제). 무결과 문구 "일치하는 검색결과가 없습니다."

## 운영자 상태·연결 입력 (2026-09-06 Notion 직접 대조)

출처: [운영자 원문](https://app.notion.com/3875169ef2f080f5bd0dcf0e532a4001)의 상태별 조회·등록·수정 절. `notion/11-settings.md` 추출 표는 연결 팝업과 비활성·잠금 절을 완전히 담지 않으므로 아래 원문 링크도 확인한다.

| 상태 | 사용자 action | 현재 호출 직전 경계 |
| --- | --- | --- |
| 대기 | SMS, 비밀번호 변경 비활성, 개인정보 전체보기, 가입 승인·거절 | 승인 확인→ID / 거절 사유→ID+사유 / 재인증 비밀번호→검증 입력 |
| 거절 | SMS·이메일, 비밀번호 변경 비활성, 삭제 | 삭제 확인→ID |
| 활성 | SMS·이메일, 비밀번호 변경, 비활성화, 개인정보 전체보기, 수정, 탈퇴 | 상태 확인→ID / 비밀번호 입력 / 수정 폼 / 재인증 입력 |
| 비활성 | 활성과 같되 활성화 | 활성화 확인→ID; 나머지 동일 입력 경계 |
| 잠금 | 활성과 같되 계정잠금해제 | 새 비밀번호·확인 일치 검증→ID+비밀번호 |

- [비밀번호 변경](https://app.notion.com/3825169ef2f080c5970fc24eb1adee2c): 8–20자, 대/소문자·숫자·특수문자 중 3종, 영문/숫자 3연속·3반복 금지, 확인 일치. 현재 비밀번호 재사용 여부는 서버 검사라 구현하지 않는다.
- [개인정보 전체보기](https://app.notion.com/3825169ef2f080d49f99d45c6707a2c0)·[대기 상태 연결](https://app.notion.com/3825169ef2f0802e8c10ee7a58ec64de): 현재 운영자 비밀번호 입력까지만. 성공을 가장해 마스킹을 해제하지 않는다.
- [회원 탈퇴](https://app.notion.com/3825169ef2f080309ea2cd2e6f16f44f): 사유 5자 이상+현재 운영자 비밀번호→첫 검증 요청 입력. 성공 응답 뒤 최종 탈퇴 확인은 이 경계 이후다.
- 등록 입력: 이름은 한글·영문·일문·중문·숫자 1–10자, 전화는 숫자·하이픈 1–20자, 이메일은 3–100자 및 형식 검증. 수정의 아이디는 읽기 전용이다. 예시 유형 값과 `agencyId` 리허설 조건은 제품 정책으로 확정하지 않는다.
- 코드 진입 (`src/features/managers/` 기준): `screens/manager-list/model/manager-list-search.ts`·`screens/manager-list/ui/ManagerListScreen.tsx`, `screens/manager-form/ui/ManagerForm.tsx`, `screens/manager-detail/ui/ManagerDetailScreen.tsx`·`screens/manager-detail/ui/ManagerActionForm.tsx`. focused tests는 각 화면 옆에 있다. fixture 검색은 입력/URL 경계만 검증하며 서버 결과 필터링·정렬 응답을 모사하지 않는다.
