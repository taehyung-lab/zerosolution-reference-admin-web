import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { PrinterDetailScreen } from './PrinterDetailScreen';

function renderScreen(printerId = 'reference-printer-1') {
  const onEdit = vi.fn();
  const onDeleted = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <PrinterDetailScreen printerId={printerId} onEdit={onEdit} onDeleted={onDeleted} />
    </TestQueryLocaleProvider>,
  );
  return { onEdit, onDeleted };
}

describe('PrinterDetailScreen (6.7.1.2 스마트프린터 조회)', () => {
  it('조회 frame 의 기본정보 항목을 읽기 전용으로 보여 준다', async () => {
    renderScreen();

    expect(await screen.findByText('001-12345648')).toBeInTheDocument();
    for (const label of [
      '기기명',
      '시리얼번호',
      '모델명',
      '제조사',
      '구매일',
      '보관위치',
      '상태',
      '조치사항',
      '용도',
      '사용상태',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('정상')).toBeInTheDocument();
    expect(screen.getByText('현장발권용')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  it('업데이트 이력을 3열로 보여 준다', async () => {
    renderScreen();
    await screen.findByText('001-12345648');

    expect(screen.getByText('업데이트 이력')).toBeInTheDocument();
    expect(screen.getByText('모델명 : ZERO > ZERO123456')).toBeInTheDocument();
    expect(screen.getByText('구매일 : 2025-06-01 > 2026-01-02')).toBeInTheDocument();
  });

  it('수정을 누르면 그 프린터의 수정 화면으로 나간다', async () => {
    const { onEdit } = renderScreen();
    await screen.findByText('001-12345648');

    fireEvent.click(screen.getByRole('button', { name: '수정' }));

    expect(onEdit).toHaveBeenCalledWith('reference-printer-1');
  });

  it('삭제는 확인 alert 를 지나 요청 함수에 닿고 성공 뒤 목록으로 나간다 — 원문 Case02', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onDeleted } = renderScreen();
    await screen.findByText('001-12345648');

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('삭제하시겠습니까?');
    expect(onDeleted).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce());
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 스마트프린터 삭제'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    log.mockRestore();
  });

  it('없는 ID 의 재조회 실패는 not-found 문구로 닫는다', async () => {
    renderScreen('no-such-printer');

    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument();
  });
});
