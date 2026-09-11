---
name: folder-structure-contract
description: Use when creating or moving source files, choosing a feature screen or domain mechanic owner, changing folder structure or import boundaries, or reviewing file placement. Not for behavior-only edits within an established owner.
---

# Folder Structure Contract

이 저장소의 폴더 배치와 의존 방향의 단일 정본이다. 도메인 응집을 유지하면서 도메인 루트를
역할별로 나눈다. FSD의 책임 분리 원칙을 참고하지만 정식 FSD 레이어 구조는 아니다.
소유자는 프로젝트 아키텍처다. 파일 배치·import 경계가 바뀌면 실제 소비자, 이 문서,
`eslint.config.js`와 정상·위반 대조군을 함께 대조한다.

## 구조

```text
src/
  app/                         # provider, router, shell, 앱 경계·metadata
  routes/                      # URL 검증, guard, loader, 도메인 간 조립
  features/
    {domain}/
      api/                     # 요청·응답 계약, Query options·keys, API-only 훅
      model/                   # 도메인 공통 값·타입·순수 규칙
      lib/                     # 필요한 순수 도우미
      config/                  # 필요한 정적 구성
      fixtures/                # 서버 연결 전 예시 데이터
      mechanics/
        {capability}/          # 도메인 내부에서 실제 재사용하는 기능
          ui/                  # 렌더와 표시 조립
          model/               # 실행·상태·업무 정책
      screens/
        {workflow}/            # list, detail, form 등 연관 화면군
          ui/                  # Screen, Filters, Result, Actions, columns
          model/               # 검색·선택·폼·mutation 후속 처리
          lib/                 # 이 workflow의 순수 도우미 (필요할 때)
          config/              # 이 workflow의 정적 구성 (필요할 때)
  shared/                      # 도메인·서버 계약을 모르는 UI·순수 공용 코드
  api/                         # 공용 transport와 교체 가능한 generated
```

`screens`는 전체 페이지뿐 아니라 route가 다른 도메인과 조립하는 기능 진입도 포함한다.
메시지 작성 다이얼로그는 `messaging/screens/compose`다. 회원 all/general/flagged는 같은
`members/screens/list`를 쓰며 URL 계층을 그대로 복제하지 않는다. 별도 `pages` 레이어는 없다.

화면과 mechanic 안에는 필요한 `ui`·`model`·`lib`·`config`만 만든다. API는 domain/api에 모아
서버 계약의 탐색 위치를 고정한다. 단일 화면 전용 API도 여기 두되 화면 상태는 가져오지 않는다.
각 폴더를 미리 만들거나 파일 수를 맞추지 않는다. domain 루트에 화면명, form, hooks, types, common을 나란히 추가하지 않는다.

## 배치 판단

| 책임 | 위치 |
| --- | --- |
| 서버 호출·Query 키·옵션, 요청 실행과 조회 사실만 제공하는 훅 | `domain/api` |
| 도메인 공통 값·데이터 타입·업무 규칙 | `domain/model` |
| 상태·업무 전이를 소유하지 않는 날짜·문자열 등 순수 도우미 | 가장 가까운 소유자의 `lib` |
| 제목·필터·컬럼 노출 등 정적 구성 | 가장 가까운 소유자의 `config` |
| URL·검색·폼·선택 정책을 결합한 조회·mutation workflow | `screens/X/model` |
| 폼 스키마·초기값·요청 입력 변환 | 소비 화면의 `model`; 실제 공통 규칙만 domain model |
| 화면·표시용 컴포넌트·컬럼·렌더와 결합된 훅 | 소비 화면 또는 mechanic의 `ui` |
| 여러 화면이 같은 의미·상태·실패 계약으로 쓰는 기능 | `mechanics/{기능명}/{ui,model}` |

