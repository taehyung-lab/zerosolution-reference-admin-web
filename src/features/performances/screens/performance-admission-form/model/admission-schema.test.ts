import { describe, expect, it } from 'vitest';
import { emptyGuideRow, toAdmissionEditDefaults } from './admission-defaults';
import { toAdmissionSettings } from './admission-request';
import { admissionFormSchema, type AdmissionFormInput } from './admission-schema';

function input(overrides: Partial<AdmissionFormInput> = {}): AdmissionFormInput {
  return {
    drawing: { kind: 'existing', name: 'drawing.png' },
    inputMode: 'zone',
    guides: [{ id: 'row-1', gate: 'Gate A', area: 'Area A', grades: [] }],
    ...overrides,
  };
}

function rejectedPaths(values: AdmissionFormInput) {
  const result = admissionFormSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

describe('입장안내 입력 계약', () => {
  it('빈 폼은 도면과 행의 게이트·구역을 거부한다', () => {
    expect(
      rejectedPaths({ drawing: { kind: 'empty' }, inputMode: 'zone', guides: [emptyGuideRow()] }),
    ).toEqual(['drawing', 'guides.0.gate', 'guides.0.area']);
  });

  it('입력 방식이 등급이면 구역 대신 등급을 요구한다', () => {
    expect(
      rejectedPaths(
        input({ inputMode: 'grade', guides: [{ id: 'row-1', gate: 'Gate A', area: '', grades: [] }] }),
      ),
    ).toEqual(['guides.0.grades']);
  });

  it('게이트는 최소 한 행이다', () => {
    expect(rejectedPaths(input({ guides: [] }))).toEqual(['guides']);
  });

  it('구역은 20자를 넘기지 못한다', () => {
    expect(
      rejectedPaths(input({ guides: [{ id: 'row-1', gate: 'Gate A', area: 'A'.repeat(21), grades: [] }] })),
    ).toEqual(['guides.0.area']);
  });
});

describe('저장 입력', () => {
  it('행 정체성과 선택되지 않은 입력 방식의 값을 떨어뜨린다', () => {
    const values = admissionFormSchema.parse(
      input({ guides: [{ id: 'row-1', gate: 'Gate A', area: ' Area A ', grades: ['Grade A'] }] }),
    );

    expect(toAdmissionSettings(values)).toEqual({
      inputMode: 'zone',
      drawing: { kind: 'kept' },
      guides: [{ gate: 'Gate A', areas: ['Area A'] }],
    });
  });

  it('등급 방식은 선택한 등급을 싣는다', () => {
    const values = admissionFormSchema.parse(
      input({
        inputMode: 'grade',
        guides: [{ id: 'row-1', gate: 'Gate A', area: 'Area A', grades: ['Grade A', 'Grade B'] }],
      }),
    );

    expect(toAdmissionSettings(values).guides).toEqual([
      { gate: 'Gate A', areas: ['Grade A', 'Grade B'] },
    ]);
  });
});

describe('수정 진입의 초기 값', () => {
  const basic = {
    ticketKindLabel: '',
    performanceTypeLabel: '',
    translations: {
      ko: { title: '', subtitle: '', performers: '', organizer: '' },
      ja: { title: '', subtitle: '', performers: '', organizer: '' },
      en: { title: '', subtitle: '', performers: '', organizer: '' },
    },
    sessions: [],
    events: [],
    venueName: '',
    gates: [{ id: 'gate-a', name: 'Gate A' }],
    totalSeats: 0,
    grades: [{ id: 'grade-a', name: 'Grade A' }],
  };

  it('입장안내가 없으면 빈 행 하나와 기본 입력 방식으로 연다', () => {
    const defaults = toAdmissionEditDefaults({ id: 'p1', basic, admission: null, history: [] });

    expect(defaults.drawing).toEqual({ kind: 'empty' });
    expect(defaults.inputMode).toBe('zone');
    expect(defaults.guides).toHaveLength(1);
    expect(defaults.guides[0]).toMatchObject({ gate: '', area: '', grades: [] });
  });

  it('등급으로 저장된 공연은 등급 값을 행에 싣는다', () => {
    const defaults = toAdmissionEditDefaults({
      id: 'p1',
      basic,
      admission: {
        inputMode: 'grade',
        drawing: { name: 'drawing.png', url: 'about:blank' },
        guides: [{ id: 'guide-1', gate: 'Gate A', areas: ['Grade A'] }],
      },
      history: [],
    });

    expect(defaults.drawing).toEqual({ kind: 'existing', name: 'drawing.png' });
    expect(defaults.guides).toEqual([{ id: 'guide-1', gate: 'Gate A', area: '', grades: ['Grade A'] }]);
  });
});
