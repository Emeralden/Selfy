"use client";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "../components/Header";
import { useCharacterStore } from "../store/useCharacterStore";
import { usePopupStore } from "../store/usePopupStore";
import { apiClient } from "@/lib/apiClient";

// ── Theme map ─────────────────────────────────────────────────────────────────
import { THEME_MAP, DEFAULT_THEME } from "@/lib/themeMap";


// ── AIR derivation from grades + mind + discipline ────────────────────────────
function getAIR(grades: number, mind: number, discipline: number): {
  air: string; label: string; color: string; stress: number;
} {
  const score = grades * 0.5 + mind * 0.3 + discipline * 0.2;
  if (score >= 88) return { air: "< 1,000",   label: "IIT Possible 🔥", color: "#10B981", stress: 20 };
  if (score >= 78) return { air: "< 5,000",   label: "NIT Likely ✅",   color: "#F59E0B", stress: 40 };
  if (score >= 65) return { air: "< 20,000",  label: "State CET 📋",    color: "#F97316", stress: 60 };
  if (score >= 50) return { air: "< 60,000",  label: "Private College", color: "#EF4444", stress: 75 };
  if (score >= 35) return { air: "< 1,50,000",label: "Drop Year? 😬",   color: "#DC2626", stress: 90 };
  return             { air: "Undetermined", label: "Need Help 🆘",    color: "#991B1B", stress: 100 };
}

// ── Action type ───────────────────────────────────────────────────────────────
type ExamAction = {
  id: string;
  label: string;
  description: string;
  emoji: string;
  theme: string;
};

type ActionResult = { title: string; body: string };

