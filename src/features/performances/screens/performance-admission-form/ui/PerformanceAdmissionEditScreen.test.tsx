import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { PerformanceAdmissionEditScreen } from './PerformanceAdmissionEditScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function setup(performanceId = 'reference-performance-2') {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <PerformanceAdmissionEditScreen
          performanceId={performanceId}
          onSaved={onSaved}
          onCancel={onCancel}
        />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onSaved, onCancel };
}

describe('공연 수정 — 입장안내정보 (5.2.3)', () => {
  it('조회한 입장안내를 채우고 기본정보는 읽기로 함께 보여 준다', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByLabelText('구역 1*')).toHaveValue('Reference Area A');
    });
    expect(screen.getByRole('combobox', { name: '게이트 1' })).toHaveTextContent('Reference Gate A');
    expect(screen.getByRole('combobox', { name: '입력 방식' })).toHaveTextContent('구역');
    expect(screen.getByText('reference-admission.txt')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '한국어' })).toBeInTheDocument();
    expect(screen.getByText('Reference Performance 2')).toBeInTheDocument();
  });

  it('추가한 빈 행은 저장을 막고 확인창을 열지 않는다', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByLabelText('구역 1*')).toHaveValue('Reference Area A');
    });

    fireEvent.click(screen.getByRole('button', { name: '추가' }));
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findAllByText('필수 항목을 입력해주세요.')).toHaveLength(2);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('행을 삭제하면 값과 오류가 남은 행을 따라간다', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByLabelText('구역 1*')).toHaveValue('Reference Area A');
    });

    fireEvent.click(screen.getByRole('button', { name: '추가' }));
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findAllByText('필수 항목을 입력해주세요.')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: '2번째 게이트 삭제' }));

    expect(screen.getByLabelText('구역 1*')).toHaveValue('Reference Area A');
    expect(screen.queryByText('필수 항목을 입력해주세요.')).not.toBeInTheDocument();
  });

  it('저장은 확인 → 요청 함수 → 저장 완료 → 조회 이동으로 이어진다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onSaved } = setup();
    await waitFor(() => {
      expect(screen.getByLabelText('구역 1*')).toHaveValue('Reference Area A');
    });

    fireEvent.change(screen.getByLabelText('구역 1*'), { target: { value: 'Reference Area C' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    const confirm = await screen.findByRole('dialog');
    expect(confirm).toHaveTextContent('저장하시겠습니까?');
    fireEvent.click(within(confirm).getByRole('button', { name: '확인' }));

    const saved = await screen.findByText('저장되었습니다.');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 공연 입장안내정보 수정'));
    fireEvent.click(within(saved.closest('[role="dialog"]')!).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    log.mockRestore();
  });

  it('없는 ID 는 not-found 문구로 닫고 폼을 그리지 않는다', async () => {
    setup('no-such-performance');

    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '저장' })).not.toBeInTheDocument();
  });
});
