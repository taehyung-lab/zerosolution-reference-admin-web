import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: BootstrapIndex,
})

function BootstrapIndex() {
  return (
    <section>
      <h1 className="text-lg font-semibold">bootstrap ok</h1>
      <p className="mt-2 text-sm text-neutral-600">
        라우터 · QueryClient · 환경변수 검증 · transport 연결만 확인하는 화면입니다. 제품 화면이
        아닙니다.
      </p>
    </section>
  )
}