화면 안의 파일 집합(목록·상세·폼이 어떤 파일을 어떤 이름으로 갖는가)은 각 역할 reference 의 `형태` 절이
소유하고([목록](../feature-contract/references/list-workflow.md#형태), [상세](../feature-contract/references/detail-workflow.md#형태),
[폼](../feature-contract/references/form-workflow.md#형태), [route](../feature-contract/references/router.md#형태)),
`contracts:check` 가 이름·위치를 대조한다. 이 표는 그 파일이 어느 segment 에 놓이는가만 정한다.

확장자로 분류하지 않는다. `useMemberListResult.ts`는 컬럼과 표시 옵션을 조립하므로
`screens/list/ui`다. `useManagerInputForm.tsx`는 JSX·focus·폼 연결을 반환하는 UI 어댑터다.
검색 전이, 요청 입력, schema, mutation 후속 처리는 model에 남긴다. JSX를 없애려고 wrapper를 더하지 않는다.

`mechanics`는 소유자가 애매한 파일을 넣는 곳이 아니다. 현재 소비자와 공유하는 계약을 확인한다.
소비자가 둘이라는 숫자만으로 승격하지 않고, 의미가 달라지거나 단일 소비자로 좁아지면 재검토한다.
도메인에 종속된 재사용 기능은 `shared`로 올리지 않는다.

## 의존 방향

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
  [API 계약](../api-contract/references/query-cache.md)이 소유한다.

API 입력 타입과 URL 정규화는 소유가 다르다. 공통 입력 타입은 api/model에 두고 URL schema는
소비 화면 또는 실제 공유 mechanic의 model에 둔다. 타입을 옮기면서 미확정 서버 DTO를 새로 정의하거나 캐시 identity를 바꾸지 않는다.

## API 훅과 model을 구분하는 기준

`use` 접두사나 API 호출 유무가 아니라 **입력과 결과, 소유하는 결정**을 본다.

- `api`: ID·locale·명시적인 조회 조건을 받아 요청하고 데이터·pending/error/retry 또는 안정된 옵션 값을 반환한다.
  `usePerformanceVenues`, `useManagerOptions`, `useMemberDetail`, `useMessagePolicy`가 해당한다.
  조회 조건의 선택은 caller가 소유한다. loader용 원본 queryOptions와 키를 그대로 공유한다.
- `model`: URL 정규화·검색 시작 여부·페이지 수·선택 대상·폼 종속 필드·mutation 후 캐시를 결정한다.
  `useMemberListData`, `useMemberListRecipients`, `useManagerFormOptions`, `useUpdateManagerMutation`이 해당한다.
- API-only mutation 훅도 가능하다(`auth/api/useSignInMutation`). 성공 후 session·navigation 등은
  호출 workflow가 처리한다. 캐시·폼·화면 동작을 옵션 팩토리나 API 훅에 감추지 않는다.
- 기존 API 훅은 이 기준으로 옮기되, 새 훅은 안정된 연결 책임이 있을 때만 만든다.
  함수 호출 한 줄을 감싸는 훅을 의무적으로 추가하지 않는다.

공연장 조회가 같은 도메인에서 재사용될 수 있어도 `shared` 데이터는 아니다. 다른 도메인의
실제 소비자가 생기면 [공용 reference data 조건](../api-contract/references/query-cache.md#shared-reference-data)을
대조한다. 미래 사용 가능성만으로 cross-feature import를 허용하거나 entities를 만들지 않는다.

## lib/config를 과하게 나누지 않는 기준

`model`은 모든 .ts 파일의 수납장이 아니며, `lib`도 나머지를 버리는 폴더가 아니다.
회원 날짜 formatter와 운영자 오류 번역 키 변환은 domain/lib, 회원 목록 노출 정의는
screens/list/config에 둔다. 메시지 공통 타입은 domain/model, 작성 schema/defaults는 compose/model,
dialog props는 compose/ui, 전화번호 표시 함수는 compose/lib가 소유한다.

상수라고 모두 config로 빼지 않는다. 검색 schema의 기본값, 정렬 허용 목록과 전이,
이력의 개인정보 비노출 정책은 이를 해석하는 model과 함께 둔다. 순수 함수여도 업무 판단을
소유하면 model이다. 특정 화면만 사용하는 행 mapper는 그 화면 model에 둔다.

## 현재 업무군의 배치

| 도메인 | screens | mechanics |
| --- | --- | --- |
| members | list, detail, form, counsel, appeals, access, dormant, withdrawn | record-list, activity, counsel-record |
| managers | list, detail, form | manager-select-options |
| performances | list, detail | 현재 필요 없음; form은 입력 정책 확인 대기 |
| community | board-list | — |
| messaging | compose | 현재 필요 없음 |
| auth | login | 현재 필요 없음 |

`record-list`는 기록 목록의 결과·필터와 회원 목록에서 공유하는 선택 액션을,
`activity`는 일반 상세·탈퇴 상세의 활동 목록을, `counsel-record`는 상세·상담의 상담 기록 편집을 소유한다.
`dormant`의 현재 파일은 표시 조립이므로 ui만 두고 조회·필터는 record-list mechanic을 소비한다.
운영자 제품/리허설 구현은 기존 list/detail/form 업무군 안에서 구분하며 서로의 서버 의미를 합치지 않는다.

## 작업 시 연결

새 파일·이동·소유권 변경 전에는 실제 import 소비자를 확인하고 위 표로 위치를 정한다.
테스트는 검증하는 소유자 옆에 둔다. 여러 화면을 조립하는 통합 테스트는 route/test 소유 위치에 두며,
테스트 편의를 이유로 production import 경계를 완화하지 않는다.

이동하면 routes import, test mock, context index, 현재 참조 문서와 검사 fixture 경로도 대조한다.
이동표만으로 완료를 주장하지 않고 typecheck·lint·관련 테스트와 변경 범위의 화면 동작을 검증한다.
UI·URL·권한·번역·payload·Query 키는 폴더 이동을 이유로 바꾸지 않는다.

이 문서는 배치만 소유한다. 화면 조립·상태는 [feature-contract](../feature-contract/SKILL.md),
서버·캐시는 [api-contract](../api-contract/SKILL.md), 도메인 없는 공용 승격은
[shared-ui-contract](../shared-ui-contract/SKILL.md)를 함께 적용한다. 기존 파일의 동작만 수정할 때는
루트의 해당 기능 스킬 라우팅을 따르며 이 문서를 매번 다시 읽지 않는다.

## 설계 참고와 채택 범위

[카카오페이 FSD 적용기](https://tech.kakaopay.com/post/fsd/)의 목적별 segment, 재사용 범위에 따른
소유권, import 방향을 참고했다(2026-09-07). 그 구조를 그대로 복제한 것은 아니다.

- **채택:** 업무 응집, 목적별 분리, 실제 재사용 확인 뒤 공통 소유자로 이동, 의존성 검사.
- **수정:** pages/features/entities 대신 현재 domain/screens/mechanics를 유지한다. API 계약은
  domain/api 한 위치에서 찾고 workflow별 상태는 screens/model에 둔다.
- **제외:** 전체 FSD 레이어 도입, 모든 폴더의 사전 생성, 단순 함수까지 lib로 분산하는 규칙.

자동 검사는 import 경계·React 실행 의존·API의 Router/Form/캐시 클라이언트 접근을 확인한다.
훅이 업무 정책을 숨겼는지와 helper/config의 의미는 실제 소비자와 코드 리뷰로 확인한다.
