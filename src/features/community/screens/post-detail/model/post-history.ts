/**
 * 게시물 업데이트 이력(Figma 9.2.2 `업데이트 이력`)을 공용 UpdateHistory 가 표시할 행으로 옮긴다.
 * frame(2026-09-22 실측)의 `업데이트 사항` 열은 `등록`·`댓글 등록` 한 줄, 또는 `수정`·`댓글 수정` 아래
 * `항목 : 이전 > 이후` 줄들이다(`게시상태 : 게시 > 게시안함`).
 * 날짜 표시·라벨·값 어휘를 이 feature 가 소유하고, 3열 렌더는 공용 표면이 소유한다.
 */
import type { TFunction } from 'i18next';
import { displayTimeZone, formatDate, formatTimeInTimeZone } from '@/shared/lib/datetime';
import type { UpdateHistoryEntry } from '@/shared/ui/detail/UpdateHistory';
import type { PostChange, PostChangeLog } from '@/features/community/model/post';

/** 변경 항목 키 → 화면 라벨. 여기 없는 키는 코드를 노출하지 않는 한 줄로 치환한다. */
const fieldLabels: Readonly<Record<string, string>> = {
  category: 'post.columns.category',
  board: 'post.columns.board',
  boardCategory: 'post.columns.boardCategory',
  title: 'post.columns.title',
  content: 'post.columns.content',
  status: 'post.columns.status',
  answerStatus: 'post.columns.answerStatus',
};

/** 값 코드 → 화면 어휘. 어휘 표에 없는 값(제목·내용 등)은 그대로 보여 준다. */
const valueNamespaces: Readonly<Record<string, string>> = {
  category: 'post.values.category',
  status: 'post.values.status',
  answerStatus: 'post.values.answerStatus',
};

const kindLabels = {
  CREATE: 'post.detail.historyCreated',
  UPDATE: 'post.detail.historyUpdated',
  COMMENT_CREATE: 'post.detail.historyCommentCreated',
  COMMENT_UPDATE: 'post.detail.historyCommentUpdated',
} as const;

function changeLine(change: PostChange, t: TFunction<'community'>): string {
  const label = fieldLabels[change.field];
  if (label === undefined) return t('post.detail.historyUnknownField');
  const namespace = valueNamespaces[change.field];
  const show = (value: string | undefined) => {
    if (value === undefined || value === '') return t('post.columns.emptyValue');
    if (namespace === undefined) return value;
    return t(`${namespace}.${value}`, { defaultValue: value });
  };
  return t('post.detail.historyLine', {
    field: t(label),
    before: show(change.before),
    after: show(change.after),
  });
}

/** frame 은 이력 일시를 `2026-06-01 13:54:41` 로 초까지 그린다. */
function historyDate(instant: string): string {
  const day = formatDate(instant);
  if (day === '') return '';
  return `${day} ${formatTimeInTimeZone(instant, displayTimeZone(), 'second')}`;
}

export function toPostHistoryEntries(
  logs: readonly PostChangeLog[],
  t: TFunction<'community'>,
): readonly UpdateHistoryEntry[] {
  const empty = t('post.columns.emptyValue');
  return logs.map((log) => ({
    id: log.id,
    date: historyDate(log.updatedAt) || empty,
    lines: [t(kindLabels[log.kind]), ...log.changes.map((change) => changeLine(change, t))],
    actor: log.manager || empty,
  }));
}
