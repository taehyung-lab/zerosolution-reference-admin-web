import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { BoardDetailScreen } from './BoardDetailScreen';

vi.hoisted(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.IntersectionObserver = class {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds = []
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return [] }
  }
  Object.defineProperty(Document.prototype, 'getAnimations', { configurable: true, value: () => [] })
  Object.defineProperty(Element.prototype, 'getAnimations', { configurable: true, value: () => [] })
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  })
});

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function renderScreen(boardId = 'reference-board-1') {
  const onEdit = vi.fn();
  const onDeleted = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <BoardDetailScreen boardId={boardId} onEdit={onEdit} onDeleted={onDeleted} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onEdit, onDeleted };
}

describe('BoardDetailScreen (Figma 9.1.2)', () => {
  it('기본정보의 항목을 Figma 순서대로 읽기 전용으로 보여 준다', async () => {
    renderScreen();
    await screen.findByText('Reference Board 1');

    // frame 9.1.2 의 행 순서. `팝업`·등록일·최근업데이트일은 frame 에 없고, `제목 지정`은 운영자가 제목 지정일 때만 보인다.
    expect(screen.getAllByRole('term').map((node) => node.textContent)).toEqual([
      '유형',
      '구분',
      '게시판명',
      '쓰기',
      '읽기',
      '카테고리',
      '게시글 제목 지정',
      'HTML',
      '파일첨부',
      '파일첨부 용량제한',
      '평점',
      '댓글',
      '비밀댓글',
      '댓글 알림',
      '표시',
      '중복 허용',
      '사용상태',
    ]);
    expect(screen.queryByText('팝업')).toBeNull();
    expect(screen.getAllByRole('heading', { level: 4 }).map((node) => node.textContent)).toEqual(['권한', '글쓰기 설정', '피드백 설정', '조회수 설정']);
    for (const list of document.querySelectorAll('dl')) {
      for (const child of list.children) expect(child.querySelector(':scope > dt') && child.querySelector(':scope > dd')).toBeTruthy();
    }
    expect(screen.getByText('1 MB')).toBeInTheDocument();
    expect(screen.getByText('비공개댓글만 사용')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('회원등급 권한은 등급까지, 운영자 제목은 목록으로 보여 준다', async () => {
    renderScreen('reference-board-4');
    await screen.findByText('Reference Board 4');
    expect(screen.getAllByText('회원등급 > 일반회원')).toHaveLength(2);
    expect(screen.getByText('제목 지정', { selector: 'dt' })).toBeInTheDocument();
    expect(screen.getByText('궁금해요, 건의합니다')).toBeInTheDocument();
  });

  it('업데이트 내역을 3열로, 변경은 항목 : 이전 > 이후 로 보여 준다', async () => {
    renderScreen();
    await screen.findByText('Reference Board 1');

    const headers = screen.getAllByRole('columnheader').map((cell) => cell.textContent);
    expect(headers).toEqual(['업데이트일', '업데이트 사항', '담당자']);
    expect(screen.getByText('권한 > 쓰기 : 비회원 포함 > 운영자')).toBeInTheDocument();
    expect(screen.getByText('등록')).toBeInTheDocument();
  });

  it('카테고리 설정 팝업은 행을 편집·추가·삭제하고 저장에서 요청 함수에 닿은 뒤 닫힌다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByText('Reference Board 1');

    fireEvent.click(screen.getByRole('button', { name: '카테고리 설정' }));
    const dialog = await screen.findByRole('dialog', { name: '카테고리 설정' });
    expect(within(dialog).getAllByRole('row')).toHaveLength(4);

    // 원문 50행: 추가는 최상단(순서 1)에 들어간다.
    fireEvent.click(within(dialog).getByRole('button', { name: '추가' }));
    const first = within(dialog).getByRole('textbox', { name: '1번 카테고리명' });
    expect(first).toHaveValue('');
    expect(within(dialog).getByRole('button', { name: '저장' })).toBeDisabled();
    fireEvent.change(first, { target: { value: '이벤트' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '4번 카테고리 삭제' }));
    await waitFor(() => expect(within(dialog).getByRole('button', { name: '저장' })).toBeEnabled());
    fireEvent.click(within(dialog).getByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '카테고리 설정' })).not.toBeInTheDocument(),
    );
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('[시나리오] 게시판 카테고리 설정 저장'),
    );
    log.mockRestore();
  });

  it('카테고리 순서는 접근 가능한 DnD 핸들로 바꾸고 마지막 행의 삭제는 숨긴다', async () => {
    renderScreen();
    await screen.findByText('Reference Board 1');

    fireEvent.click(screen.getByRole('button', { name: '카테고리 설정' }));
    const dialog = await screen.findByRole('dialog', { name: '카테고리 설정' });
    expect(within(dialog).getByRole('button', { name: '닫기' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '1번 순서 이동' })).toHaveAttribute('aria-roledescription', 'draggable');
    expect(within(dialog).queryByRole('button', { name: '1번 위로' })).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: '3번 카테고리 삭제' }));
    fireEvent.click(within(dialog).getByRole('button', { name: '2번 카테고리 삭제' }));
    expect(within(dialog).queryByRole('button', { name: /카테고리 삭제/ })).toBeNull();
  });

  it('카테고리를 수정하고 취소하면 버리기 확인을 거친다', async () => {
    renderScreen();
    await screen.findByText('Reference Board 1');
    fireEvent.click(screen.getByRole('button', { name: '카테고리 설정' }));
    const dialog = await screen.findByRole('dialog', { name: '카테고리 설정' });
    fireEvent.change(within(dialog).getByRole('textbox', { name: '1번 카테고리명' }), { target: { value: '변경' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '취소' }));
    expect(await screen.findByRole('dialog', { name: '알림' })).toHaveTextContent('입력을 취소하시겠습니까?');
  });

  it('수정 버튼은 그 게시판의 수정 화면으로 나간다', async () => {
    const { onEdit } = renderScreen();
    await screen.findByText('Reference Board 1');
    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    expect(onEdit).toHaveBeenCalledWith('reference-board-1');
  });

  it('삭제는 공통 삭제 확인을 거쳐 요청 함수에 닿고, 취소하면 나가지 않으며, 성공 뒤 목록으로 나간다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onDeleted } = renderScreen();
    await screen.findByText('Reference Board 1');

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(await screen.findByText('삭제하시겠습니까?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    await waitFor(() => expect(screen.queryByText('삭제하시겠습니까?')).toBeNull());
    expect(log).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce());
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 게시판 삭제'));
    log.mockRestore();
  });

  it('진입 후 없는 게시판은 notFound 로 선다', async () => {
    renderScreen('no-such-board');
    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument();
  });
});
