import { describe, expect, it } from 'vitest';
import { memberCounselSchema, toCounselDraft, toCounselInput } from './member-counsel-schema';

const values = {
  receivedAt: '2026-09-06T23:59',
  answeredAt: '2026-09-06T23:59',
  operatorName: '운영자',
  inquiryType: 'booking',
  content: '상담\n내용',
};

describe('member counsel validation', () => {
  it('allows later today, rejects tomorrow and missing fields', () => {
    const schema = memberCounselSchema('2026-09-06', 'required', 'date');
    expect(schema.safeParse(values).success).toBe(true);
    expect(schema.safeParse({ ...values, receivedAt: '2026-09-07T00:00' }).success).toBe(false);
    for (const field of ['receivedAt', 'answeredAt', 'operatorName', 'inquiryType', 'content']) {
      expect(schema.safeParse({ ...values, [field]: '' }).success).toBe(false);
    }
  });

  it('round-trips browser local minute values through UTC without changing plain text', () => {
    const input = toCounselInput(values, '2026-09-06', 'required', 'date');
    expect(input.receivedAt).toMatch(/Z$/);
    expect(toCounselDraft(input)).toEqual(values);
  });
});
