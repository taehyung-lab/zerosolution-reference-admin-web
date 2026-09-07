import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InlineSearchSelect } from './InlineSearchSelect';

describe('InlineSearchSelect', () => {
  it('offers matching candidates, returns one value and requires clearing before another choice', () => {
    const onValueChange = vi.fn();
    const onSearchValueChange = vi.fn();
    const props = {
      value: undefined as string | undefined,
      selectedLabel: '',
      searchValue: ' alp ',
      options: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }],
      onValueChange, onSearchValueChange,
      searchLabel: 'Find item', placeholder: 'Find item', clearLabel: 'Clear item',
    };
    const { rerender } = render(<InlineSearchSelect {...props} />);
    expect(screen.queryByRole('button', { name: 'Beta' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(onValueChange).toHaveBeenLastCalledWith('a');
    expect(onSearchValueChange).toHaveBeenLastCalledWith('');
    rerender(<InlineSearchSelect {...props} value="a" selectedLabel="Alpha" searchValue="" />);
    expect(screen.getByRole('textbox', { name: 'Find item' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Clear item' }));
    expect(onValueChange).toHaveBeenLastCalledWith(undefined);
    rerender(<InlineSearchSelect {...props} searchValue="" />);
    expect(screen.getByRole('textbox', { name: 'Find item' })).toBeEnabled();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps the caller-owned selected label and clear action when options do not contain the selection', () => {
    const onValueChange = vi.fn();
    render(<InlineSearchSelect value="selected" selectedLabel="Existing item" options={[]} searchValue=""
      onValueChange={onValueChange} onSearchValueChange={vi.fn()}
      searchLabel="Find item" placeholder="Find item" clearLabel="Clear item" />);
    expect(screen.getByText('Existing item')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear item' }));
    expect(onValueChange).toHaveBeenCalledWith(undefined);
  });
});
