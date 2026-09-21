import { mkdtempSync, mkdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { declaredVerifierPaths, resolveVerifierPaths, runVerifierPaths } from './check-values.mjs'

const testDir = dirname(fileURLToPath(import.meta.url))
const runnerPath = join(testDir, 'check-values.mjs')

const fact = (file, verify) => ({
  file,
  text: `---\nid: X\ntitle: X\nrole: policy\nstatus: 관찰됨\nchecks:\n  - id: x\n    verify: ${verify}\n---\n`,
})

const rootWithVerifyDir = () => {
  const root = mkdtempSync(join(tmpdir(), 'fact-values-'))
  mkdirSync(join(root, 'scripts/verify'), { recursive: true })
  return root
}

const writeFact = (root, file, verify) => {
  mkdirSync(join(root, 'product/facts'), { recursive: true })
  writeFileSync(join(root, 'product/facts', file), fact(file, verify).text)
}

describe('fact verifier 허용 경계', () => {
  it('첫 frontmatter의 checks 항목 verify만 순서대로 읽는다', () => {
    const text = [
      '---',
      'id: X',
      'metadata:',
      '  verify: scripts/verify/metadata.mjs',
      'checks:',
      '  - verify: scripts/verify/first.mjs',
      '  - id: second',
      '    verify: scripts/verify/second.mjs',
      '---',
      '본문 설명:',
      '  verify: scripts/verify/body.mjs',
      '```yaml',
      'checks:',
      '  - verify: scripts/verify/fenced.mjs',
      '```',
      '',
    ].join('\n')

    expect(declaredVerifierPaths([{ file: 'X.md', text }])).toEqual([
      { file: 'X.md', path: 'scripts/verify/first.mjs' },
      { file: 'X.md', path: 'scripts/verify/second.mjs' },
    ])
  })

  it('checks 안의 blank와 column-zero comment 뒤 verifier를 계속 읽는다', () => {
    const text = [
      '---',
      'id: X',
      'checks:',
      '# 첫 check 전 주석',
      '',
      '  - verify: scripts/verify/first.mjs',
      '',
      '# check 사이 주석',
      '  - id: second',
      '    verify: scripts/verify/second.mjs',
      '---',
      '',
    ].join('\n')

    expect(declaredVerifierPaths([{ file: 'X.md', text }])).toEqual([
      { file: 'X.md', path: 'scripts/verify/first.mjs' },
      { file: 'X.md', path: 'scripts/verify/second.mjs' },
    ])
  })

  it('inline comment가 있는 checks와 여분 공백 list item의 verifier를 CLI까지 실행한다', () => {
    const root = rootWithVerifyDir()
    const text = [
      '---',
      'id: X',
      'checks: # active checks',
      '  -   id: first',
      '    verify: scripts/verify/failing.mjs',
      '---',
      '',
    ].join('\n')
    mkdirSync(join(root, 'product/facts'), { recursive: true })
    writeFileSync(join(root, 'product/facts/X.md'), text)
    writeFileSync(join(root, 'scripts/verify/failing.mjs'), 'process.exit(1)\n')

    expect(declaredVerifierPaths([{ file: 'X.md', text }])).toEqual([
      { file: 'X.md', path: 'scripts/verify/failing.mjs' },
    ])

    const result = spawnSync(process.execPath, [runnerPath], { cwd: root, encoding: 'utf8' })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('✗ scripts/verify/failing.mjs: verifier exit 1')
  })

  it('인식할 수 없는 checks 선언은 parse error로 실패한다', () => {
    const root = rootWithVerifyDir()
    const entry = {
      file: 'X.md',
      text: '---\nid: X\nchecks: # active checks\n  verify: scripts/verify/failing.mjs\n---\n',
    }

    expect(resolveVerifierPaths([entry], root).errors).toEqual([
      'X.md: checks 선언을 해석할 수 없다 → checks 항목은 목록이어야 한다',
    ])
  })

  it('scalar checks 선언은 verifier가 없더라도 parse error로 실패한다', () => {
    const root = rootWithVerifyDir()
    const entry = { file: 'X.md', text: '---\nid: X\nchecks: []\n---\n' }

    expect(resolveVerifierPaths([entry], root).errors).toEqual([
      'X.md: checks 선언을 해석할 수 없다 → checks 선언 형식을 해석할 수 없다',
    ])
  })

  it('모든 fact의 선언 순서를 보존하고 중복은 한 번만 실행한다', () => {
    const root = rootWithVerifyDir()
    writeFileSync(join(root, 'scripts/verify/a.mjs'), '')
    writeFileSync(join(root, 'scripts/verify/b.mjs'), '')
    const entries = [
      fact('A.md', 'scripts/verify/a.mjs'),
      fact('B.md', 'scripts/verify/b.mjs'),
      fact('C.md', 'scripts/verify/a.mjs'),
    ]

    expect(declaredVerifierPaths(entries)).toEqual([
      { file: 'A.md', path: 'scripts/verify/a.mjs' },
      { file: 'B.md', path: 'scripts/verify/b.mjs' },
      { file: 'C.md', path: 'scripts/verify/a.mjs' },
    ])
    expect(resolveVerifierPaths(entries, root).paths).toEqual([
      realpathSync(join(root, 'scripts/verify/a.mjs')),
      realpathSync(join(root, 'scripts/verify/b.mjs')),
    ])
  })

  it.each([
    '../outside.mjs',
    'scripts/product/build-index.mjs',
    'scripts/verify/a.sh',
    'scripts/verify/a.mjs --flag',
  ])('대조군 — %s 는 실행 경계 밖이다', (verify) => {
    const root = rootWithVerifyDir()
    expect(resolveVerifierPaths([fact('X.md', verify)], root).errors).not.toEqual([])
  })

  it('없는 파일과 디렉터리를 거부한다', () => {
    const root = rootWithVerifyDir()
    mkdirSync(join(root, 'scripts/verify/directory.mjs'))

    const errors = resolveVerifierPaths([
      fact('MISSING.md', 'scripts/verify/missing.mjs'),
      fact('DIRECTORY.md', 'scripts/verify/directory.mjs'),
    ], root).errors

    expect(errors).toHaveLength(2)
    expect(errors.join('\n')).toContain('missing.mjs')
    expect(errors.join('\n')).toContain('directory.mjs')
  })

  it('대조군 — scripts/verify 안의 symlink가 밖으로 나가면 거부한다', () => {
    const root = rootWithVerifyDir()
    writeFileSync(join(root, 'outside.mjs'), '')
    symlinkSync(join(root, 'outside.mjs'), join(root, 'scripts/verify/escape.mjs'))

    expect(resolveVerifierPaths([fact('X.md', 'scripts/verify/escape.mjs')], root).errors).not.toEqual([])
  })

  it('대조군 — scripts/verify directory symlink가 repository 밖이면 거부한다', () => {
    const root = mkdtempSync(join(tmpdir(), 'fact-values-'))
    const outside = mkdtempSync(join(tmpdir(), 'fact-values-outside-'))
    mkdirSync(join(root, 'scripts'), { recursive: true })
    writeFileSync(join(outside, 'runner.mjs'), '')
    symlinkSync(outside, join(root, 'scripts/verify'))

    expect(resolveVerifierPaths([fact('X.md', 'scripts/verify/runner.mjs')], root).errors).not.toEqual([])
  })

  it('대조군 — .mjs alias의 canonical target이 .js면 거부한다', () => {
    const root = rootWithVerifyDir()
    writeFileSync(join(root, 'scripts/verify/payload.js'), '')
    symlinkSync('payload.js', join(root, 'scripts/verify/alias.mjs'))

    expect(resolveVerifierPaths([fact('X.md', 'scripts/verify/alias.mjs')], root).errors).not.toEqual([])
  })

  it('Node 직접 실행 중 첫 verifier가 non-zero여도 다음 verifier를 실행한다', () => {
    const calls = []
    const spawn = (command, args, options) => {
      calls.push({ command, args, options })
      return { status: args[0].endsWith('a.mjs') ? 1 : 0, error: undefined }
    }

    const errors = runVerifierPaths([
      '/repo/scripts/verify/a.mjs',
      '/repo/scripts/verify/b.mjs',
    ], { root: '/repo', spawn })

    expect(calls).toHaveLength(2)
    expect(calls[1].args).toEqual(['/repo/scripts/verify/b.mjs'])
    expect(calls.every((call) => (
      call.command === process.execPath
      && call.args.length === 1
      && call.options.cwd === '/repo'
      && call.options.shell === false
    ))).toBe(true)
    expect(errors).toEqual(['scripts/verify/a.mjs: verifier exit 1'])
  })

  it('spawn error를 verifier 오류로 반환한다', () => {
    const errors = runVerifierPaths(['/repo/scripts/verify/a.mjs'], {
      root: '/repo',
      spawn: () => ({ status: null, error: new Error('spawn failed') }),
    })

    expect(errors).toEqual(['scripts/verify/a.mjs: verifier 실행 실패 → spawn failed'])
  })

  it('CLI가 모든 fact verifier를 실행하고 실패 exit code를 반영한다', () => {
    const root = rootWithVerifyDir()
    writeFact(root, 'A.md', 'scripts/verify/a.mjs')
    writeFact(root, 'B.md', 'scripts/verify/b.mjs')
    writeFileSync(join(root, 'scripts/verify/a.mjs'), "console.log('a ran')\n")
    writeFileSync(join(root, 'scripts/verify/b.mjs'), 'process.exit(1)\n')

    const result = spawnSync(process.execPath, [runnerPath], { cwd: root, encoding: 'utf8' })

    expect(result.status).toBe(1)
    expect(result.stdout).toContain('a ran')
    expect(result.stderr).toContain('✗ scripts/verify/b.mjs: verifier exit 1')
  })

  it('CLI가 실제 선언 verifier가 모두 성공하면 zero로 끝난다', () => {
    const root = rootWithVerifyDir()
    writeFact(root, 'A.md', 'scripts/verify/a.mjs')
    writeFileSync(join(root, 'scripts/verify/a.mjs'), "console.log('a ran')\n")

    const result = spawnSync(process.execPath, [runnerPath], { cwd: root, encoding: 'utf8' })

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('a ran')
    expect(result.stderr).toBe('')
  })
})
