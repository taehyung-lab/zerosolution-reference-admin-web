import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { PerformanceDetailScreen } from './PerformanceDetailScreen';

function setup(id = 'reference-performance-1') {
  const onEdit = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <PerformanceDetailScreen performanceId={id} onEdit={onEdit} />
    </TestQueryLocaleProvider>,
  );
  return { onEdit };
}

describe('PerformanceDetailScreen (5.2 공연 조회)', () => {
  it('등록된 입장안내와 도면 다운로드, 안전한 업데이트 줄을 보여 준다', async () => {
    setup('reference-performance-2');
    const drawing = await screen.findByRole('link', { name: 'reference-admission.txt' });
    expect(drawing).toHaveAttribute('download', 'reference-admission.txt');
    expect(screen.queryByText('등록된 정보가 없습니다.')).toBeNull();
    expect(screen.getByText('Reference Gate A')).toBeVisible();
    expect(screen.getByText('Reference Area A')).toBeVisible();
    const history = screen.getByRole('region', { name: '업데이트 내역' });
    expect(within(history).getByText('안내 도면: - > reference-admission.txt')).toBeVisible();
    expect(within(history).getByText('Reference Operator (reference-operator)')).toBeVisible();
  });

  it('직접 진입하고, 번역 내용은 UI locale 과 별개의 탭이 고르며, 수정은 정확한 ID 로 나간다', async () => {
    const { onEdit } = setup();
    expect(await screen.findByRole('heading', { name: '공연 조회' })).toBeVisible();
    expect(await screen.findByText('등록된 정보가 없습니다.')).toBeVisible();
    expect(screen.getByText('Reference Performance 1')).toBeVisible();

    fireEvent.mouseDown(screen.getByRole('tab', { name: '일본어' }), { button: 0 });
    expect(await screen.findByRole('tabpanel', { name: '일본어' })).toHaveTextContent('Reference Performance 1 (JA)');
    expect(screen.queryByText('Reference Performance 1')).toBeNull();
    expect(screen.getByText('Reference Sound Check')).toBeVisible();
    expect(screen.getByText('Reference Hall A')).toBeVisible();
    expect(screen.getByText('Reference Grade A, Reference Grade B')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    expect(onEdit).toHaveBeenCalledWith('reference-performance-1');
    fireEvent.click(screen.getByRole('button', { name: '기본정보' }));
    expect(screen.queryByRole('tabpanel')).toBeNull();
  });

  it('없는 ID 는 제목은 남기고 not-found 문구로 닫으며 수정은 없다', async () => {
    setup('missing');
    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeVisible();
    expect(screen.getByRole('heading', { name: '공연 조회' })).toBeVisible();
    expect(screen.queryByRole('button', { name: '수정' })).toBeNull();
  });
});
