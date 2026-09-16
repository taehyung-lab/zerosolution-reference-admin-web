import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { toPrinterHistoryEntries } from './printer-history';

/** 라벨 키를 그대로 돌려주는 최소 번역기. 어휘 선택이 아니라 mapper 의 분기를 본다. */
const t = ((key: string, options?: Record<string, unknown>) => {
  if (key === 'printer.detail.historyLine')
    return `${String(options?.field)} : ${String(options?.before)} > ${String(options?.after)}`;
  if (options && 'defaultValue' in options && !key.startsWith('printer.values.status'))
    return String(options.defaultValue);
  return key;
}) as unknown as TFunction<'ticketing'>;

describe('스마트프린터 업데이트 이력 변환', () => {
  it('등록은 한 줄, 수정은 제목 아래 변경 줄들을 만든다', () => {
    const entries = toPrinterHistoryEntries(
      [
        {
          id: 'log-2',
          updatedAt: '2026-06-01T04:54:41.000Z',
          kind: 'UPDATE',
          changes: [{ field: 'model', before: 'ZERO', after: 'ZERO123456' }],
          manager: 'Reference Manager',
        },
        {
          id: 'log-1',
          updatedAt: '2026-06-01T03:12:11.000Z',
          kind: 'CREATE',
          changes: [],
          manager: 'Reference Manager',
        },
      ],
      t,
    );

    expect(entries[0]).toEqual({
      id: 'log-2',
      date: '2026-06-01',
      lines: ['printer.detail.historyUpdated', 'printer.form.model : ZERO > ZERO123456'],
      actor: 'Reference Manager',
    });
    expect(entries[1]?.lines).toEqual(['printer.detail.historyCreated']);
  });

  it('빈 값은 빈 값 문구로, enum 은 화면 어휘로 바꾼다', () => {
    const [entry] = toPrinterHistoryEntries(
      [
        {
          id: 'log-3',
          updatedAt: '2026-08-11T05:40:00.000Z',
          kind: 'UPDATE',
          changes: [
            { field: 'manufacturer', before: '', after: 'Orbit Print' },
            { field: 'status', before: 'NORMAL', after: 'BROKEN' },
          ],
          manager: '',
        },
      ],
      t,
    );

    expect(entry?.lines[1]).toBe(
      'printer.form.manufacturer : printer.detail.emptyValue > Orbit Print',
    );
    expect(entry?.lines[2]).toBe(
      'printer.form.status : printer.values.status.NORMAL > printer.values.status.BROKEN',
    );
    expect(entry?.actor).toBe('printer.detail.emptyValue');
  });

  it('모르는 항목은 서버 코드를 노출하지 않고 한 줄로 접는다', () => {
    const [entry] = toPrinterHistoryEntries(
      [
        {
          id: 'log-4',
          updatedAt: '2026-09-01T02:10:00.000Z',
          kind: 'UPDATE',
          changes: [{ field: 'secretInternalField', before: 'a', after: 'b' }],
          manager: 'Reference Manager',
        },
      ],
      t,
    );

    expect(entry?.lines[1]).toBe('printer.detail.historyUnknownField');
  });
});
