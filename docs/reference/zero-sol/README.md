# ZEROsol 전체 surface 인벤토리

Figma `ZEROsol (For Kakao)`(`Ogb6WpSpwCVhKggQ1NLRlQ`) 78 page와 Notion `DB: Work Items` 중
프로젝트가 제로솔루션인 Feature 문서를 화면 × surface 단위로 대조한 **관찰 원장**이다.
런타임 상태 전이·실패·복구는 화면을 봐서 알 수 없으므로 [시나리오 원장](../scenarios/README.md)이 따로 소유한다.
판정(공용 / feature / 미확인)은 여기에 쓰지 않는다. 판정과 그 근거는
[zero-sol-figma-analysis.md](../zero-sol-figma-analysis.md), 승격 절차는
`.agents/skills/shared-ui-contract/references/promotion.md`, 단계는 `docs/decisions/0009-shared-boundaries.md`가 소유한다.

## 왜 관찰과 판정을 분리하는가

분석할 때마다 결론이 달라진 원인은 관찰을 매번 다시 하면서 판정이 함께 흔들린 것이다.
이 원장은 node ID와 Notion 링크를 박아 다음 분석이 "다시 보기"가 아니라 "대조하기"가 되게 한다.
Figma는 UI 구성과 상태만, Notion은 동작·정책만 증명한다. 어느 쪽에도 없는 것은 `미확인`으로 남기고
리허설 API나 현재 코드에서 추론해 채우지 않는다.

Figma와 Notion은 이 제품 사실의 1순위 입력이다. 둘이 같은 사실을 다르게 말하면 미확인이 아니라
**충돌**이며, 어느 쪽을 따르면 화면·상태·요청 중 무엇이 달라지는지와 함께 사용자에게 질문한다.
받은 답은 [판정 문서 §5](../zero-sol-figma-analysis.md#5-미확인--답이-구현을-바꾸는-질문)에 기록하고,
답이 오기 전에는 그 부분을 구현하지 않는다.

## 표 형식

모든 섹션 파일은 같은 열을 쓴다.

| 열 | 채우는 것 | 출처 |
| --- | --- | --- |
| 화면 | Figma page 번호·이름과 대표 top-level frame node ID | Figma |
| surface | 기간 / 검색어 / 다중선택 / 결과 toolbar / summary / table / paging / row action / 상세 / 폼 / dialog / 상태 화면 등 | Figma |
| Figma 관찰 | 컨트롤 구성, 관찰된 상태(검색 전·후, 빈 결과, 에러, 로딩), 다른 화면과의 차이 | Figma |
| Notion 동작·정책 | 검색 gate, 기본값, 권한, 다운로드·등록·옵션변경 조건, 에러·빈 결과 문구 정책. 문서 링크 포함 | Notion |
| 미확인 | 두 출처 모두 답하지 않는 것 | — |
| 현재 코드 | 대응하는 `shared`/`features` 경로 또는 `없음` | 코드 |

CSS·색·간격은 기록하지 않는다. 공용 UI(primitive), 공용 컴포넌트(pattern), 공용 로직(mechanic·순수 유틸)
판정에 필요한 것만 적는다.
`frame-index.md`에는 page node ID가 없으므로 page ID를 추측해 채우지 않는다. 여러 상태를 합친 행은 대표 frame임을 밝히거나 상태별 frame ID를 모두 적는다.

## 판독 규칙

- select의 렌더된 값은 Figma, 옵션 목록은 Notion이 정본이다. Figma select는 커스터마이즈 여부가 제각각이므로 레이어의 옵션만으로 제품 값을 확정하지 않는다.
- `Case 정의` frame은 옵션·cascade·필터 그룹·정렬·보기·range slider의 정본이며 모든 select를 펼친 상태로 그려져 있다.
- 컴포넌트 인스턴스(`◇`)의 레이어 트리는 마스터나 형제의 텍스트를 반환할 수 있으므로 신뢰하지 않고 반드시 렌더로 확정한다.

## 섹션 파일

Figma 최상위 page 번호를 따른다. 파일 하나가 200줄을 넘으면 하위 page 단위로 쪼갠다.

| 파일 | Figma page |
| --- | --- |
| — | ⅱ. KEYSCREEN (`발권>발권취소`·`설정 > APP 버전`·`상품>전시`·`CRM`·`팝업`·`컴포넌트`·`미사용`) — 15개 도메인 밖의 별도 판독 범위 |
| [01-common.md](01-common.md) | 1 공통 (Layout, LNB, Alert, 공통화면) |
| [02-auth.md](02-auth.md) | 2 로그인 (로그인, 아이디/비밀번호 찾기, 회원가입, 결과조회) |
| [03-dashboard.md](03-dashboard.md) | 3 대시보드 |
| [04-members.md](04-members.md) | 4 회원 (활성·비활성·상담·소명신청·회원접속) |
| [05-performances.md](05-performances.md) | 5 공연 (콘텐츠, 공연목록) |
| [06-ticketing.md](06-ticketing.md) | 6 발권 (등록, 전체, 대기, 완료, 분실, 공통, 스마트프린터) |
| [07-exhibition.md](07-exhibition.md) | 7 전시 (배너, APP Splash) |
| [08-promotion.md](08-promotion.md) | 8 프로모션 (APP PUSH) |
| [09-community.md](09-community.md) | 9 커뮤니티 (게시판, 게시물) |
| [10-statistics.md](10-statistics.md) | 10 통계 (공통, 회원, 발권, 출입, APP) |
| [11-settings.md](11-settings.md) | 11 설정 (운영자, 약관, 정책 6종, 로그) |
| [12-search.md](12-search.md) | 12 통합검색 |
| [13-profile.md](13-profile.md) | 13 내정보 |
| [14-onsite.md](14-onsite.md) | 14 현장발권 (예매검색, 신규예매, 출입조회) — LNB 분리 화면군 |
| [15-notification.md](15-notification.md) | 15 알림 |

## Notion 원문 원장

`notion/`은 Codex가 Notion MCP로 `DB: Work Items`에서 `Type = Feature`이고 프로젝트 relation이
`제로솔로션`(54)·`제로플러스`(18, 소비자 APP — 관리자 섹션 외)인 72페이지를 전수 읽어 문장 단위로 옮긴
것이다. [notion/00-index.md](notion/00-index.md)가 페이지·링크·섹션 대응, `notion/NN-*.md`가 섹션별
원문, [notion/99-cross-screen.md](notion/99-cross-screen.md)가 **여러 화면에서 같은 문장으로 반복되는
규칙**(183행)이다. 각 섹션 파일의 "Notion 요점"은 이 원문에서 공용화 판정에 직접 닿는 문장만 추린 것이다.

## 관찰 한계

- Figma: 2026-09-02 Aside 브라우저 캡처는 선택 갱신 전에 URL을 읽어 node ID가 계통적으로 직전 frame으로 밀렸다. 당시 MCP는 View seat 호출 한도로 사용 불가했고 목록형 화면의 검색후·Case 정의와 화면 유형별 대표 frame에 집중했다. 2026-09-04에는 `aside repl`로 78 page를 전수 재판독해 **frame을 가진 leaf page 59개와 top-level frame 272개**를 확인하고 원장의 node ID를 실측값으로 교체했다. view-only라 prototype interaction은 재생하지 않았고 상태는 정적 frame 기준이다.
- Notion: 문서에 없는 정책은 Notion 부재를 뜻할 뿐 정책 부재를 뜻하지 않는다. 문장은 원문 인용이며 해석을
  섞지 않았다. 페이지 Status는 대부분 `Backlog`다.
