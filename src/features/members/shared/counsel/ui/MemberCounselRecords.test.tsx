import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MemberCounselRecord } from '@/features/members/model/member-counsel';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestLocaleProvider } from '@/test/locale';
import { MemberCounselRecords } from './MemberCounselRecords';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

const record: MemberCounselRecord = {
  id: 'counsel-1',
  createdAt: '2026-09-01T00:00:00Z',
  receivedAt: '2026-09-01T00:00:00Z',
  answeredAt: '2026-09-01T00:00:00Z',
  operatorName: '기존담당자',
  inquiryType: 'booking',
  content: '기존 상담',
};
const ready = { rows: [record], searched: true, isPending: false, isFetching: false, isError: false, retry: () => Promise.resolve() };

function setup(records = ready) {
  const onCreate = vi.fn(() => Promise.resolve());
  const onUpdate = vi.fn(() => Promise.resolve());
  const onDelete = vi.fn(() => Promise.resolve());
  const view = render(
    <TestLocaleProvider>
      <UnsavedChangesProvider>
        <MemberCounselRecords records={records} operatorName="로그인담당자" onCreate={onCreate} onUpdate={onUpdate} onDelete={onDelete} />
      </UnsavedChangesProvider>
    </TestLocaleProvider>,
  );
  return { onCreate, onUpdate, onDelete, view };
}

describe('MemberCounselRecords', () => {
  it('validates required fields, uses the operator default, and keeps the draft after sending', async () => {
    const { onCreate } = setup();
    const create = screen.getByRole('form', { name: '신규 상담 등록' });
    expect(within(create).getByRole('textbox', { name: '담당자' })).toHaveValue('로그인담당자');
    fireEvent.click(within(create).getByRole('button', { name: '저장' }));
    expect(await within(create).findAllByRole('alert')).toHaveLength(2);
    expect(onCreate).not.toHaveBeenCalled();

    fireEvent.keyDown(within(create).getByRole('combobox', { name: '문의유형' }), { key: 'Enter' });
    fireEvent.click(await screen.findByRole('option', { name: '예매' }));
    fireEvent.change(within(create).getByRole('textbox', { name: '상담내용 및 처리결과' }), { target: { value: '새 상담' } });
    fireEvent.click(within(create).getByRole('button', { name: '저장' }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ operatorName: '로그인담당자', inquiryType: 'booking', content: '새 상담' }));
    expect(within(create).getByRole('textbox', { name: '상담내용 및 처리결과' })).toHaveValue('새 상담');
  });

  it('edits inline, asks before discarding a dirty edit, and confirms deletion without removing the row', async () => {
    const { onUpdate, onDelete } = setup();
    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    const edit = screen.getByRole('form', { name: '수정' });
    expect(within(edit).getByRole('textbox', { name: '담당자' })).toHaveValue('기존담당자');
    fireEvent.change(within(edit).getByRole('textbox', { name: '상담내용 및 처리결과' }), { target: { value: '수정 draft' } });
    fireEvent.click(within(edit).getByRole('button', { name: '저장' }));
    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith('counsel-1', expect.objectContaining({ content: '수정 draft' })));

    fireEvent.click(within(edit).getByRole('button', { name: '취소' }));
    expect(screen.getByRole('dialog', { name: '알림' })).toHaveTextContent('입력을 취소하시겠습니까?');
    fireEvent.click(within(screen.getByRole('dialog', { name: '알림' })).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(screen.queryByRole('form', { name: '수정' })).toBeNull());

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '취소' }));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledExactlyOnceWith('counsel-1'));
    expect(screen.getByText('기존 상담')).toBeInTheDocument();
  });

  it('keeps the new form mounted while records load or fail and says empty only after success', () => {
    const { view } = setup({ ...ready, rows: [], isPending: true });
    expect(screen.getByText('데이터를 불러오는 중입니다. 잠시만 기다려 주세요.')).toBeInTheDocument();
    expect(screen.getByRole('form', { name: '신규 상담 등록' })).toBeInTheDocument();
    view.unmount();
    setup({ ...ready, rows: [] });
    expect(screen.getByText('등록된 상담이 없습니다.')).toBeInTheDocument();
  });
});
