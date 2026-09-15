import { expectTypeOf } from 'vitest';
import type { ListResultData } from './ListResult';

interface AuditLogRow {
  readonly sequence: number;
  readonly action: string;
}

declare const auditLogList: ListResultData<AuditLogRow>;

expectTypeOf(auditLogList.rows).toEqualTypeOf<readonly AuditLogRow[]>();
expectTypeOf(auditLogList.searched).toEqualTypeOf<boolean>();
expectTypeOf(auditLogList.retry).toEqualTypeOf<() => Promise<unknown>>();
