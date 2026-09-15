import { DragDropProvider } from '@dnd-kit/react'
import { isSortableOperation, useSortable } from '@dnd-kit/react/sortable'
import { Accessibility, type DragEndEvent, type DragOverEvent, type DragStartEvent } from '@dnd-kit/dom'
import { useMemo, type ReactNode, type RefCallback } from 'react'
import { useTranslation } from 'react-i18next'

export type SortableItemId = string | number

export interface SortableListItemProps<TId extends SortableItemId> {
  readonly id: TId
  readonly index: number
  readonly isDragging: boolean
  readonly itemProps: { readonly ref: RefCallback<HTMLElement> }
  readonly handleProps: { readonly ref: RefCallback<HTMLElement> }
}

export function SortableList<TId extends SortableItemId>({
  items,
  onMove,
  getItemLabel,
  children,
}: {
  readonly items: readonly TId[]
  readonly onMove: (from: number, to: number) => void
  readonly getItemLabel: (id: TId, index: number) => string
  readonly children: (item: SortableListItemProps<TId>) => ReactNode
}) {
  const { t } = useTranslation('shared')
  const accessibility = useMemo(() => Accessibility.configure({
    screenReaderInstructions: { draggable: t('sortable.instructions') },
    announcements: {
      dragstart: ({ operation: { source } }: DragStartEvent) => {
        if (!source) return
        const index = items.findIndex((id) => id === source.id)
        if (index < 0) return
        return t('sortable.pickedUp', { item: getItemLabel(items[index]!, index), position: index + 1 })
      },
      dragover: (event: DragOverEvent) => {
        if (!isSortableOperation(event.operation)) return
        const { source, target } = event.operation
        if (!source || !target || source.id === target.id) return
        const index = items.findIndex((id) => id === source.id)
        if (index < 0) return
        return t('sortable.moved', { item: getItemLabel(items[index]!, index), position: target.index + 1 })
      },
      dragend: (event: DragEndEvent) => {
        const { source } = event.operation
        if (!source) return
        const index = items.findIndex((id) => id === source.id)
        if (index < 0) return
        const item = getItemLabel(items[index]!, index)
        if (event.canceled) return t('sortable.cancelled', { item })
        const targetIndex = isSortableOperation(event.operation)
          ? event.operation.target?.index
          : undefined
        return t('sortable.dropped', { item, position: (targetIndex ?? index) + 1 })
      },
    },
  }), [getItemLabel, items, t])

  return (
    <DragDropProvider
      plugins={(defaults) =>
        defaults.map((plugin) => plugin === Accessibility ? accessibility : plugin)
      }
      onDragEnd={(event) => {
        if (event.canceled || !isSortableOperation(event.operation)) return
        const from = event.operation.source?.initialIndex
        const to = event.operation.target?.index
        if (from === undefined || to === undefined || from === to) return
        onMove(from, to)
      }}
    >
      {items.map((id, index) => (
        <SortableListItem id={id} index={index} key={id}>
          {children}
        </SortableListItem>
      ))}
    </DragDropProvider>
  )
}

function SortableListItem<TId extends SortableItemId>({
  id,
  index,
  children,
}: {
  readonly id: TId
  readonly index: number
  readonly children: (item: SortableListItemProps<TId>) => ReactNode
}) {
  const sortable = useSortable({ id, index })
  const itemRef: RefCallback<HTMLElement> = (element) => sortable.ref(element)
  const handleRef: RefCallback<HTMLElement> = (element) => sortable.handleRef(element)

  return children({
    id,
    index,
    isDragging: sortable.isDragging,
    itemProps: { ref: itemRef },
    handleProps: { ref: handleRef },
  })
}
