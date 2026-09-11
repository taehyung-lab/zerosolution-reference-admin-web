import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { toBoardHistoryEntries } from './board-history';

/** 라벨 해석만 검증하므로 키를 그대로 돌려주는 t 로 충분하다. */
const t = ((key: string) => key) as unknown as TFunction<'community'>;

describe('toBoardHistoryEntries', () => {
  it('field 코드를 화면 라벨 키로 옮긴다', () => {
    expect(
      toBoardHistoryEntries(
        [
          {
            id: 'log-1',
            updatedAt: '2026-08-21T02:40:00.000Z',
            changes: ['name', 'writePermission'],
            manager: 'Reference Manager',
          },
        ],
        t,
      ),
    ).toEqual([
      {
        id: 'log-1',
        date: '2026-08-21',
        lines: ['board.columns.name', 'board.detail.writePermission'],
        manager: 'Reference Manager',
      },
    ]);
  });

  it('모르는 field 코드는 코드 대신 중립 문구로 접는다', () => {
    const [entry] = toBoardHistoryEntries(
      [{ id: 'log-2', updatedAt: '2026-08-21T02:40:00.000Z', changes: ['secretField'], manager: '' }],
      t,
    );
    expect(entry?.lines).toEqual(['board.detail.historyUnknownField']);
    expect(entry?.manager).toBe('board.detail.emptyValue');
  });

  it('변경 항목이 없으면 빈 값 문구 한 줄만 남는다', () => {
    const [entry] = toBoardHistoryEntries(
      [{ id: 'log-3', updatedAt: '', changes: [], manager: 'Reference Manager' }],
      t,
    );
    expect(entry?.lines).toEqual(['board.detail.emptyValue']);
    expect(entry?.date).toBe('board.detail.emptyValue');
  });
});
