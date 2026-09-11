import type {
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
    id: 'board-notice',
    type: 'GENERAL',
    category: 'GENERAL',
    name: '공지사항',
    writePermission: 'MANAGER',
    readPermission: 'INCLUDING_GUEST',
    postCount: 128,
    usage: 'IN_USE',
    registeredAt: '2026-01-04T00:12:00.000Z',
    updatedAt: '2026-08-21T02:40:00.000Z',
  },
  {
    id: 'board-faq',
    type: 'GENERAL',
    category: 'GENERAL',
    name: '자주 묻는 질문',
    writePermission: 'MANAGER',
    readPermission: 'INCLUDING_GUEST',
    postCount: 64,
    usage: 'IN_USE',
    registeredAt: '2026-01-19T04:05:00.000Z',
    updatedAt: '2026-07-02T23:10:00.000Z',
  },
  {
    id: 'board-review',
    type: 'GENERAL',
    category: 'GENERAL',
    name: '관람 후기',
    writePermission: 'ALL_MEMBERS',
    readPermission: 'INCLUDING_GUEST',
    postCount: 1042,
    usage: 'IN_USE',
    registeredAt: '2026-02-11T06:30:00.000Z',
    updatedAt: '2026-09-01T08:15:00.000Z',
  },
  {
    id: 'board-special',
    type: 'GENERAL',
    category: 'GENERAL',
    name: '스페셜 콘텐츠',
    writePermission: 'MEMBER_GRADE',
    readPermission: 'MEMBER_GRADE',
    postCount: 37,
    usage: 'NOT_IN_USE',
    registeredAt: '2026-03-02T01:00:00.000Z',
    updatedAt: '2026-05-27T05:45:00.000Z',
  },
  {
    id: 'board-inquiry',
    type: 'GENERAL',
    category: 'COUNSEL',
    name: '1:1 문의',
    writePermission: 'ALL_MEMBERS',
    readPermission: 'MANAGER',
    postCount: 583,
    usage: 'IN_USE',
    registeredAt: '2026-03-18T09:20:00.000Z',
    updatedAt: '2026-09-05T11:05:00.000Z',
  },
  {
    id: 'board-refund',
    type: 'GENERAL',
    category: 'COUNSEL',
    name: '환불 상담',
    writePermission: 'ALL_MEMBERS',
    readPermission: 'MANAGER',
    postCount: 91,
    usage: 'IN_USE',
    registeredAt: '2026-04-07T22:00:00.000Z',
    updatedAt: '2026-08-30T13:35:00.000Z',
  },
  {
    id: 'board-partner',
    type: 'GENERAL',
    category: 'COUNSEL',
    name: '제휴 문의',
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
  if (request.names?.length && !request.names.some((value) => row.name.includes(value))) return false;
  if (request.types?.length && !request.types.includes(row.type)) return false;
  if (request.categories?.length && !request.categories.includes(row.category)) return false;
  if (request.usages?.length && !request.usages.includes(row.usage)) return false;
  if (request.writePermission !== undefined && row.writePermission !== request.writePermission) return false;
  if (request.readPermission !== undefined && row.readPermission !== request.readPermission) return false;
  return true;
}

export function readBoardListPage(request: BoardListRequest): Promise<BoardListPage> {
  const filtered = boards.filter((row) => matches(row, request));
  const descending = request.sortDirection === 'desc';
  const sorted = [...filtered].sort((left, right) => {
    const a = sortValue(left, request.sort);
    const b = sortValue(right, request.sort);
    const order = a === b ? 0 : a < b ? -1 : 1;
    return descending ? -order : order;
  });
  const start = (request.page - 1) * request.pageSize;
  return Promise.resolve({
    rows: sorted.slice(start, start + request.pageSize),
    total: sorted.length,
  });
}
