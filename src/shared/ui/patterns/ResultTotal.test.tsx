import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TestLocaleProvider } from '@/test/locale';
import { ResultTotal } from './ResultTotal';

describe('result total', () => {
  it('distinguishes an unsearched result from a searched zero, retaining the caller position', () => {
    const view = (searched: boolean, total: number) => <TestLocaleProvider><button>toolbar</button><ResultTotal searched={searched} total={total} /><div>content</div></TestLocaleProvider>;
    const { rerender } = render(view(false, 0));
    expect(screen.queryByText(/검색결과/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'toolbar' })).toBeInTheDocument();
    rerender(view(true, 0));
    expect(screen.getByText('검색결과 : 0')).toBeInTheDocument();
    rerender(view(true, 1234));
    expect(screen.getByText('검색결과 : 1,234')).toBeInTheDocument();
    rerender(view(false, 1234));
    expect(screen.queryByText(/검색결과/)).not.toBeInTheDocument();
  });
});
