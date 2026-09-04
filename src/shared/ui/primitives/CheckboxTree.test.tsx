import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CheckboxTree, type CheckboxTreeNode } from './CheckboxTree';

const flat: CheckboxTreeNode[] = [
  { value: 'ADMIN', label: 'WEB' },
  { value: 'APP', label: 'APP' },
];
const nested: CheckboxTreeNode[] = [
  {
    label: '공연관리',
    children: [
      { value: 'CREATE', label: '등록' },
      { value: 'UPDATE', label: '수정' },
      { value: 'DELETE', label: '삭제' },
    ],
  },
];
const checkbox = (name: string) => screen.getByRole('checkbox', { name });
const isChecked = (name: string) =>
  checkbox(name).getAttribute('aria-checked') === 'true';
const hasMark = (name: string) => {
  const mark = checkbox(name).querySelector('svg');
  return mark !== null && !mark.classList.contains('invisible');
};

describe('CheckboxTree', () => {
  it('expands empty-as-all before deselecting one visible value', () => {
    const onValueChange = vi.fn();
    render(<CheckboxTree nodes={flat} values={[]} onValueChange={onValueChange} selectAllLabel="All" emptyMeansAll />);
    fireEvent.click(checkbox('WEB'));
    expect(onValueChange).toHaveBeenCalledWith(['APP']);
  });

  it.each([
    { values: [], all: false, parent: false },
    { values: ['UPDATE'], all: false, parent: true },
    { values: ['UPDATE', 'DELETE'], all: false, parent: true },
    { values: ['CREATE', 'UPDATE', 'DELETE'], all: true, parent: true },
  ])('checks all only when every leaf is selected and the parent when any is ($values)', ({ values, all, parent }) => {
    render(<CheckboxTree nodes={nested} values={values} onValueChange={vi.fn()} selectAllLabel="All" />);
    expect(isChecked('All')).toBe(all);
    expect(isChecked('공연관리')).toBe(parent);
    expect(hasMark('All')).toBe(all);
    expect(hasMark('공연관리')).toBe(parent);
  });

  it('clears every descendant when a partly selected parent is clicked', () => {
    const onValueChange = vi.fn();
    render(<CheckboxTree nodes={nested} values={['UPDATE']} onValueChange={onValueChange} selectAllLabel="All" />);
    fireEvent.click(checkbox('공연관리'));
    expect(onValueChange).toHaveBeenCalledWith([]);
  });

  it('selects every descendant when an unselected parent is clicked', () => {
    const onValueChange = vi.fn();
    render(<CheckboxTree nodes={nested} values={[]} onValueChange={onValueChange} selectAllLabel="All" />);
    fireEvent.click(checkbox('공연관리'));
    expect(onValueChange).toHaveBeenCalledWith(['CREATE', 'UPDATE', 'DELETE']);
  });
});
