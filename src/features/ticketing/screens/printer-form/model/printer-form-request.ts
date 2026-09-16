import type { PrinterSettings } from '@/features/ticketing/model/printer';
import type { PrinterFormValues } from './printer-form-schema';

/** 유효한 폼 값을 저장 입력으로 옮긴다. 폼 값과 설정 항목이 1:1 이라 골라 담기만 한다. */
export function toPrinterSettings(values: PrinterFormValues): PrinterSettings {
  return {
    name: values.name,
    serialNo: values.serialNo,
    model: values.model,
    manufacturer: values.manufacturer,
    purchasedAt: values.purchasedAt,
    location: values.location,
    status: values.status,
    measures: values.measures,
    purpose: values.purpose,
    usage: values.usage,
  };
}
