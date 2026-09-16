import { describe, expect, it } from 'vitest';
import { printerCreateDefaults, toPrinterSettings } from './printer-form-defaults';
import { printerFormFieldOrder, printerFormSchema } from './printer-form-schema';

describe('스마트프린터 등록·수정 입력 계약', () => {
  it('등록 frame 의 첫 상태를 기본값으로 둔다: 정상 · 내부발권용 · 사용', () => {
    expect(printerCreateDefaults.status).toBe('NORMAL');
    expect(printerCreateDefaults.purpose).toBe('INTERNAL');
    expect(printerCreateDefaults.usage).toBe('IN_USE');
    expect(printerCreateDefaults.name).toBe('');
  });

  it('필드 순서가 schema 의 키 집합과 같다', () => {
    expect([...printerFormFieldOrder].sort()).toEqual(
      Object.keys(printerFormSchema.shape).sort(),
    );
  });

  it('기기명·시리얼번호는 필수다', () => {
    const result = printerFormSchema.safeParse(printerCreateDefaults);
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((issue) => issue.path[0]);
    expect(fields).toContain('name');
    expect(fields).toContain('serialNo');
  });

  it('기기명·시리얼번호·모델명은 100자를 넘기지 못한다', () => {
    const long = 'x'.repeat(101);
    const result = printerFormSchema.safeParse({
      ...printerCreateDefaults,
      name: long,
      serialNo: long,
      model: long,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0]).sort()).toEqual([
      'model',
      'name',
      'serialNo',
    ]);
  });

  it('유효한 입력은 저장 항목 그대로 나간다', () => {
    const values = printerFormSchema.parse({
      ...printerCreateDefaults,
      name: ' 001-12345648 ',
      serialNo: 'ZERO123456-45678',
      model: 'ZERO123456',
      manufacturer: 'Reference Devices',
      purchasedAt: '2026-01-02',
      location: '사무실 A-1',
      status: 'REPAIR',
      measures: '헤드 수리 접수',
      purpose: 'EXTERNAL',
      usage: 'NOT_IN_USE',
    });

    expect(toPrinterSettings(values)).toEqual({
      name: '001-12345648',
      serialNo: 'ZERO123456-45678',
      model: 'ZERO123456',
      manufacturer: 'Reference Devices',
      purchasedAt: '2026-01-02',
      location: '사무실 A-1',
      status: 'REPAIR',
      measures: '헤드 수리 접수',
      purpose: 'EXTERNAL',
      usage: 'NOT_IN_USE',
    });
  });
});
