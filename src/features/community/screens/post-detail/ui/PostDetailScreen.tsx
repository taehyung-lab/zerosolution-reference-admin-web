/**
 * 9.2.2 게시물 조회 — Figma frame(2026-09-22 aside 실측). `기본정보` 섹션이 구분·게시판·카테고리·
 * 회원유형/회원등급·작성자(+`회원 조회`)·답변받을 이메일·제목·내용(+썸네일)·등록일·조회수·게시상태를
 * 읽기 전용으로 보여 주고, `피드백 정보` 섹션이 좋아요·싫어요·평점 수치와 댓글 표를, `업데이트 이력`
 * 섹션이 3열 표를 보여 준다. 하단은 `수정`·`삭제`.
 *
 * frame 이 그리지만 이 화면에 없는 것과 그 이유는 POST-DETAIL fact 의 `범위 내 보류` 가 이름으로 적는다:
 * 헤더의 `APP용 URL 복사`(복사할 URL 이 원문에 없다), 좋아요·싫어요·평점 옆 `참여자 조회` 팝업(9.2.5.2),
 * 댓글 검색 입력과 `댓글등록` 팝업(9.2.5.3), 내용 썸네일의 `보기` 팝업(9.2.5.1).
 *
 * 헤더는 상태 경계 밖에 두어 조회 실패에도 제목이 남는다. 진입 실패는 route loader 가 처리했다.
 */
import { useMutation } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { deletePostMutation, updatePostStatusMutation } from '@/features/community/api/mutations';
import { usePostDetail } from '@/features/community/api/usePostDetail';
import type { PostDetail } from '@/features/community/model/post';
import { useLocale } from '@/shared/i18n/locale-context';
import { displayTimeZone, formatDate, formatTimeInTimeZone } from '@/shared/lib/datetime';
import { maskEmail } from '@/shared/lib/mask-contact';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';
import { DetailField } from '@/shared/ui/detail/DetailField';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { UpdateHistory } from '@/shared/ui/detail/UpdateHistory';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import { Button } from '@/shared/ui/primitives/Button';
import { toPostHistoryEntries } from '../model/post-history';
import { PostCommentsSection } from './PostCommentsSection';

export function PostDetailScreen({
  postId,
  onEdit,
  onDeleted,
  onOpenMember,
}: {
  readonly postId: string;
  readonly onEdit: (postId: string) => void;
  /** 삭제가 실제로 성공한 뒤의 이동. 서버가 없는 동안은 닿지 않는다. */
  readonly onDeleted: () => void;
  /** Notion `작성자 → 회원 조회 버튼 → … 해당 회원 페이지를 새탭으로 제공`. 새 탭 열기는 route 가 소유한다. */
  readonly onOpenMember: (memberId: string) => void;
}) {
  const { t } = useTranslation('community');
  const detail = usePostDetail(postId);

  return (
    <section>
      <PageHeader
        breadcrumbs={[
          t('post.breadcrumb.community'),
          t('post.breadcrumb.posts'),
          t('post.breadcrumb.detail'),
        ]}
        title={t('post.detail.title')}
      />
      <DetailStateBoundary query={detail}>
        {(post) => (
          <PostDetailContent
            post={post}
            onEdit={onEdit}
            onDeleted={onDeleted}
            onOpenMember={onOpenMember}
          />
        )}
      </DetailStateBoundary>
    </section>
  );
}

