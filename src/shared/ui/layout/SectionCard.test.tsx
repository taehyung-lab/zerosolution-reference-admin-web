import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/shared/i18n/i18n';
import { SectionCard } from './SectionCard';

describe('SectionCard disclosure', () => {
  it('closing the section unmounts its content', () => {
    render(<SectionCard title="운영자정보"><input aria-label="이름" /></SectionCard>);
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '운영자정보' }));
    expect(screen.queryByLabelText('이름')).toBeNull();
  });

  it('keeps closed content mounted but hidden when a form asks for it', () => {
    render(<SectionCard title="운영자정보" keepMounted><input aria-label="이름" /></SectionCard>);
    fireEvent.click(screen.getByRole('button', { name: '운영자정보' }));
    // still in the DOM (registrations survive) but hidden from the accessibility tree
    expect(screen.queryByRole('textbox', { name: '이름' })).toBeNull();
    const input = document.querySelector('input[aria-label="이름"]');
    expect(input).not.toBeNull();
    expect(input?.closest('[hidden]')).not.toBeNull();
    expect(screen.getByRole('button', { name: '운영자정보' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('announces the invalid-field count in the header name while collapsed', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SectionCard title="운영자정보" keepMounted errorCount={2} open={false} onOpenChange={() => undefined}>
          <input aria-label="이름" />
        </SectionCard>
      </I18nextProvider>,
    );
    expect(screen.getByRole('button', { name: '운영자정보 오류 2개' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('lets a caller own the open state so it can reopen the section for its own reason', () => {
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>바깥에서 열기</button>
          <SectionCard title="운영자정보" open={open} onOpenChange={setOpen}>
            <input aria-label="이름" />
          </SectionCard>
        </>
      );
    }
    render(<Controlled />);
    expect(screen.queryByLabelText('이름')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '바깥에서 열기' }));
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '운영자정보' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('reports header toggles to the caller that owns the state', () => {
    const onOpenChange = vi.fn();
    render(
      <SectionCard title="운영자정보" open onOpenChange={onOpenChange}>
        <input aria-label="이름" />
      </SectionCard>,
    );
    fireEvent.click(screen.getByRole('button', { name: '운영자정보' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
