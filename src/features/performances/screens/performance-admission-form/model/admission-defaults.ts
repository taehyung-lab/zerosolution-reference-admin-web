import type { PerformanceDetail } from '@/features/performances/model/performance-detail';
import type { AdmissionFormInput } from './admission-schema';

/** 행 하나. 삭제·추가에도 값과 오류가 따라가도록 만들 때 정체성을 준다. */
export function emptyGuideRow(): AdmissionFormInput['guides'][number] {
  return { id: crypto.randomUUID(), gate: '', area: '', grades: [] };
}

/**
 * 수정 진입의 초기 값(원문 「입장안내정보를 수정할 수 있다」 + 5.2.2/5.2.2.1 두 조회 상태).
 *
 * - 입장안내가 없는 공연(입력전)은 빈 폼이다. 입력 방식의 `default : 구역` 은 원문이 정한다.
 * - 있는 공연(입력후)은 조회한 값을 그대로 싣는다. 도면은 이미 등록된 파일이므로 이름만 남기고,
 *   교체하지 않으면 그대로 유지된다.
 */
export function toAdmissionEditDefaults(detail: PerformanceDetail): AdmissionFormInput {
  const admission = detail.admission;
  if (admission === null) {
    return { drawing: { kind: 'empty' }, inputMode: 'zone', guides: [emptyGuideRow()] };
  }
  return {
    drawing: { kind: 'existing', name: admission.drawing.name },
    inputMode: admission.inputMode,
    guides: admission.guides.map((guide) => ({
      id: guide.id,
      gate: guide.gate,
      area: admission.inputMode === 'zone' ? (guide.areas[0] ?? '') : '',
      grades: admission.inputMode === 'grade' ? [...guide.areas] : [],
    })),
  };
}
