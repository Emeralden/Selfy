"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/Header";
import ChoicePicker from "../components/ChoicePicker";
import { useCharacterStore } from "../store/useCharacterStore";
import { useActionHandler, type PhaseAction } from "@/lib/useActionHandler";
import { apiClient } from "@/lib/apiClient";
import { THEME_MAP, DEFAULT_THEME } from "@/lib/themeMap";

// ── College info (hardcoded for now) ─────────────────────────────────────────
const COLLEGE = {
  name: "IIT Bombay",
  branch: "Computer Science & Engineering",
  acronym: "IIT",
  glow: "rgba(109,40,217,0.55)",
  bg: "linear-gradient(135deg, #1e0a38 0%, #2D1462 40%, #4C1D95 100%)",
  blobA: "radial-gradient(circle, rgba(167,139,250,0.35), transparent 70%)",
  blobB: "radial-gradient(circle, rgba(124,58,237,0.25), transparent 70%)",
};

// ── CGPA derivation from grades ───────────────────────────────────────────────
function getCGPA(grades: number): { cgpa: string; label: string; color: string } {
  if (grades >= 90) return { cgpa: "9.5+",     label: "Topper 🏆",        color: "#10B981" };
  if (grades >= 80) return { cgpa: "8.5–9.4",  label: "Distinction ✅",  color: "#F59E0B" };
  if (grades >= 65) return { cgpa: "7.5–8.4",  label: "First Class 📘",  color: "#3B82F6" };
  if (grades >= 50) return { cgpa: "6.5–7.4",  label: "Pass Class 📋",   color: "#F97316" };
  if (grades >= 35) return { cgpa: "5.0–6.4",  label: "Borderline ⚠️",  color: "#EF4444" };
  return               { cgpa: "< 5.0",      label: "Detained 💀",      color: "#991B1B" };
}

// ── Attendance derivation from discipline ─────────────────────────────────────
function getAttendance(discipline: number): { pct: number; label: string; color: string } {
  const pct = Math.round(40 + discipline * 0.6); // maps 0–100 → 40–100%
  if (pct >= 85) return { pct, label: "Regular ✅",        color: "#10B981" };
  if (pct >= 75) return { pct, label: "Acceptable 📋",    color: "#F59E0B" };
  if (pct >= 60) return { pct, label: "Low ⚠️",          color: "#F97316" };
  return               { pct, label: "Detained Risk 🚨", color: "#EF4444" };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function UniversityPage() {
  const charId = useCharacterStore((s) => s.charId) ?? "";

  // ── Character ─────────────────────────────────────────────────────────────
  const { data: character, isLoading } = useQuery({
    queryKey: ["character", charId],
    queryFn: async () => (await apiClient.get(`/character/${charId}`)).data,
    enabled: !!charId,
  });

  // ── Age-specific actions ──────────────────────────────────────────────────
  const { data: uniActions = [] } = useQuery<PhaseAction[]>({
    queryKey: ["university-actions", charId, character?.age],
    queryFn: async () =>
      (await apiClient.get(`/university/${charId}/actions`)).data,
    enabled: !!charId && character?.age != null,
  });

  // ── Action handler (static / dynamic / choice) ───────────────────────────
  const { handleAction, pickOutcome, dismissChoice, pendingChoice, isPending } =
    useActionHandler({
      phase:           "university",
      charId,
      popupIcon:       "account_balance",
      extraInvalidate: [["university-actions", charId]],
    });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading || !character) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <h1 className="animate-pulse text-xl font-black text-primary">Loading...</h1>
      </div>
    );
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const cgpaData = getCGPA(character.grades ?? 50);
  const attData  = getAttendance(character.discipline ?? 50);

  return (
    <>
      {/* ── Choice picker — rendered when a choice action is tapped ── */}
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
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 shadow-inner transition-all duration-150 hover:opacity-80 active:scale-95"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
                </button>
              </Link>

              <h1 className="text-2xl font-black tracking-tight text-slate-800/95">University</h1>

              <div className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 shadow-inner">
                <span className="material-symbols-outlined text-lg text-violet-600">account_balance</span>
              </div>

            </div>
          </header>

          {/* ── Hero Card — College Identity ── */}
          <div
            className="relative overflow-hidden rounded-3xl p-5"
            style={{ background: COLLEGE.bg, boxShadow: `0 8px 32px -8px ${COLLEGE.glow}, 0 2px 8px rgba(0,0,0,0.3)` }}
          >
            {/* decorative blobs */}
            <div
              className="pointer-events-none absolute -top-10 -right-10 h-44 w-44 rounded-full opacity-60"
              style={{ background: COLLEGE.blobA }}
            />
            <div
              className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full opacity-50"
              style={{ background: COLLEGE.blobB }}
            />
            {/* scanline texture */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.8) 3px, rgba(255,255,255,0.8) 4px)",
              }}
            />

            {/* ── College identity row ── */}
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 pt-1">
                {/* College type badge */}
                <div
                  className="mb-3 inline-flex items-center gap-2 rounded-xl px-3 py-1.5"
                  style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)" }}
                >
                  <span className="material-symbols-outlined text-[14px] text-violet-300">school</span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-violet-200">
                    {COLLEGE.acronym} · Premier Institute
                  </span>
                </div>

                <h2
                  className="text-[22px] font-black leading-tight tracking-tight text-white"
                  style={{ textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}
                >
                  {COLLEGE.name}
                </h2>
                <p className="mt-1 text-[12px] font-semibold text-violet-300/80">
                  {COLLEGE.branch}
                </p>
              </div>

              {/* Emblem icon */}
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span className="material-symbols-outlined text-[36px] text-violet-200">account_balance</span>
              </div>
            </div>

            {/* ── CGPA + Attendance stat strip ── */}
            <div
              className="relative z-10 mt-5 flex overflow-hidden rounded-2xl"
              style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(12px)" }}
            >
              {/* CGPA */}
              <div className="flex-1 px-4 py-3">
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/50">CGPA</span>
                <p
                  className="mt-0.5 text-[26px] font-black leading-none tracking-tight text-white"
                  style={{ textShadow: "0 2px 12px rgba(255,255,255,0.25)" }}
                >
                  {cgpaData.cgpa}
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${character.grades ?? 50}%`, background: "linear-gradient(to right, rgba(255,255,255,0.45), rgba(255,255,255,0.85))", boxShadow: "0 0 8px rgba(255,255,255,0.3)" }}
                  />
                </div>
              </div>

              {/* divider */}
              <div className="w-px self-stretch" style={{ background: "rgba(255,255,255,0.12)" }} />

              {/* Attendance */}
              <div className="flex-1 px-4 py-3">
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/50">Attendance</span>
                <p
                  className="mt-0.5 text-[26px] font-black leading-none tracking-tight text-white"
                  style={{ textShadow: "0 2px 12px rgba(255,255,255,0.25)" }}
                >
                  {attData.pct}%
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${attData.pct}%`, background: "linear-gradient(to right, rgba(255,255,255,0.45), rgba(255,255,255,0.85))", boxShadow: "0 0 8px rgba(255,255,255,0.3)" }}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ── Age-specific actions ── */}
          {uniActions.length > 0 && (
            <div className="flex flex-col gap-3 pb-6">
              {uniActions.map((action) => {
                const t = THEME_MAP[action.theme] ?? DEFAULT_THEME;
                return (
                  <button
                    key={action.id}
                    id={`university-action-${action.id}`}
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

          {uniActions.length === 0 && <div className="pb-6" />}

        </main>
      </div>
    </>
  );
}
