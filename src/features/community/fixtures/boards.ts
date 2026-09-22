import { ApiError } from '@/api/error';
import type {
  BoardCategoryItem,
  BoardChangeLog,
  BoardDetail,
  BoardListPage,
  BoardListRequest,
  BoardRow,
  BoardSettings,
  BoardSortKey,
} from '../model/board';

/**
 * TRANSPLANT_PENDING_COMMUNITY_BOARD_QUERY: 이 저장소에는 게시판 조회 API 가 없다(AGENTS 1절).
 * 아래 행과 필터·정렬·페이지 계산은 서버 페이지 응답을 흉내 내는 예시이며 endpoint·DTO·enum 을
 * 확정 계약으로 표현하지 않는다. 실제 계약이 확정되면 api/queries.ts 의 queryFn 과 함께 교체하고
 * feature 에는 검색 입력 매핑과 응답 projection 만 남긴다.
 */
const boards: readonly BoardRow[] = [
  {
    id: 'reference-board-1',
    type: 'GENERAL',
    category: 'GENERAL',
    name: 'Reference Board 1',
    writePermission: 'MANAGER',
    readPermission: 'INCLUDING_GUEST',
    postCount: 128,
    usage: 'IN_USE',
    registeredAt: '2026-01-04T00:12:00.000Z',
    updatedAt: '2026-08-21T02:40:00.000Z',
  },
  {
    id: 'reference-board-2',
    type: 'GENERAL',
    category: 'GENERAL',
    name: 'Reference Board 2',
    writePermission: 'MANAGER',
    readPermission: 'INCLUDING_GUEST',
    postCount: 64,
    usage: 'IN_USE',
    registeredAt: '2026-01-19T04:05:00.000Z',
    updatedAt: '2026-07-02T23:10:00.000Z',
  },
  {
    id: 'reference-board-3',
    type: 'GENERAL',
    category: 'GENERAL',
    name: 'Reference Board 3',
    writePermission: 'ALL_MEMBERS',
    readPermission: 'INCLUDING_GUEST',
    postCount: 1042,
    usage: 'IN_USE',
    registeredAt: '2026-02-11T06:30:00.000Z',
    updatedAt: '2026-09-01T08:15:00.000Z',
  },
  {
    id: 'reference-board-4',
    type: 'GENERAL',
    category: 'GENERAL',
    name: 'Reference Board 4',
    writePermission: 'MEMBER_GRADE',
    readPermission: 'MEMBER_GRADE',
    postCount: 37,
    usage: 'NOT_IN_USE',
    registeredAt: '2026-03-02T01:00:00.000Z',
    updatedAt: '2026-05-27T05:45:00.000Z',
  },
  {
    id: 'reference-board-5',
    type: 'GENERAL',
    category: 'COUNSEL',
    name: 'Reference Board 5',
    writePermission: 'ALL_MEMBERS',
    readPermission: 'MANAGER',
    postCount: 583,
    usage: 'IN_USE',
    registeredAt: '2026-03-18T09:20:00.000Z',
    updatedAt: '2026-09-05T11:05:00.000Z',
  },
  {
    id: 'reference-board-6',
    type: 'GENERAL',
    category: 'COUNSEL',
    name: 'Reference Board 6',
    writePermission: 'ALL_MEMBERS',
    readPermission: 'MANAGER',
    postCount: 91,
    usage: 'IN_USE',
    registeredAt: '2026-04-07T22:00:00.000Z',
    updatedAt: '2026-08-30T13:35:00.000Z',
  },
  {
    id: 'reference-board-7',
    type: 'GENERAL',
    category: 'COUNSEL',
    name: 'Reference Board 7',
    writePermission: 'INCLUDING_GUEST',
    readPermission: 'MANAGER',
    postCount: 12,
    usage: 'NOT_IN_USE',
    registeredAt: '2026-05-21T15:10:00.000Z',
    updatedAt: '2026-06-15T07:55:00.000Z',
  },
];

function sortValue(row: BoardRow, key: BoardSortKey): string | number {
  switch (key) {
    case 'registeredAt':
      return row.registeredAt;
    case 'updatedAt':
      return row.updatedAt;
    case 'type':
      return row.type;
    case 'category':
      return row.category;
    case 'name':
      return row.name;
    case 'permission':
      return row.writePermission;
    case 'postCount':
      return row.postCount;
  }
}

function matches(row: BoardRow, request: BoardListRequest): boolean {
  const instant = request.periodType === 'registeredAt' ? row.registeredAt : row.updatedAt;
  if (request.startDateTime !== undefined && instant < request.startDateTime) return false;
  if (request.endDateTime !== undefined && instant > request.endDateTime) return false;
  if (
    request.keywords?.length &&
    !request.keywords.some(({ field, value }) => row[field].includes(value))
  )
    return false;
  if (request.types?.length && !request.types.includes(row.type)) return false;
  // 레코드의 구분(3개)이 검색 필터의 구분(2개)보다 넓어 includes 로 좁히지 않는다.
  if (request.categories?.length && !request.categories.some((value) => value === row.category))
    return false;
  if (request.usages?.length && !request.usages.includes(row.usage)) return false;
  if (request.writePermission !== undefined && row.writePermission !== request.writePermission) return false;
  if (request.readPermission !== undefined && row.readPermission !== request.readPermission) return false;
  return true;
}

/**
 * 조회·수정 화면의 설정 값 예시 — Figma 9.1.2/9.1.4 frame 이 보여 주는 값(1:1문의·공지사항)을 흉내 낸다.
 * 목록 행이 가진 값(구분·이름·권한·사용상태)은 행에서 오고, 나머지 설정은 여기 기본값에 행별 차이를 덧씌운다.
 * 실제 DTO 는 미확인이다.
 */
