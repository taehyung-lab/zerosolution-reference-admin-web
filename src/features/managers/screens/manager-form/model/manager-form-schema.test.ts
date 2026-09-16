import { describe, expect, it } from 'vitest';
import { managerCreateDefaults } from './manager-form-defaults';
import { toManagerCreateSettings, toManagerSettings } from './manager-form-request';
import {
  managerCreateFieldOrder,
  managerCreateSchema,
  managerEditFieldOrder,
  managerEditSchema,
} from './manager-form-schema';

const valid = {
  type: 'INTERNAL',
  permissionId: '1',
  name: '김',
  phone: '010-1234-5678',
  email: 'operator@example.com',
  organization: '',
};

describe('운영자 등록·수정 입력 계약', () => {
  it('필드 순서가 schema 의 키 집합과 같다', () => {
    expect([...managerCreateFieldOrder].sort()).toEqual(Object.keys(managerCreateSchema.shape).sort());
    expect([...managerEditFieldOrder].sort()).toEqual(Object.keys(managerEditSchema.shape).sort());
  });

  it('등록의 빈 초기 상태는 유형·권한·아이디·비밀번호·이름·휴대폰·이메일을 거부한다', () => {
    const result = managerCreateSchema.safeParse(managerCreateDefaults);
    expect(result.success).toBe(false);
    expect([...new Set(result.error?.issues.map((issue) => issue.path.join('.')))].sort()).toEqual(
      ['email', 'id', 'name', 'password', 'passwordConfirm', 'permissionId', 'phone', 'type'].sort(),
    );
  });

  it('비밀번호 확인이 다르면 passwordConfirm 에서 거부한다', () => {
    const result = managerCreateSchema.safeParse({
      ...valid,
      id: 'operator99',
      password: 'Safe!729',
      passwordConfirm: 'Safe!730',
    });
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual(['passwordConfirm']);
  });

  it('저장 입력은 UI 전용 필드(passwordConfirm)를 떨어뜨린다', () => {
    const settings = toManagerCreateSettings(
      managerCreateSchema.parse({ ...valid, id: 'operator99', password: 'Safe!729', passwordConfirm: 'Safe!729' }),
    );
    expect(settings).toEqual({ ...valid, id: 'operator99', password: 'Safe!729' });
    expect(settings).not.toHaveProperty('passwordConfirm');
    expect(toManagerSettings(managerEditSchema.parse(valid))).toEqual(valid);
  });

  it('이름은 10자 이내, 소속은 20자 이내, 이메일은 형식을 검사한다', () => {
    expect(managerEditSchema.safeParse({ ...valid, name: 'a'.repeat(11) }).success).toBe(false);
    expect(managerEditSchema.safeParse({ ...valid, organization: 'a'.repeat(21) }).success).toBe(false);
    expect(managerEditSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
    expect(managerEditSchema.safeParse(valid).success).toBe(true);
  });
});
