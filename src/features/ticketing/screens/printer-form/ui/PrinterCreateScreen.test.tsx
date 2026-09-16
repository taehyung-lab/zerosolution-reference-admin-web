import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestLocaleProvider } from '@/test/locale';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { chooseOptionIn } from '@/test/select';
import { PrinterCreateScreen } from './PrinterCreateScreen';

let guardDisabled = true;
vi.mock('@tanstack/react-router', () => ({
  useBlocker: (options: { disabled: boolean }) => {
    guardDisabled = options.disabled;
    return { status: 'idle' };
  },
}));

afterEach(() => {
  guardDisabled = true;
});

function setup() {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestLocaleProvider>
      <UnsavedChangesProvider>
        <PrinterCreateScreen onConfirm={onConfirm} onCancel={onCancel} />
      </UnsavedChangesProvider>
    </TestLocaleProvider>,
  );
  return { onConfirm, onCancel };
}

describe('printer create (Figma 6.7.1.3 등록)', () => {
  it('등록 frame 의 항목과 초기 선택을 그린다', () => {
    setup();

    expect(screen.getByLabelText('기기명*')).toHaveAttribute(
      'placeholder',
      '기기명 (1~100자 내외)',
    );
    expect(screen.getByLabelText('시리얼번호*')).toHaveAttribute(
      'placeholder',
      '시리얼번호 (1~100자 내외)',
    );
    expect(screen.getByLabelText('모델명')).toHaveAttribute('placeholder', '모델명 (100자 내외)');
    expect(screen.getByLabelText('제조사')).toBeInTheDocument();
    expect(screen.getByLabelText('보관위치')).toBeInTheDocument();
    expect(screen.getByLabelText('조치사항').tagName).toBe('TEXTAREA');
    expect(screen.getByRole('combobox', { name: '상태' })).toHaveTextContent('정상');
    expect(screen.getByRole('combobox', { name: '용도' })).toHaveTextContent('내부발권용');
    expect(screen.getByRole('combobox', { name: '사용상태' })).toHaveTextContent('사용');
  });

  it('필수 입력이 비면 저장이 오류로 막히고 요청에 닿지 않는다', async () => {
    const { onConfirm } = setup();

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('기기명을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('시리얼번호를 입력해주세요.')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('검증을 통과하면 확인 alert 를 지나야 요청 입력이 나간다', async () => {
    const { onConfirm } = setup();

    fireEvent.change(screen.getByLabelText('기기명*'), { target: { value: '001-12345648' } });
    fireEvent.change(screen.getByLabelText('시리얼번호*'), {
      target: { value: 'ZERO123456-45678' },
    });
    fireEvent.change(screen.getByLabelText('조치사항'), { target: { value: '리본 교체' } });
    await chooseOptionIn('상태', '수리중');
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('저장하시겠습니까?')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({
        name: '001-12345648',
        serialNo: 'ZERO123456-45678',
        model: '',
        manufacturer: '',
        purchasedAt: '',
        location: '',
        status: 'REPAIR',
        measures: '리본 교체',
        purpose: 'INTERNAL',
        usage: 'IN_USE',
      });
    });
  });

  it('입력이 없으면 취소가 바로 나가고, 입력이 있으면 이탈 보호가 켜진다', async () => {
    const { onCancel } = setup();

    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('기기명*'), { target: { value: '001' } });
    await waitFor(() => {
      expect(guardDisabled).toBe(false);
    });
  });
});
