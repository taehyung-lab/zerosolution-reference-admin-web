/**
 * 13 내정보(GNB > 내정보)의 도메인 값. 항목·필수·액션은 `product/facts/PROFILE-DETAIL.md` 와
 * `PROFILE-EDIT.md` 가 관찰한 것만 담는다. 대상은 세션이 정하므로 **어떤 타입에도 대상 ID 가 없다.**
 *
 * TRANSPLANT_PENDING_PROFILE_CONTRACT: 내 계정 조회·수정·비밀번호 변경·탈퇴의 서버 계약이 없다
 * (신규 Admin OpenAPI 없음). `계정 상태`·`가입경로` 는 frame 이 값 하나씩만 그려 집합이 미확인이라
 * enum 이 아니라 서버가 준 표시 문자열로 둔다(PROFILE-DETAIL 미확인 1). 계약이 확정되면 함께 교체한다.
 */

/** 조회 화면이 보여 주는 값 전부. frame `13.1` 의 `운영자정보` 2열이 이 집합이다. */
export interface ProfileDetail {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string;
  readonly organization: string;
  /** 표시 문자열. 관찰값 `WEB`. */
  readonly registrationRoute: string;
  /** 표시 문자열. 관찰값 `활성`. */
  readonly accountStatus: string;
}

/**
 * 수정 frame `13.2` 의 저장 항목. 아이디는 수정 불가라 빠지고, 비밀번호는 `수정` 체크박스를 켰을
 * 때만 실린다 — 끈 상태가 default 다.
 */
export interface ProfileSettings {
  readonly name: string;
  readonly phone: string;
  readonly email: string;
  readonly organization: string;
  readonly password?: string;
}

/** 조회 화면의 입력이 필요한 액션 둘. 둘 다 비밀번호를 받고 서버가 판정한다. */
export type ProfileAction =
  | { readonly type: 'changePassword'; readonly password: string }
  | { readonly type: 'withdraw'; readonly password: string };
