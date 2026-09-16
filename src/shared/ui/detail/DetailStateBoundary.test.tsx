import { fireEvent, render as renderBare, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { i18n } from '@/shared/i18n/i18n';
import { DetailStateBoundary, type DetailQueryFacts } from './DetailStateBoundary';

const I18n = ({ children }: { readonly children: ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);
const render = (ui: ReactElement) => renderBare(ui, { wrapper: I18n });

type Record = { readonly name: string };
const ready: DetailQueryFacts<Record> = {
  data: { name: 'Record A' },
  state: 'ready',
  error: undefined,
  retry: () => Promise.resolve(),
};
const facts = (over: Partial<DetailQueryFacts<Record>>): DetailQueryFacts<Record> => ({
  ...ready,
  ...over,
});

describe('DetailStateBoundary', () => {
  it('renders the record through the child function only when data is present', () => {
    const { rerender } = render(
      <DetailStateBoundary query={ready}>{(data) => <p>{data.name}</p>}</DetailStateBoundary>,
    );
    expect(screen.getByText('Record A')).toBeInTheDocument();

    rerender(
      <DetailStateBoundary query={facts({ data: undefined })}>
        {(data) => <p>{data.name}</p>}
      </DetailStateBoundary>,
    );
    expect(screen.queryByText('Record A')).not.toBeInTheDocument();
  });

  it('says not found with shared copy', () => {
    render(
      <DetailStateBoundary query={facts({ data: undefined, state: "notFound" })}>
        {(data) => <p>{data.name}</p>}
      </DetailStateBoundary>,
    );
    expect(screen.getByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument();
  });

  it('announces the error kind, offers retry, and shows the trace', () => {
    const retry = vi.fn(() => Promise.resolve());
    render(
      <DetailStateBoundary
        query={facts({
          data: undefined,
          state: "error",
          error: { kind: "timeout", requestId: "req-1" },
          retry,
        })}
      >
        {(data) => <p>{data.name}</p>}
      </DetailStateBoundary>,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('요청 시간이 초과되었습니다. 다시 시도해 주세요.');
    expect(alert).toHaveTextContent('req-1');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
