@AGENTS.md

# Claude Code

범위가 확정되기 전의 구현 요청은 `AGENTS.md` §2의 `screen-loop`만 읽는다. 범위가 확정된 뒤에는 그 범위로 라우팅된 프로젝트 스킬만 읽는다. Project skills live at `.agents/skills/{skill-name}/SKILL.md` and are read as files; do not create runtime-specific skill copies.
