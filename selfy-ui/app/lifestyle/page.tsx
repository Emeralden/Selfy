"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/Header";
import ChoicePicker from "../components/ChoicePicker";
import { useCharacterStore } from "../store/useCharacterStore";
import { useActionHandler, type PhaseAction } from "@/lib/useActionHandler";
import { apiClient } from "@/lib/apiClient";
import { THEME_MAP, DEFAULT_THEME } from "@/lib/themeMap";
import { useRouter } from "next/navigation";

// ── Core actions (always visible, 3-in-a-row) ────────────────────────────
const CORE_ACTIONS = [
  { id: "estate",  label: "Estate",  emoji: "🏠", theme: "purple", path: "/lifestyle/estate"  },
  { id: "bazaar",  label: "Bazaar",  emoji: "🛒", theme: "joy",  path: "/lifestyle/bazaar"  },
  { id: "leisure", label: "Leisure", emoji: "🎯", theme: "green",  path: "/lifestyle/leisure" },
];

export default function LifestylePage() {
  const charId = useCharacterStore((s) => s.charId) ?? "";
  const router = useRouter();

  const { data: character, isLoading } = useQuery({
    queryKey: ["character", charId],
    queryFn: async () => (await apiClient.get(`/character/${charId}`)).data,
    enabled: !!charId,
  });

  const { data: lifestyleActions = [], isLoading: isActionsLoading } = useQuery<PhaseAction[]>({
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

          {/* ── Core actions — 3 compact square cards ── */}
          <div className="grid grid-cols-3 gap-3">
            {CORE_ACTIONS.map((action) => {
              const t = THEME_MAP[action.theme] ?? DEFAULT_THEME;
              return (
                <button key={action.id} id={`lifestyle-core-${action.id}`} type="button"
                  onClick={() => router.push(action.path)}
                  className="group flex aspect-square flex-col items-center justify-center gap-2.5 rounded-3xl p-3 transition-all duration-200 active:scale-[0.94]"
                  style={{ background: t.bg, boxShadow: `0 4px 16px -4px ${t.glow}, inset 0 1px 0 rgba(255,255,255,0.8)`, border: `1.5px solid ${t.color}28` }}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-transform duration-200 group-hover:scale-110 group-active:scale-90"
                    style={{ background: `${t.color}18`, border: `1.5px solid ${t.color}30` }}>
                    {action.emoji}
                  </div>
                  <span className="text-center text-[10px] font-black uppercase leading-tight tracking-wide"
                    style={{ color: "#334155" }}>
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>

          {!isActionsLoading && lifestyleActions.length > 0 && (
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

          {!isActionsLoading && lifestyleActions.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-100 bg-white/70 px-6 py-12 text-center shadow-sm backdrop-blur-xl">
              <span className="material-symbols-outlined text-4xl text-slate-300">do_not_disturb_on</span>
              <p className="text-sm font-bold text-slate-400">
                No lifestyle actions available at this age.
              </p>
              <p className="text-xs text-slate-300">
                Age up to unlock new options! 🎂
              </p>
            </div>
          )}

        </main>
      </div>
    </>
  );
}
