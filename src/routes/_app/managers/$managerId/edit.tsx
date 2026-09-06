import { noop } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import {
  managerAgencyOptionsQuery,
  managerTypeOptionsQuery,
} from '@/features/managers/api/queries';
import { ManagerEditScreen } from '@/features/managers/form/ManagerEditScreen';
import { env } from '@/env';
import { ManagerEditInputScreen } from '@/features/managers/form/ManagerInputScreens';
import {
  findManagerFixture,
  managerOptionFixtures,
} from '@/features/managers/fixtures/managers';
import { toManagerEditDefaults } from '@/features/managers/form/manager-form-defaults';
import { useState } from 'react';
import { DevelopmentNotice } from '@/app/shell/DevelopmentNotice';

// 이 폴더에 route.tsx 가 없으므로 조회(index)와 형제 leaf 다. 공유 chrome 이 생길 때만 route.tsx 를 둔다(router.md).
// 옵션 데이터만 진입 시 warm 한다. 수정 대상 조회는 primary data 라 화면이 blocking overlay 로 기다린다.
export const Route = createFileRoute('/_app/managers/$managerId/edit')({
  loader: ({ context: { locale, queryClient } }) => {
    if (env.VITE_REFERENCE_SCENARIOS) return;
    void queryClient.query(managerTypeOptionsQuery(locale)).catch(noop);
    void queryClient.query(managerAgencyOptionsQuery(locale)).catch(noop);
  },
  component: ManagerEditRoute,
});
function ManagerEditRoute() {
  const { managerId } = Route.useParams();
  const [ready, setReady] = useState(false);
  if (env.VITE_REFERENCE_SCENARIOS) {
    const record = findManagerFixture(managerId);
    if (!record) {
      notFound({ throw: true });
      return null;
    }
    // TRANSPLANT_PENDING_MANAGER_EDIT_INPUT: the callback is the product API connection point.
    return (<>
      <DevelopmentNotice ready={ready} />
      <ManagerEditInputScreen
        managerId={managerId}
        defaults={toManagerEditDefaults(record.detail)}
        optionsForType={managerOptionFixtures}
        onConfirm={() => setReady(true)}
      />
    </>);
  }
  return <ManagerEditScreen managerId={managerId} />;
}
