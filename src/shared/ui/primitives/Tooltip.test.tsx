import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { Tooltip } from './Tooltip';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('Tooltip', () => {
  it('associates content on focus and closes it with Escape', async () => {
    render(
      <Tooltip content="Active members help">
        <button type="button">Help</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'Help' });
    fireEvent.focus(trigger);
    const tooltip = await screen.findByRole('tooltip');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
    expect(tooltip).toHaveTextContent('Active members help');

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
