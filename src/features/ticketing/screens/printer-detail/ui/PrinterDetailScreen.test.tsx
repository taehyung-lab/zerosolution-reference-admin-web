import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { PrinterDetailScreen } from './PrinterDetailScreen';

function renderScreen(printerId = 'reference-printer-1') {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <PrinterDetailScreen printerId={printerId} onEdit={onEdit} onDelete={onDelete} />
    </TestQueryLocaleProvider>,
  );
  return { onEdit, onDelete };
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
    // 입력되지 않은 조치사항은 빈칸이 아니라 빈 값 표기다.
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

  it('삭제는 확인 alert 를 지나야 요청에 닿는다 — 원문 Case02', async () => {
    const { onDelete } = renderScreen();
    await screen.findByText('001-12345648');

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(await screen.findByText('삭제하시겠습니까?')).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onDelete).toHaveBeenCalledWith('reference-printer-1');
  });

  it('없는 ID 의 재조회 실패는 not-found 문구로 닫는다', async () => {
    renderScreen('no-such-printer');

    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument();
  });
});
