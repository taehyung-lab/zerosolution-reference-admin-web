/**
 * 등록의 빈 초기값과 수정의 조회값 초기값. 두 화면이 같은 필드를 쓰므로 계산도 한 곳에 둔다.
 * 구분의 `일반` 만 원문이 default 로 적고, 권한 쓰기는 default 가 없어 빈 선택으로 시작한다.
 */
import type { BoardDetail } from '@/features/community/model/board';
import type { BoardFormInput } from './board-form-schema';

export const boardCreateDefaults: BoardFormInput = {
  category: 'GENERAL',
  name: '',
  writePermission: '',
};

export function toBoardEditDefaults(board: BoardDetail): BoardFormInput {
  return {
    category: board.category,
    name: board.name,
    writePermission: board.writePermission,
  };
}
