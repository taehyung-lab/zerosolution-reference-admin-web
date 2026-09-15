import { useTranslation } from 'react-i18next';

export interface ErrorTraceValue {
  readonly requestId?: string | undefined;
  readonly status?: number | undefined;
  readonly kind?: string | undefined;
}

export function ErrorTrace({ value }: { readonly value: ErrorTraceValue }) {
  const { t } = useTranslation('shared');
  if (!value.requestId && value.status === undefined && !value.kind)
    return null;
  return (
    <div className="mt-3 text-xs text-neutral-600">
      {value.requestId ? (
        <p>
          {t('error.trace.inquiryCode')}: <span>{value.requestId}</span>
        </p>
      ) : null}
      <details className="mt-2">
        <summary>{t('error.trace.details')}</summary>
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2">
          {value.requestId ? (
            <>
              <dt>{t('error.trace.requestId')}</dt>
              <dd>{value.requestId}</dd>
            </>
          ) : null}
          {value.status !== undefined ? (
            <>
              <dt>{t('error.trace.status')}</dt>
              <dd>{value.status}</dd>
            </>
          ) : null}
          {value.kind ? (
            <>
              <dt>{t('error.trace.kind')}</dt>
              <dd>{value.kind}</dd>
            </>
          ) : null}
        </dl>
      </details>
    </div>
  );
}
