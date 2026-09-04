import { createContext, useContext, type ReactNode } from "react";
import {
  clearAccessToken,
  registerReissueTokenReader,
  setAccessToken,
  setLoginId,
} from "@/api/http/credential";
import { signOutSession } from "@/api/auth";

export interface AuthenticatedSession {
  readonly accessToken: string;
  readonly loginId: string;
}

interface AuthContextValue {
  readonly startSession: (session: AuthenticatedSession) => void;
  readonly signOut: () => Promise<void>;
}

/**
 * 재발급 응답 본문에서 access token 을 읽는 adapter.
 *
 * transport 는 adapter shape 만 제공하고 값이 어디 있는지는 계약을 아는 app 경계가 안다.
 * 재발급 요청은 mutator 를 거치지 않는 raw axios 이므로 payload 는 봉투 통째다.
 */
function readSessionEnvelopeAccessToken(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null || !("data" in payload))
    return undefined;
  const data: unknown = payload.data;
  if (typeof data !== "object" || data === null || !("accessToken" in data))
    return undefined;
  const accessToken: unknown = data.accessToken;
  return typeof accessToken === "string" && accessToken !== ""
    ? accessToken
    : undefined;
}

// 모듈 로드 시점에 등록한다. 로그인 화면을 거치지 않고 복원된 세션도 재발급을 할 수 있어야 한다.
registerReissueTokenReader(readSessionEnvelopeAccessToken);

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const startSession = ({ accessToken, loginId }: AuthenticatedSession) => {
    setLoginId(loginId);
    setAccessToken(accessToken);
  };

  const signOut = async () => {
    await signOutSession();
    clearAccessToken();
  };

  return (
    <AuthContext value={{ startSession, signOut }}>{children}</AuthContext>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (value === undefined)
    throw new Error("useAuth must be used within AuthProvider");
  return value;
}
