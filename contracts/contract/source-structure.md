# 계약 — 소스 배치와 의존 방향

**답하는 질문**: 새 파일이 어디에 놓이고, 무엇이 무엇을 import 할 수 있으며, 이름을 어떻게 짓는가.

**담지 않는 것**: 한 화면이 어떤 파일을 갖는가 — 그것은 그 역할 계약의 `형태` 절이다. 제품 값 —
그것은 fact 다.

## 구조

```text
src/
  app/                         # provider, router, shell, 앱 경계·metadata
  routes/                      # URL 검증, guard, loader, 도메인 간 조립
  features/
    {domain}/
      api/                     # keys, query options, mutation options, API 전용 훅
      model/                   # 도메인 공통 값·타입·순수 규칙
      fixtures/                # 서버 연결 전 예시 데이터 (예시임이 드러나는 값)
      i18n/locales/{locale}/   # 이 도메인의 번역 namespace
      mechanics/{capability}/  # 같은 도메인의 두 화면이 같은 의미·전이·실패로 쓰는 조각
      screens/{entity}-{role}/ # 화면 하나. ui/ 와 model/ 만 만든다
  shared/                      # 도메인·서버 계약을 모르는 공용 코드
    ui/{family}/               # 렌더 계약
    model/                     # 렌더하지 않고 상태 수명·전이·정책 값을 소유
    lib/                       # 상태도 렌더도 없는 결정적 계산
  api/                         # 공용 transport, 공용 query 투영, 교체 가능한 generated
  test/                        # 테스트 setup, 여러 화면을 조립하는 workflow 테스트
```

`{role}` 은 `list` · `detail` · `form` 이다. 별도 `pages` 레이어는 없다.

## 이름

`{entity}` 는 surface ID 도 route segment 도 model 타입 이름도 아니다 — **그 폴더 이름만 보고
무엇을 다루는 화면인지 읽히는 최소 한정자**이며 singular kebab-case 다.

- 기본 명사만으로 읽히면 그대로 쓴다.
- 그 명사가 **무엇에 속한 것인지 물어야** 읽히면 속한 대상을 앞에 붙여 `{owner}-{noun}-{role}` 로 쓴다.
- 읽히는가의 기준은 상위 폴더 경로가 아니라 **폴더 이름 단독**이다. 상위 폴더가 이미 말해 준다는
  이유로 접두를 생략하지 않고, 도메인의 대표 엔티티라도 마찬가지다.
- model 타입·행 타입과 1:1 이 아니어도 되고, 한 화면 폴더가 여러 URL 변형을 열 수도 있다.
- **한정자는 폴더 이름과 진입 Screen 에만 붙인다** — 폴더 안의 파일은 그 폴더 안에서 읽히므로 짧은
  이름을 쓴다.

**URL segment 는 외부 계약이며 화면 폴더 이름과 일치할 필요가 없다.** resource collection 은 복수형
noun 이 기본, 상태·workflow·고정 view 는 제품 IA 가 준 이름을 따르며(복수형이 아닌 경우가 많다),
**제품이 이미 확정한 URL 이 두 기본값보다 우선한다.** route 파일 모양은 URL 을 그대로 비춘다 — 단일
leaf 는 평면 파일, leaf 가 둘 이상인 segment 는 디렉터리 + `index`.

## 배치 판단

| 책임 | 위치 |
| --- | --- |
| 서버 호출·Query 키·options, mutation options, ID·locale 만 묶는 조회 훅, 선택지 투영 훅 | `domain/api` |
| 도메인 공통 값·데이터 타입·업무 규칙 | `domain/model` |
| 상태·업무 전이를 소유하지 않는 순수 도우미 | 가장 가까운 소유자의 `lib` |
| 도메인을 모르고 렌더하지 않으며 상태 수명·전이를 소유하는 재사용 단위 | `shared/model` |
| URL 선언·검색 초안·조회 사실·액션 정책·폼 schema·기본값·요청 mapper | `screens/{entity}-{role}/model` |
| Screen·Filters·Result·Actions·컬럼·렌더와 결합된 훅 | `screens/{entity}-{role}/ui` |
| 같은 도메인의 **두 화면**이 같은 의미·상태·실패 계약으로 쓰는 기능 | `mechanics/{capability}/{ui,model}` |

확장자로 분류하지 않는다. `use` 접두사도 판정 근거가 아니다 — 렌더 계약을 소유하면 `ui`,
상태 수명·전이나 허용 값을 소유하면 `model`, 둘 다 아니면 `lib` 이다.

