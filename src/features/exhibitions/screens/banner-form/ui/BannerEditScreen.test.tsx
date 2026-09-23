import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { BannerEditScreen } from './BannerEditScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function renderScreen() {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <BannerEditScreen bannerId="reference-banner-1" onSaved={onSaved} onCancel={onCancel} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onSaved, onCancel };
}

describe('BannerEditScreen (7.1.4 배너 수정)', () => {
  it('조회 값으로 채워진 등록과 같은 항목을 그리고 기존 이미지 파일명을 보여 준다', async () => {
    renderScreen();

    expect(await screen.findByRole('textbox', { name: /배너명/ })).toHaveValue('Reference 콘서트 안내 배너');
    expect(screen.getByRole('textbox', { name: /게시순서/ })).toHaveValue('1');
    expect(screen.getByRole('textbox', { name: /^URL/ })).toHaveValue('//app/bbs/notice/123');
    expect(screen.getByRole('combobox', { name: /게시 상태/ })).toHaveTextContent('게시중');
    expect(screen.getByText('reference-concert.png')).toBeInTheDocument();
  });

  it('바꾼 값을 저장하면 확인·완료를 지나 조회로 나간다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onSaved } = renderScreen();
    const name = await screen.findByRole('textbox', { name: /배너명/ });

    fireEvent.change(name, { target: { value: 'Reference 바뀐 배너' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '확인' }));

    await waitFor(() =>
      expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 배너 수정')),
    );
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('저장되었습니다.'));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('reference-banner-1'));
    log.mockRestore();
  });

  it('기존 이미지를 지우고 저장하면 필수 문구로 거절한다', async () => {
    renderScreen();
    await screen.findByText('reference-concert.png');

    fireEvent.click(screen.getByRole('button', { name: '파일 삭제' }));
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('필수 항목을 입력해주세요.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
