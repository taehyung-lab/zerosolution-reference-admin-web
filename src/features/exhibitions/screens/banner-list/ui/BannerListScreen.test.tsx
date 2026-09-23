import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOptionIn } from '@/test/select';
import type { BannerListSearch } from '../model/banner-list-search';
import { BannerListScreen } from './BannerListScreen';

/** route 가 넘기는 것은 sparse search 와 이동 callback 이다. 해소·업무 실행은 화면이 한다. */
function renderScreen(sparse: BannerListSearch = {}) {
  const onSearchChange = vi.fn();
  const onActivate = vi.fn();
  const onCreate = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <BannerListScreen
        search={sparse}
        onSearchChange={onSearchChange}
        onActivate={onActivate}
        onCreate={onCreate}
      />
    </TestQueryLocaleProvider>,
  );
  return { onSearchChange, onActivate, onCreate };
}

/** 기본 정렬(등록일 desc)의 첫 행. */
const firstRowName = 'Reference 콘서트 안내 배너';

afterEach(() => {
  vi.useRealTimers();
});

describe('BannerListScreen (7.1.1.1 배너 리스트)', () => {
  it('진입 즉시 조회하고 frame 의 컬럼 순서를 그린다 — No. 컬럼은 없다', async () => {
    renderScreen();
    await screen.findByRole('cell', { name: firstRowName });

    const headers = screen
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent?.replace(/[▲▼]/g, '').trim());
    expect(headers).toEqual([
      '',
      '게시순서',
      '구분',
      '배너명',
      '이동경로 유형',
      '게시기간',
      '게시 상태',
      '등록일/최근업데이트일',
    ]);
    expect(screen.getByRole('checkbox', { name: `${firstRowName} 선택` })).toBeInTheDocument();
  });

  it('첫 렌더에 기본 정렬(등록일 desc)이 헤더 하나에 표시된다', async () => {
    renderScreen();
    await screen.findByRole('cell', { name: firstRowName });

    const sorted = screen
      .getAllByRole('columnheader')
      .filter((cell) => cell.hasAttribute('aria-sort'));
    expect(sorted).toHaveLength(1);
    expect(sorted[0]).toHaveAttribute('aria-sort', 'descending');
    expect(sorted[0]).toHaveAccessibleName('등록일/최근업데이트일');
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]!).getByRole('cell', { name: firstRowName })).toBeInTheDocument();
  });

  it('frame 의 표시 형식대로 enum 라벨과 두 줄 게시기간·두 줄 일시를 그린다', async () => {
    renderScreen();
    const row = (await screen.findByRole('cell', { name: firstRowName })).closest('tr')!;

    expect(within(row).getByRole('cell', { name: '홈' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: 'APP 내부' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '게시중' })).toBeInTheDocument();
    const dateTime = String.raw`\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}`;
    expect(
      within(row).getByRole('cell', { name: new RegExp(`^${dateTime} ~${dateTime}$`) }),
    ).toBeInTheDocument();
    expect(
      within(row).getByRole('cell', { name: new RegExp(`^${dateTime} /${dateTime}$`) }),
    ).toBeInTheDocument();
  });

  it('검색 영역은 Case 정의 순서와 기본값을 그린다 — 구분은 홈, 나머지는 전체', async () => {
    renderScreen();
    await screen.findByRole('cell', { name: firstRowName });

    const category = screen.getByRole('group', { name: '구분' });
    expect(within(category).getAllByRole('checkbox')).toHaveLength(1);
    expect(within(category).getByRole('checkbox', { name: '홈' })).toBeChecked();
    // 하나뿐인 홈은 비울 수 없다 — 비운 상태를 canonical 이 기본값으로 되돌려 화면과 요청이 어긋나기 때문이다.
    fireEvent.click(within(category).getByRole('checkbox', { name: '홈' }));
    expect(within(category).getByRole('checkbox', { name: '홈' })).toBeChecked();
    const linkType = screen.getByRole('group', { name: '이동경로 유형' });
    expect(within(linkType).getByRole('checkbox', { name: '전체' })).toBeChecked();
    const status = screen.getByRole('group', { name: '게시 상태' });
    expect(within(status).getByRole('checkbox', { name: '전체' })).toBeChecked();
    expect(screen.getByRole('combobox', { name: '기간 기준' })).toHaveTextContent('등록일');
  });

  it('검색을 제출하면 입력한 조건이 첫 페이지로 커밋된다', async () => {
    const { onSearchChange } = renderScreen({ page: 2 });
    await screen.findByRole('form', { name: '검색' });

    fireEvent.change(screen.getByRole('textbox', { name: '검색어' }), {
      target: { value: '5월 광고' },
    });
    const linkType = screen.getByRole('group', { name: '이동경로 유형' });
    fireEvent.click(within(linkType).getByRole('checkbox', { name: '외부 경로' }));
    const status = screen.getByRole('group', { name: '게시 상태' });
    fireEvent.click(within(status).getByRole('checkbox', { name: '대기' }));
    fireEvent.click(within(screen.getByRole('form', { name: '검색' })).getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(onSearchChange.mock.calls[0]?.[0]).toEqual({
        keywords: [{ field: 'name', value: '5월 광고' }],
        linkTypes: ['APP'],
        statuses: ['POSTING', 'ENDED'],
      });
    });
  });

  it('초기화는 조건을 비운 URL 로 나가고 검색 전 표식을 만들지 않는다', async () => {
    const { onSearchChange } = renderScreen({ statuses: ['WAITING'] });
    await screen.findByRole('cell', { name: 'Reference 외부 이벤트 배너' });

    fireEvent.click(screen.getByRole('button', { name: '초기화' }));

    expect(onSearchChange).toHaveBeenCalledWith({});
  });

  it('일치하는 결과가 없으면 원문 문구를 보여 준다', async () => {
    renderScreen({ keywords: [{ field: 'name', value: '없는 배너' }] });

    expect(await screen.findByText('일치하는 검색결과가 없습니다.')).toBeInTheDocument();
  });

  it('행을 클릭하면 그 배너의 조회로, 등록을 누르면 등록으로 나간다', async () => {
    const { onActivate, onCreate } = renderScreen();
    fireEvent.click(await screen.findByRole('cell', { name: firstRowName }));
    expect(onActivate).toHaveBeenCalledWith('reference-banner-1');

    fireEvent.click(screen.getByRole('button', { name: '등록' }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('미선택 상태의 변경은 원문 Case01 오류 alert 만 연다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByRole('cell', { name: firstRowName });

    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(await screen.findByText('변경할 항목을 선택해주세요.')).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('선택 + 값 + 확인 → 요청 함수 → 완료 alert, 확인하면 선택이 풀린다 — 원문 Case02', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByRole('cell', { name: firstRowName });

    fireEvent.click(screen.getByRole('checkbox', { name: `${firstRowName} 선택` }));
    await chooseOptionIn('일괄변경 항목', '종료');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('선택 항목을 변경하시겠습니까?');
    expect(log).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('변경되었습니다.'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 배너 일괄 게시 상태 변경'));

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('checkbox', { name: `${firstRowName} 선택` })).not.toBeChecked();
    log.mockRestore();
  });

  it('미리보기는 선택 없이 현재 APP 에 게시 중인 배너만 게시순서대로 쌓는다', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-23T00:00:00.000Z'));
    renderScreen();
    await screen.findByRole('cell', { name: firstRowName });

    fireEvent.click(screen.getByRole('button', { name: '미리보기' }));

    const dialog = await screen.findByRole('dialog', { name: '미리보기' });
    const images = await within(dialog).findAllByRole('img');
    // 게시중 + 오늘이 기간 안: 게시순서 1 인 두 배너(등록일 최신순). 대기·종료·기간 지난 게시중은 빠진다.
    expect(images.map((image) => image.getAttribute('alt'))).toEqual([
      'Reference 콘서트 안내 배너',
      'Reference 5월 광고 배너',
    ]);
    expect(screen.queryByText('변경할 항목을 선택해주세요.')).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: '닫기' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
