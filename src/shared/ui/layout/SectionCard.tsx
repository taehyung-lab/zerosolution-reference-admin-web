import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion } from '../primitives/Accordion';
import { Badge } from '../primitives/Badge';

/**
 * Owns only a titled section surface and optional disclosure mechanics.
 *
 * Disclosure accepts a controlled contract because a caller that must reopen a closed section for
 * its own reason has no other way in. A form is one such caller: closed content is unmounted, so a
 * rejected submit leaves its errors unrendered and unfocusable even though validation ran. Which
 * section to open and why stays with the caller; this surface never sees fields, errors, or schemas.
 *
 * `errorCount` is the one fact a form section shares with its header: how many of its fields are
 * currently invalid. It renders as text inside the trigger ("운영자정보 오류 2개") so the header keeps
 * announcing it while the section is collapsed. `keepMounted` keeps closed content registered.
 */
export function SectionCard({
  title,
  children,
  actions,
  collapsible = true,
  open: controlled,
  onOpenChange,
  defaultOpen = true,
  keepMounted = false,
  errorCount = 0,
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly actions?: ReactNode;
  readonly collapsible?: boolean;
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly defaultOpen?: boolean;
  readonly keepMounted?: boolean;
  readonly errorCount?: number;
}) {
  const { t } = useTranslation('shared');
  const [local, setLocal] = useState(defaultOpen);
  const heading = (
    <span className="inline-flex items-center gap-2">
      <span className="text-lg font-semibold">{title}</span>
      {errorCount > 0 ? (
        <>
          {' '}
          <Badge tone="danger">
            {t('formSection.errors', { count: errorCount })}
          </Badge>
        </>
      ) : null}
    </span>
  );
  const open = controlled ?? local;
  const setOpen = (next: boolean) => {
    setLocal(next);
    onOpenChange?.(next);
  };
  const surface = 'overflow-hidden rounded-lg border border-neutral-200';
  const body = 'border-t border-neutral-200 p-5';

  if (!collapsible) {
    return (
      <section className={surface}>
        <header className="flex items-center justify-between gap-3 p-5">
          <h2>{heading}</h2>
          {actions}
        </header>
        <div className={body}>{children}</div>
      </section>
    );
  }

  return (
    <Accordion
      className={surface}
      contentClassName={body}
      headerClassName="p-5"
      headerEnd={actions}
      keepMounted={keepMounted}
      onOpenChange={setOpen}
      open={open}
      trigger={heading}
      triggerClassName="rounded"
    >
      {children}
    </Accordion>
  );
}
