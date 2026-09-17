@AGENTS.md

# Claude Code

역할·경계 계약은 `.agents/skills/{name}/SKILL.md` 가 정본이고, `.claude/skills` 는 그것을 가리키는
심링크다 — **복사본이 아니라 어댑터**라서 정본과 어긋날 수 없다. 런타임이 각 skill 의 `description`
으로 발동하므로 루트가 목록을 다시 세지 않는다.

발동하지 않았는데 필요하다고 판단되면 `Skill` 로 직접 부른다. `description` 이 잘못 갈랐다는 뜻이면
그 `description` 을 고친다 — 루트에 예외를 더하지 않는다.

제품 사실은 `product/` 에 있고 `product-evidence` skill 이 진입을 소유한다.
