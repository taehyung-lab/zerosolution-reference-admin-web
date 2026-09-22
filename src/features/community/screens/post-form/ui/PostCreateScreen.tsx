import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { classifyFormError } from '@/api/form-error';
import { createPostMutation } from '@/features/community/api/mutations';
import { useLocale } from '@/shared/i18n/locale-context';
import { formatDate } from '@/shared/lib/datetime';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { postCreateDefaults } from '../model/post-form-defaults';
import { toPostWriteInput } from '../model/post-form-request';
import { postFormFieldOrder, postFormSchema } from '../model/post-form-schema';
import { PostForm } from './PostForm';

/**
 * 9.2.3 게시물 등록(Figma, 2026-09-22 실측). 검증 → 저장 확인 → mutation → 저장 완료 → 목록.
 * 서버가 없는 동안 mutation 은 미연결 실패로 끝나 폼 위에 공용 실패 문구가 남고 그 다음은 일어나지 않는다.
 *
 * 작성자는 frame 의 `본인으로 작성하기` 경로만 가능하다 — `작성자 검색` 팝업(9.2.5.4)이 `범위 내 보류`라
 * 다른 회원을 고를 표면이 없고, 그래서 작성자 행과 `답변받을 이메일`(등록 frame 에서 비활성)도 그리지 않는다.
 */
export function PostCreateScreen({
  onSaved,
  onCancel,
}: {
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('community');
  const { locale } = useLocale();
  const create = useMutation(createPostMutation(locale));
  // 등록일의 기본값은 화면을 연 날이다. 첫 렌더에 고정해 시간이 흘러도 초안이 흔들리지 않게 한다.
  const [today] = useState(() => formatDate(new Date().toISOString()));
  const save = useSaveForm({
    schema: postFormSchema,
    defaultValues: postCreateDefaults(today),
    sections: { info: postFormFieldOrder },
    save: {
      run: (values) => create.mutateAsync(toPostWriteInput(values)),
      isPending: create.isPending,
    },
    mapError: (error) => classifyFormError(error, postFormFieldOrder),
    onDone: onSaved,
  });

  return (
    <section>
      <PageHeader
        breadcrumbs={[
          t('post.breadcrumb.community'),
          t('post.breadcrumb.posts'),
          t('post.breadcrumb.create'),
        ]}
        title={t('post.form.createTitle')}
      />
      <PostForm save={save} onCancel={onCancel} />
    </section>
  );
}
