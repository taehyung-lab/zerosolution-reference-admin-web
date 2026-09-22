import type { TermsDetail } from '@/features/terms/model/terms';
import { formatDate } from '@/shared/lib/datetime';
import type { TermsFormInput } from './terms-form-schema';

/**
 * 등록 화면의 초기 값 — Figma 11.2.3 등록 frame 이 보여 주는 첫 상태(2026-09-22 실측)와 Notion 의
 * default 문장: 버전·본문은 빈 값, 시행일 `default : 미선택`, 게시 상태 `default : 게시`.
 * 게시일의 default 는 원문에 없고 frame 도 빈 입력을 그리므로 비워 둔다.
 */
export function termsCreateDefaults(): TermsFormInput {
  return {
    version: '',
    effectiveAt: '',
    status: 'PUBLISHED',
    publishedAt: '',
    body: '',
  };
}

/** 수정 화면은 조회한 약관의 값을 그대로 싣는다(Figma 11.2.4). */
export function toTermsEditDefaults(detail: TermsDetail): TermsFormInput {
  return {
    version: detail.version,
    effectiveAt: formatDate(detail.effectiveAt),
    status: detail.status,
    publishedAt: formatDate(detail.publishedAt),
    body: detail.body,
  };
}
