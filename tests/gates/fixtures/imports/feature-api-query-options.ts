import { queryOptions } from '@tanstack/react-query'

export const gateQuery = queryOptions({ queryKey: ['gate'], queryFn: () => Promise.resolve('gate') })
