import { ApiError } from '@/api/error';
import type {
  PostBoardCategoryOption,
  PostBoardOption,
  PostChangeLog,
  PostComment,
  PostDetail,
  PostListPage,
  PostListRequest,
  PostRow,
  PostSortKey,
} from '../model/post';
import { readBoardDetail, readInUseBoards } from './boards';

/**
 * TRANSPLANT_PENDING_COMMUNITY_POST_QUERY: 이 저장소에는 게시물 조회 API 가 없다(AGENTS 1절).
 * 아래 행과 필터·정렬·페이지 계산은 서버 페이지 응답을 흉내 내는 예시이며 endpoint·DTO·enum 을
 * 확정 계약으로 표현하지 않는다. 실제 계약이 확정되면 api/queries.ts 의 queryFn 과 함께 교체하고
 * feature 에는 검색 입력 매핑과 응답 projection 만 남긴다.
 *
 * 값은 예시임이 드러나게 `Reference …` 로 적되, frame 이 실제로 그린 표시 형태(빈 값 `-`, 마스킹된
 * 이메일, 두 줄 일시, 썸네일 행)를 모두 한 번씩 밟도록 골랐다.
 */

/** frame 의 회색 이미지 자리표시자를 그대로 흉내 내는 예시 썸네일. 실제 이미지 URL 계약은 미확인이다. */
const exampleThumbnail =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="%23d4d4d4"/></svg>';

const posts: readonly PostRow[] = [
  {
    id: 'reference-post-1',
    category: 'COUNSEL',
    boardId: 'reference-board-5',
    boardName: 'Reference Board 5',
    boardCategoryName: 'Reference Category A',
    title: 'Reference 문의합니다.',
    content: 'Reference 카드 인식이 잘 안되는데 카드 인식하는 방법 좀 알려주세요. 어떻게 해야되나요?',
    thumbnails: [
      { id: 'reference-post-1-thumbnail-1', url: exampleThumbnail },
      { id: 'reference-post-1-thumbnail-2', url: exampleThumbnail },
    ],
    authorType: 'GENERAL_MEMBER',
    authorGrade: 'GENERAL_MEMBER',
    author: { name: 'Reference 김땡땡', email: 'reference@example.test' },
    commentCount: 1,
    viewCount: 0,
    answerStatus: 'DONE',
    status: 'IN_USE',
    registeredAt: '2026-06-01T03:00:00.000Z',
    updatedAt: '2026-06-01T03:00:00.000Z',
  },
  {
    id: 'reference-post-2',
    category: 'COUNSEL',
    boardId: 'reference-board-5',
    boardName: 'Reference Board 5',
    content: 'Reference 회원님 안녕하세요. 카드 인식이 되지 않아 불편하셨을 것으로 예상됩니다.',
    thumbnails: [],
    authorType: 'MANAGER',
    author: { name: 'Reference 김담당', accountId: 'reference-manager' },
    commentCount: 0,
    viewCount: 0,
    status: 'IN_USE',
    registeredAt: '2026-06-02T03:00:00.000Z',
    updatedAt: '2026-06-02T03:00:00.000Z',
  },
  {
    id: 'reference-post-3',
    category: 'GENERAL',
    boardId: 'reference-board-1',
    boardName: 'Reference Board 1',
    boardCategoryName: '회원가입',
    title: 'Reference 1.1 업데이트 알림',
    content: 'Reference 버전이 업데이트 되었습니다. 안정적인 이용을 위해 최신 버전으로 업데이트해주세요.',
    thumbnails: [],
    authorType: 'MANAGER',
    author: { name: 'Reference 김담당', accountId: 'reference-manager' },
    likeCount: 10,
    dislikeCount: 0,
    commentCount: 0,
    viewCount: 10,
    status: 'IN_USE',
    registeredAt: '2026-06-03T03:00:00.000Z',
    updatedAt: '2026-06-03T03:00:00.000Z',
  },
  {
    id: 'reference-post-4',
    category: 'COUNSEL',
    boardId: 'reference-board-6',
    boardName: 'Reference Board 6',
    boardCategoryName: 'Reference Category C',
    title: 'Reference 카드 인증 문의합니다.',
    content: 'Reference 카드 인식이 잘 안되는데 카드 인식하는 방법 좀 알려주세요.',
    thumbnails: [],
    authorType: 'GENERAL_MEMBER',
    authorGrade: 'GENERAL_MEMBER',
    author: { name: 'Reference 김땡땡', email: 'reference@example.test' },
    rating: 4,
    commentCount: 0,
    viewCount: 0,
    answerStatus: 'REVIEWING',
    status: 'IN_USE',
    registeredAt: '2026-06-04T03:00:00.000Z',
    updatedAt: '2026-06-04T03:00:00.000Z',
  },
  {
    id: 'reference-post-5',
    category: 'COUNSEL',
    boardId: 'reference-board-6',
    boardName: 'Reference Board 6',
    boardCategoryName: 'Reference Category C',
    title: 'Reference 대기중인 문의',
    content: 'Reference 카드 인식이 잘 안되는데 카드 인식하는 방법 좀 알려주세요.',
    thumbnails: [],
    authorType: 'GENERAL_MEMBER',
    authorGrade: 'GENERAL_MEMBER',
    author: { name: 'Reference 김땡땡', email: 'reference@example.test' },
    commentCount: 0,
    viewCount: 0,
    answerStatus: 'PENDING',
    status: 'NOT_IN_USE',
    registeredAt: '2026-06-05T03:00:00.000Z',
    updatedAt: '2026-06-05T03:00:00.000Z',
  },
  {
    id: 'reference-post-6',
    category: 'GENERAL',
    boardId: 'reference-board-1',
    boardName: 'Reference Board 1',
    title: 'Reference 게시안함 공지',
    content: 'Reference 비공개로 내린 공지입니다.',
    thumbnails: [],
    authorType: 'MANAGER',
    author: { name: 'Reference 김담당', accountId: 'reference-manager' },
    likeCount: 0,
    dislikeCount: 2,
    commentCount: 3,
    viewCount: 40,
    status: 'NOT_IN_USE',
    registeredAt: '2026-06-06T03:00:00.000Z',
    updatedAt: '2026-06-07T03:00:00.000Z',
  },
  {
    id: 'reference-post-7',
    category: 'GENERAL',
    boardId: 'reference-board-3',
    boardName: 'Reference Board 3',
    title: 'Reference 비회원도 읽는 글',
    content: 'Reference 비회원 포함 권한으로 열려 있는 게시판의 글입니다.',
    thumbnails: [],
    authorType: 'GENERAL_MEMBER',
    authorGrade: 'GENERAL_MEMBER',
    author: { name: 'Reference 이땡땡', email: 'reference-2@example.test' },
    likeCount: 3,
    dislikeCount: 0,
    rating: 5,
    commentCount: 2,
    viewCount: 120,
    status: 'IN_USE',
    registeredAt: '2026-06-07T03:00:00.000Z',
    updatedAt: '2026-06-08T03:00:00.000Z',
  },
];

