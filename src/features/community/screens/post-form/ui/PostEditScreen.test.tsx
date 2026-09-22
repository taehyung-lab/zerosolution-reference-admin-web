import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { PostEditScreen } from './PostEditScreen';

// 이탈 guard 는 router 가 소유한다. 화면 테스트는 그 연결만 비활성으로 대체한다.
vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function renderScreen(postId = 'reference-post-1') {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <PostEditScreen postId={postId} onSaved={onSaved} onCancel={onCancel} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onSaved, onCancel };
}

describe('PostEditScreen (9.2.4 게시물 수정)', () => {
  it('조회 값을 채워 보여 주고 작성자 세 행은 읽기 전용이다', async () => {
    renderScreen();

    expect(await screen.findByRole('combobox', { name: '게시판' })).toHaveTextContent(
      'Reference Board 5',
    );
    expect(screen.getByRole('textbox', { name: /제목/ })).toHaveValue('Reference 문의합니다.');
    // 작성자 세 행은 입력이 아니라 읽기 전용 표기이고, 연락처는 마스킹된다.
    expect(screen.getByText('Reference 김땡땡(refe*****@example.test)')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /작성자/ })).toBeNull();
    // 회원유형·회원등급 두 행이 같은 값 `일반회원` 을 그린다(frame 관찰).
    expect(screen.getAllByText('일반회원')).toHaveLength(2);
  });

  it('답변받을 이메일은 수정에서 필수다 — 비우면 저장 요청이 나가지 않는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByRole('combobox', { name: '게시판' });

    fireEvent.change(screen.getByRole('textbox', { name: /답변받을 이메일/ }), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('답변받을 이메일을 입력해주세요.')).toBeInTheDocument();
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('저장을 확인하면 그 게시물 ID 로 요청 함수에 닿는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByRole('combobox', { name: '게시판' });

    fireEvent.change(screen.getByRole('textbox', { name: /제목/ }), {
      target: { value: 'Reference 고친 제목' },
    });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() =>
      expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 게시물 수정')),
    );
    log.mockRestore();
  });
});
