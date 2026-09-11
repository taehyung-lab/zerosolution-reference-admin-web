import { describe, expect, it } from 'vitest';
import { boardCreateDefaults, toBoardEditDefaults } from './board-form-defaults';
import { boardFormFieldOrder, boardFormSchema } from './board-form-schema';

describe('board form schema', () => {
  it('원문이 열거한 세 필드만 받는다', () => {
    expect(boardFormFieldOrder).toEqual(['category', 'name', 'writePermission']);
  });

  it('구분 기본값은 일반이고 권한 쓰기는 빈 선택으로 시작한다', () => {
    expect(boardCreateDefaults).toEqual({
      category: 'GENERAL',
      name: '',
      writePermission: '',
    });
  });

  it('빈 선택과 빈 이름을 거부한다', () => {
    const result = boardFormSchema.safeParse(boardCreateDefaults);
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((issue) => issue.path.join('.')).sort();
    expect(fields).toEqual(['name', 'writePermission']);
  });

  it('공백만 있는 게시판명을 거부한다', () => {
    const result = boardFormSchema.safeParse({
      ...boardCreateDefaults,
      name: '   ',
      writePermission: 'MANAGER',
    });
    expect(result.success).toBe(false);
  });

  it('구분에 공지사항을 허용한다 — 검색 필터(일반·상담)보다 넓다', () => {
    const result = boardFormSchema.safeParse({
      category: 'NOTICE',
      name: 'Notice board',
      writePermission: 'MANAGER',
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      category: 'NOTICE',
      name: 'Notice board',
      writePermission: 'MANAGER',
    });
  });

  it('원문에 없는 권한 값을 거부한다', () => {
    expect(
      boardFormSchema.safeParse({
        category: 'GENERAL',
        name: 'Board',
        writePermission: 'EVERYONE',
      }).success,
    ).toBe(false);
  });

  it('수정 기본값은 조회 레코드의 같은 세 필드만 옮긴다', () => {
    expect(
      toBoardEditDefaults({
        id: 'reference-board-5',
        type: 'GENERAL',
        category: 'COUNSEL',
        name: 'Reference Board 5',
        writePermission: 'ALL_MEMBERS',
        readPermission: 'MANAGER',
        postCount: 583,
        usage: 'IN_USE',
        registeredAt: '2026-03-18T09:20:00.000Z',
        updatedAt: '2026-09-05T11:05:00.000Z',
        changeLogs: [],
      }),
    ).toEqual({
      category: 'COUNSEL',
      name: 'Reference Board 5',
      writePermission: 'ALL_MEMBERS',
    });
  });
});