function sortValue(row: PostRow, key: PostSortKey): string | number {
  switch (key) {
    case 'registeredAt':
      return row.registeredAt;
    case 'updatedAt':
      return row.updatedAt;
    case 'category':
      return row.category;
    case 'board':
      return row.boardName;
    case 'title':
      return row.title ?? '';
    case 'content':
      return row.content;
    case 'member':
      return row.authorType;
    case 'author':
      return row.author.name;
    case 'likeCount':
      return row.likeCount ?? -1;
    case 'dislikeCount':
      return row.dislikeCount ?? -1;
    case 'rating':
      return row.rating ?? -1;
    case 'commentCount':
      return row.commentCount;
    case 'viewCount':
      return row.viewCount;
    case 'status':
      return row.status;
  }
}

function keywordValue(row: PostRow, field: 'content' | 'title'): string {
  return field === 'content' ? row.content : (row.title ?? '');
}

function matches(row: PostRow, request: PostListRequest): boolean {
  const instant = request.periodType === 'registeredAt' ? row.registeredAt : row.updatedAt;
  if (request.startDateTime !== undefined && instant < request.startDateTime) return false;
  if (request.endDateTime !== undefined && instant > request.endDateTime) return false;
  if (
    request.keywords?.length &&
    !request.keywords.some(({ field, value }) => keywordValue(row, field).includes(value))
  )
    return false;
  if (request.categories?.length && !request.categories.includes(row.category)) return false;
  if (request.boardId !== undefined && row.boardId !== request.boardId) return false;
  // 검색 영역의 회원유형(비회원 포함·전체회원·운영자)과 행의 회원유형(일반회원·운영자)은 어휘가 다르다.
  // 운영자만 두 쪽에 같은 이름으로 있어 그 하나만 좁히고, 나머지는 예시 응답에서 거르지 않는다.
  if (request.memberType === 'MANAGER' && row.authorType !== 'MANAGER') return false;
  if (
    request.answerStatuses?.length &&
    (row.answerStatus === undefined || !request.answerStatuses.includes(row.answerStatus))
  )
    return false;
  if (request.statuses?.length && !request.statuses.includes(row.status)) return false;
  return true;
}

