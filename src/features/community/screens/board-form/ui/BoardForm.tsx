/**
 * 게시판 등록·수정 폼 — Figma 9.1.3 등록 / 9.1.3.1 Case / 9.1.4 수정 frame 의 `기본정보` 섹션을 화면 순서대로
 * 조립한다(2026-09-11 aside 실측, 원장 15행). 규칙(필수·기본값·cascade)은 스키마·기본값 파일이, 여기서는
 * 상위 값에 따른 하위 항목의 활성·초기화만 다룬다. 하위 항목의 `*`는 frame 대로 비활성일 때도 남는다(필수 여부는
 * 상위가 켤 때만 스키마가 검사). `유형 *`의 별표는 읽기 전용 FormTextField 가 받지 않아 그리지 않는다. dialog 는 폼이 렌더한다(form-workflow.md).
 */
import { useState, type ReactNode } from 'react';
import { useSelector } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import {
  BOARD_ATTACHMENT_LIMIT_MAX_MB,
  BOARD_NAME_MAX_LENGTH,
  BOARD_POST_TITLE_MAX_LENGTH,
  boardCommentNoticeModes,
  boardMemberGrades,
  boardPermissions,
  boardPostTitleModes,
  boardRatingModes,
  boardRecordCategories,
  boardSecretCommentModes,
  boardUsages,
} from '@/features/community/model/board';
import { FormCancelButton } from '@/shared/ui/form/FormCancelButton';
import { formFieldControlId } from '@/shared/ui/form/FormField';
import { FormSelectField } from '@/shared/ui/form/FormSelectField';
import { FormSubmitButton } from '@/shared/ui/form/FormSubmitButton';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import { Button } from '@/shared/ui/primitives/Button';
import { Input } from '@/shared/ui/primitives/Input';
import type { BoardFormInput } from '../model/board-form-schema';
import type { BoardInputForm } from './useBoardInputForm';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Figma 가 소제목으로 묶는 항목군(권한·글쓰기 설정·피드백 설정·조회수 설정). 제목은 시각 구분이고 필드 라벨은 각자다. */
function Group({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-neutral-800">{title}</p>
      <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

export function BoardForm({
  form,
  onSubmit,
  onCancel,
  dialogs,
}: {
  readonly form: BoardInputForm['form'];
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
  /** 저장 확인·이탈 확인 dialog. 폼이 렌더해 blocker 만 있고 dialog 가 없는 상태를 만들지 않는다(form-workflow.md). */
  readonly dialogs: ReactNode;
}) {
  const { t } = useTranslation('community');
  const values = useSelector(form.store, (state) => state.values);
  const usageOptions = boardUsages.map((value) => ({ value, label: t(`board.values.usage.${value}`) }));
  const permissionOptions = boardPermissions.map((value) => ({ value, label: t(`board.values.permission.${value}`) }));
  const gradeOptions = boardMemberGrades.map((value) => ({ value, label: t(`board.values.memberGrade.${value}`) }));
  const placeholder = t('board.form.selectPlaceholder');

  return (
    <>
      {dialogs}
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <SectionCard title={t('board.form.section')} collapsible={false}>
          <div className="space-y-6">
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              {/* 유형은 두 frame 모두 읽기 전용 `일반`이다(원장 9행: 관찰된 유형이 하나). */}
              <FormTextField readOnly label={t('board.columns.type')} value={t('board.values.type.GENERAL')} />
              <FormSelectField
                form={form}
                label={t('board.columns.category')}
                name="category"
                options={boardRecordCategories.map((value) => ({ value, label: t(`board.values.category.${value}`) }))}
                placeholder={placeholder}
                required
              />
              <FormTextField
                form={form}
                label={t('board.columns.name')}
                name="name"
                maxLength={BOARD_NAME_MAX_LENGTH}
                placeholder={t('board.form.namePlaceholder', { max: BOARD_NAME_MAX_LENGTH })}
                required
              />
            </div>

            <Group title={t('board.form.permission')}>
              <FormSelectField
                form={form}
                label={t('board.form.write')}
                name="writePermission"
                options={permissionOptions}
                placeholder={placeholder}
                required
                onValueChange={(value) => {
                  if (value !== 'MEMBER_GRADE') form.setFieldValue('writeMemberGrade', '');
                }}
              />
              <FormSelectField
                form={form}
                label={t('board.form.read')}
                name="readPermission"
                options={permissionOptions}
                placeholder={placeholder}
                required
                onValueChange={(value) => {
                  if (value !== 'MEMBER_GRADE') form.setFieldValue('readMemberGrade', '');
                }}
              />
              {/* Figma Case: `회원등급 >` 아래 2단 cascade(일반회원·특별회원). 회원등급을 고른 쪽에만 나타난다. */}
              {values.writePermission === 'MEMBER_GRADE' ? (
                <FormSelectField form={form} label={t('board.form.writeMemberGrade')} name="writeMemberGrade" options={gradeOptions} placeholder={placeholder} required />
              ) : null}
              {values.readPermission === 'MEMBER_GRADE' ? (
                <FormSelectField form={form} label={t('board.form.readMemberGrade')} name="readMemberGrade" options={gradeOptions} placeholder={placeholder} required />
              ) : null}
            </Group>

            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              <FormSelectField form={form} label={t('board.form.categoryUsage')} name="categoryUsage" options={usageOptions} placeholder={placeholder} required />
            </div>

            <Group title={t('board.form.writing')}>
              <FormSelectField
                form={form}
                label={t('board.form.postTitleMode')}
                name="postTitleMode"
                options={boardPostTitleModes.map((value) => ({ value, label: t(`board.values.postTitleMode.${value}`) }))}
                placeholder={placeholder}
                required
                onValueChange={(value) => {
                  if (value !== 'MANAGER_TITLES') form.setFieldValue('managerTitles', []);
                }}
              />
              <ManagerTitlesField
                form={form}
                disabled={values.postTitleMode !== 'MANAGER_TITLES'}
                titles={values.managerTitles}
                onChange={(titles) => form.setFieldValue('managerTitles', [...titles])}
                t={t}
              />
            </Group>

            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              <FormSelectField form={form} label={t('board.form.html')} name="html" options={usageOptions} placeholder={placeholder} required />
            </div>
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              <FormSelectField
                form={form}
                label={t('board.form.attachment')}
                name="attachment"
                options={usageOptions}
                placeholder={placeholder}
                required
                onValueChange={(value) => {
                  if (value !== 'IN_USE') form.setFieldValue('attachmentLimitMb', '');
                }}
              />
              <FormTextField
                form={form}
                label={t('board.form.attachmentLimitMb')}
                name="attachmentLimitMb"
                inputMode="numeric"
                disabled={values.attachment !== 'IN_USE'}
                description={t('board.form.attachmentLimitHint', { max: BOARD_ATTACHMENT_LIMIT_MAX_MB })}
                required
              />
            </div>
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              <FormSelectField form={form} label={t('board.form.popup')} name="popup" options={usageOptions} placeholder={placeholder} required />
            </div>

            <Group title={t('board.form.feedback')}>
              <FormSelectField
                form={form}
                label={t('board.form.rating')}
                name="rating"
                options={boardRatingModes.map((value) => ({ value, label: t(`board.values.rating.${value}`) }))}
                placeholder={placeholder}
                required
              />
            </Group>
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-3">
              <FormSelectField
                form={form}
                label={t('board.form.comment')}
                name="comment"
                options={usageOptions}
                placeholder={placeholder}
                required
                onValueChange={(value) => {
                  if (value !== 'IN_USE') {
                    form.setFieldValue('secretComment', '');
                    form.setFieldValue('commentNotice', 'NOT_IN_USE');
                  }
                }}
              />
              <FormSelectField
                form={form}
                label={t('board.form.secretComment')}
                name="secretComment"
                options={boardSecretCommentModes.map((value) => ({ value, label: t(`board.values.secretComment.${value}`) }))}
                placeholder={placeholder}
                disabled={values.comment !== 'IN_USE'}
                required
              />
              <FormSelectField
                form={form}
                label={t('board.form.commentNotice')}
                name="commentNotice"
                options={boardCommentNoticeModes.map((value) => ({ value, label: t(`board.values.commentNotice.${value}`) }))}
                placeholder={placeholder}
                disabled={values.comment !== 'IN_USE'}
                required
              />
            </div>

            <Group title={t('board.form.viewCount')}>
              <FormSelectField
                form={form}
                label={t('board.form.viewCountDisplay')}
                name="viewCountDisplay"
                options={usageOptions}
                placeholder={placeholder}
                required
                onValueChange={(value) => {
                  if (value !== 'IN_USE') form.setFieldValue('viewCountDuplicate', 'NOT_IN_USE');
                }}
              />
              <FormSelectField
                form={form}
                label={t('board.form.viewCountDuplicate')}
                name="viewCountDuplicate"
                options={usageOptions}
                placeholder={placeholder}
                disabled={values.viewCountDisplay !== 'IN_USE'}
                required
              />
            </Group>

            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              <FormSelectField form={form} label={t('board.columns.usage')} name="usage" options={usageOptions} placeholder={placeholder} required />
            </div>
          </div>
        </SectionCard>
        <div className="mt-6 flex justify-center gap-2">
          <FormSubmitButton pending={false} />
          <FormCancelButton onClick={onCancel} />
        </div>
      </form>
    </>
  );
}

/**
 * Figma 9.1.3 `제목 지정 *`: 입력(300자 내외) + `추가` → 아래에 칩(ⓧ)으로 쌓인다. 게시글 제목 지정이
 * `운영자가 제목 지정`일 때만 활성이다. 값은 폼의 `managerTitles` 배열이고 검증은 스키마가 한다. 입력+버튼+칩의
 * 복합 컨트롤이라 FormField 의 단일 control 계약에 맞지 않아 label·aria-describedby·오류를 여기서 직접 잇는다.
 */
function ManagerTitlesField({
  form,
  disabled,
  titles,
  onChange,
  t,
}: {
  readonly form: BoardInputForm['form'];
  readonly disabled: boolean;
  readonly titles: readonly string[];
  readonly onChange: (titles: readonly string[]) => void;
  readonly t: Translate;
}) {
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<'empty' | 'duplicate' | null>(null);
  const controlId = formFieldControlId<BoardFormInput>(form, 'managerTitles');
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const add = () => {
    const value = draft.trim();
    if (value === '') return setDraftError('empty');
    // 같은 제목이 두 번 들어가면 칩을 구분할 수 없어 막는다(frame·원문에 없는 추론).
    if (titles.includes(value)) return setDraftError('duplicate');
    onChange([...titles, value]);
    setDraft('');
    setDraftError(null);
  };
  return (
    <form.Field name="managerTitles">
      {(field) => {
        const fieldError = field.state.meta.errors.find((item): item is { message: string } => typeof item === 'object' && item !== null && 'message' in item);
        const errorMessage = draftError ? t(`board.form.titleDraft.${draftError}`) : fieldError?.message;
        // 입력만 하고 `추가`를 누르지 않은 제목은 저장에 들어가지 않는다 — 그 상태를 알린다.
        const pendingDraft = !disabled && draft.trim() !== '' && draftError === null;
        return (
          <div className="space-y-2">
            <label htmlFor={controlId} className="block text-sm font-medium text-neutral-800">
              {t('board.form.managerTitles')}
              <span aria-hidden="true">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                id={controlId}
                value={draft}
                disabled={disabled}
                maxLength={BOARD_POST_TITLE_MAX_LENGTH}
                placeholder={t('board.form.managerTitlePlaceholder', { max: BOARD_POST_TITLE_MAX_LENGTH })}
                aria-required={!disabled}
                aria-invalid={errorMessage !== undefined}
                aria-describedby={[pendingDraft ? hintId : null, errorMessage ? errorId : null].filter(Boolean).join(' ') || undefined}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setDraftError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    add();
                  }
                }}
              />
              <Button type="button" className="shrink-0 whitespace-nowrap" disabled={disabled} onClick={add}>
                {t('board.form.addTitle')}
              </Button>
            </div>
            {titles.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {titles.map((title) => (
                  <li key={title} className="inline-flex items-center gap-1 rounded-full border border-neutral-300 px-3 py-1 text-sm">
                    <span>{title}</span>
                    <button
                      type="button"
                      aria-label={t('board.form.removeTitle', { title })}
                      className="text-neutral-500"
                      onClick={() => onChange(titles.filter((item) => item !== title))}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {pendingDraft ? <p id={hintId} className="text-sm text-neutral-600">{t('board.form.titleDraft.pending')}</p> : null}
            {errorMessage ? <p id={errorId} role="alert" className="text-sm text-red-600">{errorMessage}</p> : null}
          </div>
        );
      }}
    </form.Field>
  );
}
