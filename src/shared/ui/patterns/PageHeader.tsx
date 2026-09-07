import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '../primitives/Tooltip';

/** 화면은 번역된 경로·안내 문구를 전달하고, 헤더는 구분자·현재 위치·안내 아이콘 배치를 소유한다. */
export function PageHeader({
  breadcrumbs = [],
  title,
  tooltip,
  actions,
}: {
  readonly breadcrumbs?: readonly string[];
  readonly title: ReactNode;
  readonly tooltip?: { readonly content: string; readonly label: string };
  readonly actions?: ReactNode;
}) {
  const { t } = useTranslation('shared');
  return (
    <header className="mb-6 flex items-end justify-between">
      <div>
        {breadcrumbs.length > 0 ? (
          <nav
            aria-label={t('pageHeader.breadcrumb')}
            className="mb-2 flex items-center gap-1.5 text-sm text-neutral-500"
          >
            <ol className="flex items-center gap-1.5">
              {breadcrumbs.map((label, index) => (
                <li key={index} className="inline-flex items-center gap-1.5">
                  {index > 0 ? <span aria-hidden="true">›</span> : null}
                  <span
                    aria-current={
                      index === breadcrumbs.length - 1 ? 'page' : undefined
                    }
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ol>
            {tooltip ? (
              <Tooltip content={tooltip.content}>
                <button
                  aria-label={tooltip.label}
                  className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-current text-xs leading-none focus-visible:outline-2 focus-visible:outline-offset-2"
                  type="button"
                >
                  <span aria-hidden="true">!</span>
                </button>
              </Tooltip>
            ) : null}
          </nav>
        ) : null}
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      {actions}
    </header>
  );
}
