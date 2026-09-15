import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionCard } from '../layout/SectionCard';
import { DetailField } from './DetailField';

describe('detail patterns', () => {
  it('composes a semantic field inside a collapsible titled section', () => {
    render(<SectionCard title="Information"><dl><DetailField label="Name">Kim</DetailField></dl></SectionCard>);
    expect(screen.getByText('Kim')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Information' }));
    expect(screen.queryByText('Kim')).not.toBeInTheDocument();
  });
});