const baseSettings: Omit<BoardSettings, 'type' | 'category' | 'name' | 'write' | 'read' | 'usage'> = {
  categoryUsage: 'IN_USE',
  postTitleMode: 'AUTHOR_INPUT',
  managerTitles: [],
  html: 'IN_USE',
  attachment: 'IN_USE',
  attachmentLimitMb: 1,
  popup: 'IN_USE',
  rating: 'NOT_IN_USE',
  comment: 'IN_USE',
  secretComment: 'PRIVATE_ONLY',
  commentNotice: 'EMAIL',
  viewCountDisplay: 'IN_USE',
  viewCountDuplicate: 'NOT_IN_USE',
};

const settingOverrides: Readonly<Record<string, Partial<BoardSettings>>> = {
  // Figma 9.1.4 수정 frame: 공지사항, 쓰기 운영자·읽기 전체회원, 카테고리 사용안함, 댓글·조회수 표시 사용안함, 10MB.
  'reference-board-2': {
    categoryUsage: 'NOT_IN_USE',
    attachmentLimitMb: 10,
    comment: 'NOT_IN_USE',
    viewCountDisplay: 'NOT_IN_USE',
  },
  'reference-board-4': {
    postTitleMode: 'MANAGER_TITLES',
    managerTitles: ['궁금해요', '건의합니다'],
    rating: 'LIKE_DISLIKE_AND_RATING',
  },
};

/** 회원등급 권한은 등급이 따라온다(Figma cascade). 행의 권한 값에서 설정 모양으로 옮긴다. */
const permission = (value: BoardRow['writePermission']): BoardSettings['write'] =>
  value === 'MEMBER_GRADE' ? { permission: value, memberGrade: 'GENERAL_MEMBER' } : { permission: value };

/** Figma 9.1.5.1 팝업의 예시 행. 게시판마다 다르다는 사실만 흉내 낸다. */
const categories: Readonly<Record<string, readonly BoardCategoryItem[]>> = {
  'reference-board-1': [
    { id: 'reference-board-1-category-1', name: '회원가입', usage: 'IN_USE' },
    { id: 'reference-board-1-category-2', name: '티켓인증', usage: 'IN_USE' },
    { id: 'reference-board-1-category-3', name: '스케셜콘텐츠', usage: 'IN_USE' },
  ],
  // 게시물 예시 행이 가리키는 상담 게시판의 카테고리. 게시물 쪽 예시가 실제 선택지와 맞물리게 둔다.
  'reference-board-5': [
    { id: 'reference-board-5-category-1', name: 'Reference Category A', usage: 'IN_USE' },
  ],
  'reference-board-6': [
    { id: 'reference-board-6-category-1', name: 'Reference Category C', usage: 'IN_USE' },
  ],
};

/**
 * 업데이트 이력 예시 — Figma 9.1.2: `등록` 한 줄과 `수정` + 변경 목록(항목 : 이전 > 이후). field 는 BoardSettings
 * 의 키이고 값은 화면 어휘 코드다. 실제 changeLog DTO 는 미확인이다.
 */
const changeLogs: Readonly<Record<string, readonly BoardChangeLog[]>> = {
  'reference-board-1': [
    {
      id: 'reference-board-1-log-2',
      updatedAt: '2026-08-21T02:40:00.000Z',
      kind: 'UPDATE',
      changes: [
        { field: 'name', before: 'Reference Board', after: 'Reference Board 1' },
        { field: 'write', before: 'INCLUDING_GUEST', after: 'MANAGER' },
        { field: 'html', before: 'NOT_IN_USE', after: 'IN_USE' },
      ],
      manager: 'Reference Manager',
    },
    {
      id: 'reference-board-1-log-1',
      updatedAt: '2026-01-04T00:12:00.000Z',
      kind: 'CREATE',
      changes: [],
      manager: 'Reference Manager',
    },
  ],
};

export function readBoardDetail(boardId: string): Promise<BoardDetail> {
  const row = boards.find((board) => board.id === boardId);
  if (row === undefined) {
    return Promise.reject(
      new ApiError({ kind: 'not-found', message: `board ${boardId} not found` }),
    );
  }
  const { writePermission, readPermission, ...rest } = row;
  return Promise.resolve({
    ...rest,
    ...baseSettings,
    write: permission(writePermission),
    read: permission(readPermission),
    ...settingOverrides[row.id],
    categories: categories[row.id] ?? [],
    changeLogs: changeLogs[row.id] ?? [],
  });
}

export function readBoardListPage(request: BoardListRequest): Promise<BoardListPage> {
  const filtered = boards.filter((row) => matches(row, request));
  const descending = request.sortDirection === 'desc';
  const sorted = [...filtered].sort((left, right) => {
    const a = sortValue(left, request.sortType);
    const b = sortValue(right, request.sortType);
    const order = a === b ? 0 : a < b ? -1 : 1;
    return descending ? -order : order;
  });
  const start = (request.page - 1) * request.pageSize;
  return Promise.resolve({
    rows: sorted.slice(start, start + request.pageSize),
    total: sorted.length,
  });
}

/**
 * 게시물 검색 영역의 `게시판` select 가 쓰는 옵션 원본. Notion 원문은 `[게시판]에 등록된 게시판 중
 * [사용상태 : 사용]으로 설정된 리스트` 라고 적으므로 사용 중인 게시판만 돌려준다.
 *
 * TRANSPLANT_PENDING_COMMUNITY_BOARD_QUERY: 실제 endpoint 가 확정되면 이 함수도 함께 지운다.
 */
export function readInUseBoards(): Promise<readonly { readonly id: string; readonly name: string }[]> {
  return Promise.resolve(
    boards.filter((row) => row.usage === 'IN_USE').map(({ id, name }) => ({ id, name })),
  );
}
