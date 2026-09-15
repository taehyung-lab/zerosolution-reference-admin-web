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
      i18n/locales/{locale}/     # 이 도메인의 번역 namespace. app/i18n/resources.ts 가 등록한다
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
  shared/                      # 도메인·서버 계약을 모르는 공용 코드
    ui/{family}/               # 렌더 계약. primitives, form, filter, list, detail, dialog, layout, feedback
    model/                     # 렌더하지 않고 상태 수명·전이·정책 값을 소유
    lib/                       # 상태도 렌더도 없는 결정적 계산
    i18n/                      # 번역 runtime·locale·shared namespace resource
  api/                         # 공용 transport와 교체 가능한 generated
  test/                        # vitest setup, msw server, 여러 화면을 조립하는 workflow 테스트
```

`screens`는 전체 페이지뿐 아니라 route가 다른 도메인과 조립하는 기능 진입도 포함한다. 도메인의 대표 엔티티는 `list`·`detail`·`form` 그대로 쓰고(`<domain>/screens/list`), 대표가 아닌 엔티티나 두 엔티티가 같은 workflow 이름을 다투는 도메인은 엔티티를 접두한다(`<domain>/screens/<entity>-list`·`<entity>-detail`·`<entity>-form`). route 가 여는 다이얼로그 하나도 `screens/<workflow>` 다. 한 목록의 URL 변형들은 같은 `screens/list`를 쓰며 URL 계층을 그대로 복제하지 않는다. 별도 `pages` 레이어는 없다.

화면과 mechanic 안에는 필요한 `ui`·`model`·`lib`·`config`만 만든다. API는 domain/api에 모아
서버 계약의 탐색 위치를 고정한다. 단일 화면 전용 API도 여기 두되 화면 상태는 가져오지 않는다.
각 폴더를 미리 만들거나 파일 수를 맞추지 않는다. domain 루트에 화면명, form, hooks, types, common을 나란히 추가하지 않는다.

## 배치 판단

| 책임 | 위치 |
| --- | --- |
| 서버 호출·Query 키·옵션, 요청 실행과 조회 사실만 제공하는 훅 | `domain/api` |
| 도메인 공통 값·데이터 타입·업무 규칙 | `domain/model` |
| 상태·업무 전이를 소유하지 않는 날짜·문자열 등 순수 도우미 | 가장 가까운 소유자의 `lib` |
| 도메인을 모르고 렌더하지 않으며 상태 수명·전이를 소유하는 재사용 단위 | `shared/model` |
| 제목·필터·컬럼 노출 등 정적 구성 | 가장 가까운 소유자의 `config` |
| URL·검색·폼·선택 정책을 결합한 조회·mutation workflow | `screens/X/model` |
| 폼 스키마·초기값·요청 입력 변환 | 소비 화면의 `model`; 실제 공통 규칙만 domain model |
| 화면·표시용 컴포넌트·컬럼·렌더와 결합된 훅 | 소비 화면 또는 mechanic의 `ui` |
| 여러 화면이 같은 의미·상태·실패 계약으로 쓰는 기능 | `mechanics/{기능명}/{ui,model}` |

화면 안의 파일 집합(목록·상세·폼이 어떤 파일을 어떤 이름으로 갖는가)은 각 역할 reference의 `형태` 절
([목록](../feature-contract/references/list-workflow.md#형태), [상세](../feature-contract/references/detail-workflow.md#형태),
[폼](../feature-contract/references/form-workflow.md#형태), [route](../feature-contract/references/router.md#형태))이 소유한다.
이름·위치는 실제 소비자와 해당 형태 표로 리뷰하며, 이 표는 그 파일이 어느 segment 에 놓이는가만 정한다.

확장자로 분류하지 않는다. `use<Entity>ListResult.ts`는 컬럼과 표시 옵션을 조립하므로
`screens/list/ui`다. `use<Entity>InputForm.tsx`는 JSX·focus·폼 연결을 반환하는 UI 어댑터다.
검색 전이, 요청 입력, schema, mutation 후속 처리는 model에 남긴다. JSX를 없애려고 wrapper를 더하지 않는다.

`shared` 안의 세그먼트는 **소유하는 계약**으로 갈린다. 렌더(JSX·focus·ARIA·component props 계약)를
소유하면 `ui`, 렌더하지 않고 상태 수명·전이나 허용 값을 소유하면 `model`, 둘 다 아니면 `lib` 이다.
`use` 접두사나 확장자는 판정 근거가 아니다 — `useFormFeedback` 은 DOM focus 를 소유하므로 `ui` 에 남고,
`usePageRowSelection` 은 선택 수명만 소유하므로 `model` 이다. `ui` 아래 이름은 세그먼트가 아니라
렌더 계약 family 이며, 한 파일이 둘 이상의 family 에 해당하면 우선순위를 만들지 말고 파일을 나눈다.
`shared/lib` 의 React import·hook export 금지와 `shared/model` 의 JSX 금지는 `eslint.config.js` 가 본다.

`mechanics`는 소유자가 애매한 파일을 넣는 곳이 아니다. 현재 소비자와 공유하는 계약을 확인한다.
소비자가 둘이라는 숫자만으로 승격하지 않고, 의미가 달라지거나 단일 소비자로 좁아지면 재검토한다.
도메인에 종속된 재사용 기능은 `shared`로 올리지 않는다.

## 필요할 때만 읽는 reference

- import 경계를 새로 긋거나 넘을 때, 어떤 segment 가 어떤 segment 를 참조할 수 있는지: [references/dependency-direction.md](references/dependency-direction.md).
- 한 훅이 `api`인지 `model`인지, 상수가 `config`인지 `model`인지, 도우미가 `lib`인지 갈릴 때: [references/owner-boundaries.md](references/owner-boundaries.md).
- 화면 안 파일 집합은 위 배치 판단 절이 가리키는 각 역할의 `형태` 절이, 공용 승격은 [shared-ui-contract](../shared-ui-contract/SKILL.md)가 소유한다.

## 작업 시 연결

새 파일·이동·소유권 변경 전에는 실제 import 소비자를 확인하고 위 표로 위치를 정한다.
테스트는 검증하는 소유자 옆에 둔다. 여러 화면을 조립하는 통합 테스트는 `src/test/workflows`에 두며,
테스트 편의를 이유로 production import 경계를 완화하지 않는다.

이동하면 routes import, test mock, context index, 현재 참조 문서와 검사 fixture 경로도 대조한다.
이동표만으로 완료를 주장하지 않고 typecheck·lint·관련 테스트와 변경 범위의 화면 동작을 검증한다.
UI·URL·권한·번역·payload·Query 키는 폴더 이동을 이유로 바꾸지 않는다.

이 문서는 배치만 소유한다. 화면 조립·상태는 [feature-contract](../feature-contract/SKILL.md),
서버·캐시와 다른 도메인의 데이터·cache key를 쓰는 규칙은 [api-contract](../api-contract/SKILL.md)의
[query-cache](../api-contract/references/query-cache.md), 도메인 없는 공용 승격은
[shared-ui-contract](../shared-ui-contract/SKILL.md)를 함께 적용한다. 다른 도메인의 기능을 한 화면에
연결하는 자리는 위 구조의 `routes/`다. 기존 파일의 동작만 수정할 때는
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
