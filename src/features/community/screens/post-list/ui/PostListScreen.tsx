import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
import { standardPageSizeOptions } from '@/shared/lib/list-options';
import { postSortKeys } from '@/features/community/model/post';
import {
  postListSearch,
  type PostListSearch,
  type PostListView,
} from '../model/post-list-search';
import { usePostListData } from '../model/usePostListData';
import { usePostListFilter } from '../model/usePostListFilter';
import { PostListActions } from './PostListActions';
import { PostListFilters } from './PostListFilters';
import { usePostListResult } from './usePostListResult';

/**
 * 9.2 게시물 목록. 조립만 하고 상태는 각 소유자에 둔다.
 * route 는 검증한 sparse search 를 넘기고 화면이 한 번 해소한다. 모든 URL 전이는 `commit` 한 곳으로
 * 나가며 canonical 로 줄여 `onSearchChange` 에 넘긴다.
 */
export function PostListScreen({
  search: sparse,
  onSearchChange,
  onActivate,
  onCreate,
}: {
  readonly search: PostListSearch;
  readonly onSearchChange: (next: PostListSearch) => void;
  readonly onActivate: (postId: string) => void;
  readonly onCreate: () => void;
}) {
  const { t } = useTranslation('community');
  const search = postListSearch.resolve(sparse);
  const commit = (next: PostListView) => onSearchChange(postListSearch.canonical.parse(next));
  const filter = usePostListFilter(search, commit);
  const { rows, total, totalPages, ...data } = usePostListData(search);
  const result = usePostListResult({ search, rows, totalPages, commit });

  return (
    <section>
      <PageHeader
        breadcrumbs={[t('post.breadcrumb.community'), t('post.breadcrumb.posts')]}
        title={t('post.title')}
      />
      <PostListFilters filter={filter} />
      <PagedListResult
        data={{ rows, ...data }}
        total={total}
        view={result.view}
        columns={result.columns}
        getRowId={(row) => row.id}
        onRowActivate={(row) => onActivate(row.id)}
        actions={
          <PostListActions
            selectedIds={result.selection.selectedIds}
            onChanged={result.selection.clear}
            onCreate={onCreate}
          />
        }
        copy={{ empty: t('post.result.empty') }}
        pageSizeOptions={standardPageSizeOptions}
        sortOptions={postSortKeys.map((value) => ({ value, label: t(`post.sort.${value}`) }))}
      />
    </section>
  );
}
