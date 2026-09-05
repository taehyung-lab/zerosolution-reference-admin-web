import { clearAccessToken, setAccessToken } from '@/api/http/credential';
import { AppProviders, createQueryClient } from '@/app/providers/AppProviders';
import { createAppRouter } from '@/app/router/router';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

beforeEach(() => setAccessToken('member-route-test'));
afterEach(() => clearAccessToken());

function renderAt(path: string) {
  const queryClient = createQueryClient();
  const router = createAppRouter({
    queryClient,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

describe('active member list routes', () => {
  it.each([
    ['/members/active/all', '전체회원'],
    ['/members/active/general', '일반회원'],
    ['/members/active/flagged', '불량회원'],
  ])('renders the separate %s screen identity', async (path, title) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { name: title })).toBeVisible();
    expect(screen.getByText('검색해주세요.')).toBeVisible();
  });

  it('commits the search discriminator to the URL and resets back to pre-search', async () => {
    const router = renderAt('/members/active/all?page=7');
    const filter = await screen.findByRole('form', { name: '검색' });
    fireEvent.click(within(filter).getByRole('button', { name: '검색' }));
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ periodType: 'joinedAt' }),
    );
    fireEvent.click(screen.getByRole('button', { name: '초기화' }));
    await waitFor(() => expect(router.state.location.search).toEqual({}));
  });

  it('navigates registration to the typed placeholder route', async () => {
    const router = renderAt('/members/active/all');
    fireEvent.click(await screen.findByRole('button', { name: '등록' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/members/new'));
    expect(await screen.findByText('회원 등록은 후속 이슈에서 구현합니다.')).toBeVisible();
  });
});