function PostDetailContent({
  post,
  onEdit,
  onDeleted,
  onOpenMember,
}: {
  readonly post: PostDetail;
  readonly onEdit: (postId: string) => void;
  readonly onDeleted: () => void;
  readonly onOpenMember: (memberId: string) => void;
}) {
  const { t } = useTranslation('community');
  const { t: shared } = useTranslation('shared');
  const { locale } = useLocale();
  const remove = useMutation(deletePostMutation(locale));
  const changeStatus = useMutation(updatePostStatusMutation(locale));
  const deletion = useConfirmation<string>({
    run: (postId) => remove.mutateAsync(postId).then(onDeleted),
    description: shared('deleteConfirm.description'),
  });
  const empty = t('post.columns.emptyValue');
  const text = (value: string | undefined) => (value === undefined || value === '' ? empty : value);
  const count = (value: number | undefined) => (value === undefined ? empty : String(value));
  const contact =
    post.author.email === undefined ? post.author.accountId : maskEmail(post.author.email);
  // frame 의 `게시상태` 행: 현재 값 옆에 반대 상태로 바꾸는 버튼 하나.
  const nextStatus = post.status === 'IN_USE' ? 'NOT_IN_USE' : 'IN_USE';

  return (
    <div className="space-y-5">
      <SectionCard title={t('post.detail.section')}>
        <div className="space-y-4">
          <Fields>
            <DetailField label={t('post.columns.category')}>
              {t(`post.values.category.${post.category}`)}
            </DetailField>
            <DetailField label={t('post.columns.board')}>{post.boardName}</DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('post.columns.boardCategory')}>
              {text(post.boardCategoryName)}
            </DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('post.detail.memberType')}>
              {t(`post.values.authorType.${post.authorType}`)}
            </DetailField>
            <DetailField label={t('post.detail.memberGrade')}>
              {post.authorGrade === undefined
                ? empty
                : t(`post.values.authorGrade.${post.authorGrade}`)}
            </DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('post.columns.author')}>
              <span className="inline-flex flex-wrap items-center gap-3">
                {contact === undefined
                  ? post.author.name
                  : t('post.values.author', { name: post.author.name, contact })}
                {post.author.memberId === undefined ? null : (
                  <Button
                    type="button"
                    className="bg-white text-neutral-900 ring-1 ring-neutral-300"
                    onClick={() => onOpenMember(post.author.memberId!)}
                  >
                    {t('post.detail.openMember')}
                  </Button>
                )}
              </span>
            </DetailField>
            <DetailField label={t('post.detail.answerEmail')}>
              {post.answerEmail === undefined ? empty : maskEmail(post.answerEmail)}
            </DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('post.columns.title')}>{text(post.title)}</DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('post.columns.content')}>
              <div>
                <p className="whitespace-pre-line">{post.content}</p>
                {post.thumbnails.length > 0 ? (
                  <ul className="mt-2 flex gap-2">
                    {post.thumbnails.map((thumbnail) => (
                      <li key={thumbnail.id}>
                        <img
                          alt={t('post.columns.thumbnail')}
                          className="size-10 rounded-sm object-cover"
                          src={thumbnail.url}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('post.detail.registeredAt')}>
              {formatDateTime(post.registeredAt) || empty}
            </DetailField>
            <DetailField label={t('post.columns.viewCount')}>{count(post.viewCount)}</DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('post.columns.status')}>
              <span className="inline-flex flex-wrap items-center gap-3">
                {t(`post.values.status.${post.status}`)}
                <Button
                  type="button"
                  className="bg-white text-neutral-900 ring-1 ring-neutral-300"
                  onClick={() =>
                    void changeStatus.mutateAsync({ postId: post.id, status: nextStatus })
                  }
                >
                  {t(`post.values.status.${nextStatus}`)}
                </Button>
              </span>
            </DetailField>
          </Fields>
        </div>
      </SectionCard>

      <SectionCard title={t('post.detail.feedback')}>
        <div className="space-y-4">
          <Fields>
            <DetailField label={t('post.columns.likeCount')}>{count(post.likeCount)}</DetailField>
            <DetailField label={t('post.columns.dislikeCount')}>
              {count(post.dislikeCount)}
            </DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('post.columns.rating')}>{count(post.rating)}</DetailField>
          </Fields>
          <PostCommentsSection
            postId={post.id}
            comments={post.comments}
            answerStatus={post.answerStatus}
          />
        </div>
      </SectionCard>

      <SectionCard title={t('post.detail.history')}>
        <UpdateHistory
          entries={toPostHistoryEntries(post.changeLogs, t)}
          labels={{
            date: t('post.detail.historyDate'),
            change: t('post.detail.historyChange'),
            actor: t('post.detail.historyManager'),
          }}
          emptyText={t('post.detail.historyEmpty')}
        />
      </SectionCard>

      <div className="flex justify-center gap-2">
        <Button onClick={() => onEdit(post.id)}>{t('post.detail.edit')}</Button>
        <Button
          className="bg-white text-neutral-900 ring-1 ring-neutral-300"
          onClick={() => deletion.request(post.id)}
        >
          {t('post.detail.delete')}
        </Button>
      </div>
      {deletion.dialog}
    </div>
  );
}

/** frame 의 한 행은 `dl` 하나다. `dl` 은 `dt`/`dd` 만 담으므로 그룹 소제목은 밖에 둔다. */
function Fields({ children }: { readonly children: ReactNode }) {
  return <dl className="grid gap-x-8 md:grid-cols-2">{children}</dl>;
}

/** frame 의 `2026-06-01 12:00:00` 표기. */
function formatDateTime(instant: string): string {
  const day = formatDate(instant);
  if (day === '') return '';
  return `${day} ${formatTimeInTimeZone(instant, displayTimeZone(), 'second')}`;
}
