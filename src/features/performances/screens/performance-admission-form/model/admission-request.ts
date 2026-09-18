import type { PerformanceAdmissionSettings } from '@/features/performances/model/performance-detail';
import type { AdmissionFormValues } from './admission-schema';

/**
 * 유효한 폼 값을 저장 입력으로 옮긴다. 행 정체성(`id`)과 선택되지 않은 입력 방식의 값은 UI 전용이라
 * 떨어진다 — 저장 입력은 그 시점의 입력 방식이 요구하는 값만 싣는다.
 *
 * 게이트·등급을 표시 문자열로 싣는 것은 서버 식별자 계약이 미확인이기 때문이다
 * (PERF-EDIT-ADMISSION 미확인 5). 계약이 정해지면 이 mapper 한 곳만 바뀐다.
 */
export function toAdmissionSettings(values: AdmissionFormValues): PerformanceAdmissionSettings {
  return {
    inputMode: values.inputMode,
    drawing:
      values.drawing.kind === 'selected'
        ? { kind: 'selected', file: values.drawing.file }
        : { kind: 'kept' },
    guides: values.guides.map((row) => ({
      gate: row.gate,
      areas: values.inputMode === 'zone' ? [row.area.trim()] : row.grades,
    })),
  };
}
