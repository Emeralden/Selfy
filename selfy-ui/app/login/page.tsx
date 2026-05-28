"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";


const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function FieldWrapper({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">
        {label}
      </label>
      {children}
      {error && (
        <span className="text-[10px] font-bold text-appeal">{error}</span>
      )}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const inputCls =
    "w-full rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface shadow-sm outline-none ring-0 transition-all placeholder:font-normal placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/15";

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: data.username,
          password: data.password,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Login failed");
      }
      router.push("/new-life");

    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 shadow-[0_0_24px_rgba(109,40,217,0.15)]">
          <span className="text-3xl">🔐</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight text-on-surface">
            Welcome Back
          </h1>
          <p className="mt-1 text-sm font-medium text-on-surface-variant">
            Your life is waiting. Get back in there.
          </p>
        </div>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-5 rounded-4xl border border-outline-variant bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.07)]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
            <span className="material-symbols-outlined text-[16px] text-primary">
              person
            </span>
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
            Credentials
          </span>
        </div>
        <FieldWrapper label="Username" error={errors.username?.message}>
          <input
            id="username"
            type="text"
            autoComplete="username"
            placeholder="Your username"
            className={inputCls}
            {...register("username")}
          />
        </FieldWrapper>
        <FieldWrapper label="Password" error={errors.password?.message}>
          <div className="relative">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              className={`${inputCls} pr-11`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPass ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </FieldWrapper>
        {submitError && (
          <div className="rounded-2xl border border-appeal/20 bg-appeal/5 px-4 py-3">
            <p className="text-xs font-bold text-appeal">{submitError}</p>
          </div>
        )}
        <button
          type="submit"
          id="login-btn"
          disabled={isSubmitting}
          className="group mt-1 flex w-full items-center justify-center gap-2 rounded-3xl bg-linear-to-b from-[#8B5CF6] to-primary py-4 text-sm font-black tracking-tight text-white shadow-md shadow-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Logging in...</span>
            </>
          ) : (
            <>
              <span>Log In</span>
              <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </>
          )}
        </button>
      </form>
      <p className="mt-6 text-center text-[11px] font-medium text-on-surface-variant/60">
        Don't have an account?{" "}
        <Link
          href="/register"
          className="font-black text-primary hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
