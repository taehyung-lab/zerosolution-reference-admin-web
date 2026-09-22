import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOptionIn } from '@/test/select';
import type { TermsListSearch } from '../model/terms-list-search';
import { TermsListScreen } from './TermsListScreen';

/** route 가 넘기는 것은 sparse search 와 이동 callback 이다. 해소·업무 실행은 화면이 한다. */
function renderScreen(sparse: TermsListSearch = {}) {
  const onSearchChange = vi.fn();
  const onActivate = vi.fn();
  const onCreate = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <TermsListScreen
        search={sparse}
        onSearchChange={onSearchChange}
        onActivate={onActivate}
        onCreate={onCreate}
      />
    </TestQueryLocaleProvider>,
  );
  return { onSearchChange, onActivate, onCreate };
}

/** 등록일 desc 기본 정렬의 첫 행(2026-06-10 등록). */
const firstRowVersion = 'V2.0';

describe('TermsListScreen (11.2 약관 목록)', () => {
  it('조회를 기다리지 않고 진입 즉시 결과를 그린다', async () => {
    renderScreen();

    expect(await screen.findByRole('cell', { name: firstRowVersion })).toBeInTheDocument();
    expect(screen.getByText('검색결과 : 5')).toBeInTheDocument();
  });

  it('Figma 11.2.1 table 의 컬럼을 순서대로 노출하고 행 checkbox 를 준다', async () => {
    renderScreen();
    await screen.findByRole('cell', { name: firstRowVersion });

    const headers = screen
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent?.replace(/[▲▼]/g, '').trim());
    expect(headers).toEqual([
      '',
      '버전',
      '본문',
      '시행일',
      '게시 상태',
      '게시일',
      '등록일/최근업데이트일',
    ]);
    expect(
      within(screen.getByRole('table')).getByRole('checkbox', { name: `${firstRowVersion} 선택` }),
    ).toBeInTheDocument();
  });

  it('첫 렌더에 기본 정렬(등록일 desc)이 헤더 하나에 표시되고 최신 약관이 첫 행이다', async () => {
    renderScreen();
    await screen.findByRole('cell', { name: firstRowVersion });

    const sorted = screen
      .getAllByRole('columnheader')
      .filter((cell) => cell.hasAttribute('aria-sort'));
    expect(sorted).toHaveLength(1);
    expect(sorted[0]).toHaveAttribute('aria-sort', 'descending');
    expect(sorted[0]).toHaveAccessibleName('등록일/최근업데이트일');
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]!).getByRole('cell', { name: firstRowVersion })).toBeInTheDocument();
  });

  it('활성 정렬 헤더를 누르면 방향만 바뀐 검색으로 나간다', async () => {
    const { onSearchChange } = renderScreen();
    await screen.findByRole('cell', { name: firstRowVersion });

    fireEvent.click(screen.getByRole('button', { name: '등록일/최근업데이트일' }));

    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange.mock.calls[0]?.[0]).toEqual({ sortDirection: 'asc' });
  });

  it('frame 의 표시 형식대로 버전 접두·게시 상태·두 일시를 그린다', async () => {
    renderScreen({ statuses: ['UNPUBLISHED'], sortType: 'version' });

    const row = (await screen.findByRole('cell', { name: 'V1.2' })).closest('tr')!;
    expect(within(row).getByRole('cell', { name: '게시안함' })).toBeInTheDocument();
    expect(
      within(row).getByRole('cell', { name: /^2026-06-01 .+2026-06-02 .+$/ }),
    ).toBeInTheDocument();
  });

  it('검색을 제출하면 입력한 조건이 첫 페이지로 커밋된다', async () => {
    const { onSearchChange } = renderScreen();
    await screen.findByRole('cell', { name: firstRowVersion });

    fireEvent.change(screen.getByRole('textbox', { name: '검색어' }), {
      target: { value: '개인정보' },
    });
    const status = screen.getByRole('group', { name: '게시 상태' });
    fireEvent.click(within(status).getByRole('checkbox', { name: '게시안함' }));
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(onSearchChange.mock.calls[0]?.[0]).toEqual({
        keywords: [{ field: 'body', value: '개인정보' }],
        statuses: ['PUBLISHED'],
      });
    });
  });

  it('초기화는 조건을 비운 URL 로 나가고 검색 전 표식을 만들지 않는다', async () => {
    const { onSearchChange } = renderScreen({ statuses: ['UNPUBLISHED'] });
    await screen.findByRole('cell', { name: firstRowVersion });

    fireEvent.click(screen.getByRole('button', { name: '초기화' }));

    expect(onSearchChange).toHaveBeenCalledWith({});
  });

  it('일치하는 결과가 없으면 원문 문구를 보여 준다', async () => {
    renderScreen({ keywords: [{ field: 'body', value: '없는 본문' }] });

    expect(await screen.findByText('일치하는 검색결과가 없습니다.')).toBeInTheDocument();
  });

  it('행을 클릭하면 그 약관의 조회로 나간다 — 원문 `특정 행 클릭시, 조회 화면으로 이동`', async () => {
    const { onActivate } = renderScreen();
    const cell = await screen.findByRole('cell', { name: firstRowVersion });

    fireEvent.click(cell);

    expect(onActivate).toHaveBeenCalledWith('reference-terms-4');
  });

  it('toolbar 우측의 등록을 누르면 등록 화면으로 나간다 — 원문 `등록 버튼 → 등록 화면으로 이동`', async () => {
    const { onCreate, onActivate } = renderScreen();
    await screen.findByRole('cell', { name: firstRowVersion });

    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('미선택 상태의 변경·선택복사는 원문 Case01 오류 alert 만 연다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByRole('cell', { name: firstRowVersion });

    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(await screen.findByText('변경할 항목을 선택해주세요.')).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '선택복사' }));
    expect(await screen.findByText('변경할 항목을 선택해주세요.')).toBeInTheDocument();
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('선택 + 값 + 확인 → 요청 함수 → 완료 alert, 확인하면 선택이 풀린다 — 원문 Case02', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByRole('cell', { name: firstRowVersion });

    fireEvent.click(screen.getByRole('checkbox', { name: `${firstRowVersion} 선택` }));
    await chooseOptionIn('일괄변경 항목', '게시안함');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('선택 항목을 변경하시겠습니까?');
    expect(log).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('변경되었습니다.'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 약관 일괄 게시 상태 변경'));

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('checkbox', { name: `${firstRowVersion} 선택` })).not.toBeChecked();
    log.mockRestore();
  });

  it('선택복사는 확인 없이 요청 함수까지 간다 — 원문이 적은 것은 Case01 뿐이다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByRole('cell', { name: firstRowVersion });

    fireEvent.click(screen.getByRole('checkbox', { name: `${firstRowVersion} 선택` }));
    fireEvent.click(screen.getByRole('button', { name: '선택복사' }));

    await waitFor(() =>
      expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 약관 선택복사')),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    log.mockRestore();
  });
});
