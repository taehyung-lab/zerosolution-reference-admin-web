import { useState } from "react";

type ConfirmationState<TValues> =
  | { readonly kind: "closed" }
  | { readonly kind: "confirm"; readonly values: TValues };

// 확인 전의 값만 보관한다. 폼·API·성공 이후 처리는 호출부가 소유한다.
export function useConfirmation<TValues>({
  run,
}: {
  readonly run: (values: TValues) => void;
}) {
  const [state, setState] = useState<ConfirmationState<TValues>>({
    kind: "closed",
  });

  return {
    state,
    requestConfirmation: (values: TValues) =>
      setState({ kind: "confirm", values }),
    close: () => setState({ kind: "closed" }),
    confirm: () => {
      if (state.kind !== "confirm") return;
      run(state.values);
      setState({ kind: "closed" });
    },
  };
}
