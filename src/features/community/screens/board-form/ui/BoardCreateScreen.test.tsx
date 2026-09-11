import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestLocaleProvider } from '@/test/locale';
import { BoardCreateScreen } from './BoardCreateScreen';

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
      <BoardCreateScreen onConfirm={onConfirm} onCancel={onCancel} />
    </TestLocaleProvider>,
  );
  return { onConfirm, onCancel };
}

async function choose(combobox: string, option: string) {
  fireEvent.click(screen.getByRole('combobox', { name: combobox }));
  fireEvent.click(await screen.findByRole('option', { name: option }));
}

describe('board create (Figma 9.1.3 등록)', () => {
  it('등록 frame 의 항목과 초기 상태를 그린다: 유형은 읽기 전용, 하위 항목은 비활성', () => {
    setup();

    expect(screen.getByText('일반', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '구분' })).toHaveTextContent('일반');
    expect(screen.getByLabelText('게시판명*')).toHaveAttribute('placeholder', '게시판명 (30자 내외)');
    for (const name of ['쓰기', '읽기', '카테고리', '게시글 제목 지정', 'HTML', '파일첨부', '팝업', '평점', '댓글', '비밀댓글', '댓글 알림', '표시', '중복 허용', '사용상태']) {
      expect(screen.getByRole('combobox', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('combobox', { name: '카테고리' })).toHaveTextContent('사용');
    expect(screen.getByRole('combobox', { name: 'HTML' })).toHaveTextContent('사용안함');
    expect(screen.getByRole('combobox', { name: '사용상태' })).toHaveTextContent('사용');
    expect(screen.getByRole('combobox', { name: '댓글 알림' })).toHaveTextContent('사용안함');
    // 상위가 꺼진 하위 항목은 비활성이고 `*`는 frame 대로 남는다. 중복 허용은 수정 frame 의 규칙(표시 ← 사용)을 따른다(질문 33).
    expect(screen.getByLabelText('제목 지정*')).toBeDisabled();
    expect(screen.getByLabelText('파일첨부 용량제한*')).toBeDisabled();
    expect(screen.getByRole('combobox', { name: '비밀댓글' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: '중복 허용' })).toBeDisabled();
    // 회원등급을 고르기 전에는 등급 select 가 없다.
    expect(screen.queryByRole('combobox', { name: '쓰기 회원등급' })).toBeNull();
  });

  it('상위 값이 하위 항목을 켠다: 회원등급 → 등급, 운영자가 제목 지정 → 제목 칩, 파일첨부 사용 → 용량제한', async () => {
    setup();

    await choose('쓰기', '회원등급');
    expect(screen.getByRole('combobox', { name: '쓰기 회원등급' })).toBeInTheDocument();

    await choose('게시글 제목 지정', '운영자가 제목 지정');
    const title = screen.getByLabelText('제목 지정*');
    expect(title).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: '추가' }));
    expect(screen.getByRole('alert')).toHaveTextContent('제목을 입력한 뒤 추가를 눌러주세요.');
    fireEvent.change(title, { target: { value: '궁금해요' } });
    expect(screen.getByText('입력한 제목은 추가를 눌러야 저장에 들어갑니다.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '추가' }));
    expect(screen.getByText('궁금해요')).toBeInTheDocument();
    fireEvent.change(title, { target: { value: '궁금해요' } });
    fireEvent.click(screen.getByRole('button', { name: '추가' }));
    expect(screen.getByRole('alert')).toHaveTextContent('이미 추가된 제목입니다.');
    fireEvent.click(screen.getByRole('button', { name: '궁금해요 삭제' }));
    expect(screen.queryByText('궁금해요')).toBeNull();

    await choose('파일첨부', '사용');
    expect(screen.getByLabelText('파일첨부 용량제한*')).toBeEnabled();
  });

  it('필수 입력이 비면 저장이 확인창까지 가지 않고 첫 오류로 포커스가 간다', async () => {
    const { onConfirm } = setup();

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(screen.getByLabelText('게시판명*')).toHaveFocus());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('유효한 입력은 저장 확인을 거쳐 정리된 설정으로 업무 요청에 닿는다', async () => {
    const { onConfirm } = setup();

    fireEvent.change(screen.getByLabelText('게시판명*'), { target: { value: '공지 게시판' } });
    await choose('쓰기', '운영자');
    await choose('읽기', '전체회원');
    await choose('게시글 제목 지정', '작성자가 직접입력');
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('저장하시겠습니까?')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'GENERAL',
        category: 'GENERAL',
        name: '공지 게시판',
        write: { permission: 'MANAGER' },
        read: { permission: 'ALL_MEMBERS' },
        postTitleMode: 'AUTHOR_INPUT',
        managerTitles: [],
        comment: 'NOT_IN_USE',
        usage: 'IN_USE',
      }),
    );
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('attachmentLimitMb');
  });

  it('입력 전에는 이탈 가드가 꺼져 있고 입력하면 켜진다', () => {
    setup();
    expect(guardDisabled).toBe(true);
    fireEvent.change(screen.getByLabelText('게시판명*'), { target: { value: 'x' } });
    expect(guardDisabled).toBe(false);
  });
});