export default function ExamPrepPage() {
  const charId      = useCharacterStore((s) => s.charId) ?? "";
  const showPopup   = usePopupStore((s) => s.showPopup);
  const queryClient = useQueryClient();

  // ── Character ──────────────────────────────────────────────────────────────
  const { data: character } = useQuery({
    queryKey: ["character", charId],
    queryFn: async () => (await apiClient.get(`/character/${charId}`)).data,
    enabled: !!charId,
  });

  // ── Age-specific actions ───────────────────────────────────────────────────
  const { data: ageActions = [] } = useQuery<ExamAction[]>({
    queryKey: ["exam-actions", charId, character?.age],
    queryFn: async () => (await apiClient.get(`/exam-prep/${charId}/actions`)).data,
    enabled: !!charId && character?.age != null,
  });

  // ── Action mutation ────────────────────────────────────────────────────────
  const actionMutation = useMutation<ActionResult, Error, string>({
    mutationFn: async (actionName: string) =>
      (await apiClient.get(`/exam-prep/${charId}/action`, { params: { action_name: actionName } })).data,
    onSuccess: (data) => {
      showPopup(data.body, data.title, "school");
      queryClient.invalidateQueries({ queryKey: ["character", charId] });
      queryClient.invalidateQueries({ queryKey: ["exam-actions", charId] });
    },
  });

  // ── Leave coaching mutation ────────────────────────────────────────────────
  const leaveCoachingMutation = useMutation({
    mutationFn: async () =>
      (await apiClient.delete(`/exam-prep/${charId}/coaching`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character", charId] });
      queryClient.invalidateQueries({ queryKey: ["exam-actions", charId] });
    },
  });

  const grades     = character?.grades     ?? 50;
  const mind       = character?.mind       ?? 50;
  const discipline = character?.discipline ?? 50;
  const airData    = getAIR(grades, mind, discipline);

  const hasCoaching = character?.tags?.includes("Coaching");

  return (
    <>
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

              <h1 className="text-2xl font-black tracking-tight text-slate-800/95">Exam Prep</h1>

              <div className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 shadow-inner">
                <span className="material-symbols-outlined text-lg text-red-500">menu_book</span>
              </div>

            </div>
          </header>

          {/* ── Mock Test Predictor ── */}
          <div
            className="relative overflow-hidden rounded-3xl p-5"
            style={{
              background: "linear-gradient(135deg, #1a0505 0%, #3B0A0A 40%, #7F1D1D 100%)",
              boxShadow: "0 8px 32px -8px rgba(220,38,38,0.55), 0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            {/* scanline texture */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.8) 3px, rgba(255,255,255,0.8) 4px)",
              }}
            />
            {/* red glow pulse blob */}
            <div
              className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full animate-pulse"
              style={{ background: "radial-gradient(circle, rgba(239,68,68,0.25), transparent 70%)" }}
            />
            <div
              className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(185,28,28,0.3), transparent 70%)" }}
            />

            {/* header row */}
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400/80">Mock Test Predictor</span>
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  Expected AIR 📊
                </h2>
                <div
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-1"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: airData.color, boxShadow: `0 0 8px ${airData.color}` }}
                  />
                  <span className="text-[11px] font-black tracking-wide text-white/80">{airData.label}</span>
                </div>
              </div>

              {/* AIR badge */}
              <div
                className="flex min-w-20 flex-col items-center justify-center rounded-2xl px-3 py-3"
                style={{
                  background: "rgba(0,0,0,0.35)",
                  border: `1.5px solid ${airData.color}55`,
                  boxShadow: `0 0 24px -6px ${airData.color}66`,
                  backdropFilter: "blur(8px)",
                }}
              >
                <span
                  className="text-[11px] font-black leading-none tracking-widest uppercase"
                  style={{ color: airData.color }}
                >
                  AIR
                </span>
                <span
                  className="mt-1 font-black leading-tight text-center"
                  style={{
                    fontSize: airData.air.length > 7 ? "0.85rem" : "1.1rem",
                    color: "#fff",
                    textShadow: `0 0 16px ${airData.color}`,
                  }}
                >
                  {airData.air}
                </span>
              </div>
            </div>

            {/* stress bar */}
            <div className="relative z-10 mt-5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-300/60">Stress Level</span>
                <span className="text-[10px] font-bold text-red-300/80">{airData.stress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${airData.stress}%`,
                    background: `linear-gradient(to right, #F97316, #EF4444, #B91C1C)`,
                    boxShadow: "0 0 12px rgba(239,68,68,0.6)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── Coaching Center Card ── */}
          {hasCoaching ? (
            <div
              className="relative overflow-hidden rounded-3xl px-5 py-6"
              style={{
                background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 55%, #fed7aa 100%)",
                border: "1.5px solid rgba(249,115,22,0.25)",
                boxShadow: "0 6px 24px -6px rgba(249,115,22,0.2), inset 0 1px 0 rgba(255,255,255,0.8)",
              }}
            >
              <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full opacity-40"
                style={{ background: "radial-gradient(circle, #fdba74, transparent 70%)" }} />
              <div className="pointer-events-none absolute -bottom-5 -left-5 h-20 w-20 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, #f97316, transparent 70%)" }} />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                    style={{ background: "rgba(249,115,22,0.12)", border: "1.5px solid rgba(249,115,22,0.25)" }}
                  >
                    🏫
                  </div>
                  <div>
                    <p className="text-[15px] font-black tracking-tight text-orange-900">Coaching Center</p>
                    <p className="text-[11px] font-bold text-orange-600/80">JEE Prep</p>
                    <div className="mt-1 flex items-center gap-1.5">
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  id="exam-leave-coaching"
                  onClick={() => leaveCoachingMutation.mutate()}
                  disabled={leaveCoachingMutation.isPending}
                  className="rounded-xl px-3 py-1.5 text-[11px] font-black tracking-wide transition-all duration-150 active:scale-95 disabled:opacity-50"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1.5px solid rgba(239,68,68,0.18)" }}
                >
                  {leaveCoachingMutation.isPending ? "Leaving…" : "Drop Out"}
                </button>
              </div>
            </div>
          ) : null}

          {/* ── Age-specific actions ── */}
          {ageActions.length > 0 && (
            <div className="flex flex-col gap-3 pb-6">
              {ageActions.map((action) => {
                const t = THEME_MAP[action.theme] ?? DEFAULT_THEME;
                return (
                  <button
                    key={action.id}
                    id={`exam-age-${action.id}`}
                    type="button"
                    onClick={() => actionMutation.mutate(action.id)}
                    disabled={actionMutation.isPending}
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

          {ageActions.length === 0 && <div className="pb-6" />}

        </main>
      </div>
    </>
  );
}
