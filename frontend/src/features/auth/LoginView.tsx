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
        <section className="relative hidden overflow-hidden bg-[#eef2f7] px-12 py-12 text-axis-ink lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-y-0 right-0 w-2/5 bg-white/55" />
          <div className="absolute bottom-[-120px] right-[-100px] h-[520px] w-[520px] rotate-[-12deg] opacity-[0.08]">
            <svg viewBox="0 0 220 220" aria-hidden="true">
              <path
                d="M34 110C62 50 158 50 186 110C158 170 62 170 34 110Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="15"
              />
              <path d="M110 38V182M48 110H172" stroke="currentColor" strokeLinecap="round" strokeWidth="15" />
              <circle cx="110" cy="110" r="24" fill="currentColor" />
            </svg>
          </div>

          <div className="relative axis-fade-up">
            <AxisLogo />

            <div className="mt-24 max-w-2xl">
              <p className="text-sm font-semibold text-axis-blue">ERP OPERATING MODEL</p>
              <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-normal text-axis-ink">
                회사 운영 데이터를 한 축으로 정렬합니다.
              </h1>
              <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-[#424245]">
                Axis ERP는 조직, 권한, 승인, 재고 기준을 같은 구조로 연결해 업무 흐름의 기준을 분명하게 만듭니다.
              </p>
            </div>
          </div>

          <div className="relative flex items-end justify-between axis-fade-up [animation-delay:120ms]">
            <p className="max-w-md text-sm font-semibold leading-6 text-axis-muted">
              조직, 구매, 판매, 재고, 근태 데이터를 한 화면 흐름 안에서 관리합니다.
            </p>
            <div className="h-24 w-24 rounded-[28px] border border-axis-border bg-white/65" />
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
