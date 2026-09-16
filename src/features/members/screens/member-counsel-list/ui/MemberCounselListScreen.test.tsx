import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOption, chooseOptionIn } from '@/test/select';
import type { CounselListSearch } from '../model/counsel-list-search';
import { MemberCounselListScreen } from './MemberCounselListScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function renderScreen(search: CounselListSearch = {}) {
  const onSearchChange = vi.fn();
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <MemberCounselListScreen search={search} onSearchChange={onSearchChange} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onSearchChange, log };
}

const counselDialog = () => screen.getByRole('dialog', { name: '회원상담' });

describe('MemberCounselListScreen (4.6 회원상담)', () => {
  it('진입 즉시 조회하고 문의유형을 전체로 되돌리면 그 조건만 사라진다', async () => {
    const { onSearchChange } = renderScreen({ inquiryType: 'reference', statuses: ['waiting'] });
    expect(await screen.findByRole('cell', { name: 'Example inquiry' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Example inquiry type' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '정렬' })).toBeInTheDocument();

    await chooseOptionIn('문의유형', '전체');
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    expect(onSearchChange).toHaveBeenLastCalledWith({ statuses: ['waiting'] });
    fireEvent.click(screen.getByRole('button', { name: '초기화' }));
    expect(onSearchChange).toHaveBeenLastCalledWith({});
  });

  it('행을 클릭하면 상담 팝업이 열리고 기록 등록·수정·삭제가 상담 ID 와 함께 요청 함수에 닿는다', async () => {
    const { log } = renderScreen();
    fireEvent.click(await screen.findByRole('cell', { name: 'Example inquiry' }));
    const dialog = counselDialog();
    expect(await within(dialog).findByText('refe*****@example.com')).toBeInTheDocument();

    const create = within(dialog).getByRole('form', { name: '신규 상담 등록' });
    fireEvent.click(within(create).getByRole('button', { name: '저장' }));
    expect((await within(create).findAllByRole('alert')).length).toBeGreaterThan(0);
    expect(log).not.toHaveBeenCalled();
    await chooseOption(within(create).getByRole('combobox', { name: '문의유형' }), '예매');
    fireEvent.change(within(create).getByRole('textbox', { name: '상담내용 및 처리결과' }), { target: { value: '새 상담 내용' } });
    fireEvent.click(within(create).getByRole('button', { name: '저장' }));
    await waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 회원상담 등록')));

    fireEvent.click(within(dialog).getByRole('button', { name: '수정' }));
    const edit = within(dialog).getByRole('form', { name: '수정' });
    fireEvent.change(within(edit).getByRole('textbox', { name: '상담내용 및 처리결과' }), { target: { value: '수정 상담 내용' } });
    fireEvent.click(within(edit).getByRole('button', { name: '저장' }));
    await waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 회원상담 수정')));
    fireEvent.click(within(edit).getByRole('button', { name: '취소' }));
    const cancelEdit = screen.getByRole('dialog', { name: '알림' });
    expect(cancelEdit).toHaveTextContent('입력을 취소하시겠습니까?');
    fireEvent.click(within(cancelEdit).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(within(dialog).queryByRole('form', { name: '수정' })).toBeNull());

    fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: '알림' })).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 회원상담 삭제')));
    expect(log.mock.calls.join('\n')).not.toContain('상담 내용');
  });

  it('재발권은 프린터를 골라야 열리고 테스트 발권과 실제 재발권을 구분해 요청 함수에 닿는다', async () => {
    const { log } = renderScreen();
    fireEvent.click(await screen.findByRole('cell', { name: 'Example inquiry' }));
    fireEvent.click(await within(counselDialog()).findByRole('button', { name: '티켓재발권' }));
    const print = screen.getByRole('dialog', { name: '티켓재발권' });
    expect(within(print).getByRole('button', { name: '테스트 발권' })).toBeDisabled();
    expect(within(print).getByRole('button', { name: '발권 시작하기' })).toBeDisabled();

    await chooseOption(await within(print).findByRole('combobox', { name: '스마트프린터 선택' }), 'Example printer');
    fireEvent.click(within(print).getByRole('button', { name: '테스트 발권' }));
    await waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 티켓 테스트 발권')));
    fireEvent.click(within(print).getByRole('button', { name: '발권 시작하기' }));
    await waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 티켓 재발권')));
    expect(print).toBeInTheDocument();
  });

  it('기록 초안이 있으면 팝업을 닫기 전에 묻는다', async () => {
    renderScreen();
    fireEvent.click(await screen.findByRole('cell', { name: 'Example inquiry' }));
    const dialog = counselDialog();
    const create = await within(dialog).findByRole('form', { name: '신규 상담 등록' });
    fireEvent.change(within(create).getByRole('textbox', { name: '상담내용 및 처리결과' }), { target: { value: 'draft' } });
    fireEvent.keyDown(dialog, { key: 'Escape' });
    const alert = screen.getByRole('dialog', { name: '알림' });
    expect(alert).toHaveTextContent('입력을 취소하시겠습니까?');
    fireEvent.click(within(alert).getByRole('button', { name: '취소' }));
    expect(within(create).getByRole('textbox', { name: '상담내용 및 처리결과' })).toHaveValue('draft');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    fireEvent.click(within(screen.getByRole('dialog', { name: '알림' })).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
