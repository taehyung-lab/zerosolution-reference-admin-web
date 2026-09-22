import type { TFunction } from 'i18next';
import type { PostRow, PostSortKey } from '@/features/community/model/post';
import { displayTimeZone, formatDate, formatTimeInTimeZone } from '@/shared/lib/datetime';
import { headerSortDirection } from '@/shared/lib/list-sort';
import { maskEmail } from '@/shared/lib/mask-contact';
import type { PageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { DataTableProps } from '@/shared/ui/list/DataTable';
import { selectionColumn } from '@/shared/ui/list/selection-column';
import type { PostListView } from '../model/post-list-search';

/**
 * Figma `9.2.1. 게시물 리스트` table 의 컬럼 구성이다(2026-09-22 aside 실측, 100% 렌더 판독).
 * 행 checkbox + 구분·게시판·카테고리·제목·내용·회원유형/회원등급·작성자·좋아요·싫어요·평점·댓글·
 * 조회수·답변상태·게시상태·`등록일/최근업데이트일`.
 *
 * 표시 형식도 그 frame 이 정한다.
 * - 값이 없는 자리는 `-` 다(카테고리·제목·좋아요·싫어요·평점·답변상태에서 실제로 관찰).
 * - `작성자` 는 `이름(연락처)` 이고 이메일은 마스킹된다(`your****@email.com`, CONTACT-MASKING).
 *   운영자 행의 아이디는 frame 이 마스킹 없이 그린다.
 * - `회원유형/회원등급` 은 등급이 있을 때만 두 값을 `/` 로 잇는다(운영자 행은 유형 하나).
 * - `내용` 은 두 줄로 줄이고 그 아래 썸네일 행을 그린다.
 * - 마지막 컬럼은 두 일시를 한 셀에 쌓고(`2026-06-01 12:00:00`) 정렬 축은 `등록일` 하나다 —
 *   `최근업데이트일` 정렬은 보기 영역의 `정렬` 선택으로 고른다.
 *
 * 정렬 가능한 컬럼은 Case 정의 정렬 목록의 14개와 같은 집합이라 `카테고리`·`답변상태` 에는 정렬이 없다.
 * frame 은 정렬 표시를 마지막 컬럼에만 그렸지만 정렬 목록이 열거한 축은 헤더에서도 고를 수 있게 둔다
 * (저장소의 다른 목록과 같은 처리, POST-LIST 미확인 5).
 */
export function postListColumns({
  t,
  search,
  selection,
  onHeaderSort,
}: {
  readonly t: TFunction<'community'>;
  readonly search: PostListView;
  readonly selection: PageRowSelection<PostRow>;
  readonly onHeaderSort: (key: PostSortKey) => void;
}): DataTableProps<PostRow>['columns'] {
  const active = { type: search.sortType, direction: search.sortDirection };
  const sortMeta = (key: PostSortKey) => ({
    sort: {
      direction: headerSortDirection(active, key),
      onSort: () => onHeaderSort(key),
    },
  });
  const empty = t('post.columns.emptyValue');
  const text = (value: string | undefined) => (value === undefined || value === '' ? empty : value);
  const count = (value: number | undefined) => (value === undefined ? empty : String(value));

  return [
    selectionColumn({
      selection,
      pageLabel: t('post.result.selectAll'),
      rowLabel: (row) => t('post.result.selectRow', { name: row.title ?? row.content }),
    }),
    {
      id: 'category',
      header: t('post.columns.category'),
      accessorFn: (row: PostRow) => t(`post.values.category.${row.category}`),
      meta: sortMeta('category'),
    },
    {
      id: 'board',
      header: t('post.columns.board'),
      accessorFn: (row: PostRow) => row.boardName,
      meta: sortMeta('board'),
    },
    {
      id: 'boardCategory',
      header: t('post.columns.boardCategory'),
      accessorFn: (row: PostRow) => text(row.boardCategoryName),
    },
    {
      id: 'title',
      header: t('post.columns.title'),
      accessorFn: (row: PostRow) => text(row.title),
      meta: sortMeta('title'),
    },
    {
      id: 'content',
      header: t('post.columns.content'),
      cell: ({ row }: { row: { original: PostRow } }) => (
        <div className="max-w-80">
          <p className="line-clamp-2">{row.original.content}</p>
          {row.original.thumbnails.length > 0 ? (
            <ul className="mt-1 flex gap-1">
              {row.original.thumbnails.map((thumbnail) => (
                <li key={thumbnail.id}>
                  <img
                    alt={t('post.columns.thumbnail')}
                    className="size-6 rounded-sm object-cover"
                    src={thumbnail.url}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ),
      meta: sortMeta('content'),
    },
    {
      id: 'member',
      header: t('post.columns.member'),
      accessorFn: (row: PostRow) =>
        row.authorGrade === undefined
          ? t(`post.values.authorType.${row.authorType}`)
          : t('post.values.member', {
              type: t(`post.values.authorType.${row.authorType}`),
              grade: t(`post.values.authorGrade.${row.authorGrade}`),
            }),
      meta: sortMeta('member'),
    },
    {
      id: 'author',
      header: t('post.columns.author'),
      accessorFn: (row: PostRow) => authorLabel(t, row),
      meta: sortMeta('author'),
    },
    {
      id: 'likeCount',
      header: t('post.columns.likeCount'),
      accessorFn: (row: PostRow) => count(row.likeCount),
      meta: sortMeta('likeCount'),
    },
    {
      id: 'dislikeCount',
      header: t('post.columns.dislikeCount'),
      accessorFn: (row: PostRow) => count(row.dislikeCount),
      meta: sortMeta('dislikeCount'),
    },
    {
      id: 'rating',
      header: t('post.columns.rating'),
      accessorFn: (row: PostRow) => count(row.rating),
      meta: sortMeta('rating'),
    },
    {
      id: 'commentCount',
      header: t('post.columns.commentCount'),
      accessorFn: (row: PostRow) => count(row.commentCount),
      meta: sortMeta('commentCount'),
    },
    {
      id: 'viewCount',
      header: t('post.columns.viewCount'),
      accessorFn: (row: PostRow) => count(row.viewCount),
      meta: sortMeta('viewCount'),
    },
    {
      id: 'answerStatus',
      header: t('post.columns.answerStatus'),
      accessorFn: (row: PostRow) =>
        row.answerStatus === undefined ? empty : t(`post.values.answerStatus.${row.answerStatus}`),
    },
    {
      id: 'status',
      header: t('post.columns.status'),
      accessorFn: (row: PostRow) => t(`post.values.status.${row.status}`),
      meta: sortMeta('status'),
    },
    {
      id: 'timestamps',
      header: t('post.columns.timestamps'),
      cell: ({ row }: { row: { original: PostRow } }) => (
        <span className="block whitespace-nowrap">
          <span className="block">{formatDateTime(row.original.registeredAt)}</span>
          <span className="block">{formatDateTime(row.original.updatedAt)}</span>
        </span>
      ),
      meta: sortMeta('registeredAt'),
    },
  ];
}

/** frame: `김땡땡(your****@email.com)` · `김담당(idididid123)`. 연락처가 없으면 이름만 남는다. */
function authorLabel(t: TFunction<'community'>, row: PostRow): string {
  const contact =
    row.author.email === undefined ? row.author.accountId : maskEmail(row.author.email);
  if (contact === undefined) return row.author.name;
  return t('post.values.author', { name: row.author.name, contact });
}

/** frame 의 `2026-06-01 12:00:00` 표기. 하루 경계와 시각은 브라우저 zone 으로 읽는다. */
function formatDateTime(instant: string): string {
  const day = formatDate(instant);
  if (day === '') return '';
  return `${day} ${formatTimeInTimeZone(instant, displayTimeZone(), 'second')}`;
}
