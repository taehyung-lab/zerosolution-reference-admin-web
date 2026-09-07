import { http, HttpResponse } from 'msw';
import { managerHandlers } from './managers';

export const handlers = [
  ...managerHandlers,
  // 미정의 API는 실제 네트워크로 넘기지 않는다. 저장 성공이나 상태 전이도 만들지 않는다.
  http.all(/^https?:\/\/[^/]+\/api\//, () => HttpResponse.json({ code: 'MOCK_NOT_IMPLEMENTED' }, { status: 501 })),
];
