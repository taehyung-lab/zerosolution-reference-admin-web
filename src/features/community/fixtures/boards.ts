import { ApiError } from '@/api/error';
import type {
  BoardChangeLog,
  BoardDetail,
  BoardListPage,
  BoardListRequest,
  BoardRow,
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
 * 업데이트 내역 예시. 열 구성은 공용 3열 archetype 을 따르고 field 코드는 서버 vocabulary 가 아니라
 * 화면이 이미 아는 이름을 빌린 자리표시자다. 실제 changeLog DTO 는 미확인이다.
 */
const changeLogs: Readonly<Record<string, readonly BoardChangeLog[]>> = {
  'reference-board-1': [
    {
      id: 'reference-board-1-log-1',
      updatedAt: '2026-08-21T02:40:00.000Z',
      changes: ['name', 'writePermission'],
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
  return Promise.resolve({ ...row, changeLogs: changeLogs[row.id] ?? [] });
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