export function readPostListPage(request: PostListRequest): Promise<PostListPage> {
  const filtered = posts.filter((row) => matches(row, request));
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

/** 검색 영역 `게시판` select 의 옵션. 목록은 게시판 쪽 예시 데이터가 소유한다. */
export async function readPostBoardOptions(): Promise<readonly PostBoardOption[]> {
  const boards = await readInUseBoards();
  return boards.map(({ id, name }) => ({ value: id, label: name }));
}

/**
 * 조회 화면이 쓰는 예시 값. 목록 행에 없는 것(답변받을 이메일·댓글·업데이트 이력)만 여기서 덧붙인다.
 * frame 9.2.2 는 댓글 두 줄과 `등록`·`수정`·`댓글 등록`·`댓글 수정` 네 종류의 이력을 그린다.
 */
const answerEmails: Readonly<Record<string, string>> = {
  'reference-post-1': 'reference@example.test',
  'reference-post-4': 'reference@example.test',
  'reference-post-5': 'reference@example.test',
};

/** 조회·수정이 같은 선택지에서 다시 고르도록 행의 카테고리 이름에 대응하는 ID 를 붙인다. */
const boardCategoryIds: Readonly<Record<string, string>> = {
  'reference-post-1': 'reference-board-5-category-1',
  'reference-post-3': 'reference-board-1-category-1',
  'reference-post-4': 'reference-board-6-category-1',
  'reference-post-5': 'reference-board-6-category-1',
};

const memberIds: Readonly<Record<string, string>> = {
  'Reference 김땡땡': 'reference-member-1',
  'Reference 이땡땡': 'reference-member-2',
};

const comments: Readonly<Record<string, readonly PostComment[]>> = {
  'reference-post-1': [
    {
      id: 'reference-post-1-comment-1',
      boardCategoryName: 'Reference 답변',
      title: 'Reference 답변드립니다.',
      content: 'Reference 회원님 안녕하세요. 카드 인식이 되지 않아 불편하셨을 것으로 예상됩니다.',
      thumbnails: [],
      authorType: 'MANAGER',
      author: { name: 'Reference 김담당', accountId: 'reference-manager' },
      viewCount: 0,
      status: 'IN_USE',
      registeredAt: '2026-06-01T03:10:00.000Z',
      updatedAt: '2026-06-01T03:10:00.000Z',
    },
    {
      id: 'reference-post-1-comment-2',
      boardCategoryName: 'Reference 답변',
      title: 'Reference 추가로 남긴 댓글입니다.',
      content: 'Reference 이용에 참고해주세요.',
      thumbnails: [{ id: 'reference-post-1-comment-2-thumbnail-1', url: exampleThumbnail }],
      authorType: 'GENERAL_MEMBER',
      authorGrade: 'GENERAL_MEMBER',
      author: {
        name: 'Reference 김땡땡',
        email: 'reference@example.test',
        memberId: 'reference-member-1',
      },
      viewCount: 0,
      status: 'NOT_IN_USE',
      registeredAt: '2026-06-01T03:20:00.000Z',
      updatedAt: '2026-06-01T03:20:00.000Z',
    },
  ],
};

const changeLogs: Readonly<Record<string, readonly PostChangeLog[]>> = {
  'reference-post-1': [
    {
      id: 'reference-post-1-log-4',
      updatedAt: '2026-06-01T04:54:41.000Z',
      kind: 'COMMENT_UPDATE',
      changes: [{ field: 'status', before: 'IN_USE', after: 'NOT_IN_USE' }],
      manager: 'Reference 김담당(reference-manager)',
    },
    {
      id: 'reference-post-1-log-3',
      updatedAt: '2026-06-01T04:54:41.000Z',
      kind: 'COMMENT_CREATE',
      changes: [],
      manager: 'Reference 김담당(reference-manager)',
    },
    {
      id: 'reference-post-1-log-2',
      updatedAt: '2026-06-01T04:54:41.000Z',
      kind: 'UPDATE',
      changes: [{ field: 'status', before: 'IN_USE', after: 'NOT_IN_USE' }],
      manager: 'Reference 김제로(reference-admin)',
    },
    {
      id: 'reference-post-1-log-1',
      updatedAt: '2026-06-01T03:12:11.000Z',
      kind: 'CREATE',
      changes: [],
      manager: 'Reference 김땡땡(reference@example.test)',
    },
  ],
};

export function readPostDetail(postId: string): Promise<PostDetail> {
  const row = posts.find((post) => post.id === postId);
  if (row === undefined) {
    return Promise.reject(new ApiError({ kind: 'not-found', message: `post ${postId} not found` }));
  }
  const { author, ...rest } = row;
  return Promise.resolve({
    ...rest,
    author: { ...author, memberId: memberIds[author.name] },
    boardCategoryId: boardCategoryIds[row.id],
    answerEmail: answerEmails[row.id],
    comments: comments[row.id] ?? [],
    changeLogs: changeLogs[row.id] ?? [],
  });
}

/**
 * 등록·수정의 `카테고리` select 옵션. 고른 게시판이 소유한 카테고리에서 오고, 카테고리를 쓰지 않는
 * 게시판은 빈 목록이다(그때 이 입력은 필수가 아니다).
 */
export async function readPostBoardCategoryOptions(
  boardId: string,
): Promise<readonly PostBoardCategoryOption[]> {
  const board = await readBoardDetail(boardId);
  return board.categoryUsage === 'IN_USE'
    ? board.categories
        .filter((category) => category.usage === 'IN_USE')
        .map(({ id, name }) => ({ value: id, label: name }))
    : [];
}
