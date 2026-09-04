import type { ComponentPropsWithoutRef } from 'react'
/** Owns: semantic table element tokens. Rejects: columns/sort/domain. API: Table and semantic subcomponents. Boundary: primitive markup §promotion. */
export function Table(props: ComponentPropsWithoutRef<'table'>) { return <table {...props} className={`w-full border-collapse text-sm ${props.className ?? ''}`} /> }
export function TableHead(props: ComponentPropsWithoutRef<'th'>) { return <th {...props} className={`border-b bg-neutral-50 p-3 text-left ${props.className ?? ''}`} /> }
export function TableCell(props: ComponentPropsWithoutRef<'td'>) { return <td {...props} className={`border-b p-3 ${props.className ?? ''}`} /> }
