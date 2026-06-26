import { useState } from "react";
import { useForm } from "react-hook-form";
import { Building2, Database, ShieldCheck } from "lucide-react";
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
        <section className="relative hidden overflow-hidden bg-[#161719] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="relative axis-fade-up">
            <AxisLogo inverted />

            <div className="mt-20 max-w-2xl">
              <p className="text-sm font-semibold text-white/50">ERP OPERATING MODEL</p>
              <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-normal">
                회사 운영 데이터를 한 축으로 정렬합니다.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/65">
                Axis ERP는 조직, 권한, 승인, 재고 기준을 같은 구조로 연결해 업무 흐름의 기준을 분명하게 만듭니다.
              </p>
            </div>

            <div className="mt-10 max-w-xl rounded-lg bg-white/[0.06] p-5">
              <p className="text-xs font-semibold text-white/65">초기 구축 범위</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {["계정/권한", "조직/직원", "근태 기준"].map((item) => (
                  <div key={item} className="rounded-md bg-white/[0.08] px-3 py-3">
                    <p className="text-sm font-semibold text-white">{item}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm font-medium leading-6 text-white/70">
                로그인 전 화면은 실제 업무 데이터를 불러오지 않고, 현재 ERP가 제공할 기준 모듈만 안내합니다.
              </p>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-3 axis-fade-up [animation-delay:120ms]">
            {[
              { title: "조직", description: "부서와 직원 기준", icon: Building2 },
              { title: "권한", description: "역할 기반 접근 제어", icon: ShieldCheck },
              { title: "데이터", description: "업무 흐름 연결", icon: Database }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-lg bg-white/[0.08] p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
                    <Icon size={17} strokeWidth={2.2} />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-xs leading-5 text-white/50">{item.description}</p>
                </div>
              );
            })}
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
              <p className="mt-3 text-sm font-bold leading-6 text-[#424245]">계정 정보를 입력하면 Axis ERP 대시보드로 이동합니다.</p>
            </div>

            <div className="mt-8 space-y-5">
              <TextField
                label="아이디"
                className="h-12"
                autoComplete="username"
                error={errors.username?.message}
                {...register("username")}
              />
              <TextField
                label="비밀번호"
                className="h-12"
                type="password"
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

            <div className="mt-6 rounded-lg border border-axis-border bg-axis-bg p-4 text-sm leading-6">
              <p className="font-semibold text-axis-ink">데모 환경</p>
              <p className="font-semibold text-[#424245]">관리자 계정 정보가 기본 입력되어 있습니다.</p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
