/**
 * 카테고리 설정 팝업 — Figma 9.1.5.1(2026-09-11 aside 실측, 원장 16행): 제목 바 `카테고리 설정` + ✕,
 * `카테고리` 헤더 오른쪽 `추가`, 행마다 순서(드래그 핸들 + 번호)·카테고리명(20자 내외)·사용 상태·ⓧ, 하단 `저장`·`취소`.
 * 원문 50행: 추가는 최상단(순서 1)에 들어가고, 정렬은 드래그&드롭이다(가능한 방법이지 유일한 방법이 아니라 키보드용
 * 위/아래 버튼도 둔다). 드래그는 `≡` 핸들에서만 시작해 이름 입력의 텍스트 선택을 막지 않는다. 저장이 무엇을 확정하는지는
 * 미확인(질문 27)이라 저장은 요청 함수 도달까지다. 초안은 팝업 안에서만 살고 취소하면 버린다.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BOARD_CATEGORY_NAME_MAX_LENGTH,
  boardUsages,
  type BoardCategoryItem,
} from '@/features/community/model/board';
import { Dialog } from '@/shared/ui/primitives/Dialog';
import { Button } from '@/shared/ui/primitives/Button';
import { Input } from '@/shared/ui/primitives/Input';
import { Select } from '@/shared/ui/primitives/Select';

export function CategorySettingsDialog({
  open,
  categories,
  onOpenChange,
  onSave,
}: {
  readonly open: boolean;
  readonly categories: readonly BoardCategoryItem[];
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (categories: readonly BoardCategoryItem[]) => void;
}) {
  const { t } = useTranslation('community');
  const { t: shared } = useTranslation('shared');
  const [draft, setDraft] = useState<readonly BoardCategoryItem[]>(categories);
  const [dragging, setDragging] = useState<string | null>(null);

  const update = (id: string, patch: Partial<BoardCategoryItem>) =>
    setDraft((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const moveTo = (fromId: string, to: number) =>
    setDraft((items) => {
      const from = items.findIndex((item) => item.id === fromId);
      if (from < 0 || to < 0 || to >= items.length || from === to) return items;
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      return next;
    });
  const usageOptions = boardUsages.map((value) => ({ value, label: t(`board.values.usage.${value}`) }));
  const valid = draft.every((item) => item.name.trim() !== '');

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('board.categories.title')}
      closeLabel={t('board.categories.close')}
      footer={
        <>
          <Button type="button" disabled={!valid} onClick={() => onSave(draft)}>
            {shared('formAction.save')}
          </Button>
          <Button type="button" className="bg-neutral-200 text-neutral-900" onClick={() => onOpenChange(false)}>
            {shared('formAction.cancel')}
          </Button>
        </>
      }
    >
      <div className="flex items-center justify-between rounded-md bg-neutral-100 px-3 py-2">
        <span className="text-sm font-medium">{t('board.categories.heading')}</span>
        <Button
          type="button"
          onClick={() =>
            // 원문 50행: 추가된 입력 필드가 최상단(순서 1)에 들어간다.
            setDraft((items) => [{ id: `new-${crypto.randomUUID()}`, name: '', usage: 'IN_USE' }, ...items])
          }
        >
          {t('board.categories.add')}
        </Button>
      </div>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-neutral-600">
            <th scope="col" className="w-32 py-2">{t('board.categories.order')}</th>
            <th scope="col" className="py-2">{t('board.categories.name')}</th>
            <th scope="col" className="w-40 py-2">{t('board.categories.usage')}</th>
            <th scope="col" className="w-12 py-2">
              <span className="sr-only">{t('board.categories.remove')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {draft.map((item, index) => (
            <tr
              key={item.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragging) moveTo(dragging, index);
                setDragging(null);
              }}
              className="border-t border-neutral-200"
            >
              <td className="py-2">
                <span className="inline-flex items-center gap-1">
                  <span
                    draggable
                    aria-hidden="true"
                    className="cursor-grab px-1 text-neutral-400"
                    onDragStart={() => setDragging(item.id)}
                    onDragEnd={() => setDragging(null)}
                  >
                    ≡
                  </span>
                  <span className="w-5 text-center">{index + 1}</span>
                  <button
                    type="button"
                    aria-label={t('board.categories.moveUp', { order: index + 1 })}
                    className="px-1 text-neutral-500 disabled:text-neutral-300"
                    disabled={index === 0}
                    onClick={() => moveTo(item.id, index - 1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={t('board.categories.moveDown', { order: index + 1 })}
                    className="px-1 text-neutral-500 disabled:text-neutral-300"
                    disabled={index === draft.length - 1}
                    onClick={() => moveTo(item.id, index + 1)}
                  >
                    ↓
                  </button>
                </span>
              </td>
              <td className="py-2 pr-3">
                <Input
                  aria-label={t('board.categories.nameFor', { order: index + 1 })}
                  value={item.name}
                  maxLength={BOARD_CATEGORY_NAME_MAX_LENGTH}
                  placeholder={t('board.categories.namePlaceholder', { max: BOARD_CATEGORY_NAME_MAX_LENGTH })}
                  onChange={(event) => update(item.id, { name: event.target.value })}
                />
              </td>
              <td className="py-2 pr-3">
                <Select
                  aria-label={t('board.categories.usageFor', { order: index + 1 })}
                  value={item.usage}
                  options={usageOptions}
                  onValueChange={(value) => {
                    if (value === 'IN_USE' || value === 'NOT_IN_USE') update(item.id, { usage: value });
                  }}
                />
              </td>
              <td className="py-2">
                <button
                  type="button"
                  aria-label={t('board.categories.removeFor', { order: index + 1 })}
                  className="text-neutral-500"
                  onClick={() => setDraft((items) => items.filter((row) => row.id !== item.id))}
                >
                  ⓧ
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}
