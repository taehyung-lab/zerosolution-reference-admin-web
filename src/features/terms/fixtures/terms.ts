import { ApiError } from '@/api/error';
import type {
  TermsChangeLog,
  TermsDetail,
  TermsListPage,
  TermsListRequest,
  TermsRow,
  TermsSortKey,
} from '../model/terms';

/**
 * TRANSPLANT_PENDING_TERMS_QUERY: 이 저장소에는 약관 조회 API 가 없다(AGENTS 1절). 아래 행과
 * 필터·정렬·페이지 계산은 서버 페이지 응답을 흉내 내는 예시이며 endpoint·DTO·enum 을 확정 계약으로
 * 표현하지 않는다. 실제 계약이 확정되면 api/queries.ts 의 queryFn 과 함께 교체하고 feature 에는
 * 검색 입력 매핑과 응답 projection 만 남긴다.
 *
 * 값은 예시임이 드러나게 `Reference …` 로 적되, frame 이 실제로 그린 표시 형태(`V1.2` 버전, 한 줄로
 * 줄인 본문, 초까지 있는 일시, 게시·게시안함 두 상태)를 모두 한 번씩 밟도록 골랐다.
 */
const exampleBody = [
  'Reference 서비스 이용약관',
  '제로플러스 서비스 및 제품(이하 ‘서비스’)을 이용해 주셔서 감사합니다. 본 약관은 다양한 제로플러스 서비스의 이용과 관련하여 제로플러스 서비스를 제공하는 회사와 이를 이용하는 회원 또는 비회원과의 관계를 설명합니다.',
  '제로플러스 서비스를 이용하시거나 제로플러스 서비스 회원으로 가입하실 경우 여러분은 본 약관 및 관련 운영 정책을 확인하거나 동의하게 되므로, 잠시 시간을 내시어 주의 깊게 살펴봐 주시기 바랍니다.',
].join('\n');

const privacyBody = [
  'Reference 개인정보 처리방침',
  '제로플러스는 여러분의 개인정보를 소중히 다룹니다. 본 방침은 수집하는 항목과 이용 목적, 보관 기간을 설명합니다.',
].join('\n');

const terms: readonly TermsRow[] = [
  {
    id: 'reference-terms-1',
    version: '1.2',
    body: exampleBody,
    effectiveAt: '2026-06-01T03:00:00.000Z',
    status: 'UNPUBLISHED',
    publishedAt: '2026-06-01T03:00:00.000Z',
    registeredAt: '2026-06-01T03:00:00.000Z',
    updatedAt: '2026-06-02T01:10:00.000Z',
  },
  {
    id: 'reference-terms-2',
    version: '1.1',
    body: exampleBody,
    effectiveAt: '2026-05-01T03:00:00.000Z',
    status: 'PUBLISHED',
    publishedAt: '2026-05-01T03:00:00.000Z',
    registeredAt: '2026-05-01T03:00:00.000Z',
    updatedAt: '2026-05-02T01:10:00.000Z',
  },
  {
    id: 'reference-terms-3',
    version: '1.0',
    body: exampleBody,
    effectiveAt: '2026-04-01T03:00:00.000Z',
    status: 'PUBLISHED',
    publishedAt: '2026-04-01T03:00:00.000Z',
    registeredAt: '2026-04-01T03:00:00.000Z',
    updatedAt: '2026-04-01T03:00:00.000Z',
  },
  {
    id: 'reference-terms-4',
    version: '2.0',
    body: privacyBody,
    effectiveAt: '2026-07-01T00:00:00.000Z',
    status: 'UNPUBLISHED',
    publishedAt: '2026-06-15T00:00:00.000Z',
    registeredAt: '2026-06-10T02:00:00.000Z',
    updatedAt: '2026-06-11T02:00:00.000Z',
  },
  {
    id: 'reference-terms-5',
    version: '10.11',
    body: privacyBody,
    effectiveAt: '2026-03-01T00:00:00.000Z',
    status: 'PUBLISHED',
    publishedAt: '2026-03-01T00:00:00.000Z',
    registeredAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
];

function sortValue(row: TermsRow, key: TermsSortKey): string {
  switch (key) {
    case 'registeredAt':
      return row.registeredAt;
    case 'updatedAt':
      return row.updatedAt;
    case 'effectiveAt':
      return row.effectiveAt;
    case 'publishedAt':
      return row.publishedAt;
    case 'version':
      return row.version;
    case 'body':
      return row.body;
    case 'status':
      return row.status;
  }
}

/**
 * 검색어 대상 두 개 중 `내용` 이 가리키는 값은 미확인이다(TERMS-LIST 미확인 2) — 이 예시 응답은
 * 둘 다 저장된 본문 텍스트에서 찾는다. 실제 계약이 확정되면 여기가 아니라 서버가 가른다.
 */
function keywordValue(row: TermsRow): string {
  return row.body;
}

function periodValue(row: TermsRow, request: TermsListRequest): string {
  switch (request.periodType) {
    case 'registeredAt':
      return row.registeredAt;
    case 'updatedAt':
      return row.updatedAt;
    case 'effectiveAt':
      return row.effectiveAt;
    case 'publishedAt':
      return row.publishedAt;
  }
}

function matches(row: TermsRow, request: TermsListRequest): boolean {
  const instant = periodValue(row, request);
  if (request.startDateTime !== undefined && instant < request.startDateTime) return false;
  if (request.endDateTime !== undefined && instant > request.endDateTime) return false;
  if (
    request.keywords?.length &&
    !request.keywords.some(({ value }) => keywordValue(row).includes(value))
  )
    return false;
  if (request.statuses?.length && !request.statuses.includes(row.status)) return false;
  return true;
}

export function readTermsListPage(request: TermsListRequest): Promise<TermsListPage> {
  const filtered = terms.filter((row) => matches(row, request));
  const descending = request.sortDirection === 'desc';
  const sorted = [...filtered].sort((left, right) => {
    const a = sortValue(left, request.sortType);
    const b = sortValue(right, request.sortType);
    const order = a === b ? 0 : a < b ? -1 : 1;
    return descending ? -order : order;
  });
  const start = (request.page - 1) * request.pageSize;
  return Promise.resolve({
    rows: sorted.slice(start, start + request.pageSize),
    total: sorted.length,
  });
}

/**
 * 조회 화면이 쓰는 예시 이력. frame 11.2.2 는 `등록` 한 줄을 그리고, Notion 은 업데이트일을
 * `수정되어 저장된 날짜` 라 적는다 — 수정이 한 번 쌓인 행을 하나 둔다.
 */
const changeLogs: Readonly<Record<string, readonly TermsChangeLog[]>> = {
  'reference-terms-1': [
    {
      id: 'reference-terms-1-log-2',
      updatedAt: '2026-06-02T01:10:00.000Z',
      kind: 'UPDATE',
      manager: 'Reference 김땡땡 (adminuser)',
    },
    {
      id: 'reference-terms-1-log-1',
      updatedAt: '2026-06-01T03:12:11.000Z',
      kind: 'CREATE',
      manager: 'Reference 김땡땡 (adminuser)',
    },
  ],
};

export function readTermsDetail(termsId: string): Promise<TermsDetail> {
  const row = terms.find((item) => item.id === termsId);
  if (row === undefined) {
    return Promise.reject(
      new ApiError({ kind: 'not-found', message: `terms ${termsId} not found` }),
    );
  }
  return Promise.resolve({ ...row, changeLogs: changeLogs[row.id] ?? [] });
}
