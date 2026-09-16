import { describe, expect, it } from 'vitest';
import { i18n } from '@/shared/i18n/i18n';
import { toManagerHistoryEntries } from './manager-history';

const t = i18n.getFixedT('ko', 'managers');

describe('운영자 업데이트 내역 변환', () => {
  it('등록·삭제는 한 줄, 수정은 항목: 이전 > 이후 줄들이다', () => {
    const entries = toManagerHistoryEntries(
      [
        {
          id: 'log-3',
          updatedAt: '2026-08-28T00:00:00Z',
          kind: 'UPDATE',
          changes: [
            { field: 'name', before: '김체로', after: '김영영' },
            { field: 'permission', before: '일반관리자', after: '최고관리자' },
            { field: 'accountStatus', before: 'active', after: 'inactive' },
          ],
          manager: 'Admin',
        },
        { id: 'log-2', updatedAt: '2026-08-28T00:00:00Z', kind: 'DELETE', changes: [], manager: '' },
        { id: 'log-1', updatedAt: '2026-08-28T00:00:00Z', kind: 'CREATE', changes: [], manager: 'Admin' },
      ],
      t,
    );
    expect(entries.map((entry) => entry.lines)).toEqual([
      ['수정', '이름: 김체로 > 김영영', '권한: 일반관리자 > 최고관리자', '계정 상태: 활성 > 비활성'],
      ['삭제'],
      ['등록'],
    ]);
    expect(entries[1]?.actor).toBe('-');
    expect(entries[0]?.date).toBe('2026-08-28');
  });

  it('비밀번호 값과 모르는 항목 코드는 노출하지 않고, 좌우가 같으면 항목명만 남긴다', () => {
    const [entry] = toManagerHistoryEntries(
      [
        {
          id: 'log',
          updatedAt: '2026-08-28T00:00:00Z',
          kind: 'UPDATE',
          changes: [
            { field: 'password', before: 'old-secret', after: 'new-secret' },
            { field: 'internalFlag', before: '1', after: '2' },
            { field: 'email', before: 'a@b.c', after: 'a@b.c' },
            { field: 'organization', before: '', after: 'Example' },
          ],
          manager: 'Admin',
        },
      ],
      t,
    );
    expect(entry?.lines).toEqual(['수정', '비밀번호', '기타 항목 변경', '이메일', '소속: - > Example']);
    expect(entry?.lines.join('\n')).not.toContain('secret');
    expect(entry?.lines.join('\n')).not.toContain('internalFlag');
  });
});
