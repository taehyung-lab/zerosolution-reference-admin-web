import type { LoginValues } from "./login-schema";

export function toSignInRequest(values: LoginValues): {
  id: string;
  password: string;
} {
  return { id: values.id, password: values.password };
}
