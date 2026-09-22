import { useTranslation } from 'react-i18next';
import { usePostBoardOptions } from '@/features/community/api/usePostBoardOptions';
import {
  postAnswerStatuses,
  postCategories,
  postKeywordFields,
  postMemberTypes,
  postPeriodTypes,
  postStatuses,
} from '@/features/community/model/post';
import type { PostMemberType, PostPeriodType } from '@/features/community/model/post';
import { standardPeriodPresetValues } from '@/shared/lib/list-options';
import { usePeriodPresets } from '@/shared/i18n/use-period-presets';
import { AsyncFieldBoundary } from '@/shared/ui/feedback/AsyncFieldBoundary';
import { FilterField } from '@/shared/ui/filter/FilterField';
import { FilterPanel } from '@/shared/ui/filter/FilterPanel';
import { KeywordFilterField } from '@/shared/ui/filter/KeywordFilterField';
import { PeriodFilterField } from '@/shared/ui/filter/PeriodFilterField';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import { Select } from '@/shared/ui/primitives/Select';
import type { usePostListFilter } from '../model/usePostListFilter';

/** 검색 영역의 "전체"(조건 없음)를 뜻하는 UI 전용 값. URL·요청에는 나가지 않는다. */
const ANY = 'ANY';

const optional = (value: string | null): string | undefined =>
  value === null || value === ANY ? undefined : value;

/**
 * Figma 9.2.1 Case 정의의 검색 영역 순서: 기간 → 검색어 → 구분 → 게시판 → 회원유형 → 답변상태 →
 * 게시상태 → 검색·초기화. 게시판 선택지만 서버에서 오므로 `AsyncFieldBoundary` 안에서 렌더해
 * 실패를 빈 목록으로 숨기지 않는다. 패널 제목·검색/초기화·기간·검색어 같은 공통 문구는 공용 단위가
 * `shared` namespace 에서 읽으므로 여기서 넘기지 않는다.
 */
export function PostListFilters({
  filter,
}: {
  readonly filter: ReturnType<typeof usePostListFilter>;
}) {
  const { t } = useTranslation('community');
  const { presets, customLabel } = usePeriodPresets(standardPeriodPresetValues);
  const { draft, patchDraft, period, keyword } = filter;
  const boards = usePostBoardOptions();

  return (
    <FilterPanel onSubmit={filter.submit} onReset={filter.reset}>
      <PeriodFilterField
        label={t('post.filter.period.label')}
        criterion={{
          value: draft.periodType ?? 'registeredAt',
          options: postPeriodTypes.map((value) => ({
            value,
            label: t(`post.values.periodType.${value}`),
          })),
          onValueChange: (value: PostPeriodType) => patchDraft({ periodType: value }),
        }}
        preset={period.preset}
        presets={presets}
        customLabel={customLabel}
        onPresetChange={period.setPreset}
        range={period.range}
        onRangeChange={period.setRange}
      />
      <KeywordFilterField
        label={t('post.filter.keyword.label')}
        field={{
          value: keyword.pending.field,
          options: postKeywordFields.map((value) => ({
            value,
            label: t(`post.values.keywordField.${value}`),
          })),
          onValueChange: keyword.setPendingField,
        }}
        items={keyword.items}
        pendingValue={keyword.pending.value}
        onPendingValueChange={keyword.setPendingValue}
        onAdd={keyword.addPending}
        onRemoveAt={keyword.removeAt}
        formatItem={(item) =>
          t('post.filter.keyword.chip', {
            field: t(`post.values.keywordField.${item.field}`),
            value: item.value,
          })
        }
      />
      <FilterField label={t('post.filter.category.label')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={postCategories.map((value) => ({
              value,
              label: t(`post.values.category.${value}`),
            }))}
            values={draft.categories ?? []}
            onValueChange={(values) =>
              patchDraft({ categories: values as (typeof postCategories)[number][] })}
          />
        )}
      </FilterField>
      <FilterField label={t('post.filter.board.label')}>
        {({ labelId, controlId }) => (
          <AsyncFieldBoundary labelledBy={labelId} state={boards.state} onRetry={boards.retry}>
            <Select
              id={controlId}
              aria-labelledby={labelId}
              className="w-64"
              options={[{ value: ANY, label: t('post.filter.all') }, ...boards.items]}
              value={draft.boardId ?? ANY}
              onValueChange={(value) => patchDraft({ boardId: optional(value) })}
            />
          </AsyncFieldBoundary>
        )}
      </FilterField>
      <FilterField label={t('post.filter.memberType.label')}>
        {({ labelId, controlId }) => (
          <Select
            id={controlId}
            aria-labelledby={labelId}
            className="w-64"
            options={[
              { value: ANY, label: t('post.filter.all') },
              ...postMemberTypes.map((value) => ({
                value,
                label: t(`post.values.memberType.${value}`),
              })),
            ]}
            value={draft.memberType ?? ANY}
            onValueChange={(value) =>
              patchDraft({ memberType: optional(value) as PostMemberType | undefined })}
          />
        )}
      </FilterField>
      <FilterField label={t('post.filter.answerStatus.label')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={postAnswerStatuses.map((value) => ({
              value,
              label: t(`post.values.answerStatus.${value}`),
            }))}
            values={draft.answerStatuses ?? []}
            onValueChange={(values) =>
              patchDraft({ answerStatuses: values as (typeof postAnswerStatuses)[number][] })}
          />
        )}
      </FilterField>
      <FilterField label={t('post.filter.status.label')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={postStatuses.map((value) => ({
              value,
              label: t(`post.filter.status.${value}`),
            }))}
            values={draft.statuses ?? []}
            onValueChange={(values) =>
              patchDraft({ statuses: values as (typeof postStatuses)[number][] })}
          />
        )}
      </FilterField>
    </FilterPanel>
  );
}
