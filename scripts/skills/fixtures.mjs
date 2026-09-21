/**
 * skill 라우팅의 3종 평가.
 *
 * `description` 은 문서가 아니라 **매칭 대상**이다. 그것이 맞는지는 읽어서 알 수 없고 요청 문장을
 * 실제로 던져 봐야 안다. 그래서 skill 마다 셋을 둔다 — 그 skill 을 부르는 **명백한** 요청, 같은 것을
 * 사용자가 쓸 법한 다른 낱말로 바꾼 **재표현**, 그리고 열리면 안 되는 **비발동**.
 *
 * 비발동이 깨지면 그것은 오탐이 아니라 **잘못된 문서를 읽고 구현한다**는 뜻이다.
 */
export const CASES = [
  // list-contract
  { id: 'list/명백', request: 'Add a created-at sort to the member list screen.', expect: ['list-contract'] },
  { id: 'list/재표현', request: '리스트에서 검색 조건을 바꾸면 주소창에도 남아 있어야 합니다.', expect: ['list-contract', 'route-composition'], reject: ['form-contract'] },
  { id: 'list/비발동', request: 'axios mutator 의 재시도 횟수를 2회로 줄여주세요.', reject: ['list-contract'] },

  // detail-contract
  { id: 'detail/명백', request: 'Add an account-status section to the operator detail view.', expect: ['detail-contract'] },
  { id: 'detail/재표현', request: '레코드 하나를 여는 화면에서 삭제된 건이면 뭘 보여줘야 하나요.', expect: ['detail-contract'], reject: ['list-contract'] },
  { id: 'detail/비발동', request: '목록의 페이지 크기 기본값을 50으로 바꿔주세요.', reject: ['detail-contract'] },

  // form-contract
  { id: 'form/명백', request: 'Place server field errors on the member edit form after a failed save.', expect: ['form-contract'] },
  { id: 'form/재표현', request: '입력하다 나가려고 하면 물어보게 해주세요.', expect: ['form-contract'], reject: ['auth-session'] },
  { id: 'form/비발동', request: '토큰 재발급이 동시에 두 번 일어납니다.', reject: ['form-contract'] },

  // collection-contract
  { id: 'collection/명백', request: 'Add sorting to the history table embedded in the detail screen.', expect: ['collection-contract'] },
  { id: 'collection/재표현', request: '폼 안에서 행을 추가·삭제하는 반복 입력을 만들어주세요.', expect: ['collection-contract'], allowed: ['form-contract'], reject: ['list-contract'] },
  { id: 'collection/비발동', request: '이 순수 함수의 반올림 규칙이 틀렸습니다.', reject: ['collection-contract'] },

  // route-composition
  { id: 'route/명백', request: 'Add a route guard that blocks users without permission.', expect: ['route-composition'] },
  { id: 'route/재표현', request: '주소로 바로 열었을 때 데이터가 먼저 로드되게 해주세요.', expect: ['route-composition'], allowed: ['server-state'], reject: ['form-contract'] },
  { id: 'route/비발동', request: 'DataTable 의 헤더 포커스 링이 안 보입니다.', reject: ['route-composition'] },

  // screen-composition
  { id: 'screen-composition/명백', request: 'Scaffold a new announcements screen and divide route and feature responsibilities.', expect: ['screen-composition'] },
  { id: 'screen-composition/재표현', request: '새 화면 하나를 route 와 feature 로 어떻게 나눠야 하나요.', expect: ['screen-composition'], allowed: ['source-structure'], reject: ['detail-contract'] },
  { id: 'screen-composition/비발동', request: '이미 있는 목록 화면의 필터 문구만 고쳐주세요.', reject: ['screen-composition'] },

  // file-workflow
  { id: 'file/명백', request: 'Show upload progress for an Excel file import.', expect: ['file-workflow'] },
  { id: 'file/재표현', request: '첨부 내려받기가 큰 파일에서 끊깁니다.', expect: ['file-workflow'], reject: ['list-contract'] },
  { id: 'file/비발동', request: '로그인 후 이동할 주소를 바꿔주세요.', reject: ['file-workflow'] },

  // specialized-screens
  { id: 'specialized/명백', request: 'Handle growing rows and columns in the permission matrix screen.', expect: ['specialized-screens'] },
  { id: 'specialized/재표현', request: '통계 보드에서 축을 바꾸면 셀이 다시 계산돼야 합니다.', expect: ['specialized-screens'], allowed: ['server-state'], reject: ['form-contract'] },
  { id: 'specialized/비발동', request: '회원 등록 폼에 전화번호 필드를 추가해주세요.', reject: ['specialized-screens'] },

  // shared-ui
  { id: 'shared-ui/명백', request: 'Add multi-select behavior to the shared Select primitive.', expect: ['shared-ui'] },
  { id: 'shared-ui/재표현', request: '이 다이얼로그를 두 화면이 같이 쓰게 공용으로 올려도 될까요.', expect: ['shared-ui', 'source-structure'], reject: ['detail-contract'] },
  { id: 'shared-ui/비발동', request: 'query key 에 locale 을 넣어야 하나요.', reject: ['shared-ui'] },

  // api-wire
  { id: 'api-wire/명백', request: 'Classify business error codes from the API response envelope.', expect: ['api-wire'] },
  { id: 'api-wire/재표현', request: '서버가 주는 모양이 OpenAPI 스냅샷과 다릅니다.', expect: ['api-wire'], reject: ['form-contract'] },
  { id: 'api-wire/비발동', request: '상세 화면의 섹션 순서를 바꿔주세요.', reject: ['api-wire'] },

  // server-state
  { id: 'server-state/명백', request: 'Invalidate the list query cache after a successful mutation.', expect: ['server-state'] },
  { id: 'server-state/재표현', request: '필터가 비었을 때는 조회를 아예 하지 않게 해주세요.', expect: ['server-state'], reject: ['route-composition'] },
  { id: 'server-state/비발동', request: '이 버튼 라벨을 제품 문구로 맞춰주세요.', reject: ['server-state'] },

  // auth-session
  { id: 'auth/명백', request: 'Refresh the access token on expiry instead of logging out.', expect: ['auth-session'] },
  { id: 'auth/재표현', request: '401 이 오면 어디서 처리하고 있나요.', expect: ['auth-session'], allowed: ['api-wire'], reject: ['list-contract'] },
  { id: 'auth/비발동', request: '표의 컬럼 순서를 바꿔주세요.', reject: ['auth-session'] },

  // logic
  { id: 'logic/명백', request: 'Fix the date-range utility calculation at the end of a month.', expect: ['logic'] },
  { id: 'logic/재표현', request: '이 매퍼 함수의 타입 오류를 고쳐주세요.', expect: ['logic'], reject: ['shared-ui'] },
  { id: 'logic/비발동', request: '폼 제출 후 완료 alert 을 띄워주세요.', reject: ['logic'] },

  // source-structure
  { id: 'source-structure/명백', request: 'Decide which folder should own this new hook.', expect: ['source-structure'] },
  { id: 'source-structure/재표현', request: '화면에서 옆 화면 파일을 import 하고 있는데 괜찮나요.', expect: ['source-structure'], reject: ['route-composition'] },
  { id: 'source-structure/비발동', request: '이 목록의 기본 정렬을 최신순으로 바꿔주세요.', reject: ['source-structure'] },

  // product-evidence
  { id: 'product/명백', request: 'Confirm the product-approved options for this filter and update them.', expect: ['product-evidence'] },
  { id: 'product/재표현', request: '이 문구가 실제 제품 문구가 맞나요.', expect: ['product-evidence'], reject: ['logic'] },
  { id: 'product/비발동', request: '이 파일의 import 순서를 lint 규칙에 맞춰주세요.', reject: ['product-evidence'] },
]
