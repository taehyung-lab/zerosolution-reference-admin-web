import { ApiError } from "@/api/error";
import { resolveErrorOutcome } from "@/api/error-outcome";
import { FormTextField } from "@/shared/ui/form/FormTextField";
import { Button } from "@/shared/ui/primitives/Button";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toSignInRequest } from "../model/login-mapper";
import { loginSchema, type LoginValues } from "../model/login-schema";
import { useSignInMutation } from "../../../api/useSignInMutation";

interface LoginScreenProps {
  /**
   * 제출한 로그인 ID 를 함께 넘긴다. 토큰 재발급 요청 body 가 그 값을 요구하고,
   * sign-in 에 실제로 사용한 값이 아니면 서버가 재발급을 계산할 수 없다.
   */
  readonly onAuthenticated: (session: {
    accessToken: string;
    loginId: string;
  }) => void;
  /** 인증 가드가 되돌려 보낸 원래 목적지. route가 소유하고 검증한다. */
  readonly redirectTo?: string | undefined;
}

export function LoginScreen({ onAuthenticated, redirectTo }: LoginScreenProps) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [rootError, setRootError] = useState<string>();
  const mutation = useSignInMutation();
  const form = useForm({
    defaultValues: { id: "", password: "" },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      const values: LoginValues = loginSchema.parse(value);
      setRootError(undefined);
      try {
        const session = await mutation.mutateAsync(toSignInRequest(values));
        if (session.requirePasswordChange) {
          console.error("Password change flow is not implemented");
          setRootError(t("errors.flowNotImplemented"));
          return;
        }
        onAuthenticated({
          accessToken: session.accessToken,
          loginId: values.id,
        });
        await navigate({ to: redirectTo ?? "/" });
      } catch (error: unknown) {
        applyLoginError(error);
      }
    },
  });

  function setFieldError(field: "id" | "password") {
    form.setFieldMeta(field, (previous) => ({
      ...previous,
      errorMap: { ...previous?.errorMap, onServer: t("errors.invalidField") },
    }));
  }

  function applyLoginError(error: unknown) {
    if (error instanceof ApiError && error.kind === "validation") {
      for (const fieldError of error.fieldErrors) {
        if (fieldError.field === "id" || fieldError.field === "password") {
          setFieldError(fieldError.field);
        } else {
          setRootError(t("errors.general"));
        }
      }
      return;
    }
    if (error instanceof ApiError) {
      // 로그인 전 실패는 이 화면이 인라인으로 처리한다. 세션 종료가 아니므로 incident 로 보내지 않는다.
      if (resolveErrorOutcome("pre-auth", error.kind) !== "feature") return;
      if (error.kind === "network" || error.kind === "timeout") {
        setRootError(t("errors.connection"));
        return;
      }
      if (error.kind === "server-error") {
        setRootError(t("errors.server"));
        return;
      }
      if (error.kind === "rate-limited") {
        setRootError(t("errors.rateLimited"));
        return;
      }
      // 401 은 서버가 제출한 자격증명을 거부한 것이고, 업무 실패 code 도 같은 안전 카피를 쓴다.
      if (error.kind === "unauthorized" || error.kind === "business") {
        setRootError(t("errors.invalidCredentials"));
        return;
      }
    }
    setRootError(t("errors.general"));
  }

  return (
    <div className="grid min-h-dvh grid-rows-[1fr_auto] bg-white">
      <div className="grid md:grid-cols-2">
        <aside className="hidden bg-neutral-950 p-12 text-white md:block">
          <span className="text-2xl font-bold">{t("brand")}</span>
        </aside>
        <main className="flex items-center justify-center p-8">
          <form
            className="w-full max-w-sm space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <h1 className="text-center text-2xl font-semibold">{t("title")}</h1>
            {rootError === undefined ? null : (
              <p role="alert" className="text-sm text-red-700">
                {rootError}
              </p>
            )}
            <FormTextField
              name="id"
              label={t("fields.id")}
              form={form}
              required
              autoComplete="username"
            />
            <FormTextField
              name="password"
              label={t("fields.password")}
              form={form}
              required
              type="password"
              autoComplete="current-password"
            />
            <Button
              className="w-full"
              type="submit"
              disabled={mutation.isPending}
            >
              {t("actions.signIn")}
            </Button>
            {/* These slots remain intentionally unconnected until their workflows are implemented. */}
            <Button className="w-full" disabled>
              {t("actions.signUp")}
            </Button>
            <div className="flex justify-between text-xs text-neutral-600">
              <span>{t("slots.findCredentials")}</span>
              <span>{t("slots.signUpResult")}</span>
            </div>
          </form>
        </main>
      </div>
      <footer className="flex justify-between border-t px-6 py-4 text-xs text-neutral-600">
        <span>{t("footer.copyright")}</span>
        <span>{t("footer.locale")}</span>
      </footer>
    </div>
  );
}
