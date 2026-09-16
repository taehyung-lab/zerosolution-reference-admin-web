import { TestLocaleProvider } from '@/test/locale';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders the title as the single h1 and the caller-owned actions at the end', () => {
    render(
      <PageHeader
        breadcrumbs={["상위", "하위"]}
        title="예시 조회"
        actions={<button type="button">예시 액션</button>}
      />,
      { wrapper: TestLocaleProvider },
    );

    const header = screen.getByRole('banner');
    expect(within(header).getByRole('heading', { level: 1, name: '예시 조회' })).toBeInTheDocument();
    expect(within(header).getByRole('navigation', { name: '현재 위치' })).toBeInTheDocument();
    expect(within(header).getByText('하위')).toHaveAttribute('aria-current', 'page');
    expect(within(header).getByRole('button', { name: '예시 액션' })).toBeInTheDocument();
  });

  it('renders no breadcrumb paragraph when the caller passes none', () => {
    render(<PageHeader title="예시 조회" />, { wrapper: TestLocaleProvider });

    expect(screen.getByRole('heading', { level: 1, name: '예시 조회' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});
