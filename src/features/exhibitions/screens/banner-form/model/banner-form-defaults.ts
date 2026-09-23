import type { BannerDetail } from '@/features/exhibitions/model/banner';
import { formatDate } from '@/shared/lib/datetime';
import type { BannerFormInput } from './banner-form-schema';

/**
 * 등록 화면의 초기 값 — Figma 7.1.3 등록 frame 이 보여 주는 첫 상태(2026-09-23 실측)와 Notion 의
 * default 문장: 구분 `홈`, 이동경로 유형 `APP 내부` 가 채워져 있고 나머지는 빈 입력이다.
 * 게시기간은 `default : 미선택`. 게시 상태는 등록 Case 정의가 값 없는 select 를 그리고 원문이 default 를
 * 적지 않아 비워 둔다.
 */
export function bannerCreateDefaults(): BannerFormInput {
  return {
    category: 'HOME',
    order: '',
    name: '',
    linkType: 'APP',
    linkUrl: '',
    image: { kind: 'empty' },
    postPeriod: { from: '', to: '' },
    status: '',
  };
}

/** 수정 화면은 조회한 배너의 값을 그대로 싣는다(Figma 7.1.4). 이미지는 기존 파일명으로 시작한다. */
export function toBannerEditDefaults(detail: BannerDetail): BannerFormInput {
  return {
    category: detail.category,
    order: String(detail.order),
    name: detail.name,
    linkType: detail.linkType,
    linkUrl: detail.linkUrl,
    image: { kind: 'existing', name: detail.image.name },
    postPeriod: { from: formatDate(detail.postStartAt), to: formatDate(detail.postEndAt) },
    status: detail.status,
  };
}
