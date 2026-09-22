import type { TFunction } from 'i18next';
import type { PostComment } from '@/features/community/model/post';
import { displayTimeZone, formatDate, formatTimeInTimeZone } from '@/shared/lib/datetime';
import { maskEmail } from '@/shared/lib/mask-contact';
import type { PageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { DataTableProps } from '@/shared/ui/list/DataTable';
import { selectionColumn } from '@/shared/ui/list/selection-column';

/**
 * Figma 9.2.2 `피드백 정보 > 댓글` 표의 컬럼이다(2026-09-22 실측). 목록 표와 달리 구분·게시판·좋아요·
 * 싫어요·평점·댓글·답변상태가 없고 카테고리·제목·내용·회원유형/회원등급·작성자·조회수·게시상태·
 * `등록일/최근업데이트일` 만 있다. 이 표에는 정렬 컨트롤이 없다(frame 의 마지막 헤더에 붙은 표시만 있고
 * 고를 정렬 목록이 없다 — POST-DETAIL 미확인 3). 표시 형식은 목록과 같다.
 */
export function postCommentColumns({
  t,
  selection,
}: {
  readonly t: TFunction<'community'>;
  readonly selection: PageRowSelection<PostComment>;
}): DataTableProps<PostComment>['columns'] {
  const empty = t('post.columns.emptyValue');
  const text = (value: string | undefined) => (value === undefined || value === '' ? empty : value);

  return [
    selectionColumn({
      selection,
      pageLabel: t('post.detail.comments.selectAll'),
      rowLabel: (row) => t('post.result.selectRow', { name: row.title ?? row.content }),
    }),
    {
      id: 'boardCategory',
      header: t('post.columns.boardCategory'),
      accessorFn: (row: PostComment) => text(row.boardCategoryName),
    },
    {
      id: 'title',
      header: t('post.columns.title'),
      accessorFn: (row: PostComment) => text(row.title),
    },
    {
      id: 'content',
      header: t('post.columns.content'),
      cell: ({ row }: { row: { original: PostComment } }) => (
        <div className="max-w-96">
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
    },
    {
      id: 'member',
      header: t('post.columns.member'),
      accessorFn: (row: PostComment) =>
        row.authorGrade === undefined
          ? t(`post.values.authorType.${row.authorType}`)
          : t('post.values.member', {
              type: t(`post.values.authorType.${row.authorType}`),
              grade: t(`post.values.authorGrade.${row.authorGrade}`),
            }),
    },
    {
      id: 'author',
      header: t('post.columns.author'),
      accessorFn: (row: PostComment) => {
        const contact =
          row.author.email === undefined ? row.author.accountId : maskEmail(row.author.email);
        return contact === undefined
          ? row.author.name
          : t('post.values.author', { name: row.author.name, contact });
      },
    },
    {
      id: 'viewCount',
      header: t('post.columns.viewCount'),
      accessorFn: (row: PostComment) => String(row.viewCount),
    },
    {
      id: 'status',
      header: t('post.columns.status'),
      accessorFn: (row: PostComment) => t(`post.values.status.${row.status}`),
    },
    {
      id: 'timestamps',
      header: t('post.columns.timestamps'),
      cell: ({ row }: { row: { original: PostComment } }) => (
        <span className="block whitespace-nowrap">
          <span className="block">{formatDateTime(row.original.registeredAt)}</span>
          <span className="block">{formatDateTime(row.original.updatedAt)}</span>
        </span>
      ),
    },
  ];
}

/** frame 의 `2026-06-01 12:00:00` 표기. 하루 경계와 시각은 브라우저 zone 으로 읽는다. */
function formatDateTime(instant: string): string {
  const day = formatDate(instant);
  if (day === '') return '';
  return `${day} ${formatTimeInTimeZone(instant, displayTimeZone(), 'second')}`;
}
