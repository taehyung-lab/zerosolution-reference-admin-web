import type { PrinterDetail } from '@/features/ticketing/model/printer';
import type { PrinterFormInput } from './printer-form-schema';

/**
 * 등록 화면의 초기 값 — Figma 6.7.1.3 등록 frame 이 보여 주는 첫 상태(2026-09-15 렌더 실측):
 * 상태 `정상`, 용도 `내부발권용`, 사용상태 `사용` 이 이미 선택돼 있고 나머지는 빈 입력이다.
 */
export const printerCreateDefaults: PrinterFormInput = {
  name: '',
  serialNo: '',
  model: '',
  manufacturer: '',
  purchasedAt: '',
  location: '',
  status: 'NORMAL',
  measures: '',
  purpose: 'INTERNAL',
  usage: 'IN_USE',
};

/** 수정 화면은 조회한 프린터의 값을 그대로 싣는다(Figma 6.7.1.4). */
export function toPrinterEditDefaults(detail: PrinterDetail): PrinterFormInput {
  return {
    name: detail.name,
    serialNo: detail.serialNo,
    model: detail.model,
    manufacturer: detail.manufacturer,
    purchasedAt: detail.purchasedAt,
    location: detail.location,
    status: detail.status,
    measures: detail.measures,
    purpose: detail.purpose,
    usage: detail.usage,
  };
}
