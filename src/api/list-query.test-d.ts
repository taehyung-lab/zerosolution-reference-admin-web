import { expectTypeOf } from 'vitest';
import type { ListQueryResult } from './list-query';

interface AuditLogRow {
  readonly sequence: number;
}

// The projection keeps the caller's `searched` literal so a list that queries on entry can
// prove to its result UI that the not-searched state is unreachable.
expectTypeOf<ListQueryResult<AuditLogRow, true>['searched']>().toEqualTypeOf<true>();
expectTypeOf<ListQueryResult<AuditLogRow>['searched']>().toEqualTypeOf<boolean>();
