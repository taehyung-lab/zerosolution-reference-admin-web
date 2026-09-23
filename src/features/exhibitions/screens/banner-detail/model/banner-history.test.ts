import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { i18n } from '@/shared/i18n/i18n';
import { toBannerHistoryEntries } from './banner-history';

const t: TFunction<'exhibitions'> = i18n.getFixedT('ko', 'exhibitions');

describe('toBannerHistoryEntries', () => {
  it('수정은 종류 한 줄 아래에 항목별 이전 > 이후 줄을 쌓고, 등록은 한 낱말이다', () => {
    const entries = toBannerHistoryEntries(
      [
        {
          id: 'log-2',
          updatedAt: '2026-06-01T04:54:41.000Z',
          kind: 'UPDATE',
          changes: [
            { field: 'order', before: '10', after: '1' },
            { field: 'image', before: 'old.png', after: '' },
          ],
          manager: '',
        },
        { id: 'log-1', updatedAt: '2026-06-01T03:12:11.000Z', kind: 'CREATE', changes: [], manager: 'Reference' },
      ],
      t,
    );

    expect(entries[0]?.lines).toEqual(['수정', '- 게시순서 : 10 > 1', '- 이미지 : old.png > -']);
    expect(entries[0]?.actor).toBe('-');
    expect(entries[1]?.lines).toEqual(['등록']);
    expect(entries[1]?.date).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});
