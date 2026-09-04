import { describe, expect, it } from 'vitest'
import { managerCreateDefaults, toManagerEditDefaults } from './manager-form-defaults'
import { toManagerCreateRequest, toManagerUpdateRequest } from './manager-form-request'
import {
  managerCreateSchema,
  managerEditSchema,
  type ManagerCreateInput,
  type ManagerEditInput,
} from './manager-form-schema'

const validCreate: ManagerCreateInput = {
  type: 'INTERNAL',
  agencyId: '',
  permissionId: '1',
  id: 'operator01',
  password: 'Passw0rd!',
  passwordConfirm: 'Passw0rd!',
  name: '김맹맹',
  phone: '010-1234-1234',
  email: 'operator@example.com',
  organization: '부스터랩',
}

const validEdit: ManagerEditInput = {
  type: 'INTERNAL',
  agencyId: '',
  permissionId: '1',
  name: '김맹맹',
  phone: '010-1234-1234',
  email: 'operator@example.com',
  organization: '부스터랩',
}

describe('create/edit 스키마 비대칭', () => {
  it('등록 스키마만 아이디와 비밀번호를 요구한다', () => {
    expect(managerCreateSchema.safeParse(validCreate).success).toBe(true)
    const withoutCredentials = { ...validCreate, id: '', password: '', passwordConfirm: '' }
    const issues = managerCreateSchema.safeParse(withoutCredentials).error?.issues ?? []
    expect(issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining(['id', 'password', 'passwordConfirm']),
    )
  })

  it('수정 스키마의 값 계약에는 아이디·비밀번호 자체가 없다', () => {
    const parsed = managerEditSchema.parse(validEdit)
    expect(Object.keys(parsed).sort()).toEqual(
      ['agencyId', 'email', 'name', 'organization', 'permissionId', 'phone', 'type'].sort(),
    )
  })

  it('비밀번호 확인이 다르면 확인 필드에 오류를 붙인다', () => {
    const result = managerCreateSchema.safeParse({ ...validCreate, passwordConfirm: 'Passw0rd?' })
    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toContain('passwordConfirm')
  })

  it('유형이 기획사면 기획사 선택을 요구하고, 아니면 요구하지 않는다', () => {
    const asAgency = { ...validCreate, type: 'AGENCY' as const }
    expect(managerCreateSchema.safeParse(asAgency).success).toBe(false)
    expect(managerCreateSchema.safeParse({ ...asAgency, agencyId: '7' }).success).toBe(true)
    expect(managerCreateSchema.safeParse(validCreate).success).toBe(true)
  })

  it('유형을 고르지 않은 초기 값은 통과하지 않는다', () => {
    expect(managerCreateSchema.safeParse(managerCreateDefaults).success).toBe(false)
  })
})

describe('요청 mapper 는 UI 전용 값을 본문에 싣지 않는다', () => {
  it('등록 본문에 passwordConfirm 이 없다', () => {
    const values = managerCreateSchema.parse(validCreate)
    const request = toManagerCreateRequest(values)
    expect(Object.keys(request)).not.toContain('passwordConfirm')
    expect(request).toMatchObject({ id: 'operator01', password: 'Passw0rd!', permissionId: 1 })
  })

  it('유형이 기획사가 아니면 기획사 값이 남아 있어도 본문에 넣지 않는다', () => {
    // 조건부 컨트롤이 화면에서 사라져도 form 값은 남는다. mapper 가 마지막 경계다.
    const values = managerCreateSchema.parse({ ...validCreate, agencyId: '7' })
    expect(toManagerCreateRequest(values).agencyId).toBeUndefined()
  })

  it('빈 문자열 optional 필드는 보내지 않는다', () => {
    const values = managerCreateSchema.parse({ ...validCreate, organization: '' })
    expect(toManagerCreateRequest(values).organization).toBeUndefined()
  })

  it('수정 본문에는 아이디와 비밀번호가 없다', () => {
    const request = toManagerUpdateRequest(managerEditSchema.parse(validEdit))
    expect(Object.keys(request).sort()).toEqual(
      ['agencyId', 'email', 'name', 'organization', 'permissionId', 'phone', 'type'].sort(),
    )
  })
})

describe('수정 조회 응답 → 폼 defaults', () => {
  it('객체 옵션을 스칼라로 평탄화하고 폼이 제출하지 않는 값은 버린다', () => {
    expect(
      toManagerEditDefaults({
        id: 'ididi1234',
        name: '김맹맹',
        organization: '부스터랩/제로플러스',
        phone: '010-1234-1234',
        email: 'your@email.com',
        type: { id: 'AGENCY', name: '기획사' },
        agency: { id: 7, name: '부스터랩' },
        permission: { id: 3, name: '일반관리자' },
        status: { id: 'ACTIVE', name: '활성' },
        statusReason: '무관한 값',
        registrationRoute: { id: 'ADMIN', name: '관리자' },
        createdAt: '2026-06-01T12:00:00Z',
        updatedAt: '2026-06-01T12:00:00Z',
        pwdChangedAt: '2026-06-01T12:00:00Z',
        changeLogs: [{ id: 1, type: 'U' }],
      }),
    ).toEqual({
      type: 'AGENCY',
      agencyId: '7',
      permissionId: '3',
      name: '김맹맹',
      phone: '010-1234-1234',
      email: 'your@email.com',
      organization: '부스터랩/제로플러스',
    })
  })

  it('비어 있는 응답도 폼이 렌더할 수 있는 빈 문자열로 만든다', () => {
    expect(toManagerEditDefaults({})).toEqual({
      type: '',
      agencyId: '',
      permissionId: '',
      name: '',
      phone: '',
      email: '',
      organization: '',
    })
  })
})
