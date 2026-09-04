// 부정 대조군: shared 는 Query 를 알 수 없다. feature 가 Query 상태를 plain facts 로 바꿔 넘긴다.
import { useQuery } from '@tanstack/react-query'

export const gate = useQuery
