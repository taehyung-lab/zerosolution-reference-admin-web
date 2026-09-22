import type { TermsWriteInput } from '@/features/terms/model/terms';
import type { TermsFormValues } from './terms-form-schema';

/** 검증을 지난 폼 값을 API 경계의 입력으로 옮긴다. 다섯 항목이 모두 필수라 생략되는 키가 없다. */
export function toTermsWriteInput(values: TermsFormValues): TermsWriteInput {
  return {
    version: values.version,
    effectiveAt: values.effectiveAt,
    status: values.status,
    publishedAt: values.publishedAt,
    body: values.body,
  };
}
