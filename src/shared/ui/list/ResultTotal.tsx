import { useTranslation } from 'react-i18next';
import { formatCount } from '@/shared/lib/format';
import { ResultSummary } from './ResultSummary';

/** 검색 전의 부재와 검색 후 0건을 구분한다. 배치 순서와 조회·오류 정책은 소비 화면이 소유한다. */
export function ResultTotal({ searched, total }: {
  readonly searched: boolean;
  readonly total: number;
}) {
  const { t, i18n } = useTranslation('shared');
  if (!searched) return null;
  return <ResultSummary groups={[{
    key: 'total',
    items: [{ key: 'total', text: t('list.total', { formatted: formatCount(i18n.language, total) }) }],
  }]} />;
}
