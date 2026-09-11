import { describe, expect, it } from 'vitest';
import { boardCreateDefaults, toBoardSettings } from './board-form-defaults';
import { boardFormFieldOrder, boardFormSchema } from './board-form-schema';

const valid = {
  ...boardCreateDefaults,
  name: 'Notice board',
  writePermission: 'MANAGER',
  readPermission: 'ALL_MEMBERS',
  postTitleMode: 'AUTHOR_INPUT',
};

describe('board form schema (Figma 9.1.3 / 9.1.3.1 Case)', () => {
  it('화면 순서대로 20개 입력을 안다 — 유형은 읽기 전용이라 없다', () => {
    expect(boardFormFieldOrder).toHaveLength(20);
    expect(boardFormFieldOrder[0]).toBe('category');
    expect(boardFormFieldOrder.at(-1)).toBe('usage');
    expect(boardFormFieldOrder).not.toContain('type');
  });

  it('등록 초기 상태는 Figma 등록 frame 과 같다', () => {
    expect(boardCreateDefaults).toMatchObject({
      category: 'GENERAL',
      writePermission: '',
      readPermission: '',
      categoryUsage: 'IN_USE',
      postTitleMode: '',
      html: 'NOT_IN_USE',
      attachment: 'NOT_IN_USE',
      rating: 'NOT_IN_USE',
      comment: 'NOT_IN_USE',
      commentNotice: 'NOT_IN_USE',
      viewCountDisplay: 'NOT_IN_USE',
      usage: 'IN_USE',
    });
  });

  it('초기 상태의 빈 선택을 거부한다', () => {
    const result = boardFormSchema.safeParse(boardCreateDefaults);
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((issue) => issue.path.join('.')).sort();
    expect(fields).toEqual(['name', 'postTitleMode', 'readPermission', 'writePermission']);
  });

  it('하위 항목은 상위가 켤 때만 필수다', () => {
    const grade = boardFormSchema.safeParse({ ...valid, writePermission: 'MEMBER_GRADE' });
    expect(grade.error?.issues.map((issue) => issue.path.join('.'))).toEqual(['writeMemberGrade']);

    const titles = boardFormSchema.safeParse({ ...valid, postTitleMode: 'MANAGER_TITLES' });
    expect(titles.error?.issues.map((issue) => issue.path.join('.'))).toEqual(['managerTitles']);

    for (const attachmentLimitMb of ['11', '0', '1e1', ' 5 ', '0x5']) {
      const limit = boardFormSchema.safeParse({ ...valid, attachment: 'IN_USE', attachmentLimitMb });
      expect(limit.error?.issues.map((issue) => issue.path.join('.')), attachmentLimitMb).toEqual(['attachmentLimitMb']);
    }
    expect(boardFormSchema.safeParse({ ...valid, attachment: 'IN_USE', attachmentLimitMb: '10' }).success).toBe(true);

    const comment = boardFormSchema.safeParse({ ...valid, comment: 'IN_USE', commentNotice: '' });
    expect(comment.error?.issues.map((issue) => issue.path.join('.')).sort()).toEqual(['commentNotice', 'secretComment']);

    expect(boardFormSchema.safeParse({ ...valid, comment: 'IN_USE', secretComment: 'PUBLIC_ONLY', commentNotice: 'EMAIL' }).success).toBe(true);
  });

  it('게시판명은 30자 내외, 공백만은 거부한다', () => {
    expect(boardFormSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false);
    expect(boardFormSchema.safeParse({ ...valid, name: 'a'.repeat(31) }).success).toBe(false);
    expect(boardFormSchema.safeParse({ ...valid, name: 'a'.repeat(30) }).success).toBe(true);
  });

  it('저장 입력은 꺼진 하위 항목을 남기지 않고 유형을 일반으로 고정한다', () => {
    const settings = toBoardSettings(boardFormSchema.parse({ ...valid, attachment: 'IN_USE', attachmentLimitMb: '10' }));
    expect(settings).toMatchObject({
      type: 'GENERAL',
      write: { permission: 'MANAGER' },
      read: { permission: 'ALL_MEMBERS' },
      attachmentLimitMb: 10,
      managerTitles: [],
    });
    expect(settings).not.toHaveProperty('secretComment');
    expect(settings).not.toHaveProperty('viewCountDuplicate');
    expect(settings.write).not.toHaveProperty('memberGrade');
  });
});
