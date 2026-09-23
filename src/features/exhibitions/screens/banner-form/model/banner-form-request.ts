import type { BannerWriteInput } from '@/features/exhibitions/model/banner';
import type { BannerFormValues } from './banner-form-schema';

/**
 * 검증을 지난 폼 값을 API 경계의 입력으로 옮긴다. 이미지는 새로 고른 파일이면 그 파일을, 아니면 기존
 * 파일 유지를 싣는다 — 스키마가 `empty`·`removed` 를 이미 거부했다.
 */
export function toBannerWriteInput(values: BannerFormValues): BannerWriteInput {
  return {
    category: values.category,
    order: Number(values.order),
    name: values.name,
    linkType: values.linkType,
    linkUrl: values.linkUrl,
    image: values.image.kind === 'selected' ? { kind: 'selected', file: values.image.file } : { kind: 'existing' },
    postStartDate: values.postPeriod.from,
    postEndDate: values.postPeriod.to,
    status: values.status,
  };
}
