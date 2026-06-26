import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useLoginMutation } from "./api/authApi";
import { getErrorMessage } from "../../shared/api/http";
import { AxisLogo } from "../../shared/ui/AxisLogo";
import { Button } from "../../shared/ui/Button";
import { TextField } from "../../shared/ui/TextField";

const loginSchema = z.object({
  username: z.string().min(1, "아이디를 입력해 주세요."),
  password: z.string().min(1, "비밀번호를 입력해 주세요.")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginView() {
  const [formError, setFormError] = useState<string | null>(null);
  const loginMutation = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    defaultValues: {
      username: "",
      password: ""
    }
  });

  const onSubmit = handleSubmit((values) => {
    const result = loginSchema.safeParse(values);
    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? "로그인 정보를 확인해 주세요.");
      return;
    }

    setFormError(null);
    loginMutation.mutate(result.data);
  });

  return (
    <main className="min-h-screen bg-axis-bg">
      <div className="grid min-h-screen lg:grid-cols-[1fr_520px]">
        <section className="relative hidden overflow-hidden bg-[#f5f7fb] px-12 py-12 text-axis-ink lg:flex lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,113,227,0.10)_0%,rgba(0,113,227,0.04)_36%,rgba(255,255,255,0)_36%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(315deg,rgba(29,29,31,0.06)_0%,rgba(29,29,31,0.02)_28%,rgba(255,255,255,0)_28%)]" />

          <div className="relative flex max-w-2xl flex-col items-center text-center axis-fade-up">
            <AxisLogo />

            <div className="mt-12">
              <p className="text-sm font-semibold text-axis-blue">ERP OPERATING MODEL</p>
              <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-normal text-axis-ink">
                회사 운영 데이터를 한 축으로 정렬합니다.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg font-medium leading-8 text-[#424245]">
                Axis ERP는 조직, 권한, 승인, 재고 기준을 같은 구조로 연결해 업무 흐름의 기준을 분명하게 만듭니다.
              </p>
            </div>
          </div>
        </section>

        <form
          className="flex min-h-screen flex-col justify-center bg-white px-6 py-10 sm:px-10 lg:px-14"
          onSubmit={onSubmit}
        >
          <div className="mx-auto w-full max-w-sm">
            <div className="lg:hidden">
              <AxisLogo compact />
            </div>

            <div className="mt-10 lg:mt-0">
              <p className="text-sm font-bold text-axis-blue">로그인</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-axis-ink">업무를 시작합니다.</h2>
            </div>

            <div className="mt-8 space-y-5">
              <TextField
                label="아이디"
                className="h-12"
                placeholder="아이디를 입력해 주세요"
                autoComplete="username"
                error={errors.username?.message}
                {...register("username")}
              />
              <TextField
                label="비밀번호"
                className="h-12"
                type="password"
                placeholder="비밀번호를 입력해 주세요"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register("password")}
              />
            </div>

            {formError || loginMutation.error ? (
              <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {formError || getErrorMessage(loginMutation.error)}
              </p>
            ) : null}

            <Button className="mt-6 h-12 w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "로그인 중" : "로그인"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
