import type {
  CnChangeLogDTOChange,
  CnChangeLogDTOInventory,
  MrManagerDTODetail,
} from '@/api/generated/models';

/** 상세 화면이 읽는 서버 응답 이름. generated 는 api/ 밖으로 직접 나가지 않는다. */
export type ManagerDetail = MrManagerDTODetail;
export type ManagerChangeLog = CnChangeLogDTOInventory;
export type ManagerChangeLogChange = CnChangeLogDTOChange;
