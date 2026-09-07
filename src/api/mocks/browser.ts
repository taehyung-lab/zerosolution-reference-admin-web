import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

const worker = setupWorker(...handlers);

export function startApiMocks() {
  return worker.start({
    quiet: true,
    // API는 마지막 handler가 처리한다. Vite 모듈과 정적 자원은 정상 로드한다.
    onUnhandledRequest: 'bypass',
  });
}
