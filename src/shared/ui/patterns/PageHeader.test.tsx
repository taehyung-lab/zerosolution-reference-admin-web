import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders the title as the single h1 and the caller-owned actions at the end', () => {
    render(
      <PageHeader
        breadcrumb="회원 > 전체회원"
        title="전체회원 조회"
        actions={<button type="button">SMS 발송</button>}
      />,
    );

    const header = screen.getByRole('banner');
    expect(within(header).getByRole('heading', { level: 1, name: '전체회원 조회' })).toBeInTheDocument();
    expect(within(header).getByText('회원 > 전체회원')).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: 'SMS 발송' })).toBeInTheDocument();
  });

  it('renders no breadcrumb paragraph when the caller passes none', () => {
    render(<PageHeader title="운영자 조회" />);

    expect(screen.getByRole('heading', { level: 1, name: '운영자 조회' })).toBeInTheDocument();
    expect(screen.getByRole('banner').querySelector('p')).toBeNull();
  });
});
