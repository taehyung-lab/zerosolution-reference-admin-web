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
  { id: 'list/명백', request: '회원 목록 화면에 등록일 정렬을 추가해주세요.', expect: ['list-contract'] },
  { id: 'list/재표현', request: '리스트에서 검색 조건을 바꾸면 주소창에도 남아 있어야 합니다.', expect: ['list-contract'] },
  { id: 'list/비발동', request: 'axios mutator 의 재시도 횟수를 2회로 줄여주세요.', reject: ['list-contract'] },

  // detail-contract
  { id: 'detail/명백', request: '운영자 상세 화면에 계정 상태 섹션을 추가해주세요.', expect: ['detail-contract'] },
  { id: 'detail/재표현', request: '레코드 하나를 여는 화면에서 삭제된 건이면 뭘 보여줘야 하나요.', expect: ['detail-contract'] },
  { id: 'detail/비발동', request: '목록의 페이지 크기 기본값을 50으로 바꿔주세요.', reject: ['detail-contract'] },

  // form-contract
  { id: 'form/명백', request: '회원 수정 폼에서 저장 실패 시 서버 오류를 필드에 붙여주세요.', expect: ['form-contract'] },
  { id: 'form/재표현', request: '입력하다 나가려고 하면 물어보게 해주세요.', expect: ['form-contract'] },
  { id: 'form/비발동', request: '토큰 재발급이 동시에 두 번 일어납니다.', reject: ['form-contract'] },

  // collection-contract
  { id: 'collection/명백', request: '상세 화면 안에 있는 이력 표에 정렬을 넣어주세요.', expect: ['collection-contract'] },
  { id: 'collection/재표현', request: '폼 안에서 행을 추가·삭제하는 반복 입력을 만들어주세요.', expect: ['collection-contract'] },
  { id: 'collection/비발동', request: '이 순수 함수의 반올림 규칙이 틀렸습니다.', reject: ['collection-contract'] },

  // route-composition
  { id: 'route/명백', request: '권한이 없으면 이 route 에 못 들어가게 guard 를 넣어주세요.', expect: ['route-composition'] },
  { id: 'route/재표현', request: '주소로 바로 열었을 때 데이터가 먼저 로드되게 해주세요.', expect: ['route-composition'] },
  { id: 'route/비발동', request: 'DataTable 의 헤더 포커스 링이 안 보입니다.', reject: ['route-composition'] },

  // screen-composition
  { id: 'screen-composition/명백', request: '공지사항 화면을 새로 만들려는데 뼈대를 어떻게 세우면 되나요.', expect: ['screen-composition'] },
  { id: 'screen-composition/재표현', request: '새 화면 하나를 route 와 feature 로 어떻게 나눠야 하나요.', expect: ['screen-composition'] },
  { id: 'screen-composition/비발동', request: '이미 있는 목록 화면의 필터 문구만 고쳐주세요.', reject: ['screen-composition'] },

  // file-workflow
  { id: 'file/명백', request: '엑셀 업로드에 진행률 표시를 붙여주세요.', expect: ['file-workflow'] },
  { id: 'file/재표현', request: '첨부 내려받기가 큰 파일에서 끊깁니다.', expect: ['file-workflow'] },
  { id: 'file/비발동', request: '로그인 후 이동할 주소를 바꿔주세요.', reject: ['file-workflow'] },

  // specialized-screens
  { id: 'specialized/명백', request: '권한 matrix 화면에서 행과 열이 늘어나면 어떻게 처리하나요.', expect: ['specialized-screens'] },
  { id: 'specialized/재표현', request: '통계 보드에서 축을 바꾸면 셀이 다시 계산돼야 합니다.', expect: ['specialized-screens'] },
  { id: 'specialized/비발동', request: '회원 등록 폼에 전화번호 필드를 추가해주세요.', reject: ['specialized-screens'] },

  // shared-ui
  { id: 'shared-ui/명백', request: 'shared 의 Select 에 다중 선택을 넣어달라는 요청이 왔습니다.', expect: ['shared-ui'] },
  { id: 'shared-ui/재표현', request: '이 다이얼로그를 두 화면이 같이 쓰게 공용으로 올려도 될까요.', expect: ['shared-ui', 'source-structure'] },
  { id: 'shared-ui/비발동', request: 'query key 에 locale 을 넣어야 하나요.', reject: ['shared-ui'] },

  // api-wire
  { id: 'api-wire/명백', request: '응답 봉투에서 business error 코드를 분류하지 못하고 있습니다.', expect: ['api-wire'] },
  { id: 'api-wire/재표현', request: '서버가 주는 모양이 OpenAPI 스냅샷과 다릅니다.', expect: ['api-wire'] },
  { id: 'api-wire/비발동', request: '상세 화면의 섹션 순서를 바꿔주세요.', reject: ['api-wire'] },

  // server-state
  { id: 'server-state/명백', request: '저장에 성공하면 목록 캐시가 안 지워집니다.', expect: ['server-state'] },
  { id: 'server-state/재표현', request: '필터가 비었을 때는 조회를 아예 하지 않게 해주세요.', expect: ['server-state'] },
  { id: 'server-state/비발동', request: '이 버튼 라벨을 제품 문구로 맞춰주세요.', reject: ['server-state'] },

  // auth-session
  { id: 'auth/명백', request: '액세스 토큰 만료 시 재발급이 안 되고 로그아웃됩니다.', expect: ['auth-session'] },
  { id: 'auth/재표현', request: '401 이 오면 어디서 처리하고 있나요.', expect: ['auth-session'] },
  { id: 'auth/비발동', request: '표의 컬럼 순서를 바꿔주세요.', reject: ['auth-session'] },

  // logic
  { id: 'logic/명백', request: '날짜 구간을 계산하는 이 유틸이 월말에서 틀립니다.', expect: ['logic'] },
  { id: 'logic/재표현', request: '이 매퍼 함수의 타입 오류를 고쳐주세요.', expect: ['logic'] },
  { id: 'logic/비발동', request: '폼 제출 후 완료 alert 을 띄워주세요.', reject: ['logic'] },

  // source-structure
  { id: 'source-structure/명백', request: '이 훅을 어느 폴더에 둬야 하나요.', expect: ['source-structure'] },
  { id: 'source-structure/재표현', request: '화면에서 옆 화면 파일을 import 하고 있는데 괜찮나요.', expect: ['source-structure'] },
  { id: 'source-structure/비발동', request: '이 목록의 기본 정렬을 최신순으로 바꿔주세요.', reject: ['source-structure'] },

  // product-evidence
  { id: 'product/명백', request: '이 필터의 선택지가 제품 기준으로 무엇무엇인지 확인해서 맞춰주세요.', expect: ['product-evidence'] },
  { id: 'product/재표현', request: '이 문구가 실제 제품 문구가 맞나요.', expect: ['product-evidence'] },
  { id: 'product/비발동', request: '이 파일의 import 순서를 lint 규칙에 맞춰주세요.', reject: ['product-evidence'] },
]
