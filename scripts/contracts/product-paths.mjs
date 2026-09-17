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

/** 옛 이름으로 부르던 소비자를 위한 대응. inventory·judgment·scenarios 는 더 이상 갈라지지 않는다. */
const legacy = {
  inventory: PRODUCT_PATHS.facts,
  judgment: `${PRODUCT_PATHS.policies}/evidence.md`,
  scenarios: PRODUCT_PATHS.facts,
  index: PRODUCT_PATHS.index,
}

export const PRODUCT_POINTER = PRODUCT_PATHS.index

export function productPaths(root = process.cwd()) {
  void resolve(root)
  return { ...legacy }
}
