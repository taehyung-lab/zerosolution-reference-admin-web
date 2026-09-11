/**
 * 게시판 업데이트 내역(Figma 9.1.2 표기 `업데이트 이력`)을 공용 UpdateHistory 가 표시할 행으로 옮긴다. frame(2026-09-11 실측)의
 * `업데이트 사항` 열은 `등록` 한 줄, 또는 `수정` 아래 `항목 경로 : 이전 > 이후` 줄들이다
 * (`게시판명 : 공지 > 1:1문의`, `권한 > 쓰기 : 비회원 > 회원`, `글쓰기 설정 > HTML : 사용안함 > 사용`).
 * 날짜 표시·라벨·값 어휘를 이 feature 가 소유하고, 3열 렌더는 공용 표면이 소유한다.
 */
import { formatDate } from '@/shared/lib/datetime';
import type { UpdateHistoryEntry } from '@/shared/ui/patterns/UpdateHistory';
import type { TFunction } from 'i18next';
import type { BoardChange, BoardChangeLog } from '@/features/community/model/board';

/** 설정 키 → 화면 라벨 경로(Figma 의 `그룹 > 항목` 표기). 여기 없는 키는 코드를 노출하지 않는 한 줄로 치환한다. */
const fieldPaths: Readonly<Record<string, readonly string[]>> = {
  category: ['board.columns.category'],
  name: ['board.columns.name'],
  write: ['board.form.permission', 'board.form.write'],
  read: ['board.form.permission', 'board.form.read'],
  categoryUsage: ['board.form.categoryUsage'],
  postTitleMode: ['board.form.writing', 'board.form.postTitleMode'],
  html: ['board.form.writing', 'board.form.html'],
  attachment: ['board.form.attachment'],
  attachmentLimitMb: ['board.form.attachmentLimitMb'],
  popup: ['board.form.popup'],
  rating: ['board.form.feedback', 'board.form.rating'],
  comment: ['board.form.feedback', 'board.form.comment'],
  secretComment: ['board.form.feedback', 'board.form.secretComment'],
  commentNotice: ['board.form.feedback', 'board.form.commentNotice'],
  viewCountDisplay: ['board.form.viewCount', 'board.form.viewCountDisplay'],
  viewCountDuplicate: ['board.form.viewCount', 'board.form.viewCountDuplicate'],
  usage: ['board.columns.usage'],
};

/** 값 코드 → 화면 어휘. 어휘 표에 없는 값(게시판명·숫자 등)은 그대로 보여 준다. */
const valueNamespaces: Readonly<Record<string, string>> = {
  category: 'board.values.category',
  write: 'board.values.permission',
  read: 'board.values.permission',
  categoryUsage: 'board.values.usage',
  postTitleMode: 'board.values.postTitleMode',
  html: 'board.values.usage',
  attachment: 'board.values.usage',
  popup: 'board.values.usage',
  rating: 'board.values.rating',
  comment: 'board.values.usage',
  secretComment: 'board.values.secretComment',
  commentNotice: 'board.values.commentNotice',
  viewCountDisplay: 'board.values.usage',
  viewCountDuplicate: 'board.values.usage',
  usage: 'board.values.usage',
};

function changeLine(change: BoardChange, t: TFunction<'community'>): string {
  const path = fieldPaths[change.field];
  if (path === undefined) return t('board.detail.historyUnknownField');
  const label = path.map((key) => t(key)).join(' > ');
  const namespace = valueNamespaces[change.field];
  const show = (value: string | undefined) => {
    if (value === undefined || value === '') return t('board.detail.emptyValue');
    if (namespace === undefined) return value;
    const key = `${namespace}.${value}`;
    return t(key, { defaultValue: value });
  };
  return t('board.detail.historyLine', { field: label, before: show(change.before), after: show(change.after) });
}

export function toBoardHistoryEntries(
  logs: readonly BoardChangeLog[],
  t: TFunction<'community'>,
): readonly UpdateHistoryEntry[] {
  const empty = t('board.detail.emptyValue');
  return logs.map((log) => ({
    id: log.id,
    date: formatDate(log.updatedAt) || empty,
    lines:
      log.kind === 'CREATE'
        ? [t('board.detail.historyCreated')]
        : [t('board.detail.historyUpdated'), ...log.changes.map((change) => changeLine(change, t))],
    manager: log.manager || empty,
  }));
}
