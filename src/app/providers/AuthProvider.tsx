import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { clearAccessToken, setAccessToken } from "@/api/http/credential";
import { signOutSession } from "@/api/auth";

interface AuthContextValue {
  readonly setAccessToken: (token: string) => void;
  readonly signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const signOut = async () => {
    await signOutSession();
    clearAccessToken();
  };

  return (
    <AuthContext value={{ setAccessToken, signOut }}>{children}</AuthContext>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (value === undefined)
    throw new Error("useAuth must be used within AuthProvider");
  return value;
}
