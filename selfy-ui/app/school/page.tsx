"use client";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "../components/Header";
import ChoicePicker from "../components/ChoicePicker";
import { useCharacterStore } from "../store/useCharacterStore";
import { useActionHandler, type PhaseAction } from "@/lib/useActionHandler";
import { apiClient } from "@/lib/apiClient";
import { THEME_MAP, DEFAULT_THEME } from "@/lib/themeMap";


// ── Grade derivation ──────────────────────────────────────────────────────
function getGrade(grades: number): { base: string; suffix: string; glow: string } {
  if (grades >= 90) return { base: "A", suffix: "+", glow: "rgba(16,185,129,0.5)"  };
  if (grades >= 80) return { base: "A", suffix: "",  glow: "rgba(34,197,94,0.5)"   };
  if (grades >= 65) return { base: "B", suffix: "",  glow: "rgba(59,130,246,0.5)"  };
  if (grades >= 50) return { base: "C", suffix: "",  glow: "rgba(245,158,11,0.5)"  };
  if (grades >= 35) return { base: "D", suffix: "",  glow: "rgba(249,115,22,0.5)"  };
  return               { base: "F", suffix: "",  glow: "rgba(239,68,68,0.5)"    };
}

// ── Status derivation ─────────────────────────────────────────────────────
// Tags earned via backend actions take priority.
// Stat-based labels are the fallback for characters without earned tags.
// ageRange: [min, max] — tag only shows while char is within this age window.
const TAG_STATUS: Record<string, { label: string; emoji: string; ageRange?: [number, number] }> = {
  Monitor:      { label: "Monitor",      emoji: "📋", ageRange: [10, 13] },
  Topper:       { label: "Topper",       emoji: "🏆" },
  Sportsperson: { label: "Sportsperson", emoji: "⚽" },
};

function getStatus(char: Record<string, unknown>): { label: string; emoji: string } {
  const tags = (char.tags ?? []) as string[];
  const age  = (char.age  as number) ?? 0;

  // 1. Earned tags win — but only within their valid age window
  for (const tag of tags) {
    const entry = TAG_STATUS[tag];
    if (!entry) continue;
    if (entry.ageRange && (age < entry.ageRange[0] || age > entry.ageRange[1])) continue;
    return { label: entry.label, emoji: entry.emoji };
  }

  // 2. Stat-derived fallback
  const grades      = (char.grades      as number) ?? 50;
  const mind        = (char.mind        as number) ?? 50;
  const body        = (char.body        as number) ?? 50;
  const discipline  = (char.discipline  as number) ?? 50;
  const sociability = (char.sociability as number) ?? 50;
  const joy         = (char.joy         as number) ?? 50;

  if (grades >= 90 && mind >= 80)          return { label: "Topper",       emoji: "🏆" };
  if (body >= 78)                          return { label: "Sportsperson",  emoji: "⚽" };
  if (discipline <= 20)                    return { label: "Troublemaker",  emoji: "😈" };
  if (joy >= 75 && discipline <= 40)       return { label: "Class Clown",   emoji: "🤡" };
  if (sociability <= 30)                   return { label: "Quiet Kid",     emoji: "🤫" };
  if (grades >= 70 && discipline >= 70)    return { label: "Studious",      emoji: "📚" };
  return                                          { label: "Average Kid",   emoji: "😊" };
}

// ── Core actions (always visible, 3-in-a-row) ────────────────────────────
const CORE_ACTIONS = [
  { id: "change_school", label: "Change School", emoji: "🏫", theme: "indigo", danger: false },
  { id: "participate",   label: "Participate",   emoji: "🏆", theme: "amber",  danger: false },
  { id: "drop_out",      label: "Drop Out",       emoji: "🚪", theme: "red",    danger: true  },
];

// ── Social pills ─────────────────────────────────────────────────────────
const SOCIAL_PILLS = [
  { id: "classmates", label: "Classmates", emoji: "👥" },
  { id: "teachers",   label: "Teachers",   emoji: "🎓" },
];



