import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { PrinterEditScreen } from './PrinterEditScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function setup(printerId = 'reference-printer-2') {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <PrinterEditScreen printerId={printerId} onConfirm={onConfirm} onCancel={onCancel} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onConfirm, onCancel };
}

describe('printer edit (Figma 6.7.1.4 수정)', () => {
  it('조회한 값으로 등록과 같은 항목을 채워 보여 준다', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByLabelText('기기명*')).toHaveValue('001-12345649');
    });
    expect(screen.getByLabelText('시리얼번호*')).toHaveValue('ZERO123456-45679');
    expect(screen.getByLabelText('조치사항')).toHaveValue('리본 교체 요청');
    expect(screen.getByRole('combobox', { name: '상태' })).toHaveTextContent('고장');
    expect(screen.getByRole('combobox', { name: '사용상태' })).toHaveTextContent('사용안함');
  });

  it('저장은 확인 alert 를 지나 대상 ID 와 함께 요청에 닿는다', async () => {
    const { onConfirm } = setup();
    await waitFor(() => {
      expect(screen.getByLabelText('기기명*')).toHaveValue('001-12345649');
    });

    fireEvent.change(screen.getByLabelText('보관위치'), { target: { value: '창고 C' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('저장하시겠습니까?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({
        printerId: 'reference-printer-2',
        input: expect.objectContaining({ location: '창고 C', status: 'BROKEN' }),
      });
    });
  });
});
