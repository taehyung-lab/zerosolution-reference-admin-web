import { noop } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  managerAgencyOptionsQuery,
  managerTypeOptionsQuery,
} from '@/features/managers/api/queries'
import { ManagerEditScreen } from '@/features/managers/form/ManagerEditScreen'

// 이 폴더에 route.tsx 가 없으므로 조회(index)와 형제 leaf 다. 공유 chrome 이 생길 때만 route.tsx 를 둔다(router.md).
// 옵션 데이터만 진입 시 warm 한다. 수정 대상 조회는 primary data 라 화면이 blocking overlay 로 기다린다.
export const Route = createFileRoute('/_app/managers/$managerId/edit')({
  loader: ({ context: { locale, queryClient } }) => {
    void queryClient.query(managerTypeOptionsQuery(locale)).catch(noop)
    void queryClient.query(managerAgencyOptionsQuery(locale)).catch(noop)
  },
  component: ManagerEditRoute,
})
function ManagerEditRoute() {
  return <ManagerEditScreen managerId={Route.useParams().managerId} />
}
