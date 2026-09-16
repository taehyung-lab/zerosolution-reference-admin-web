/**
 * 스마트프린터 등록·수정의 업무 요청 경계다. 원문은 「스마트프린터를 등록할 수 있다」의
 * `저장 버튼 → 클릭시, 유효성 체크` 까지 적고 이 저장소에는 저장 API 가 없다(AGENTS 1절).
 * 도달 조건: 폼 검증 통과 → 저장 확인 alert 에서 `확인`. 입력은 `toPrinterSettings` 가 정리한 항목 전부다.
 * 저장 성공·완료 alert·목록 복귀는 서버 계약이 확정된 뒤 mutation workflow 로 교체하며 여기서
 * 성공을 만들거나 dirty 를 지우지 않는다.
 */
import type { PrinterSettings } from '@/features/ticketing/model/printer';

export const requestPrinterCreate: (input: PrinterSettings) => void = () => {
  console.log('[시나리오] 스마트프린터 등록: 요청 입력 확인 → API 연결 대기');
};

export const requestPrinterEdit: (request: {
  printerId: string;
  input: PrinterSettings;
}) => void = () => {
  console.log('[시나리오] 스마트프린터 수정: 요청 입력 확인 → API 연결 대기');
};
