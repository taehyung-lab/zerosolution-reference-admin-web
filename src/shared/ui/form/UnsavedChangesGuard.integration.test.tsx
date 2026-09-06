import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { revalidateLogic, useForm, useSelector } from '@tanstack/react-form';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router';
import { useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/shared/i18n/i18n';
import { describe, expect, it } from 'vitest';
import { Dialog } from '../primitives/Dialog';
import { FormTextField } from './FormTextField';
import { useUnsavedChangesGuard } from './UnsavedChangesGuard';

function Editor({ onClose }: { readonly onClose: () => void }) {
  const form = useForm({ defaultValues: { content: '' }, validationLogic: revalidateLogic() });
  const dirty = useSelector(form.store, (state) => state.isDirty && !state.isDefaultValue);
  const guard = useUnsavedChangesGuard({ when: dirty });
  return <>
    <Dialog open title="editor" closeLabel="close editor" onOpenChange={(open) => { if (!open) guard.close(onClose); }}>
      <FormTextField form={form} name="content" label="content" />
      <button type="button" onClick={() => guard.close(onClose)}>cancel editor</button>
    </Dialog>
    {guard.dialog}
  </>;
}

function Page() {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)}>open editor</button>
    {open ? <Editor onClose={() => setOpen(false)} /> : null}
  </>;
}

function renderPage() {
  const root = createRootRoute({ component: Outlet });
  const editor = createRoute({ getParentRoute: () => root, path: '/editor', component: Page });
  const done = createRoute({ getParentRoute: () => root, path: '/done', component: () => <h1>done</h1> });
  const router = createRouter({
    routeTree: root.addChildren([editor, done]),
    history: createMemoryHistory({ initialEntries: ['/editor'] }),
  });
  render(<I18nextProvider i18n={i18n}><RouterProvider router={router} /></I18nextProvider>);
  return router;
}

async function openEditor() {
  const opener = await screen.findByRole('button', { name: 'open editor' });
  opener.focus();
  fireEvent.click(opener);
  return screen.findByRole('textbox', { name: /content/ });
}

describe('dirty dialog with real Router and Form', () => {
  it.each(['cancel', 'close', 'escape'] as const)('%s asks without unmounting input; keep restores input and focus', async (method) => {
    renderPage();
    const input = await openEditor();
    fireEvent.change(input, { target: { value: 'unsaved message' } });
    const cancel = screen.getByRole('button', { name: 'cancel editor' });
    cancel.focus();
    if (method === 'cancel') fireEvent.click(cancel);
    if (method === 'close') fireEvent.click(screen.getByRole('button', { name: 'close editor' }));
    if (method === 'escape') fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    const question = await screen.findByRole('dialog', { name: '알림' });
    expect(question).toHaveTextContent('입력을 취소하시겠습니까?');
    expect(input).toHaveValue('unsaved message');
    fireEvent.click(within(question).getByRole('button', { name: '취소' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '알림' })).toBeNull());
    expect(input).toHaveValue('unsaved message');
    await waitFor(() => expect(cancel).toHaveFocus());
    fireEvent.click(cancel);
    fireEvent.click(within(await screen.findByRole('dialog', { name: '알림' })).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(screen.getByRole('button', { name: 'open editor' })).toHaveFocus());
  });

  it('guards route navigation while the popup has unsaved input', async () => {
    const router = renderPage();
    const input = await openEditor();
    fireEvent.change(input, { target: { value: 'keep me' } });
    router.history.push('/done');
    const question = await screen.findByRole('dialog', { name: '알림' });
    expect(question).toHaveTextContent('화면으로 이동하시겠습니까?');
    fireEvent.click(within(question).getByRole('button', { name: '취소' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '알림' })).toBeNull());
    expect(router.state.location.pathname).toBe('/editor');
    expect(input).toHaveValue('keep me');
    router.history.push('/done');
    fireEvent.click(within(await screen.findByRole('dialog', { name: '알림' })).getByRole('button', { name: '확인' }));
    await screen.findByRole('heading', { name: 'done' });
    expect(router.state.location.pathname).toBe('/done');
  });
});
