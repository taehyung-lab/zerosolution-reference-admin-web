import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOptionIn } from '@/test/select';
import { BannerCreateScreen } from './BannerCreateScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function renderScreen() {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <BannerCreateScreen onSaved={onSaved} onCancel={onCancel} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onSaved, onCancel };
}

/** 게시기간 달력은 오늘이 든 달을 먼저 그린다 — 그 달의 `day` 일 칸을 누른다. */
function pickDay(groupName: string, day: number) {
  const group = screen.getByRole('group', { name: groupName });
  const cell = within(group)
    .getAllByRole('button')
    .find((button) => button.textContent?.trim() === String(day));
  fireEvent.click(cell!);
}

function png(name = 'banner.png', bytes = 10) {
  return new File([new Uint8Array(bytes)], name, { type: 'image/png' });
}

describe('BannerCreateScreen (7.1.3 배너 등록)', () => {
  it('frame 초기 상태를 그린다 — 구분 홈·유형 APP 내부, 나머지는 빈 값', async () => {
    renderScreen();

    expect(await screen.findByRole('combobox', { name: /구분/ })).toHaveTextContent('홈');
    expect(screen.getByRole('combobox', { name: /^유형/ })).toHaveTextContent('APP 내부');
    expect(screen.getByRole('textbox', { name: /게시순서/ })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /배너명/ })).toHaveAttribute('placeholder', '500자 내외');
    expect(screen.getByText('숫자만 입력 가능합니다.')).toBeInTheDocument();
    expect(screen.getByText(/권장 사이즈 : 가로 \{n\}px \* 세로 \{n\}px/)).toBeInTheDocument();
  });

  it('필수 입력을 비운 채 저장하면 저장 요청 없이 필드 문구가 나온다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByRole('combobox', { name: /구분/ });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(screen.getAllByText('필수 항목을 입력해주세요.').length).toBeGreaterThanOrEqual(6),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('게시순서가 숫자가 아니거나 이미지가 png·1MB 이하가 아니면 저장 전에 거절한다', async () => {
    renderScreen();
    await screen.findByRole('combobox', { name: /구분/ });

    fireEvent.change(screen.getByRole('textbox', { name: /게시순서/ }), { target: { value: '1a' } });
    fireEvent.change(screen.getByLabelText('파일선택'), {
      target: { files: [new File(['x'], 'banner.jpg', { type: 'image/jpeg' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(screen.getAllByText('숫자만 입력 가능합니다.').length).toBeGreaterThanOrEqual(2),
    );
    expect(screen.getByText('지원확장자 : png, 1MB 이하')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('파일선택'), {
      target: { files: [png('big.png', 1024 * 1024 + 1)] },
    });
    await waitFor(() => expect(screen.getByText('지원확장자 : png, 1MB 이하')).toBeInTheDocument());
  });

  it('값을 채우고 저장하면 확인을 지나 요청 함수에 닿고, 완료 확인 뒤 목적지로 나간다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onSaved } = renderScreen();
    await screen.findByRole('combobox', { name: /구분/ });

    fireEvent.change(screen.getByRole('textbox', { name: /게시순서/ }), { target: { value: '12' } });
    fireEvent.change(screen.getByRole('textbox', { name: /배너명/ }), {
      target: { value: 'Reference 새 배너' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /^URL/ }), {
      target: { value: '//app/bbs/notice/1' },
    });
    fireEvent.change(screen.getByLabelText('파일선택'), { target: { files: [png()] } });
    expect(await screen.findByText('banner.png')).toBeInTheDocument();
    pickDay('시작일', 1);
    pickDay('종료일', 2);
    await chooseOptionIn(/게시 상태/, '대기');
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('저장하시겠습니까?');
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() =>
      expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 배너 등록')),
    );
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('저장되었습니다.'));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    // 시나리오 요청은 새 ID 를 돌려주지 않는다 — route 가 그 경우를 목록으로 보낸다.
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(undefined));
    log.mockRestore();
  });
});
