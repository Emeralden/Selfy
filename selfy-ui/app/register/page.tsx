"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";


const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(24, "Username too long")
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords don't match bro 😬",
    path: ["confirm_password"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

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

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const inputCls =
    "w-full rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface shadow-sm outline-none ring-0 transition-all placeholder:font-normal placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/15";

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("https://selfy-yu0z.onrender.com/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Registration failed");
      }
      const loginRes = await fetch("https://selfy-yu0z.onrender.com/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: data.username,
          password: data.password,
        }),
        credentials: "include",
      });
      if (!loginRes.ok) throw new Error("Auto-login failed after registration");

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
          <span className="text-3xl">✨</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight text-on-surface">
            Create Account
          </h1>
          <p className="mt-1 text-sm font-medium text-on-surface-variant">
            Your story hasn't started yet. Let's fix that.
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
            Identity
          </span>
        </div>
        <FieldWrapper label="Username" error={errors.username?.message}>
          <div className="relative">
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="e.g. shadow_coder"
              className={inputCls}
              {...register("username")}
            />
          </div>
        </FieldWrapper>

        <div className="border-t border-outline-variant/50" />
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
            <span className="material-symbols-outlined text-[16px] text-primary">
              lock
            </span>
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
            Security
          </span>
        </div>
        <FieldWrapper label="Password" error={errors.password?.message}>
          <div className="relative">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 6 characters"
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
        <FieldWrapper
          label="Confirm Password"
          error={errors.confirm_password?.message}
        >
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Same thing again"
              className={`${inputCls} pr-11`}
              {...register("confirm_password")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showConfirm ? "visibility_off" : "visibility"}
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
          id="register-btn"
          disabled={isSubmitting}
          className="group mt-1 flex w-full items-center justify-center gap-2 rounded-3xl bg-linear-to-b from-[#8B5CF6] to-primary py-4 text-sm font-black tracking-tight text-white shadow-md shadow-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Creating your story...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </>
          )}
        </button>
      </form>
      <p className="mt-6 text-center text-[11px] font-medium text-on-surface-variant/60">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-black text-primary hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
