import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { BannerDetailScreen } from './BannerDetailScreen';

function renderScreen(bannerId = 'reference-banner-1') {
  const onEdit = vi.fn();
  const onDeleted = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <BannerDetailScreen bannerId={bannerId} onEdit={onEdit} onDeleted={onDeleted} />
    </TestQueryLocaleProvider>,
  );
  return { onEdit, onDeleted };
}

describe('BannerDetailScreen (7.1.2 배너 조회)', () => {
  it('기본정보 섹션이 frame 의 항목을 읽기 전용으로 보여 준다', async () => {
    renderScreen();

    expect(await screen.findByText('Reference 콘서트 안내 배너')).toBeInTheDocument();
    expect(screen.getByText('홈')).toBeInTheDocument();
    expect(screen.getByText('APP 내부')).toBeInTheDocument();
    expect(screen.getByText('//app/bbs/notice/123')).toBeInTheDocument();
    expect(screen.getByText('게시중')).toBeInTheDocument();
    expect(
      screen.getByText(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} ~ \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
    ).toBeInTheDocument();
    // 이미지 파일명은 브라우저 기본 다운로드로 이어지는 링크다(Notion).
    const image = screen.getByRole('link', { name: 'reference-concert.png' });
    expect(image).toHaveAttribute('download', 'reference-concert.png');
    // 즉시중단은 원문이 동작을 적지 않아 만들지 않았다(BANNER-DETAIL 미확인 1).
    expect(screen.queryByRole('button', { name: '즉시중단' })).not.toBeInTheDocument();
  });

  it('업데이트 이력은 수정 아래 항목별 이전 > 이후 줄을 쌓는다', async () => {
    renderScreen();
    await screen.findByText('Reference 콘서트 안내 배너');

    const history = screen.getByRole('table');
    const headers = within(history)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent?.trim());
    expect(headers).toEqual(['업데이트일', '업데이트 사항', '담당자']);
    const rows = within(history).getAllByRole('row').slice(1);
    expect(within(rows[0]!).getByText('수정')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('- 게시순서 : 10 > 1')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('- 이동경로 URL : //app/bbs/notice/12 > //app/bbs/notice/123')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('등록')).toBeInTheDocument();
  });

  it('수정은 그 배너의 수정으로 나간다', async () => {
    const { onEdit } = renderScreen();
    await screen.findByText('Reference 콘서트 안내 배너');

    fireEvent.click(screen.getByRole('button', { name: '수정' }));

    expect(onEdit).toHaveBeenCalledWith('reference-banner-1');
  });

  it('삭제는 원문의 확인 alert 을 지나야 요청 함수에 닿고, 취소하면 아무것도 부르지 않는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onDeleted } = renderScreen();
    await screen.findByText('Reference 콘서트 안내 배너');

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    let dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('삭제하시겠습니까?');
    fireEvent.click(within(dialog).getByRole('button', { name: '취소' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(log).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 배너 삭제'));
    log.mockRestore();
  });
});
