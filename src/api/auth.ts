import { signOut } from "./generated/endpoints";

export async function signOutSession() {
  await signOut();
}
