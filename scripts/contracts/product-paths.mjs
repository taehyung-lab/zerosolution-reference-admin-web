import { resolve } from 'node:path'

/**
 * 새 문서 체계: 제품 사실의 경로는 포인터 파일이 아니라 이 상수가 소유한다.
 *
 * 옛 체계는 `docs/reference/product.json` 이 inventory·judgment·scenarios·index 네 경로를
 * 가리켰고, 그 넷이 같은 surface 의 사실을 나눠 가져 갱신마다 세 곳이 어긋났다. 지금은 한 surface
 * 의 관찰·정책·미확인을 `product/facts/<ID>.md` 하나가 소유하고, 여러 fact 에 걸친 판독 규칙만
 * `product/policies/` 에 있으며, 색인은 fact frontmatter 에서 생성한다.
 */
export const PRODUCT_PATHS = {
  facts: 'product/facts',
  policies: 'product/policies',
  index: 'product/generated-index.md',
}

/**
 * 옛 이름으로 부르던 소비자를 위한 대응. inventory·judgment·scenarios 는 더 이상 갈라지지 않는다.
 *
 * `policies` 는 여기 들어가지 않는다 — 그것은 **제품 사실이 아니라 판독 절차**라서 대상 제품으로
 * 그대로 이관된다. 제품 사실(fact)은 집에 남고 대상이 자기 원문으로 다시 쓴다.
 */
const legacy = {
  inventory: PRODUCT_PATHS.facts,
  judgment: PRODUCT_PATHS.facts,
  scenarios: PRODUCT_PATHS.facts,
  index: PRODUCT_PATHS.index,
}

export const PRODUCT_POINTER = PRODUCT_PATHS.index

/**
 * 아직 fact 로 옮기지 않은 화면들의 옛 원장. **관찰이 실제로 사는 곳**이라 게이트가 계속 지킨다.
 *
 * 이 값은 은퇴 예정이다 — 마지막 화면이 fact 가 되면 이 상수와 소비자(`scripts/evidence/`,
 * `build-index.mjs` 의 미이관 표, `check.mjs` 의 옛 원장 분기)를 함께 지운다. 그때까지 이 경로를
 * `PRODUCT_PATHS` 와 섞지 않는다: 새 작업은 fact 를 쓰고, 이 원장은 읽기만 한다.
 */
export const LEGACY_LEDGER = {
  inventory: 'docs/reference/zero-sol',
  judgment: 'docs/reference/zero-sol-figma-analysis.md',
  scenarios: 'docs/reference/scenarios',
  index: 'docs/reference/zero-sol/context.json',
}

export function productPaths(root = process.cwd()) {
  void resolve(root)
  return { ...legacy }
}
