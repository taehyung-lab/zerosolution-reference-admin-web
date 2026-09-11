import { describe, expect, it } from 'vitest';
import { i18n } from '@/shared/i18n/i18n';
import type { TFunction } from 'i18next';
import { toBoardHistoryEntries } from './board-history';

const t: TFunction<'community'> = i18n.getFixedT('ko', 'community');

describe('board history mapper (Figma 9.1.2 업데이트 이력)', () => {
  it('등록은 한 줄, 수정은 항목 경로 : 이전 > 이후 줄들이다', () => {
    const entries = toBoardHistoryEntries(
      [
        {
          id: 'log-2',
          updatedAt: '2026-06-01T04:54:41.000Z',
          kind: 'UPDATE',
          changes: [
            { field: 'name', before: '공지', after: '1:1문의' },
            { field: 'write', before: 'INCLUDING_GUEST', after: 'ALL_MEMBERS' },
            { field: 'html', before: 'NOT_IN_USE', after: 'IN_USE' },
          ],
          manager: '김제로(admin)',
        },
        { id: 'log-1', updatedAt: '2026-06-01T03:12:11.000Z', kind: 'CREATE', changes: [], manager: '김제로(admin)' },
      ],
      t,
    );
    expect(entries[0]?.lines).toEqual([
      '수정',
      '게시판명 : 공지 > 1:1문의',
      '권한 > 쓰기 : 비회원 포함 > 전체회원',
      '글쓰기 설정 > HTML : 사용안함 > 사용',
    ]);
    expect(entries[1]?.lines).toEqual(['등록']);
    expect(entries[0]?.manager).toBe('김제로(admin)');
  });

  it('모르는 항목 코드는 코드를 노출하지 않고 접는다', () => {
    const [entry] = toBoardHistoryEntries(
      [{ id: 'log', updatedAt: '2026-06-01T00:00:00.000Z', kind: 'UPDATE', changes: [{ field: 'mystery', before: 'a', after: 'b' }], manager: '' }],
      t,
    );
    expect(entry?.lines).toEqual(['수정', '알 수 없는 항목이 변경되었습니다.']);
    expect(entry?.lines.join(' ')).not.toContain('mystery');
    expect(entry?.manager).toBe('-');
  });
});
