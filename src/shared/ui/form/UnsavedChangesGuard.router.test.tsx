import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import {
  createBrowserHistory,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { TestLocaleProvider } from '@/test/locale';
import { UnsavedChangesProvider, useUnsavedChangesGuard } from './UnsavedChangesGuard';

function Form({ name, onLeave }: { readonly name: string; readonly onLeave?: () => void }) {
  const [value, setValue] = useState('');
  const [pending, setPending] = useState(false);
  const guard = useUnsavedChangesGuard({ when: value !== '', refuseSilently: pending });
  return (
    <>
      <input aria-label={name} value={value} onChange={(event) => setValue(event.target.value)} />
      <button onClick={() => guard.close(() => setValue(''))}>close {name}</button>
      <button onClick={() => setPending(!pending)}>pending {name}</button>
      {onLeave && <button onClick={() => guard.leave(onLeave)}>leave {name}</button>}
      {guard.dialog}
    </>
  );
}

const cleanupHistory: (() => void)[] = [];
afterEach(() => {
  cleanupHistory.splice(0).forEach((cleanup) => cleanup());
});

function setup(browser = false) {
  if (browser) window.history.replaceState(null, '', '/form');
  const history = browser
    ? createBrowserHistory()
    : createMemoryHistory({ initialEntries: ['/form'] });
  cleanupHistory.push(() => history.destroy());
  function Page() {
    const [second, setSecond] = useState(true);
    return (
      <>
        <Form name="first" onLeave={() => history.push('/done')} />
        {second && <Form name="second" />}
        <button onClick={() => setSecond(false)}>unmount second</button>
        <button onClick={() => history.push('/done')}>navigate</button>
      </>
    );
  }
  const root = createRootRoute({
    component: () => (
      <UnsavedChangesProvider>
        <Outlet />
      </UnsavedChangesProvider>
    ),
  });
  const form = createRoute({ getParentRoute: () => root, path: '/form', component: Page });
  const done = createRoute({
    getParentRoute: () => root,
    path: '/done',
    component: () => <h1>done</h1>,
  });
  const router = createRouter({ routeTree: root.addChildren([form, done]), history });
  render(
    <TestLocaleProvider>
      <RouterProvider router={router} />
    </TestLocaleProvider>,
  );
  return router;
}

const dirty = (name: string) =>
  fireEvent.change(screen.getByRole('textbox', { name }), { target: { value: 'draft' } });
const answer = (name: string) =>
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name }));

describe('route guard with multiple form owners', () => {
  it('uses cancel copy for an explicit leave and does not bypass another form dirty fact', async () => {
    setup();
    await screen.findByRole('textbox', { name: 'first' });
    dirty('second');
    fireEvent.click(screen.getByRole('button', { name: 'leave first' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('입력을 취소하시겠습니까?');
    answer('확인');
    await screen.findByRole('heading', { name: 'done' });
  });
  it('asks once for two dirty forms, preserves both on cancel and leaves after one confirmation', async () => {
    setup();
    await screen.findByRole('textbox', { name: 'first' });
    dirty('first');
    dirty('second');
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));
    await screen.findByRole('dialog');
    answer('취소');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('textbox', { name: 'first' })).toHaveValue('draft');
    expect(screen.getByRole('textbox', { name: 'second' })).toHaveValue('draft');
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));
    await screen.findByRole('dialog');
    answer('확인');
    await screen.findByRole('heading', { name: 'done' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('local cancel preserves both drafts and local confirm discards only its own form', async () => {
    setup();
    await screen.findByRole('textbox', { name: 'first' });
    dirty('first');
    dirty('second');
    fireEvent.click(screen.getByRole('button', { name: 'close second' }));
    answer('취소');
    expect(screen.getByRole('textbox', { name: 'second' })).toHaveValue('draft');
    fireEvent.click(screen.getByRole('button', { name: 'close second' }));
    answer('확인');
    expect(screen.getByRole('textbox', { name: 'second' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'first' })).toHaveValue('draft');
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));
    await screen.findByRole('dialog');
    answer('확인');
    await screen.findByRole('heading', { name: 'done' });
  });

  it('refuses route and owning local dismiss silently while pending, then permits retry', async () => {
    const router = setup();
    await screen.findByRole('textbox', { name: 'first' });
    dirty('first');
    dirty('second');
    fireEvent.click(screen.getByRole('button', { name: 'pending second' }));
    fireEvent.click(screen.getByRole('button', { name: 'close second' }));
    expect(screen.getByRole('textbox', { name: 'second' })).toHaveValue('draft');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'navigate' }));
      await Promise.resolve();
    });
    expect(router.state.location.pathname).toBe('/form');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'pending second' }));
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));
    await screen.findByRole('dialog');
    answer('확인');
    await screen.findByRole('heading', { name: 'done' });
  });

  it('unregisters dirty and pending facts when their form unmounts', async () => {
    setup();
    await screen.findByRole('textbox', { name: 'first' });
    dirty('second');
    fireEvent.click(screen.getByRole('button', { name: 'pending second' }));
    fireEvent.click(screen.getByRole('button', { name: 'unmount second' }));
    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));
    await screen.findByRole('heading', { name: 'done' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('browser beforeunload is prevented only while registered dirty input exists', async () => {
    setup(true);
    await screen.findByRole('textbox', { name: 'first' });
    const unload = () => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(unload()).toBe(false);
    dirty('first');
    dirty('second');
    expect(unload()).toBe(true);
    fireEvent.change(screen.getByRole('textbox', { name: 'first' }), { target: { value: '' } });
    expect(unload()).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'unmount second' }));
    expect(unload()).toBe(false);
  });
});
