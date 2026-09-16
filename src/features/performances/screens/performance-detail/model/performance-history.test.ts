import { describe, expect, it } from 'vitest';
import { i18n } from '@/shared/i18n/i18n';
import { toPerformanceHistoryEntries } from './performance-history';

describe('공연 업데이트 내역 변환', () => {
  it('모르는 항목 코드·개인 값·JSON·같은 값 쌍을 노출하지 않는다', () => {
    const entries = toPerformanceHistoryEntries(
      [
        {
          id: 'history-1',
          occurredAt: '2026-09-01T00:00:00Z',
          operator: null,
          changes: [
            { field: 'drawing', before: 'same.txt', after: 'same.txt' },
            { field: 'drawing', before: { secret: 'private-json' }, after: null },
            { field: 'private-field-code', before: 'private-value-before', after: 'private-value-after' },
          ],
        },
      ],
      i18n.getFixedT('ko', 'performances'),
    );
    expect(entries[0]?.lines).toEqual(['수정', '안내 도면', '안내 도면', '업데이트 사항']);
    expect(JSON.stringify(entries)).not.toMatch(/private-|same.txt/);
    expect(entries[0]?.actor).toBe('-');
  });
});
