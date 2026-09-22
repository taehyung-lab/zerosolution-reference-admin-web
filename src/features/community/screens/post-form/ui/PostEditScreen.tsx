import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { classifyFormError } from '@/api/form-error';
import { updatePostMutation } from '@/features/community/api/mutations';
import { usePostDetail } from '@/features/community/api/usePostDetail';
import type { PostDetail } from '@/features/community/model/post';
import { useLocale } from '@/shared/i18n/locale-context';
import { maskEmail } from '@/shared/lib/mask-contact';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { toPostEditDefaults } from '../model/post-form-defaults';
import { toPostWriteInput } from '../model/post-form-request';
import { postFormFieldOrder, postFormSchema } from '../model/post-form-schema';
import { PostForm, type PostFormAuthor } from './PostForm';

/**
 * 9.2.4 게시물 수정(Figma, 2026-09-22 실측): 등록과 같은 항목을 조회 값으로 채워 보여 주고, 작성자
 * 세 행은 읽기 전용이며 `답변받을 이메일 *` 만 입력이다.
 * 조회 실패에도 제목이 남도록 헤더를 상태 경계 밖에 둔다. 폼은 조회가 성공한 뒤에만 mount 해
 * 서버 재조회가 입력 초안을 덮어쓰지 않게 한다. 진입 실패는 route loader 가 이미 처리했다.
 */
export function PostEditScreen({
  postId,
  onSaved,
  onCancel,
}: {
  readonly postId: string;
  readonly onSaved: (postId: string) => void;
  readonly onCancel: () => void;
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
          t('post.breadcrumb.edit'),
        ]}
        title={t('post.form.editTitle')}
      />
      <DetailStateBoundary query={detail}>
        {(post) => (
          <PostEditForm
            key={post.id}
            post={post}
            onSaved={() => onSaved(post.id)}
            onCancel={onCancel}
          />
        )}
      </DetailStateBoundary>
    </section>
  );
}

function PostEditForm({
  post,
  onSaved,
  onCancel,
}: {
  readonly post: PostDetail;
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('community');
  const { locale } = useLocale();
  const update = useMutation(updatePostMutation(locale));
  const save = useSaveForm({
    schema: postFormSchema,
    defaultValues: toPostEditDefaults(post),
    sections: { info: postFormFieldOrder },
    save: {
      run: (values) => update.mutateAsync({ postId: post.id, input: toPostWriteInput(values) }),
      isPending: update.isPending,
    },
    mapError: (error) => classifyFormError(error, postFormFieldOrder),
    onDone: onSaved,
  });
  const empty = t('post.columns.emptyValue');
  const contact =
    post.author.email === undefined ? post.author.accountId : maskEmail(post.author.email);
  const author: PostFormAuthor = {
    memberType: t(`post.values.authorType.${post.authorType}`),
    memberGrade:
      post.authorGrade === undefined ? empty : t(`post.values.authorGrade.${post.authorGrade}`),
    author:
      contact === undefined
        ? post.author.name
        : t('post.values.author', { name: post.author.name, contact }),
  };

  return <PostForm save={save} author={author} onCancel={onCancel} />;
}
