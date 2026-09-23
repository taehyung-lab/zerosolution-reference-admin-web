import { ApiError } from '@/api/error';
import type {
  BannerChangeLog,
  BannerDetail,
  BannerImage,
  BannerListPage,
  BannerListRequest,
  BannerPreviewItem,
  BannerRow,
  BannerSortKey,
} from '../model/banner';

/**
 * TRANSPLANT_PENDING_BANNER_QUERY: 이 저장소에는 배너 조회 API 가 없다(AGENTS 1절). 아래 행과
 * 필터·정렬·페이지 계산은 서버 페이지 응답을 흉내 내는 예시이며 endpoint·DTO·enum 을 확정 계약으로
 * 표현하지 않는다. 실제 계약이 확정되면 api/queries.ts 의 queryFn 과 함께 교체하고 feature 에는
 * 검색 입력 매핑과 응답 projection 만 남긴다.
 *
 * 값은 예시임이 드러나게 `Reference …` 로 적되, frame 이 그린 표시 형태(두 줄 게시기간, 초까지 있는
 * 일시, 세 게시 상태, 두 이동경로 유형)를 모두 한 번씩 밟도록 골랐다. 이미지는 저장소 안에서 끝나는
 * SVG data URL 이다 — 실제 이미지 저장소와 URL 규칙은 미확인이다.
 */
function exampleImage(name: string, label: string): BannerImage {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="280" viewBox="0 0 360 280"><rect width="360" height="280" fill="#d9d9d9"/><text x="180" y="146" font-family="sans-serif" font-size="18" fill="#6b6b6b" text-anchor="middle">${label}</text></svg>`;
  return { name, url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` };
}

interface BannerRecord extends BannerRow {
  readonly linkUrl: string;
  readonly image: BannerImage;
}

const banners: readonly BannerRecord[] = [
  {
    id: 'reference-banner-1',
    order: 1,
    category: 'HOME',
    name: 'Reference 콘서트 안내 배너',
    linkType: 'APP',
    linkUrl: '//app/bbs/notice/123',
    image: exampleImage('reference-concert.png', 'Reference 콘서트 안내 배너'),
    postStartAt: '2025-12-01T03:00:00.000Z',
    postEndAt: '2026-12-01T03:00:00.000Z',
    status: 'POSTING',
    registeredAt: '2026-06-01T03:00:00.000Z',
    updatedAt: '2026-06-01T04:54:41.000Z',
  },
  {
    id: 'reference-banner-2',
    order: 2,
    category: 'HOME',
    name: 'Reference 외부 이벤트 배너',
    linkType: 'EXTERNAL',
    linkUrl: 'https://example.com/reference-event',
    image: exampleImage('reference-event.png', 'Reference 외부 이벤트 배너'),
    postStartAt: '2026-10-01T00:00:00.000Z',
    postEndAt: '2026-12-31T03:00:00.000Z',
    status: 'WAITING',
    registeredAt: '2026-05-20T03:00:00.000Z',
    updatedAt: '2026-05-21T03:00:00.000Z',
  },
  {
    id: 'reference-banner-3',
    order: 3,
    category: 'HOME',
    name: 'Reference 지난 시즌 배너',
    linkType: 'APP',
    linkUrl: '//app/performances/42',
    image: exampleImage('reference-season.png', 'Reference 지난 시즌 배너'),
    postStartAt: '2025-01-01T00:00:00.000Z',
    postEndAt: '2025-06-30T03:00:00.000Z',
    status: 'ENDED',
    registeredAt: '2024-12-20T03:00:00.000Z',
    updatedAt: '2025-07-01T03:00:00.000Z',
  },
  {
    id: 'reference-banner-4',
    order: 1,
    category: 'HOME',
    name: 'Reference 5월 광고 배너',
    linkType: 'EXTERNAL',
    linkUrl: 'https://example.com/reference-may',
    image: exampleImage('reference-may.png', 'Reference 5월 광고 배너'),
    postStartAt: '2026-05-01T00:00:00.000Z',
    postEndAt: '2026-12-31T03:00:00.000Z',
    status: 'POSTING',
    registeredAt: '2026-04-25T03:00:00.000Z',
    updatedAt: '2026-04-26T03:00:00.000Z',
  },
  {
    id: 'reference-banner-5',
    order: 5,
    category: 'HOME',
    name: 'Reference 게시중 기간 지난 배너',
    linkType: 'APP',
    linkUrl: '//app/bbs/notice/7',
    image: exampleImage('reference-expired.png', 'Reference 게시중 기간 지난 배너'),
    postStartAt: '2026-01-01T00:00:00.000Z',
    postEndAt: '2026-02-01T00:00:00.000Z',
    status: 'POSTING',
    registeredAt: '2025-12-15T03:00:00.000Z',
    updatedAt: '2025-12-15T03:00:00.000Z',
  },
];

