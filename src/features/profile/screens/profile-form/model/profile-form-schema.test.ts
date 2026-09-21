import { describe, expect, it } from 'vitest';
import { toProfileEditDefaults } from './profile-form-defaults';
import { toProfileSettings } from './profile-form-request';
import {
  profileEditBlurMessages,
  profileEditFieldOrder,
  profileEditSchema,
  type ProfileEditInput,
} from './profile-form-schema';

const record = {
  id: 'example-operator',
  name: 'Example',
  phone: '010-0000-0000',
  email: 'operator@example.com',
  organization: 'Example org',
  registrationRoute: 'WEB',
  accountStatus: 'Example status',
};

function invalidFields(values: ProfileEditInput): readonly string[] {
  const result = profileEditSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

describe('내정보 수정 입력 계약', () => {
  it('화면 순서 선언이 schema 의 키 집합과 같다', () => {
    expect([...profileEditFieldOrder].sort()).toEqual(
      Object.keys(toProfileEditDefaults(record)).sort(),
    );
  });

  it('비밀번호 수정이 꺼져 있으면 필수는 이름·휴대폰번호·이메일뿐이다', () => {
    const empty = { ...toProfileEditDefaults(record), name: '', phone: '', email: '' };
    expect(invalidFields(empty)).toEqual(['name', 'phone', 'email']);
  });

  it('비밀번호 수정이 꺼져 있으면 빈 비밀번호로도 저장된다', () => {
    expect(invalidFields(toProfileEditDefaults(record))).toEqual([]);
  });

  it('비밀번호 수정을 켜면 규칙과 확인 일치를 본다', () => {
    const defaults = toProfileEditDefaults(record);
    expect(invalidFields({ ...defaults, passwordEdit: true })).toEqual(['password', 'passwordConfirm']);
    expect(invalidFields({ ...defaults, passwordEdit: true, password: 'abcd1234!', passwordConfirm: 'abcd1234!' })).toEqual([
      'password',
    ]);
    expect(invalidFields({ ...defaults, passwordEdit: true, password: 'Qw9!zXr2', passwordConfirm: 'Qw9!zXr3' })).toEqual([
      'passwordConfirm',
    ]);
    expect(invalidFields({ ...defaults, passwordEdit: true, password: 'Qw9!zXr2', passwordConfirm: 'Qw9!zXr2' })).toEqual([]);
  });

  it('blur 는 확인 불일치 하나만 말하고 일치하면 아무 말도 하지 않는다', () => {
    const defaults = toProfileEditDefaults(record);
    expect(
      profileEditBlurMessages({ ...defaults, passwordEdit: true, password: 'Qw9!zXr2', passwordConfirm: 'Qw9!zXr3' })
        .passwordConfirm,
    ).toBe('비밀번호와 동일하게 입력해주세요.');
    expect(
      profileEditBlurMessages({ ...defaults, passwordEdit: true, password: 'Qw9!zXr2', passwordConfirm: 'Qw9!zXr2' })
        .passwordConfirm,
    ).toBeUndefined();
    expect(
      profileEditBlurMessages({ ...defaults, password: 'Qw9!zXr2', passwordConfirm: 'other' }).passwordConfirm,
    ).toBeUndefined();
  });

  it('요청 mapper 는 UI 전용 필드를 떨어뜨리고 체크박스를 켰을 때만 비밀번호를 싣는다', () => {
    const defaults = toProfileEditDefaults(record);
    expect(toProfileSettings(profileEditSchema.parse(defaults))).toEqual({
      name: 'Example',
      phone: '010-0000-0000',
      email: 'operator@example.com',
      organization: 'Example org',
    });
    const withPassword = profileEditSchema.parse({
      ...defaults,
      passwordEdit: true,
      password: 'Qw9!zXr2',
      passwordConfirm: 'Qw9!zXr2',
    });
    expect(toProfileSettings(withPassword).password).toBe('Qw9!zXr2');
  });
});