**두 화면이 같은 조립을 그린다면 읽기 전용이어도 `mechanics` 다.** 화면이 형제 화면을 import 하는
것은 lint 가 막으므로, 공유가 실제로 필요하면 소유자를 옮기는 것이 유일한 경로다. 다만 소비자가
둘이라는 숫자만으로 올리지 않는다 — 의미·상태·실패가 같은지 먼저 확인하고, 달라지거나 단일
소비자로 좁아지면 되돌린다.

`mechanics` 는 소유자가 애매한 파일을 넣는 곳이 아니다. 도메인에 종속된 재사용 기능은 `shared` 로
올리지 않는다.

## 공용 단위의 승격

코드 모양이 아니라 **의미와 상태 전이**로 판단한다.

```text
첫 소비자    → 기능 내부에서 가장 단순하게 구현
두 번째      → 공통점과 차이를 비교
반복         → 의미·입력·상태 전이·실패·수명이 같을 때만 승격 검토
```

**쓰는 것과 승격하는 것은 다른 결정이다.** 기존 계약이 그대로 맞으면 그냥 쓰고 이 절을 열지 않는다.
한 곳에서만 필요하면 그 기능 안에 두고 역시 열지 않는다.

승격하려면 넷이 모두 참이어야 한다.

- 비교한 호출자들에서 의미·상호작용 수명·소유·실패 동작이 같다
- 공개 계약에 도메인 타입·서버 DTO·Query·Router·권한·mutation 정책이 없다
- 자원·엔티티 switch, 도메인 mode, schema 주입, callback override 가 필요 없다. 단위가 필드·DTO·
  endpoint·목적지를 배우지 않는 불투명 인자(읽지 않는 schema 타입 인자, `run(values)` callback,
  순수 분류 결과, 완료 callback, `resetKey` 문자열)는 schema 주입이 아니다
- 하나의 구현이 **관측된** 변경 비용이나 결함 위험을 줄인다(반복된 결함, 소비자마다 다시 쓰는 전이,
  한 번 놓친 접근성 불변식)

시각적 유사성, 예상되는 재사용, 기계적인 세 번째 발생은 근거가 아니다.

**승격하지 않을 신호**: 도메인 이름이나 제품 값을 알아야 함 · 경로·권한·캐시를 직접 알아야 함 ·
호출자마다 mode 가 늘어남 · callback 과 설정으로 차이를 계속 흡수함 · 한 소비자 때문에 공개 API 가
넓어짐 · 생김새만 같고 실패·수명이 다름.

맞지 않으면 **중복을 허용한다.** 읽기 쉬운 명시적 조립이 잘못된 추상화보다 낫다.

승격한 단위는 계약을 공개한다: 입력 / 출력 / 소유하는 상태와 수명 / 직접 하는 부작용 / 처리하는
실패의 범위 / **호출자에게 남기는 것** / 좁히거나 되돌릴 조건. 첫 소비자는 소비자이지 소유자가 아니다 —
두 번째 실제 workflow 가 같은 의미·수명·실패를 확인하기 전까지 그 단위는 잠정이다.

## 의존 방향

- `routes/` 는 여러 feature 를 조립할 수 있다. feature 는 다른 feature 의 UI·model·훅을 import 하지
  않는다.
- 화면은 형제 화면을 import 하지 않는다.
- `shared/lib` 은 React 를 import 하지 않고 훅을 export 하지 않는다. `shared/model` 은 JSX 를 갖지
  않는다.
- component 는 generated operation 을 직접 부르지 않고 query key 를 다시 만들지 않는다.
- 훅 하나는 상태·동작 소유자 하나를 갖는다. query·mutation·form·dialog·toast·navigation·permission 을
  한 page controller 훅에 묶지 않는다.
- 업무 차이를 흡수하는 범용 CRUD 훅·resource 서술자·resource framework 를 만들지 않는다.

위 경계 중 기계가 보는 것은 `eslint.config.js` 와 `scripts/` 의 검사다. 문서는 이유와 예외 경로만
설명한다.

## 이 계약의 검증 대상

| 축 | 무엇을 확인하나 |
| --- | --- |
| import | 금지된 방향이 실제로 lint 에서 걸리는가 |
| 조립 | 새 파일이 실제 소비자에서 조립되어 앱에서 도달 가능한가 |
| 빌드 | `build` 가 통과하는가 |
| 이동 | 이동한 파일을 가리키던 import·테스트·검사 fixture·문서 링크가 모두 따라왔는가 |

이동표만으로 완료를 주장하지 않는다. UI·URL·권한·번역·payload·Query 키는 폴더 이동을 이유로
바꾸지 않는다.
