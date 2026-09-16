import { describe, expect, it } from 'vitest';
import { formatDate } from '@/shared/lib/datetime';
import { toMemberSettings } from './member-form-request';
import { memberCreateSchema, memberEditSchema } from './member-form-schema';

const valid = {
  email: 'member@example.com',
  password: 'Safe!729',
  name: '김회원',
  birthDate: '2000-02-29',
  phone: '010-1234-5678',
};

describe('member create input contract', () => {
  it('accepts documented character sets and today as the last birth date', () => {
    for (const name of ['김회원', 'Jane9', 'やまだ', 'ヤマダー', '王小明']) {
      expect(
        memberCreateSchema.safeParse({ ...valid, name, birthDate: formatDate(new Date().toISOString()) }).success,
      ).toBe(true);
    }
  });

  it.each([
    ['email', 'member+tag@example.com'],
    ['email', 'invalid'],
    ['password', 'short!1'],
    ['password', 'onlylowercase'],
    ['name', 'has space'],
    ['name', '12345678901'],
    ['birthDate', '2001-02-29'],
    ['birthDate', '2999-01-01'],
    ['phone', '010 1234 5678'],
    ['phone', '123456789012345678901'],
  ])('rejects invalid %s: %s', (field, value) => {
    expect(memberCreateSchema.safeParse({ ...valid, [field]: value }).success).toBe(false);
  });

  it('requires each field', () => {
    for (const field of Object.keys(valid)) {
      expect(memberCreateSchema.safeParse({ ...valid, [field]: '' }).success).toBe(false);
    }
  });
});

describe('member edit restrictions', () => {
  const values = { name: '김회원', birthDate: '2000-01-01', phone: '010-1234-5678', accountStatus: 'flagged' as const, restrictions: ['inquiry'] };

  it('requires known restrictions only for flagged members', () => {
    expect(memberEditSchema.safeParse(values).success).toBe(true);
    expect(memberEditSchema.safeParse({ ...values, restrictions: [] }).success).toBe(false);
    expect(memberEditSchema.safeParse({ ...values, restrictions: ['obsolete'] }).success).toBe(false);
    expect(memberEditSchema.safeParse({ ...values, accountStatus: 'general', restrictions: [] }).success).toBe(true);
    expect(memberEditSchema.safeParse({ ...values, accountStatus: 'general', restrictions: ['obsolete'] }).success).toBe(true);
  });

  it('keeps the hidden draft out of a general member request', () => {
    expect(toMemberSettings(memberEditSchema.parse({ ...values, accountStatus: 'general' })).restrictions).toEqual([]);
    expect(toMemberSettings(memberEditSchema.parse(values)).restrictions).toEqual(['inquiry']);
  });
});