function toRow(record: BannerRecord): BannerRow {
  return {
    id: record.id,
    order: record.order,
    category: record.category,
    name: record.name,
    linkType: record.linkType,
    postStartAt: record.postStartAt,
    postEndAt: record.postEndAt,
    status: record.status,
    registeredAt: record.registeredAt,
    updatedAt: record.updatedAt,
  };
}

function sortValue(row: BannerRow, key: BannerSortKey): string | number {
  switch (key) {
    case 'registeredAt':
      return row.registeredAt;
    case 'updatedAt':
      return row.updatedAt;
    case 'postStartAt':
      return row.postStartAt;
    case 'postEndAt':
      return row.postEndAt;
    case 'order':
      return row.order;
    case 'category':
      return row.category;
    case 'name':
      return row.name;
    case 'linkType':
      return row.linkType;
    case 'status':
      return row.status;
  }
}

/**
 * 기간 기준 `게시일` 이 게시기간의 어느 끝을 가리키는지는 미확인이다(BANNER-LIST 미확인 2) —
 * 이 예시 응답은 게시 시작일로 가른다. 실제 계약이 확정되면 여기가 아니라 서버가 가른다.
 */
function periodValue(row: BannerRow, request: BannerListRequest): string {
  switch (request.periodType) {
    case 'registeredAt':
      return row.registeredAt;
    case 'updatedAt':
      return row.updatedAt;
    case 'postedAt':
      return row.postStartAt;
  }
}

function matches(row: BannerRow, request: BannerListRequest): boolean {
  const instant = periodValue(row, request);
  if (request.startDateTime !== undefined && instant < request.startDateTime) return false;
  if (request.endDateTime !== undefined && instant > request.endDateTime) return false;
  if (request.keywords?.length && !request.keywords.some(({ value }) => row.name.includes(value)))
    return false;
  if (request.categories?.length && !request.categories.includes(row.category)) return false;
  if (request.linkTypes?.length && !request.linkTypes.includes(row.linkType)) return false;
  if (request.statuses?.length && !request.statuses.includes(row.status)) return false;
  return true;
}

export function readBannerListPage(request: BannerListRequest): Promise<BannerListPage> {
  const filtered = banners.map(toRow).filter((row) => matches(row, request));
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
 * 조회 화면이 쓰는 예시 이력. frame 7.1.2 는 `수정` 아래 항목별 `이전 > 이후` 줄 네 개와 `등록` 한 줄을
 * 그린다. 그 모양을 한 번씩 밟는다.
 */
const changeLogs: Readonly<Record<string, readonly BannerChangeLog[]>> = {
  'reference-banner-1': [
    {
      id: 'reference-banner-1-log-2',
      updatedAt: '2026-06-01T04:54:41.000Z',
      kind: 'UPDATE',
      changes: [
        { field: 'order', before: '10', after: '1' },
        { field: 'name', before: 'Reference 배너', after: 'Reference 콘서트 안내 배너' },
        { field: 'linkUrl', before: '//app/bbs/notice/12', after: '//app/bbs/notice/123' },
        { field: 'image', before: 'reference-old.png', after: 'reference-concert.png' },
      ],
      manager: 'Reference 김제로(admin)',
    },
    {
      id: 'reference-banner-1-log-1',
      updatedAt: '2026-06-01T03:12:11.000Z',
      kind: 'CREATE',
      changes: [],
      manager: 'Reference 김제로(admin)',
    },
  ],
};

export function readBannerDetail(bannerId: string): Promise<BannerDetail> {
  const record = banners.find((item) => item.id === bannerId);
  if (record === undefined) {
    return Promise.reject(
      new ApiError({ kind: 'not-found', message: `banner ${bannerId} not found` }),
    );
  }
  return Promise.resolve({ ...record, changeLogs: changeLogs[record.id] ?? [] });
}

/**
 * 미리보기 팝업의 예시 응답. Notion 은 `[게시 상태 : 게시중]인 경우만 APP에 노출됨` 과 `오늘이 게시기간에
 * 포함되더라도 [게시 상태 : 중단/대기]인 경우 APP에 노출되지 않음` 을 적는다 — 이 예시는 게시중이면서
 * 오늘이 게시기간 안인 배너를 `게시순서 오름차순 → 등록일 내림차순` 으로 쌓는다. 무엇이 APP 에 실제로
 * 노출되는지는 서버가 정한다(BANNER-LIST 미확인 5).
 */
export function readPostingBanners(now: Date = new Date()): Promise<readonly BannerPreviewItem[]> {
  const today = now.toISOString();
  const posting = banners
    .filter((row) => row.status === 'POSTING' && row.postStartAt <= today && today <= row.postEndAt)
    .sort((left, right) =>
      left.order === right.order
        ? right.registeredAt.localeCompare(left.registeredAt)
        : left.order - right.order,
    );
  return Promise.resolve(posting.map(({ id, name, image }) => ({ id, name, image })));
}
