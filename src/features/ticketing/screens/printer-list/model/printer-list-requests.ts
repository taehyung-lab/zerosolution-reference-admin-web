/**
 * 스마트프린터 목록 toolbar 의 업무 요청 경계다. 원문은 `일괄변경 → 변경 버튼 → Case02. 변경 확인
 * alert → 확인` 과 `선택복사 버튼 → Case02. 1개 이상 선택시 복사 완료 alert` 까지 적고 이 저장소에는
 * 그 API 가 없다(AGENTS 1절).
 * 도달 조건: 행을 1개 이상 선택하고 — 일괄변경은 변경 값까지 고른 뒤 확인 alert 에서 `확인`.
 * 변경 완료·복사 완료 alert 와 목록 갱신은 서버 계약이 확정된 뒤 mutation workflow 로 교체하며
 * 여기서 성공을 만들거나 선택을 지우지 않는다.
 */
import type {
  PrinterBulkChangeRequest,
  PrinterCopyRequest,
} from './usePrinterListActions';

export const requestPrinterBulkChange: (request: PrinterBulkChangeRequest) => void = () => {
  console.log('[시나리오] 스마트프린터 일괄변경: 요청 입력 확인 → API 연결 대기');
};

export const requestPrinterCopy: (request: PrinterCopyRequest) => void = () => {
  console.log('[시나리오] 스마트프린터 선택복사: 요청 입력 확인 → API 연결 대기');
};
