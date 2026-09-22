import type { PostWriteInput } from '@/features/community/model/post';
import type { PostFormValues } from './post-form-schema';

/**
 * 검증을 지난 폼 값을 API 경계의 입력으로 옮긴다. 화면 전용 사실(`boardCategoryRequired`·
 * `answerEmailRequired`)은 요청에 실리지 않고, 비어 있는 선택값은 키를 만들지 않는다.
 */
export function toPostWriteInput(values: PostFormValues): PostWriteInput {
  return {
    category: values.category,
    boardId: values.boardId,
    boardCategoryId: values.boardCategoryId === '' ? undefined : values.boardCategoryId,
    answerEmail: values.answerEmail.trim() === '' ? undefined : values.answerEmail.trim(),
    title: values.title,
    content: values.content,
    registeredAt: values.registeredAt,
    status: values.status,
  };
}
