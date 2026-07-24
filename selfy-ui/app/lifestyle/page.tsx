"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/Header";
import ChoicePicker from "../components/ChoicePicker";
import { useCharacterStore } from "../store/useCharacterStore";
import { useActionHandler, type PhaseAction } from "@/lib/useActionHandler";
import { apiClient } from "@/lib/apiClient";
import { THEME_MAP, DEFAULT_THEME } from "@/lib/themeMap";

export default function LifestylePage() {
  const charId = useCharacterStore((s) => s.charId) ?? "";

  const { data: character, isLoading } = useQuery({
    queryKey: ["character", charId],
    queryFn: async () => (await apiClient.get(`/character/${charId}`)).data,
    enabled: !!charId,
  });

  const { data: lifestyleActions = [] } = useQuery<PhaseAction[]>({
    queryKey: ["lifestyle-actions", charId, character?.age],
    queryFn: async () => (await apiClient.get(`/lifestyle/${charId}/actions`)).data,
    enabled: !!charId && character?.age != null,
  });

  const { handleAction, pickOutcome, dismissChoice, pendingChoice, isPending } =
    useActionHandler({
      phase:           "lifestyle",
      charId,
      popupIcon:       "casino",
      extraInvalidate: [["lifestyle-actions", charId]],
    });

  if (isLoading || !character) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <h1 className="animate-pulse text-xl font-black text-primary">Loading...</h1>
      </div>
    );
  }

  return (
    <>
      {pendingChoice && (
        <ChoicePicker
          action={pendingChoice}
          onPick={pickOutcome}
          onClose={dismissChoice}
          isLoading={isPending}
        />
      )}
      <div className="flex h-dvh flex-col overflow-hidden bg-[#FAFBFF]">
        <Header />

        <main className="hide-scrollbar mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <header className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 px-5 py-3 shadow-sm backdrop-blur-xl">
            <div className="absolute inset-0 bg-linear-to-br from-white/40 via-transparent to-slate-100/40" />
            <div className="relative flex items-center justify-center">

              <Link href="/" className="absolute left-0">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-xl shadow-inner transition-all duration-150 hover:opacity-80 active:scale-95"
                  style={{ background: "rgba(29,78,216,0.08)", border: "1px solid rgba(29,78,216,0.15)" }}
                >
                  <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
                </button>
              </Link>

              <h1 className="text-2xl font-black tracking-tight text-slate-800/95">Lifestyle</h1>

              <div
                className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl shadow-inner"
                style={{ background: "rgba(29,78,216,0.08)", border: "1px solid rgba(29,78,216,0.15)" }}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ color: "#1D4ED8" }}
                >
                  casino
                </span>
              </div>
            </div>
          </header>

          {lifestyleActions.length > 0 && (
            <div className="flex flex-col gap-3 pb-6">
              {lifestyleActions.map((action) => {
                const t = THEME_MAP[action.theme] ?? DEFAULT_THEME;
                return (
                  <button
                    key={action.id}
                    id={`lifestyle-action-${action.id}`}
                    type="button"
                    onClick={() => handleAction(action)}
                    disabled={isPending}
                    className="group flex w-full items-center gap-4 overflow-hidden rounded-3xl px-4 py-4 transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                    style={{
                      background: t.bg,
                      boxShadow: `0 4px 20px -4px ${t.glow}, inset 0 1px 0 rgba(255,255,255,0.8)`,
                      border: `1.5px solid ${t.color}22`,
                    }}
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl transition-transform duration-200 group-hover:scale-110 group-active:scale-90"
                      style={{ background: `${t.color}18`, border: `1.5px solid ${t.color}30` }}
                    >
                      {action.emoji}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-[15px] font-black tracking-tight text-slate-800">{action.label}</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{action.description}</p>
                    </div>
                    <span
                      className="material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:translate-x-0.5"
                      style={{ color: `${t.color}99` }}
                    >
                      chevron_right
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {lifestyleActions.length === 0 && <div className="pb-6" />}

        </main>
      </div>
    </>
  );
}
