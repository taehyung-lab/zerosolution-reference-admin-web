import { describe, expect, it } from 'vitest'
import { factIndexFailures } from './build-index.mjs'

const fact = (id, extra = '') => ({
  file: `${id}.md`,
  text: `---\nid: ${id}\ntitle: 제목\nrole: list\nstatus: 관찰됨\n${extra}---\n\n본문\n`,
})

describe('fact 집합의 정합성', () => {
  it('정상 fact 는 통과한다', () => {
    expect(factIndexFailures([fact('A'), fact('B')]).errors).toEqual([])
  })

  it('없는 fact 를 related 로 가리키면 실패한다', () => {
    // 대조군: 손으로 쓴 색인 시절 dangling 참조를 잡던 판단이 여기로 옮겨 왔다.
    expect(factIndexFailures([fact('A', 'related: [GONE]\n')]).errors).toEqual([
      'A.md: related 의 GONE 를 가진 fact 가 없다',
    ])
  })

  it('파일 이름과 id 가 다르면 실패한다', () => {
    expect(factIndexFailures([{ ...fact('A'), file: 'B.md' }]).errors).toContain(
      'B.md: 파일 이름이 id(A) 와 다르다. id 는 불변이며 파일 이름이 그것을 따른다',
    )
  })

  it('모르는 role·status 와 빠진 필수 항목을 잡는다', () => {
    const broken = { file: 'C.md', text: '---\nid: C\ntitle: 제목\nrole: 몰라\nstatus: 이상함\n---\n\n본문\n' }
    expect(factIndexFailures([broken]).errors).toEqual([
      'C.md: 모르는 role "몰라"',
      'C.md: 모르는 status "이상함"',
    ])
  })

  it('frontmatter 가 없으면 실패한다', () => {
    expect(factIndexFailures([{ file: 'D.md', text: '# 제목만 있다\n' }]).errors).toEqual([
      'D.md: frontmatter 가 없다',
    ])
  })

  it('보류는 같은 fact의 미확인 번호를 가리킨다', () => {
    const valid = fact('A')
    valid.text += '\n## 미확인\n\n| # | 무엇 |\n| --- | --- |\n| 1 | 정책 |\n\n## 보류\n\n- 미확인 1 때문에 생략\n'
    expect(factIndexFailures([valid]).errors).toEqual([])

    const invalid = fact('B')
    invalid.text += '\n## 미확인\n\n| # | 무엇 |\n| --- | --- |\n| 1 | 정책 |\n\n## 보류\n\n- 미확인 2 때문에 생략\n'
    expect(factIndexFailures([invalid]).errors).toContain('B.md: 보류가 존재하지 않는 미확인 2를 가리킨다')
  })

  it('현재 코드 구현 서술은 fact에 두지 않는다', () => {
    const narrated = fact('A')
    narrated.text += '\n## 현재 코드\n\n화면이 구현돼 있다.\n'
    expect(factIndexFailures([narrated]).errors).toContain('A.md: 현재 코드 절 대신 근거가 있는 보류만 남긴다')
  })
})
