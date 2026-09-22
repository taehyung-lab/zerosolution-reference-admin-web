import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOptionIn } from '@/test/select';
import { PostCreateScreen } from './PostCreateScreen';

// 이탈 guard 는 router 가 소유한다. 화면 테스트는 그 연결만 비활성으로 대체한다.
vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function renderScreen() {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <PostCreateScreen onSaved={onSaved} onCancel={onCancel} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onSaved, onCancel };
}

describe('PostCreateScreen (9.2.3 게시물 등록)', () => {
  it('frame 초기 상태를 그린다 — 구분 일반·게시상태 게시, 게시판·카테고리는 선택 전', async () => {
    renderScreen();

    // 게시판 선택지는 서버에서 오므로 필드가 먼저 로딩 상태를 그린다.
    expect(await screen.findByRole('combobox', { name: '게시판' })).toHaveTextContent('선택');
    expect(screen.getByRole('combobox', { name: '구분' })).toHaveTextContent('일반');
    expect(screen.getByRole('combobox', { name: '게시상태' })).toHaveTextContent('게시');
    // 작성자 검색 팝업이 보류라 등록 화면은 작성자 행과 답변받을 이메일을 그리지 않는다.
    expect(screen.queryByRole('textbox', { name: /답변받을 이메일/ })).toBeNull();
  });

  it('필수 입력을 비운 채 저장하면 저장 요청 없이 필드 문구가 나온다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByRole('combobox', { name: '구분' });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('게시판을 선택해주세요.')).toBeInTheDocument();
    expect(screen.getByText('제목을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('내용을 입력해주세요.')).toBeInTheDocument();
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('게시판을 고르면 그 게시판의 카테고리 선택지가 따라온다', async () => {
    renderScreen();
    await screen.findByRole('combobox', { name: '게시판' });

    await chooseOptionIn('게시판', 'Reference Board 5');
    // 카테고리 선택지는 고른 게시판에 종속돼 다시 로딩을 지난다.
    await screen.findByRole('combobox', { name: '카테고리' });
    await chooseOptionIn('카테고리', 'Reference Category A');

    expect(screen.getByRole('combobox', { name: '카테고리' })).toHaveTextContent(
      'Reference Category A',
    );
  });

  it('값을 채우고 저장하면 확인을 지나 요청 함수에 닿는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByRole('combobox', { name: '게시판' });

    await chooseOptionIn('게시판', 'Reference Board 5');
    await screen.findByRole('combobox', { name: '카테고리' });
    await chooseOptionIn('카테고리', 'Reference Category A');
    fireEvent.change(screen.getByRole('textbox', { name: /제목/ }), {
      target: { value: 'Reference 새 글' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /내용/ }), {
      target: { value: 'Reference 본문' },
    });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('저장하시겠습니까?');
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() =>
      expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 게시물 등록')),
    );
    log.mockRestore();
  });
});
