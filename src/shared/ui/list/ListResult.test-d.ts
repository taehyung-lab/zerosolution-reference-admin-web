import { expectTypeOf } from 'vitest';
import type { ListResultCopy, ListResultData } from './ListResult';

interface AuditLogRow {
  readonly sequence: number;
  readonly action: string;
}

declare const auditLogList: ListResultData<AuditLogRow>;

expectTypeOf(auditLogList.rows).toEqualTypeOf<readonly AuditLogRow[]>();
expectTypeOf(auditLogList.searched).toEqualTypeOf<boolean>();
expectTypeOf(auditLogList.retry).toEqualTypeOf<() => Promise<unknown>>();

// A list that queries on entry carries literal `true` into the result data.
expectTypeOf<ListResultData<AuditLogRow, true>['searched']>().toEqualTypeOf<true>();

// Its copy never labels a state it cannot reach; a gated list must label it.
expectTypeOf<ListResultCopy<true>>().toEqualTypeOf<{
  readonly empty: string;
  readonly notSearched?: undefined;
}>();
expectTypeOf<ListResultCopy<boolean>>().toEqualTypeOf<{
  readonly empty: string;
  readonly notSearched: string;
}>();
expectTypeOf<ListResultCopy<false>>().toEqualTypeOf<{
  readonly empty: string;
  readonly notSearched: string;
}>();

const entryCopy: ListResultCopy<true> = { empty: 'none' };
// @ts-expect-error -- a gated list cannot omit the not-searched sentence
const gatedCopy: ListResultCopy<boolean> = { empty: 'none' };
void entryCopy;
void gatedCopy;
