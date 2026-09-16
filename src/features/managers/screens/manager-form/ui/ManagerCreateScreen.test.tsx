import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/error';
import { readManagerTypeOptions } from '@/features/managers/fixtures/managers';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOptionIn } from '@/test/select';
import { ManagerCreateScreen } from './ManagerCreateScreen';

let guardDisabled = true;
vi.mock('@tanstack/react-router', () => ({
  useBlocker: (options: { disabled: boolean }) => {
    guardDisabled = options.disabled;
    return { status: 'idle' };
  },
}));
/** 옵션 응답만 대체해 실패를 만든다. Query 실행 경로는 화면과 같다. */
vi.mock(import('@/features/managers/fixtures/managers'), async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, readManagerTypeOptions: vi.fn(actual.readManagerTypeOptions) };
});

afterEach(() => {
  guardDisabled = true;
});

function setup() {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <ManagerCreateScreen onSaved={onSaved} onCancel={onCancel} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onSaved, onCancel };
}

/** 옵션은 Query 로 도착하므로 select 가 나타난 뒤에 고른다. */
async function chooseWhenLoaded(field: string, option: string) {
  await screen.findByRole('combobox', { name: field });
  await chooseOptionIn(field, option);
}

const fill = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('ManagerCreateScreen (11.1.3 운영자 등록)', () => {
  it('빈 저장은 첫 오류(유형)로 포커스가 가고 확인창을 열지 않는다', async () => {
    setup();
    await screen.findByRole('combobox', { name: '유형' });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(screen.getByRole('combobox', { name: '유형' })).toHaveFocus());
    expect(screen.getByText('유형을 선택하세요.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('유형을 고르면 그 유형의 권한만 열리고, 비밀번호 확인 불일치는 저장에서 그 필드로 알린다', async () => {
    setup();
    expect(screen.getByRole('combobox', { name: '권한' })).toBeDisabled();

    await chooseWhenLoaded('유형', 'Example site type');
    await waitFor(() => expect(screen.getByRole('combobox', { name: '권한' })).toBeEnabled());
    fireEvent.keyDown(screen.getByRole('combobox', { name: '권한' }), { key: 'Enter' });
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Example site permission',
    ]);
    fireEvent.keyDown(listbox, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());

    fill('비밀번호*', 'Safe!729');
    fill('비밀번호 확인*', 'wrong');
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() =>
      expect(screen.getByLabelText('비밀번호 확인*')).toHaveAccessibleDescription('비밀번호가 일치하지 않습니다.'),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('유효한 입력은 저장 확인 → 요청 함수 → 저장 완료 → 목록 이동으로 이어지며 비밀번호는 로그에 없다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onSaved } = setup();

    await chooseWhenLoaded('유형', 'Example type');
    await chooseWhenLoaded('권한', 'Example permission');
    fill('아이디*', 'operator99');
    fill('비밀번호*', 'Safe!729');
    fill('비밀번호 확인*', 'Safe!729');
    fill('이름*', '김');
    fill('휴대폰번호*', '010-1234-5678');
    fill('이메일*', 'operator@example.com');
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    const confirm = await screen.findByRole('dialog');
    expect(confirm).toHaveTextContent('저장하시겠습니까?');
    fireEvent.click(within(confirm).getByRole('button', { name: '취소' }));
    expect(log).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '확인' }));

    const saved = await screen.findByText('저장되었습니다.');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 운영자 등록'));
    expect(log.mock.calls.join('\n')).not.toContain('Safe!729');
    fireEvent.click(within(saved.closest('[role="dialog"]')!).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    log.mockRestore();
  });

  it('입력이 없으면 취소가 바로 나가고, 입력하면 이탈 보호가 켜진다', async () => {
    const { onCancel } = setup();
    await screen.findByRole('combobox', { name: '유형' });

    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onCancel).toHaveBeenCalledOnce();

    fill('이름*', '김');
    await waitFor(() => expect(guardDisabled).toBe(false));
  });

  it('유형 옵션 조회 실패를 빈 select 로 숨기지 않고 재시도로 복구한다', async () => {
    const read = vi.mocked(readManagerTypeOptions);
    const original = read.getMockImplementation()!;
    read.mockImplementation(() => Promise.reject(new ApiError({ kind: 'network', message: 'test' })));
    setup();

    expect(await screen.findByRole('alert', { name: '유형' })).toHaveTextContent('옵션을 불러오지 못했습니다.');
    expect(screen.queryByRole('combobox', { name: '유형' })).toBeNull();

    read.mockImplementation(original);
    fireEvent.click(screen.getByRole('button', { name: '유형 다시 시도' }));
    await waitFor(() => expect(screen.getByRole('combobox', { name: '유형' })).toBeEnabled());
  });
});
