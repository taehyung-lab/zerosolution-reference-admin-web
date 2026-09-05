/**
 * Presentation facts only. TRANSPLANT_PENDING_MEMBER_LIST_CONTRACT: the future member
 * contract must map its confirmed stable identifier and already-masked display values here.
 */
export interface MemberListRow {
  readonly key: string;
  readonly grade: string;
  readonly signupMethod: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string;
  readonly accountStatus: string;
  readonly joinedAt: string;
  readonly lastAccessedAt: string;
  readonly restrictions: readonly string[];
  readonly selectable?: boolean;
}

export type MemberListActionIntent =
  | {
      readonly type: 'bulkChange';
      readonly targetIds: readonly string[];
      readonly values: {
        readonly accountStatus: 'general' | 'flagged';
        readonly restrictions: readonly string[];
      };
    }
  | { readonly type: 'sms' | 'email'; readonly targetIds: readonly string[] };
