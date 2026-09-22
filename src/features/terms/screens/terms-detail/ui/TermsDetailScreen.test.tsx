import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { TermsDetailScreen } from './TermsDetailScreen';

function renderScreen(termsId = 'reference-terms-1') {
  const onEdit = vi.fn();
  const onDeleted = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <TermsDetailScreen termsId={termsId} onEdit={onEdit} onDeleted={onDeleted} />
    </TestQueryLocaleProvider>,
  );
  return { onEdit, onDeleted };
}

describe('TermsDetailScreen (11.2.2 약관 조회)', () => {
  it('기본정보 섹션이 버전·시행일·게시 상태·게시일·본문을 읽기 전용으로 보여 준다', async () => {
    renderScreen();

    expect(await screen.findByText('V 1.2')).toBeInTheDocument();
    expect(screen.getByText('시행일')).toBeInTheDocument();
    expect(screen.getByText('게시일')).toBeInTheDocument();
    expect(screen.getAllByText(/^2026-06-01 /).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Reference 서비스 이용약관/)).toBeInTheDocument();
    // 게시 상태 행은 현재 값과 반대 상태로 바꾸는 버튼을 나란히 둔다(frame 11.2.2).
    expect(screen.getAllByText('게시안함').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '게시' })).toBeInTheDocument();
  });

  it('업데이트 이력 3열 표를 최신순으로 보여 준다', async () => {
    renderScreen();
    await screen.findByText('V 1.2');

    const history = screen.getByRole('table');
    const headers = within(history)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent?.trim());
    expect(headers).toEqual(['업데이트일', '업데이트 사항', '담당자']);
    const rows = within(history).getAllByRole('row').slice(1);
    expect(within(rows[0]!).getByText('수정')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('등록')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('Reference 김땡땡 (adminuser)')).toBeInTheDocument();
  });

  it('게시 상태 버튼은 원문의 확인 alert 을 지나야 요청 함수에 닿는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen('reference-terms-2');
    await screen.findByText('V 1.1');

    fireEvent.click(screen.getByRole('button', { name: '게시안함' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('게시안함으로 변경하시겠습니까?');
    expect(log).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() =>
      expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 약관 게시 상태 변경')),
    );
    log.mockRestore();
  });

  it('확인 alert 에서 취소하면 상태 변경 요청이 나가지 않는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen('reference-terms-2');
    await screen.findByText('V 1.1');

    fireEvent.click(screen.getByRole('button', { name: '게시안함' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '취소' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('수정을 누르면 그 약관의 수정으로 나간다', async () => {
    const { onEdit } = renderScreen();
    await screen.findByText('V 1.2');

    fireEvent.click(screen.getByRole('button', { name: '수정' }));

    expect(onEdit).toHaveBeenCalledWith('reference-terms-1');
  });

  it('삭제는 원문의 삭제 확인 alert 을 지나야 요청 함수에 닿는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onDeleted } = renderScreen();
    await screen.findByText('V 1.2');

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('삭제하시겠습니까?');
    expect(log).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() =>
      expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 약관 삭제')),
    );
    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    log.mockRestore();
  });
});
