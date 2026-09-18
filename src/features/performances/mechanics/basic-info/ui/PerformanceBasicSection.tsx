import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PerformanceBasicInfo } from '@/features/performances/model/performance-detail';
import { displayTimeZone, formatDate, formatTimeInTimeZone } from '@/shared/lib/datetime';
import { DetailField } from '@/shared/ui/detail/DetailField';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/primitives/Tabs';
import { Table, TableCell, TableHead } from '@/shared/ui/primitives/Table';

const languages = ['ko', 'ja', 'en'] as const;

function dateTime(value: string) {
  return `${formatDate(value)} ${formatTimeInTimeZone(value, displayTimeZone())}`;
}

/**
 * `기본정보` 섹션. 번역된 내용은 UI locale 과 별개로 언어 탭이 고른다.
 * 조회(5.2.2)와 수정(5.2.3) 두 화면이 같은 읽기 조립을 그리므로 소유자가 여기다.
 */
export function PerformanceBasicSection({ basic }: { readonly basic: PerformanceBasicInfo }) {
  const { t } = useTranslation('performances');
  const [language, setLanguage] = useState('ko');
  const empty = t('detail.emptyValue');
  return (
    <SectionCard title={t('detail.basic')}>
      <dl className="grid md:grid-cols-2 md:gap-x-8">
        <DetailField label={t('fields.ticketKind')}>{basic.ticketKindLabel}</DetailField>
        <DetailField label={t('fields.performanceType')}>{basic.performanceTypeLabel}</DetailField>
      </dl>
      <Tabs value={language} onValueChange={setLanguage}>
        <TabsList aria-label={t('detail.language')}>
          {languages.map((code) => (
            <TabsTrigger key={code} value={code}>
              {t(`detail.languages.${code}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        {languages.map((code) => (
          <TabsContent key={code} value={code}>
            <dl className="grid md:grid-cols-2 md:gap-x-8">
              <DetailField label={t('fields.title')}>{basic.translations[code].title || empty}</DetailField>
              <DetailField label={t('detail.subtitle')}>{basic.translations[code].subtitle || empty}</DetailField>
              <DetailField label={t('fields.performers')}>{basic.translations[code].performers || empty}</DetailField>
              <DetailField label={t('detail.organizer')}>{basic.translations[code].organizer || empty}</DetailField>
            </dl>
          </TabsContent>
        ))}
      </Tabs>
      <dl>
        <DetailField label={t('fields.performedAt')}>
          {basic.sessions.map((session) => (
            <div key={session.id} className="mb-3">
              <p>{t('detail.session', { number: session.number })}</p>
              <p>{t('detail.interval', { from: dateTime(session.startsAt), to: dateTime(session.endsAt) })}</p>
            </div>
          ))}
        </DetailField>
        <DetailField label={t('detail.events')}>
          <Table>
            <thead>
              <tr>
                <TableHead>{t('detail.eventName')}</TableHead>
                <TableHead>{t('detail.eventPeriod')}</TableHead>
              </tr>
            </thead>
            <tbody>
              {basic.events.map((event) => (
                <tr key={event.id}>
                  <TableCell>{event.name}</TableCell>
                  <TableCell>
                    {t('detail.interval', { from: dateTime(event.startsAt), to: dateTime(event.endsAt) })}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </DetailField>
        <DetailField label={t('filters.venue')}>{basic.venueName}</DetailField>
        <DetailField label={t('detail.seats')}>
          <p>{basic.totalSeats.toLocaleString()}</p>
          {basic.sessions.map((session) => (
            <p key={session.id}>
              {t('detail.sessionSeats', {
                number: session.number,
                sold: session.soldSeats.toLocaleString(),
                unsold: session.unsoldSeats.toLocaleString(),
              })}
            </p>
          ))}
        </DetailField>
        <DetailField label={t('detail.grades')}>{basic.grades.map((grade) => grade.name).join(', ')}</DetailField>
      </dl>
    </SectionCard>
  );
}
