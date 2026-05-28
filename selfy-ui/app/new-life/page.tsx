"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import { genesisSchema, GenesisFormValues } from "../schemas/genesis";
import { useCharacterStore } from "../store/useCharacterStore";

const COUNTRIES = [
  { code: "IN", label: "🇮🇳 India" },
];

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

export default function NewLifePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diceSpinning, setDiceSpinning] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GenesisFormValues>({
    resolver: zodResolver(genesisSchema),
    defaultValues: { gender: "Male" },
  });

  const selectedCountry = watch("country");
  const selectedState   = watch("state");
  const selectedGender  = watch("gender");

  const { data: states = [] } = useQuery<string[]>({
    queryKey: ["states", selectedCountry],
    queryFn: async () => {
      if (!selectedCountry) return [];
      const res = await fetch(`http://127.0.0.1:8000/life/states?country=${selectedCountry}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedCountry,
  });

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue("country", e.target.value, { shouldValidate: true });
    setValue("state", "", { shouldValidate: false });
  };

  const handleDiceRoll = async () => {
    if (diceSpinning) return;
    setDiceSpinning(true);
    try {
      const params = new URLSearchParams({
        country: selectedCountry,
        state:   selectedState,
        gender:  selectedGender ?? "Male",
      });
      const res = await fetch(`http://127.0.0.1:8000/life/generate-name?${params}`);
      if (!res.ok) throw new Error();

      const { first_name, last_name } = await res.json();
      setValue("first_name", first_name, { shouldValidate: true });
      setValue("last_name",  last_name,  { shouldValidate: true });
    } catch {
    } finally {
      setDiceSpinning(false);
    }
  };

  const setCharId = useCharacterStore((s) => s.setCharId);

  const onSubmit = async (data: GenesisFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        user_id: "00000000-0000-0000-0000-000000000001",
        ...data,
      };
      const response = await fetch("http://127.0.0.1:8000/life/birth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Birth failed! Backend said no.");
      const char = await response.json();
      setCharId(char.id);
      router.push("/");
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectCls =
    "w-full appearance-none rounded-2xl border border-outline-variant bg-white pl-4 pr-10 py-3 text-sm font-semibold text-on-surface shadow-sm outline-none ring-0 transition-all focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-40";

  const canRoll = !!selectedCountry && !!selectedState;

  const inputCls =
    "w-full rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface shadow-sm outline-none ring-0 transition-all placeholder:font-normal placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/15";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <Header />

      <main className="hide-scrollbar flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 pb-16 pt-8">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 shadow-[0_0_24px_rgba(109,40,217,0.15)]">
              <span className="text-3xl">🍼</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-on-surface">
                New Life
              </h1>
              <p className="mt-1 text-sm font-medium text-on-surface-variant">
                Every legend starts with a birth certificate.
              </p>
            </div>
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-4xl border border-outline-variant bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.07)] space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  public
                </span>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
                Origin
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="Country" error={errors.country?.message}>
                <div className="relative">
                  <select
                    id="country"
                    className={selectCls}
                    {...register("country")}
                    onChange={handleCountryChange}
                    defaultValue=""
                  >
                    <option value="" disabled>Select country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant/50">
                    expand_more
                  </span>
                </div>
              </FieldWrapper>

              <FieldWrapper label="State" error={errors.state?.message}>
                <div className="relative">
                  <select
                    id="state"
                    className={selectCls}
                    {...register("state")}
                    disabled={!selectedCountry || states.length === 0}
                    defaultValue=""
                  >
                    <option value="" disabled>Select state</option>
                    {states.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant/50">
                    expand_more
                  </span>
                </div>
              </FieldWrapper>
            </div>

            <div className="border-t border-outline-variant/50" />
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-appeal/10">
                <span className="material-symbols-outlined text-[16px] text-appeal">
                  wc
                </span>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
                Identity
              </span>
            </div>
            <FieldWrapper label="Gender" error={errors.gender?.message}>
              <div className="grid grid-cols-2 gap-2">
                {(["Male", "Female"] as const).map((g) => {
                  const isActive = selectedGender === g;
                  const emoji = g === "Male" ? "♂️" : "♀️";
                  return (
                    <button
                      key={g}
                      type="button"
                      id={`gender-${g.toLowerCase()}`}
                      onClick={() => setValue("gender", g, { shouldValidate: true })}
                      className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-bold transition-all duration-200 active:scale-95 ${
                        isActive
                          ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_16px_rgba(109,40,217,0.12)]"
                          : "border-outline-variant bg-white text-on-surface-variant hover:border-primary/20 hover:bg-primary/5"
                      }`}
                    >
                      <span>{emoji}</span>
                      <span>{g}</span>
                    </button>
                  );
                })}
              </div>
            </FieldWrapper>

            <div className="border-t border-outline-variant/50" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-joy/10">
                  <span className="material-symbols-outlined text-[16px] text-joy">
                    badge
                  </span>
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
                  Name
                </span>
              </div>
              <button
                type="button"
                id="dice-roll-btn"
                onClick={handleDiceRoll}
                disabled={!canRoll || diceSpinning}
                title={!canRoll ? "Pick a country & state first!" : "Roll a random name"}
                className={`group flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-black uppercase tracking-widest transition-all ${
                  canRoll
                    ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 active:scale-95"
                    : "cursor-not-allowed border-outline-variant bg-slate-50 text-on-surface-variant/40"
                }`}
              >
                <span
                  className={`text-base transition-transform duration-500 ${
                    diceSpinning ? "rotate-360" : canRoll ? "group-hover:rotate-12" : ""
                  }`}
                  style={{ display: "inline-block" }}
                >
                  🎲
                </span>
                <span>Randomize</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="First Name" error={errors.first_name?.message}>
                <input
                  id="first-name"
                  type="text"
                  placeholder="e.g. Arun"
                  className={inputCls}
                  {...register("first_name")}
                />
              </FieldWrapper>

              <FieldWrapper label="Last Name" error={errors.last_name?.message}>
                <input
                  id="last-name"
                  type="text"
                  placeholder="e.g. Nair"
                  className={inputCls}
                  {...register("last_name")}
                />
              </FieldWrapper>
            </div>
            {submitError && (
              <div className="rounded-2xl border border-appeal/20 bg-appeal/5 px-4 py-3">
                <p className="text-xs font-bold text-appeal">{submitError}</p>
              </div>
            )}
            <button
              type="submit"
              id="begin-life-btn"
              disabled={isSubmitting}
              className="group mt-1 flex w-full items-center justify-center gap-2 rounded-3xl bg-linear-to-b from-[#8B5CF6] to-primary py-4 text-sm font-black tracking-tight text-white shadow-md shadow-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Bringing you into this world...</span>
                </>
              ) : (
                <>
                  <span>Begin Life</span>
                  <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </>
              )}
            </button>

          </form>
          <p className="mt-6 text-center text-[11px] font-medium text-on-surface-variant/50">
            No refunds. No respawns. Choose wisely. 🫡
          </p>
        </div>
      </main>
    </div>
  );
}