export default function SchoolPage() {
  const charId = useCharacterStore((s) => s.charId) ?? "";

  // ── Character data ──────────────────────────────────────────────────────
  const { data: character } = useQuery({
    queryKey: ["character", charId],
    queryFn: async () => (await apiClient.get(`/character/${charId}`)).data,
    enabled: !!charId,
  });

  // ── Age-specific actions from backend ───────────────────────────────────
  const { data: ageActions = [] } = useQuery<PhaseAction[]>({
    queryKey: ["school-actions", charId, character?.age],
    queryFn: async () => (await apiClient.get(`/school/${charId}/actions`)).data,
    enabled: !!charId && character?.age != null,
  });

  // ── Action handler (static / dynamic / choice) ──────────────────────────
  const { handleAction, pickOutcome, dismissChoice, pendingChoice, isPending } =
    useActionHandler({
      phase:           "school",
      charId,
      popupIcon:       "school",
      extraInvalidate: [["school-actions", charId]],
    });

  // ── Leave tuition (DELETE — not an action, stays as useMutation) ────────
  const queryClient = useQueryClient();
  const leaveTuitionMutation = useMutation({
    mutationFn: async () =>
      (await apiClient.delete(`/school/${charId}/tuition`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character", charId] });
      queryClient.invalidateQueries({ queryKey: ["school-actions", charId] });
    },
  });

  const grades = character?.grades ?? 50;
  const grade  = getGrade(grades);
  const status = getStatus(character ?? {});

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

          {/* ── Page Header ── */}
          <header className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 px-5 py-3 shadow-sm backdrop-blur-xl">
            <div className="absolute inset-0 bg-linear-to-br from-white/40 via-transparent to-slate-100/40" />
            <div className="relative flex items-center justify-center">

              <Link href="/" className="absolute left-0">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 shadow-inner transition-all duration-150 hover:bg-white active:scale-95"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
                </button>
              </Link>

              <h1 className="text-2xl font-black tracking-tight text-slate-800/95">School</h1>

              <div className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 shadow-inner">
                <span className="material-symbols-outlined text-lg text-primary">school</span>
              </div>

            </div>
          </header>

          {/* ── Grade Widget ── */}
          <div
            className="relative overflow-hidden rounded-3xl p-5"
            style={{
              background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 50%, #5B21B6 100%)",
              boxShadow: "0 8px 24px -8px rgba(109, 40, 217, 0.35)",
            }}
          >
            <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #C4B5FD, transparent 70%)" }} />
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-15"
              style={{ background: "radial-gradient(circle, #DDD6FE, transparent 70%)" }} />

            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">Report Card 📋</h2>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-1"
                  style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)" }}>
                  <span className="text-base leading-none">{status.emoji}</span>
                  <span className="text-[12px] font-black tracking-wide text-white">{status.label}</span>
                </div>
              </div>
              <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(255,255,255,0.25)" }}>
                  <span
                    className="font-black leading-none"
                    style={{ fontSize: "2.25rem", color: "#fff", textShadow: `0 0 20px ${grade.glow}, 0 2px 8px rgba(0,0,0,0.2)` }}
                  >
                    {grade.base}
                    {grade.suffix && (
                      <sup style={{ fontSize: "1rem", verticalAlign: "super", lineHeight: 0 }}>
                        {grade.suffix}
                      </sup>
                    )}
                  </span>
                <span className="mt-0.5 text-[10px] font-bold text-purple-200/70">GRADE</span>
              </div>
            </div>

            <div className="relative z-10 mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${grades}%`, background: "linear-gradient(to right, rgba(255,255,255,0.5), rgba(255,255,255,0.9))", boxShadow: "0 0 10px rgba(255,255,255,0.4)" }} />
              </div>
              <div className="mt-1.5 flex justify-between">
                <span className="text-[10px] font-bold text-purple-200/60">0</span>
                <span className="text-[10px] font-bold text-purple-200/60">{grades} / 100</span>
              </div>
            </div>
          </div>

          {/* ── Tuition Card (visible only when enrolled) ── */}
          {character?.tags?.includes("Tuition") && (
            <div
              className="relative overflow-hidden rounded-3xl px-5 py-6"
              style={{
                background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 55%, #a7f3d0 100%)",
                border: "1.5px solid rgba(52,211,153,0.3)",
                boxShadow: "0 6px 24px -6px rgba(16,185,129,0.25), inset 0 1px 0 rgba(255,255,255,0.8)",
              }}
            >
              {/* top-right glow blob */}
              <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full opacity-40"
                style={{ background: "radial-gradient(circle, #6ee7b7, transparent 70%)" }} />
              {/* bottom-left accent */}
              <div className="pointer-events-none absolute -bottom-5 -left-5 h-20 w-20 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, #34d399, transparent 70%)" }} />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-2xl"
                    style={{ background: "rgba(16,185,129,0.12)", border: "1.5px solid rgba(16,185,129,0.25)" }}>
                    🎒
                  </div>
                  <div>
                    <p className="text-[15px] font-black tracking-tight text-emerald-900">Tuition</p>
                    <p className="text-[11px] font-bold text-emerald-600/80">Stream: JEE</p>
                  </div>
                </div>

                <button
                  type="button"
                  id="school-leave-tuition"
                  onClick={() => leaveTuitionMutation.mutate()}
                  disabled={leaveTuitionMutation.isPending}
                  className="rounded-xl px-3 py-1.5 text-[11px] font-black tracking-wide transition-all duration-150 active:scale-95 disabled:opacity-50"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1.5px solid rgba(239,68,68,0.18)" }}
                >
                  {leaveTuitionMutation.isPending ? "Leaving…" : "Leave Tuition"}
                </button>
              </div>
            </div>
          )}

          {/* ── Social Pills ── */}
          <div className="flex gap-3">
            {SOCIAL_PILLS.map((pill) => (
              <button key={pill.id} id={`school-${pill.id}`} type="button" onClick={() => {}}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-all duration-150 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md active:scale-[0.97]">
                <span className="text-lg leading-none">{pill.emoji}</span>
                <span className="text-[13px] font-black tracking-wide text-slate-700">{pill.label}</span>
                <span className="material-symbols-outlined ml-auto text-[16px] text-slate-300">chevron_right</span>
              </button>
            ))}
          </div>

          {/* ── Core actions — 3 compact square cards ── */}
          <div className="grid grid-cols-3 gap-3">
            {CORE_ACTIONS.map((action) => {
              const t = THEME_MAP[action.theme] ?? DEFAULT_THEME;
              return (
                <button key={action.id} id={`school-core-${action.id}`} type="button" onClick={() => {}}
                  className="group flex aspect-square flex-col items-center justify-center gap-2.5 rounded-3xl p-3 transition-all duration-200 active:scale-[0.94]"
                  style={{ background: t.bg, boxShadow: `0 4px 16px -4px ${t.glow}, inset 0 1px 0 rgba(255,255,255,0.8)`, border: `1.5px solid ${t.color}28` }}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-transform duration-200 group-hover:scale-110 group-active:scale-90"
                    style={{ background: `${t.color}18`, border: `1.5px solid ${t.color}30` }}>
                    {action.emoji}
                  </div>
                  <span className="text-center text-[10px] font-black uppercase leading-tight tracking-wide"
                    style={{ color: action.danger ? t.color : "#334155" }}>
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Age-specific actions from backend ── */}
          {ageActions.length > 0 && (
            <div className="flex flex-col gap-3 pb-6">
              {ageActions.map((action) => {
                const t = THEME_MAP[action.theme] ?? DEFAULT_THEME;
                return (
                  <button key={action.id} id={`school-age-${action.id}`} type="button"
                    onClick={() => handleAction(action)}
                    disabled={isPending}
                    className="group flex w-full items-center gap-4 overflow-hidden rounded-3xl px-4 py-4 transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                    style={{ background: t.bg, boxShadow: `0 4px 20px -4px ${t.glow}, inset 0 1px 0 rgba(255,255,255,0.8)`, border: `1.5px solid ${t.color}22` }}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl transition-transform duration-200 group-hover:scale-110 group-active:scale-90"
                      style={{ background: `${t.color}18`, border: `1.5px solid ${t.color}30` }}>
                      {action.emoji}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-[15px] font-black tracking-tight text-slate-800">{action.label}</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{action.description}</p>
                    </div>
                    <span className="material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:translate-x-0.5"
                      style={{ color: `${t.color}99` }}>
                      chevron_right
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {ageActions.length === 0 && <div className="pb-6" />}

        </main>
      </div>
    </>
  );
}
