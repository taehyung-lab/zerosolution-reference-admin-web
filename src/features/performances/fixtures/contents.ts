import type {
  ContentListPage,
  ContentListRequest,
  ContentPreview,
  ContentRow,
} from '../model/content';
import { performanceVenues } from './performances';

/**
 * TRANSPLANT_PENDING_CONTENT_QUERY: 이 저장소에는 콘텐츠 조회 API 가 없다. 아래 행과 필터·정렬·페이지
 * 계산은 서버 페이지 응답을 흉내 내는 예시이며 endpoint·DTO·enum 을 확정 계약으로 표현하지 않는다.
 * 실제 계약이 확정되면 `api/queries.ts` 의 queryFn 과 함께 교체한다.
 */
const rows: readonly ContentRow[] = [
  {
    id: 'reference-content-1',
    ticketKind: 'day',
    performanceType: 'concert',
    title: 'Reference Content 1',
    sessionCount: 2,
    performers: 'Reference Performer',
    organizer: 'Reference Organizer',
    period: '2026-09-01',
    venueId: performanceVenues[0]!.id,
    usageStatus: 'notInUse',
    hasPreview: false,
    registeredAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-02T00:00:00Z',
  },
  {
    id: 'reference-content-2',
    ticketKind: 'period',
    performanceType: 'festival',
    title: 'Reference Content 2',
    sessionCount: 3,
    performers: 'Reference Performer, Reference Performer 2',
    organizer: 'Reference Organizer',
    period: '2026-09-03',
    venueId: performanceVenues[1]!.id,
    usageStatus: 'inUse',
    hasPreview: true,
    registeredAt: '2026-09-03T00:00:00Z',
    updatedAt: '2026-09-04T00:00:00Z',
  },
];

function matches(row: ContentRow, request: ContentListRequest): boolean {
  if (request.venueId !== undefined && row.venueId !== request.venueId) return false;
  if (request.ticketKinds?.length && !request.ticketKinds.includes(row.ticketKind)) return false;
  if (request.performanceTypes?.length && !request.performanceTypes.includes(row.performanceType)) return false;
  if (request.usageStatuses?.length && !request.usageStatuses.includes(row.usageStatus)) return false;
  if (
    request.keywords?.length &&
    !request.keywords.every(({ field, value }) => row[field].toLowerCase().includes(value.toLowerCase()))
  )
    return false;
  const instant = request.periodType === 'performedAt' ? `${row.period}T00:00:00Z` : row[request.periodType];
  if (request.startDateTime !== undefined && Date.parse(instant) < Date.parse(request.startDateTime)) return false;
  if (request.endDateTime !== undefined && Date.parse(instant) > Date.parse(request.endDateTime)) return false;
  return true;
}

export function readContentPage(request: ContentListRequest): Promise<ContentListPage> {
  const filtered = rows.filter((row) => matches(row, request));
  const descending = request.sortDirection === 'desc';
  filtered.sort((left, right) => {
    const order = String(left[request.sortType]).localeCompare(String(right[request.sortType]));
    return descending ? -order : order;
  });
  const start = (request.page - 1) * request.pageSize;
  return Promise.resolve({ rows: filtered.slice(start, start + request.pageSize), total: filtered.length });
}

/**
 * 미리보기 팝업의 임시 응답. 원문 frame 이 타이틀·이미지·영상 영역을 자리표시자로만 그려 두었으므로
 * 값도 예시임이 드러나는 문자열이다. 실제 미리보기 대상은 시나리오 §6 의 미확인이다.
 */
export function readContentPreview(contentId: string): Promise<ContentPreview> {
  const sessions = ['1회차', '2회차'];
  const languages = ['ko', 'ja', 'en'];
  return Promise.resolve({
    sessions,
    languages,
    cards: sessions.flatMap((session) =>
      languages.map((language) => ({
        session,
        language,
        title: `Reference Content Title (${contentId} · ${session} · ${language})`,
        imageTitle: `Reference Image Title (${session} · ${language})`,
        videoTitle: `Reference Video Title (${session} · ${language})`,
      })),
    ),
  });
}
