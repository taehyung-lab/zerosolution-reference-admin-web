import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOptionIn } from '@/test/select';
import { PostDetailScreen } from './PostDetailScreen';

function renderScreen(postId = 'reference-post-1') {
  const onEdit = vi.fn();
  const onDeleted = vi.fn();
  const onOpenMember = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <PostDetailScreen
        postId={postId}
        onEdit={onEdit}
        onDeleted={onDeleted}
        onOpenMember={onOpenMember}
      />
    </TestQueryLocaleProvider>,
  );
  return { onEdit, onDeleted, onOpenMember };
}

describe('PostDetailScreen (9.2.2 게시물 조회)', () => {
  it('frame 의 기본정보 행을 읽기 전용으로 보여 주고 연락처를 마스킹한다', async () => {
    renderScreen();

    expect(await screen.findByText('Reference 문의합니다.')).toBeInTheDocument();
    expect(screen.getByText('Reference Board 5')).toBeInTheDocument();
    expect(screen.getByText('Reference Category A')).toBeInTheDocument();
    // 작성자와 답변받을 이메일 둘 다 마스킹된 값으로 그린다(작성자 표기는 댓글 표에도 나온다).
    expect(screen.getAllByText('Reference 김땡땡(refe*****@example.test)').length).toBeGreaterThan(0);
    expect(screen.getByText('refe*****@example.test')).toBeInTheDocument();
  });

  it('게시상태 행은 현재 값과 반대 상태 버튼을 주고, 누르면 요청 함수에 닿는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByText('Reference 문의합니다.');

    fireEvent.click(screen.getByRole('button', { name: '게시안함' }));

    await waitFor(() =>
      expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 게시물 게시상태 변경')),
    );
    log.mockRestore();
  });

  it('작성자의 회원 조회는 그 회원 ID 로 나간다 — 원문 `회원 페이지를 새탭으로 제공`', async () => {
    const { onOpenMember } = renderScreen();
    await screen.findByText('Reference 문의합니다.');

    fireEvent.click(screen.getByRole('button', { name: '회원 조회' }));

    expect(onOpenMember).toHaveBeenCalledWith('reference-member-1');
  });

  it('업데이트 이력은 등록·수정·댓글 등록·댓글 수정 네 종류를 항목 줄과 함께 보여 준다', async () => {
    renderScreen();
    await screen.findByText('Reference 문의합니다.');

    expect(screen.getByText('댓글 수정')).toBeInTheDocument();
    expect(screen.getByText('댓글 등록')).toBeInTheDocument();
    expect(screen.getByText('등록')).toBeInTheDocument();
    // `수정`·`댓글 수정` 두 줄이 같은 항목 변경을 적는다.
    expect(screen.getAllByText('게시상태 : 게시 > 게시안함')).toHaveLength(2);
  });

  it('댓글 표는 frame 의 컬럼과 행 checkbox 를 준다', async () => {
    renderScreen();
    await screen.findByText('Reference 문의합니다.');

    // 첫 표가 댓글이고 두 번째가 업데이트 이력이다.
    const table = screen.getAllByRole('table')[0]!;
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent?.trim());
    expect(headers).toEqual([
      '',
      '카테고리',
      '제목',
      '내용',
      '회원유형/회원등급',
      '작성자',
      '조회수',
      '게시상태',
      '등록일/최근업데이트일',
    ]);
  });

  it('댓글을 고르지 않고 변경을 누르면 공용 거절 문구만 나온다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByText('Reference 문의합니다.');

    fireEvent.click(screen.getByRole('button', { name: '변경' }));

    expect(await screen.findByText('변경할 항목을 선택해주세요.')).toBeInTheDocument();
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('댓글 선택 + 값 + 확인이면 요청 함수에 닿고 완료 alert 이 열린다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByText('Reference 문의합니다.');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Reference 추가로 남긴 댓글입니다. 선택' }));
    await chooseOptionIn('댓글 일괄변경 항목', '게시안함');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() =>
      expect(log).toHaveBeenCalledWith(
        expect.stringContaining('[시나리오] 게시물 댓글 일괄 상태 변경'),
      ),
    );
    log.mockRestore();
  });

  it('답변상태 변경은 고른 값으로 요청 함수에 닿는다 — Notion `대기, 검토중, 완료 중 택1`', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByText('Reference 문의합니다.');

    await chooseOptionIn('답변상태', '검토중');
    fireEvent.click(screen.getByRole('button', { name: '답변상태 변경' }));

    await waitFor(() =>
      expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 게시물 답변상태 변경')),
    );
    log.mockRestore();
  });

  it('수정은 그 게시물로 나가고, 삭제는 공통 확인을 지나 요청 함수에 닿는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onEdit } = renderScreen();
    await screen.findByText('Reference 문의합니다.');

    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    expect(onEdit).toHaveBeenCalledWith('reference-post-1');

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('삭제하시겠습니까?');
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() =>
      expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 게시물 삭제')),
    );
    log.mockRestore();
  });

  it('없는 게시물은 route 가 아니라 화면의 not-found 상태로 끝난다', async () => {
    renderScreen('reference-post-none');

    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument();
  });
});
