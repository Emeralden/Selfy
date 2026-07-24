"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/Header";
import ChoicePicker from "../components/ChoicePicker";
import { useCharacterStore } from "../store/useCharacterStore";
import { useActionHandler, type PhaseAction } from "@/lib/useActionHandler";
import { apiClient } from "@/lib/apiClient";

// ── Theme map (same pattern as school) ───────────────────────────────────────
import { THEME_MAP, DEFAULT_THEME } from "@/lib/themeMap";


// ── Marital status emoji hint ────────────────────────────────────────────────
function maritalIcon(status: string): string {
  if (status === "Married")           return "favorite";
  if (status === "In a Relationship") return "favorite";
  if (status === "Divorced")          return "heart_broken";
  if (status === "Widowed")           return "candle";
  return "person";
}

// ── Action type (re-export PhaseAction for local use) ────────────────────────
type SelfAction = PhaseAction;

// ── Stage icon helper ─────────────────────────────────────────────────────────
function getStageIcon(stage: string): string {
  if (stage === "Baby")       return "baby_changing_station";
  if (stage === "Toddler")    return "child_care";
  if (stage === "Pre-School") return "toys";
  if (stage === "School")     return "school";
  if (stage === "Exam-Prep")  return "menu_book";
  if (stage === "University") return "account_balance";
  return "trending_up";
}

