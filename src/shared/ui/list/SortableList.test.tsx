import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TestLocaleProvider } from '@/test/locale'
import { SortableList } from './SortableList'

const dnd = vi.hoisted(() => ({
  onDragEnd: undefined as undefined | ((event: unknown) => void),
  announcements: undefined as undefined | {
    readonly dragend: (event: unknown) => string | undefined
  },
}))

vi.mock('@dnd-kit/dom', () => ({
  Accessibility: {
    configure: (configuration: unknown) => {
      dnd.announcements = (configuration as { announcements: typeof dnd.announcements }).announcements
      return { configuration }
    },
  },
}))

vi.mock('@dnd-kit/react', () => ({
  DragDropProvider: ({ children, onDragEnd }: {
    children: React.ReactNode
    onDragEnd: (event: unknown) => void
  }) => {
    dnd.onDragEnd = onDragEnd
    return children
  },
}))

vi.mock('@dnd-kit/react/sortable', () => ({
  isSortableOperation: () => true,
  useSortable: () => ({ isDragging: false, ref: vi.fn(), handleRef: vi.fn() }),
}))

describe('SortableList', () => {
  it('renders stable items and reports sortable index changes', () => {
    const onMove = vi.fn()
    render(
      <SortableList items={['a', 'b', 'c']} onMove={onMove} getItemLabel={(id) => id}>
        {({ id, index, itemProps, handleProps }) => (
          <div {...itemProps} data-index={index}>
            {id}<button {...handleProps} type="button">move</button>
          </div>
        )}
      </SortableList>,
    )

    expect(screen.getAllByRole('button')).toHaveLength(3)
    dnd.onDragEnd?.({
      canceled: false,
      operation: { source: { initialIndex: 0 }, target: { index: 1 } },
    })

    expect(onMove).toHaveBeenCalledWith(0, 1)
  })

  it.each([
    ['a canceled drag', { canceled: true, operation: {} }],
    ['the original position', {
      canceled: false,
      operation: { source: { initialIndex: 1 }, target: { index: 1 } },
    }],
  ])('does not report a move for %s', (_, event) => {
    const onMove = vi.fn()
    render(
      <SortableList items={['a', 'b']} onMove={onMove} getItemLabel={(id) => id}>
        {({ id, itemProps }) => <div {...itemProps}>{id}</div>}
      </SortableList>,
    )

    dnd.onDragEnd?.(event)

    expect(onMove).not.toHaveBeenCalled()
  })

  it('announces cancellation and the original position without a sortable target', () => {
    render(
      <TestLocaleProvider>
        <SortableList items={['internal-a']} onMove={vi.fn()} getItemLabel={() => '첫 번째 카테고리'}>
          {({ id, itemProps }) => <div {...itemProps}>{id}</div>}
        </SortableList>
      </TestLocaleProvider>,
    )

    const source = { id: 'internal-a' }
    expect(dnd.announcements?.dragend({ canceled: true, operation: { source, target: null } }))
      .toContain('첫 번째 카테고리 항목의 순서 변경을 취소했습니다.')
    expect(dnd.announcements?.dragend({ canceled: false, operation: { source, target: null } }))
      .toContain('첫 번째 카테고리 항목을 1번째에 놓았습니다.')
  })
})
