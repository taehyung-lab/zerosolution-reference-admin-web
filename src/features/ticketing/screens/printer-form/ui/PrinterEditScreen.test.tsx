import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { PrinterEditScreen } from './PrinterEditScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function setup(printerId = 'reference-printer-2') {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <PrinterEditScreen printerId={printerId} onSaved={onSaved} onCancel={onCancel} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onSaved, onCancel };
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

  it('저장은 확인을 지나 실행되고, 미연결 실패는 폼 위 문구로 남아 이동하지 않는다', async () => {
    const { onSaved } = setup();
    await waitFor(() => {
      expect(screen.getByLabelText('기기명*')).toHaveValue('001-12345649');
    });

    fireEvent.change(screen.getByLabelText('보관위치'), { target: { value: '창고 C' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('저장하시겠습니까?');
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    );
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('없는 ID 는 not-found 문구로 닫고 폼을 그리지 않는다', async () => {
    setup('no-such-printer');

    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument();
    expect(screen.queryByLabelText('기기명*')).not.toBeInTheDocument();
  });
});
