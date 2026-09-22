/**
 * 게시물 등록·수정 폼 — Figma 9.2.3 등록 / 9.2.3.1 Case / 9.2.4 수정 frame 의 `기본정보` 섹션을 화면
 * 순서대로 조립한다(2026-09-22 aside 실측). 규칙(필수·기본값)은 스키마·기본값 파일이 소유하고, 여기서는
 * 게시판을 고치면 카테고리 선택지와 값이 따라 바뀌는 것만 다룬다.
 *
 * frame 이 그리지만 여기 없는 입력과 그 이유는 `post-form-schema.ts` 의 머리글과 POST-FORM fact 가
 * 이름으로 적는다(파일첨부·조회수·시분초·HTML 에디터·작성자 검색 팝업·팝업 설정).
 */
import { useSelector } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import {
  usePostBoardCategoryOptions,
  usePostBoardOptions,
} from '@/features/community/api/usePostBoardOptions';
import { postRecordCategories, postStatuses } from '@/features/community/model/post';
import { FormCancelButton } from '@/shared/ui/form/FormCancelButton';
import { FormField } from '@/shared/ui/form/FormField';
import { FormSaveFailureMessage } from '@/shared/ui/form/FormSaveDialogs';
import { FormSelectField } from '@/shared/ui/form/FormSelectField';
import { FormSubmitButton } from '@/shared/ui/form/FormSubmitButton';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import { FormDateField } from '@/shared/ui/form/FormDateField';
import type { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import type { PostFormInput, PostFormValues } from '../model/post-form-schema';

export type PostSaveForm = ReturnType<typeof useSaveForm<PostFormInput, PostFormValues, 'info'>>;

/** 수정 화면이 넘기는 읽기 전용 작성자 행. 등록 화면은 작성자를 고르는 표면이 보류라 넘기지 않는다. */
export interface PostFormAuthor {
  readonly memberType: string;
  readonly memberGrade: string;
  readonly author: string;
}

export function PostForm({
  save,
  author,
  onCancel,
}: {
  readonly save: PostSaveForm;
  readonly author?: PostFormAuthor;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('community');
  const { form } = save;
  const values = useSelector(form.store, (state) => state.values);
  const boards = usePostBoardOptions();
  const categories = usePostBoardCategoryOptions(values.boardId);
  const placeholder = t('post.form.selectPlaceholder');

  return (
    <>
      {save.dialogs}
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save.submit.run();
        }}
      >
        {save.stage.kind === 'failed' ? <FormSaveFailureMessage failure={save.stage.root} /> : null}
        <SectionCard title={t('post.form.section')} {...save.sections.sectionProps('info')}>
          <div className="space-y-6">
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              <FormSelectField
                form={form}
                label={t('post.columns.category')}
                name="category"
                options={postRecordCategories.map((value) => ({
                  value,
                  label: t(`post.values.recordCategory.${value}`),
                }))}
                placeholder={placeholder}
                required
              />
              <FormSelectField
                form={form}
                label={t('post.columns.board')}
                name="boardId"
                options={boards.items}
                placeholder={placeholder}
                required
                state={boards.state}
                onRetry={boards.retry}
                onValueChange={() => {
                  // 게시판이 바뀌면 이전 게시판의 카테고리는 고를 수 없는 값이 된다.
                  form.setFieldValue('boardCategoryId', '');
                  form.setFieldValue('boardCategoryRequired', false);
                }}
              />
              <FormSelectField
                form={form}
                label={t('post.columns.boardCategory')}
                name="boardCategoryId"
                options={categories.items}
                placeholder={placeholder}
                required={categories.items.length > 0}
                disabled={categories.items.length === 0}
                state={categories.state}
                onRetry={categories.retry}
                onValueChange={() => form.setFieldValue('boardCategoryRequired', true)}
              />
            </div>
            {author === undefined ? null : (
              <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
                <FormTextField readOnly label={t('post.detail.memberType')} value={author.memberType} />
                <FormTextField readOnly label={t('post.detail.memberGrade')} value={author.memberGrade} />
                <FormTextField readOnly label={t('post.columns.author')} value={author.author} />
                <FormTextField
                  form={form}
                  label={t('post.detail.answerEmail')}
                  name="answerEmail"
                  required={values.answerEmailRequired}
                />
              </div>
            )}
            <div className="grid gap-x-8 gap-y-4">
              <FormTextField
                form={form}
                label={t('post.columns.title')}
                name="title"
                required
              />
              <FormField form={form} name="content" label={t('post.columns.content')} required>
                {(field, control) => (
                  <textarea
                    {...control}
                    className="min-h-40 w-full rounded border border-neutral-300 p-3 text-sm"
                    name={field.name}
                    value={typeof field.state.value === 'string' ? field.state.value : ''}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                )}
              </FormField>
            </div>
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              <FormDateField
                form={form}
                label={t('post.detail.registeredAt')}
                name="registeredAt"
                required
              />
              <FormSelectField
                form={form}
                label={t('post.columns.status')}
                name="status"
                options={postStatuses.map((value) => ({
                  value,
                  label: t(`post.values.status.${value}`),
                }))}
                required
              />
            </div>
          </div>
        </SectionCard>
        <div className="mt-6 flex justify-center gap-2">
          <FormSubmitButton pending={save.submit.isPending} />
          <FormCancelButton disabled={save.submit.isPending} onClick={() => save.guard.leave(onCancel)} />
        </div>
      </form>
    </>
  );
}
