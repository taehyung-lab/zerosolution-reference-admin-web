import { useMutation } from "@tanstack/react-query";
import { signInMutationOptions } from "./mutations";

export function useSignInMutation() {
  return useMutation(signInMutationOptions());
}
