/**
 * 검증된 폼 값에서 허용된 필드만 선택하고 숫자/enum을 변환해 서버 DTO를 만든다.
 * 실제 API에서도 필요한 요청 변환이다. 신규 계약에서 달라질 기획사 조건·빈값 표현은 이 경계에서 대조한다.
 */
import { managerFormTypes } from '../api/manager-form-contract';
import type { ManagerCreateRequest, ManagerUpdateRequest } from '../api/manager-form-contract';
import type { ManagerCreateValues, ManagerEditValues } from './manager-form-schema';
import { z } from 'zod';

/**
 * 요청 본문은 DTO 필드를 하나씩 적는 whitelist 다.
 *
 * `{ ...values }` 로 펼치지 않는 이유는 `passwordConfirm` 같은 UI 전용 필드가 지금 새지 않는 것에 더해,
 * 앞으로 스키마에 UI 전용 필드가 추가돼도 자동으로 새지 않아야 하기 때문이다. 반환 타입 표기가
 * 객체 리터럴의 초과 속성을 typecheck 에서 거부한다.
 */

/** 빈 문자열은 "입력하지 않음"이므로 optional 필드에서 제외한다. */
function optionalText(value: string): string | undefined {
  return value === '' ? undefined : value;
}

/** [가정] 리허설 계약은 `type=AGENCY` 일 때만 `agencyId` 를 요구한다. 다른 유형에서는 보내지 않는다. */
function agencyId(type: ManagerCreateRequest['type'], value: string): number | undefined {
  if (type !== managerFormTypes.AGENCY) return undefined;
  return z.coerce.number().int().positive().parse(value);
}

export function toManagerCreateRequest(values: ManagerCreateValues): ManagerCreateRequest {
  const type = z.enum(managerFormTypes).parse(values.type);
  return {
    id: values.id,
    password: values.password,
    name: values.name,
    email: values.email,
    type,
    permissionId: Number(values.permissionId),
    phone: optionalText(values.phone),
    organization: optionalText(values.organization),
    agencyId: agencyId(type, values.agencyId),
  };
}

/**
 * 아이디는 path parameter 이고 본문에 없다. 비밀번호는 Figma 수정 화면에 필드가 없으므로
 * 리허설 계약이 optional 로 허용하더라도 보내지 않는다.
 */
export function toManagerUpdateRequest(values: ManagerEditValues): ManagerUpdateRequest {
  const type = z.enum(managerFormTypes).parse(values.type);
  return {
    name: values.name,
    email: values.email,
    type,
    permissionId: Number(values.permissionId),
    phone: optionalText(values.phone),
    organization: optionalText(values.organization),
    agencyId: agencyId(type, values.agencyId),
  };
}
