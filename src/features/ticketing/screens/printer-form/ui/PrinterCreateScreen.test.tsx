import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
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
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <PrinterCreateScreen onSaved={onSaved} onCancel={onCancel} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onSaved, onCancel };
}

describe('printer create (Figma 6.7.1.3 등록)', () => {
  it('등록 frame 의 항목과 초기 선택을 그린다', () => {
    setup();

    expect(screen.getByLabelText('기기명*')).toHaveAttribute('placeholder', '기기명 (1~100자 내외)');
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

  it('필수 입력이 비면 저장이 오류로 막힌다', async () => {
    setup();

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('기기명을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('시리얼번호를 입력해주세요.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('검증을 통과하면 저장 확인을 지나 저장을 실행하고, 미연결 실패는 폼 위 문구로 남는다', async () => {
    const { onSaved } = setup();

    fireEvent.change(screen.getByLabelText('기기명*'), { target: { value: '001-12345648' } });
    fireEvent.change(screen.getByLabelText('시리얼번호*'), {
      target: { value: 'ZERO123456-45678' },
    });
    fireEvent.change(screen.getByLabelText('조치사항'), { target: { value: '리본 교체' } });
    await chooseOptionIn('상태', '수리중');
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('저장하시겠습니까?');
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    );
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.queryByText('저장되었습니다.')).not.toBeInTheDocument();
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
