import { useTranslation } from 'react-i18next';
import {
  bannerCategories,
  bannerKeywordFields,
  bannerLinkTypes,
  bannerPeriodTypes,
  bannerStatuses,
} from '@/features/exhibitions/model/banner';
import type { BannerPeriodType } from '@/features/exhibitions/model/banner';
import { standardPeriodPresetValues } from '@/shared/lib/list-options';
import { usePeriodPresets } from '@/shared/i18n/use-period-presets';
import { FilterField } from '@/shared/ui/filter/FilterField';
import { FilterPanel } from '@/shared/ui/filter/FilterPanel';
import { KeywordFilterField } from '@/shared/ui/filter/KeywordFilterField';
import { PeriodFilterField } from '@/shared/ui/filter/PeriodFilterField';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import type { useBannerListFilter } from '../model/useBannerListFilter';

/**
 * Figma 7.1.1.1.1 Case 정의의 검색 영역 순서: 기간 → 검색어 → 구분 → 이동경로 유형 → 게시 상태 →
 * 검색·초기화. 선택지가 전부 도메인 enum 이라 서버에서 오는 option source 가 없다. 패널 제목·검색/
 * 초기화·기간·검색어 같은 공통 문구는 공용 단위가 `shared` namespace 에서 읽으므로 여기서 넘기지 않는다.
 *
 * `구분` 은 frame 이 `전체` 없이 `✓ 홈` 하나만 그린다 — 전체 선택 control 을 빼고(`selectAll={false}`)
 * 조건 없음을 뜻하는 항목도 없으므로 `emptyMeansAll` 을 쓰지 않는다. 하나뿐인 `홈` 을 비운 상태는 원문이
 * 뜻을 적지 않고 canonical 이 기본값으로 되돌리므로(BANNER-LIST 미확인 7), 마지막 항목을 비우는 입력은
 * 받지 않는다 — 화면과 요청이 어긋나지 않게 한다. `이동경로 유형`·`게시 상태` 는 `✓ 전체 |` 로 시작한다.
 */
export function BannerListFilters({
  filter,
}: {
  readonly filter: ReturnType<typeof useBannerListFilter>;
}) {
  const { t } = useTranslation('exhibitions');
  const { presets, customLabel } = usePeriodPresets(standardPeriodPresetValues);
  const { draft, patchDraft, period, keyword } = filter;

  return (
    <FilterPanel onSubmit={filter.submit} onReset={filter.reset}>
      <PeriodFilterField
        label={t('banner.filter.period.label')}
        criterion={{
          value: draft.periodType ?? 'registeredAt',
          options: bannerPeriodTypes.map((value) => ({
            value,
            label: t(`banner.values.periodType.${value}`),
          })),
          onValueChange: (value: BannerPeriodType) => patchDraft({ periodType: value }),
        }}
        preset={period.preset}
        presets={presets}
        customLabel={customLabel}
        onPresetChange={period.setPreset}
        range={period.range}
        onRangeChange={period.setRange}
      />
      <KeywordFilterField
        label={t('banner.filter.keyword.label')}
        field={{
          value: keyword.pending.field,
          options: bannerKeywordFields.map((value) => ({
            value,
            label: t(`banner.values.keywordField.${value}`),
          })),
          onValueChange: keyword.setPendingField,
        }}
        items={keyword.items}
        pendingValue={keyword.pending.value}
        onPendingValueChange={keyword.setPendingValue}
        onAdd={keyword.addPending}
        onRemoveAt={keyword.removeAt}
        formatItem={(item) =>
          t('banner.filter.keyword.chip', {
            field: t(`banner.values.keywordField.${item.field}`),
            value: item.value,
          })
        }
      />
      <FilterField label={t('banner.filter.category.label')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            selectAll={false}
            nodes={bannerCategories.map((value) => ({
              value,
              label: t(`banner.values.category.${value}`),
            }))}
            values={draft.categories ?? []}
            onValueChange={(values) => {
              if (values.length === 0) return;
              patchDraft({ categories: values as (typeof bannerCategories)[number][] });
            }}
          />
        )}
      </FilterField>
      <FilterField label={t('banner.filter.linkType.label')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={bannerLinkTypes.map((value) => ({
              value,
              label: t(`banner.values.linkType.${value}`),
            }))}
            values={draft.linkTypes ?? []}
            onValueChange={(values) =>
              patchDraft({ linkTypes: values as (typeof bannerLinkTypes)[number][] })}
          />
        )}
      </FilterField>
      <FilterField label={t('banner.filter.status.label')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            emptyMeansAll
            nodes={bannerStatuses.map((value) => ({
              value,
              label: t(`banner.values.status.${value}`),
            }))}
            values={draft.statuses ?? []}
            onValueChange={(values) =>
              patchDraft({ statuses: values as (typeof bannerStatuses)[number][] })}
          />
        )}
      </FilterField>
    </FilterPanel>
  );
}
