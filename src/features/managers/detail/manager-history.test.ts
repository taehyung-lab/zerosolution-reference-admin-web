import { describe, expect, it } from 'vitest';
import type { ManagerChangeLogChange } from '../api/manager-detail-contract';
import { i18n } from '@/shared/i18n/i18n';
import { toManagerHistoryEntries } from './manager-history';

const t = i18n.getFixedT('ko', 'managers');

/** 리허설 snapshot은 before/after를 object map으로 선언하지만 실제 값은 primitive도 온다. 매퍼는 unknown으로 다룬다. */
const change = (field: string, before: unknown, after: unknown) =>
  ({ field, before, after }) as unknown as ManagerChangeLogChange;

describe('toManagerHistoryEntries', () => {
  it('renders created and deleted as one line and updated with one line per change', () => {
    const entries = toManagerHistoryEntries(
      [
        {
          id: 1,
          type: 'C',
          createdAt: '2026-08-28T00:00:00Z',
          manager: { name: 'Admin' },
        },
        { id: 2, type: 'D', createdAt: '2026-08-28T00:00:00Z' },
        {
          id: 3,
          type: 'U',
          createdAt: '2026-08-28T00:00:00Z',
          manager: { name: 'Admin' },
          changes: [
            change('name', '김체로', '김영영'),
            change('permission', { id: 1, name: '일반관리자' }, { id: 2, name: '최고관리자' }),
          ],
        },
      ],
      t,
    );
    expect(entries.map((entry) => entry.lines)).toEqual([
      ['등록'],
      ['삭제'],
      ['수정', '이름: 김체로 > 김영영', '권한: 일반관리자 > 최고관리자'],
    ]);
    expect(entries[1]!.manager).toBe('-');
    expect(entries.map((entry) => entry.id)).toEqual(['1', '2', '3']);
  });

  it('never exposes redacted values, raw JSON, or server field codes', () => {
    const [entry] = toManagerHistoryEntries(
      [
        {
          id: 9,
          type: 'U',
          createdAt: '2026-08-28T00:00:00Z',
          changes: [
            change('password', 'old-secret', 'new-secret'),
            change('permission', { deep: { nested: true } }, 'x'),
            change('internalFlag', 1, 2),
            change('status', 'ACTIVE', 'ACTIVE'),
            change('email', null, 'a@b.c'),
          ],
        },
      ],
      t,
    );
    const text = entry!.lines.join('\n');
    expect(entry!.lines).toEqual([
      '수정',
      '비밀번호',
      '권한: 표시할 수 없는 값',
      '기타 항목 변경',
      '계정 상태',
      '이메일: - > a@b.c',
    ]);
    expect(text).not.toContain('secret');
    expect(text).not.toContain('nested');
    expect(text).not.toContain('internalFlag');
  });

  it('returns no entries for a missing list and falls back to a non-index key when id is absent', () => {
    expect(toManagerHistoryEntries(undefined, t)).toEqual([]);
    const [entry] = toManagerHistoryEntries([{ type: 'U', createdAt: '2026-08-28T00:00:00Z' }], t);
    expect(entry!.id).toBe('2026-08-28T00:00:00Z#0');
    expect(entry!.lines).toEqual(['수정']);
  });
});