export default function SelfPage() {
  const charId = useCharacterStore((s) => s.charId) ?? "";

  // ── Character data (re-uses dashboard's cached query) ────────────────────
  const { data: character, isLoading } = useQuery({
    queryKey: ["character", charId],
    queryFn: async () => (await apiClient.get(`/character/${charId}`)).data,
    enabled: !!charId,
  });

  // ── Age-specific self actions from backend ───────────────────────────────
  const { data: selfActions = [] } = useQuery<SelfAction[]>({
    queryKey: ["self-actions", charId, character?.age],
    queryFn: async () => (await apiClient.get(`/self/${charId}/actions`)).data,
    enabled: !!charId && character?.age != null,
  });

  // ── Action handler (static / dynamic / choice) ───────────────────────────
  const { handleAction, pickOutcome, dismissChoice, pendingChoice, isPending } =
    useActionHandler({
      phase:           "self",
      charId,
      popupIcon:       "child_care",
      extraInvalidate: [["self-actions", charId]],
    });

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading || !character) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <h1 className="animate-pulse text-xl font-black text-primary">Loading...</h1>
      </div>
    );
  }

  // ── Gender-based colour palette ───────────────────────────────────────────
  // Appeal (#FF007F) for Female  ·  Mind (#1D4ED8) for Male
  const isFemale = character.gender === "Female";

  const heroBg   = isFemale
    ? "linear-gradient(135deg, #9D174D 0%, #DB2777 45%, #FF007F 100%)"
    : "linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #3B82F6 100%)";
  const heroGlow = isFemale
    ? "0 8px 32px -8px rgba(219,39,119,0.45)"
    : "0 8px 32px -8px rgba(29,78,216,0.45)";
  const blob1    = isFemale
    ? "radial-gradient(circle, rgba(255,182,193,0.35), transparent 70%)"
    : "radial-gradient(circle, rgba(147,197,253,0.35), transparent 70%)";
  const blob2    = isFemale
    ? "radial-gradient(circle, rgba(251,113,133,0.25), transparent 70%)"
    : "radial-gradient(circle, rgba(96,165,250,0.25), transparent 70%)";

  const genderEmoji   = isFemale ? "♀️" : "♂️";
  const location      = [character.state, character.country].filter(Boolean).join(", ");
  const showMarital   = character.age >= 18 && !!character.marital_status;

  // Frosted glass style — shared across pills and chips in hero card
  const frosted = {
    background:   "rgba(255,255,255,0.15)",
    border:       "1px solid rgba(255,255,255,0.25)",
    backdropFilter: "blur(10px)",
  } as React.CSSProperties;

  return (
    <>
      {/* ── Generic choice picker — rendered when a choice action is tapped ── */}
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
                  className="flex h-9 w-9 items-center justify-center rounded-xl shadow-inner transition-all duration-150 hover:opacity-80 active:scale-95"
                  style={isFemale
                    ? { background: "rgba(255,0,127,0.08)", border: "1px solid rgba(255,0,127,0.15)" }
                    : { background: "rgba(29,78,216,0.08)", border: "1px solid rgba(29,78,216,0.15)" }
                  }
                >
                  <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
                </button>
              </Link>

              <h1 className="text-2xl font-black tracking-tight text-slate-800/95">Self</h1>

              <div
                className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl shadow-inner"
                style={isFemale
                  ? { background: "rgba(255,0,127,0.08)", border: "1px solid rgba(255,0,127,0.15)" }
                  : { background: "rgba(29,78,216,0.08)", border: "1px solid rgba(29,78,216,0.15)" }
                }
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ color: isFemale ? "#FF007F" : "#1D4ED8" }}
                >
                  favorite
                </span>
              </div>

            </div>
          </header>

          {/* ── Hero Identity Card ── */}
          <div
            className="relative overflow-hidden rounded-3xl p-5"
            style={{ background: heroBg, boxShadow: heroGlow }}
          >
            {/* Decorative blobs — depth, not drama */}
            <div
              className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full opacity-60"
              style={{ background: blob1 }}
            />
            <div
              className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-50"
              style={{ background: blob2 }}
            />

            {/* ── Identity header ── */}
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 pt-1">
                <span
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-black text-white"
                  style={frosted}
                >
                  <span className="material-symbols-outlined text-[12px]">{getStageIcon(character.stage)}</span>
                  {character.stage}
                </span>

                <h2
                  className="mt-2 text-[24px] font-black leading-tight tracking-tight text-white"
                  style={{ textShadow: "0 2px 10px rgba(0,0,0,0.2)" }}
                >
                  {character.first_name} {character.last_name}
                </h2>

                {location && (
                  <div
                    className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-xl px-3 py-1"
                    style={frosted}
                  >
                    <span className="material-symbols-outlined text-[13px] text-white/70">location_on</span>
                    <span className="truncate text-[12px] font-semibold text-white/80">{location}</span>
                  </div>
                )}
              </div>

              {/* Avatar portrait */}
              <div
                className="relative flex h-32 w-24 shrink-0 overflow-hidden items-center justify-center rounded-2xl sm:h-36 sm:w-28"
                style={frosted}
              >
                {character.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={character.avatar_url} 
                    alt="Avatar" 
                    className="absolute h-full w-full object-cover scale-[1] translate-y-[0.2rem]" 
                  />
                ) : (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "3rem", color: "rgba(255,255,255,0.45)" }}
                  >
                    account_circle
                  </span>
                )}
              </div>
            </div>

            {/* ── Identity chips ── */}
            <div className="relative z-10 mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <span
                className="rounded-xl px-3 py-1.5 text-center text-[11px] font-black text-white"
                style={frosted}
              >
                Age {character.age}
              </span>
              <span
                className="rounded-xl px-3 py-1.5 text-center text-[11px] font-black text-white"
                style={frosted}
              >
                {genderEmoji} {character.gender}
              </span>

              {showMarital && (
                <span
                  className="col-span-2 flex items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-black text-white sm:col-span-1"
                  style={frosted}
                >
                  <span className="material-symbols-outlined text-[12px]">{maritalIcon(character.marital_status)}</span>
                  {character.marital_status}
                </span>
              )}
            </div>


          </div>

          {/* ── Self Actions from backend ── */}
          {selfActions.length > 0 && (
            <div className="flex flex-col gap-3 pb-6">
              {selfActions.map((action) => {
                const t = THEME_MAP[action.theme] ?? DEFAULT_THEME;
                return (
                  <button
                    key={action.id}
                    id={`self-action-${action.id}`}
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

          {selfActions.length === 0 && <div className="pb-6" />}

        </main>
      </div>
    </>
  );
}
