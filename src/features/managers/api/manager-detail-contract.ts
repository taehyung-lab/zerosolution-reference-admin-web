/**
 * 운영자 상세와 변경 이력의 생성 타입을 feature 내부 이름으로 노출한다.
 * 새 OpenAPI 연결 때 이 경계와 응답 소비처를 함께 대조하며 현재 타입이 신규 제품 계약임을 뜻하지 않는다.
 */
import type {
  CnChangeLogDTOChange,
  CnChangeLogDTOInventory,
  MrManagerDTODetail,
} from '@/api/generated/models';

/** 상세 화면이 읽는 서버 응답 이름. generated 는 api/ 밖으로 직접 나가지 않는다. */
export type ManagerDetail = MrManagerDTODetail;
export type ManagerChangeLog = CnChangeLogDTOInventory;
export type ManagerChangeLogChange = CnChangeLogDTOChange;
