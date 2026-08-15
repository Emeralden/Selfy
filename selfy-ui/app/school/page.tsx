"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "../components/Header";
import ChoicePicker from "../components/ChoicePicker";
import { useCharacterStore } from "../store/useCharacterStore";
import { useActionHandler, type PhaseAction } from "@/lib/useActionHandler";
import { usePopupStore } from "../store/usePopupStore";
import { apiClient } from "@/lib/apiClient";
import { THEME_MAP, DEFAULT_THEME } from "@/lib/themeMap";
import { TAGS } from "@/lib/tags";

// ── Grade derivation (pure display — no game logic) ───────────────────────
function getGrade(grades: number): { base: string; suffix: string; glow: string } {
  if (grades >= 90) return { base: "A", suffix: "+", glow: "rgba(16,185,129,0.5)"  };
  if (grades >= 80) return { base: "A", suffix: "",  glow: "rgba(34,197,94,0.5)"   };
  if (grades >= 65) return { base: "B", suffix: "",  glow: "rgba(59,130,246,0.5)"  };
  if (grades >= 50) return { base: "C", suffix: "",  glow: "rgba(245,158,11,0.5)"  };
  if (grades >= 35) return { base: "D", suffix: "",  glow: "rgba(249,115,22,0.5)"  };
  return               { base: "F", suffix: "",  glow: "rgba(239,68,68,0.5)"    };
}

// ── Status derivation — tag-priority, stat-derived fallback ──────────────
const TAG_STATUS: Record<string, { label: string; emoji: string; ageRange?: [number, number] }> = {
  [TAGS.MONITOR]:      { label: "Monitor",      emoji: "📋", ageRange: [10, 13] },
  [TAGS.TOPPER]:       { label: "Topper",       emoji: "🏆" },
  [TAGS.SPORTSPERSON]: { label: "Sportsperson", emoji: "⚽" },
};

function getStatus(char: Record<string, unknown>): { label: string; emoji: string } {
  const tags = (char.tags ?? []) as string[];
  const age  = (char.age  as number) ?? 0;

  for (const tag of tags) {
    const entry = TAG_STATUS[tag];
    if (!entry) continue;
    if (entry.ageRange && (age < entry.ageRange[0] || age > entry.ageRange[1])) continue;
    return { label: entry.label, emoji: entry.emoji };
  }

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

// ── Core action IDs — derived from engine response, not hardcoded ────────
const CORE_ACTION_IDS = new Set(["change_school", "participate", "drop_out"]);

// ── Social pills ─────────────────────────────────────────────────────────
const SOCIAL_PILLS = [
  { id: "classmates", label: "Classmates", emoji: "👥" },
  { id: "teachers",   label: "Teachers",   emoji: "🎓" },
];


export default function SchoolPage() {
  const charId = useCharacterStore((s) => s.charId) ?? "";
  const router = useRouter();

  // ── Character data ──────────────────────────────────────────────────────
  const { data: character, isLoading } = useQuery({
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
  const isDropout = (character?.tags ?? []).includes(TAGS.SCHOOL_DROPOUT);

  // Derive core actions from engine response (labels/emojis/themes come from YAML)
  const coreActions = ageActions.filter((a) => CORE_ACTION_IDS.has(a.id));
  const regularActions = ageActions.filter((a) => !CORE_ACTION_IDS.has(a.id));

  const showPopup    = usePopupStore((s) => s.showPopup);
  const showScenario = usePopupStore((s) => s.showScenario);

  // ── Change School ───────────────────────────────────────────────────────
  const changeSchoolMutation = useMutation({
    mutationFn: async () => (await apiClient.post(`/school/${charId}/change`)).data,
    onSuccess: (data) => {
      showPopup(data.body, data.title, "school");
      queryClient.invalidateQueries({ queryKey: ["character", charId] });
      queryClient.invalidateQueries({ queryKey: ["school-actions", charId] });
    },
    onError: () => showPopup("Something went wrong.", "Oops!", "error"),
  });

  // ── Drop School ─────────────────────────────────────────────────────────
  const dropSchoolMutation = useMutation({
    mutationFn: async () => (await apiClient.post(`/school/${charId}/drop`)).data,
    onSuccess: (data) => {
      if (!data.allowed) {
        showPopup(data.body, data.title, "block");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["character", charId] });
      showPopup(data.body, data.title, "door_open");
    },
    onError: () => showPopup("Something went wrong.", "Oops!", "error"),
  });

  function handleDropSchool() {
    const age = character?.age ?? 0;
    if (age <= 12) {
      // Static block — no confirm needed, parents just say no
      dropSchoolMutation.mutate();
      return;
    }
    // Ages 13+ — confirm first
    showScenario(
      "Drop Out? 🚪",
      "This is permanent for this stage. You'll lose your classmates and teacher. Are you sure?",
      [
        { label: "Yes, drop out", slug: "confirm", variant: "danger" },
        { label: "Cancel",        slug: "cancel",  variant: "muted"  },
      ],
      (slug) => {
        if (slug === "confirm") dropSchoolMutation.mutate();
      },
      "door_open"
    );
  }

  // ── Rejoin mutation ──────────────────────────────────────────────────────
  const rejoinMutation = useMutation({
    mutationFn: async () => (await apiClient.post(`/school/${charId}/rejoin`)).data,
    onSuccess: (data) => {
      showPopup(data.body, data.title, "school");
      queryClient.invalidateQueries({ queryKey: ["character", charId] });
      queryClient.invalidateQueries({ queryKey: ["npcs", charId] });
      queryClient.invalidateQueries({ queryKey: ["school-actions", charId] });
    },
    onError: () => showPopup("Something went wrong.", "Oops!", "error"),
  });

  if (isLoading || !character) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#FAFBFF]">
        <h1 className="animate-pulse text-xl font-black text-primary">Loading...</h1>
      </div>
    );
  }

  // ── Dropout screen ───────────────────────────────────────────────────────
  if (isDropout) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-[#FAFBFF]">
        <Header />
        <main className="hide-scrollbar mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5 flex flex-col items-center justify-center gap-6">
          {/* Icon */}
          <div
            className="flex h-24 w-24 items-center justify-center rounded-3xl shadow-inner"
            style={{ background: "linear-gradient(135deg,#FEF2F2,#FEE2E2)", border: "1.5px solid rgba(239,68,68,0.2)" }}
          >
            <span className="text-5xl">🚪</span>
          </div>

          {/* Text */}
          <div className="text-center space-y-2 px-4">
            <h1 className="text-3xl font-black tracking-tight text-slate-800">Dropped Out</h1>
            <p className="text-[14px] font-semibold text-slate-400 leading-relaxed">
              You walked away. The gate closed behind you.
              <br />The future is completely unwritten.
            </p>
          </div>

          {/* Rejoin button */}
          <button
            id="school-rejoin"
            type="button"
            onClick={() => rejoinMutation.mutate()}
            disabled={rejoinMutation.isPending}
            className="flex items-center gap-2.5 rounded-2xl px-6 py-3.5 text-[14px] font-black tracking-wide transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg,#6D28D9,#4F46E5)",
              color: "#fff",
              boxShadow: "0 8px 24px -8px rgba(109,40,217,0.45)",
            }}
          >
            <span className="material-symbols-outlined text-[18px]">school</span>
            {rejoinMutation.isPending ? "Rejoining…" : "Rejoin School"}
          </button>

          {/* Back */}
          <Link href="/" className="text-[12px] font-bold text-slate-400 underline underline-offset-2">
            Back to life
          </Link>
        </main>
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
          {character?.tags?.includes(TAGS.TUITION) && (
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
              <button key={pill.id} id={`school-${pill.id}`} type="button"
                onClick={() => router.push(`/school/${pill.id}`)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-all duration-150 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md active:scale-[0.97]">
                <span className="text-lg leading-none">{pill.emoji}</span>
                <span className="text-[13px] font-black tracking-wide text-slate-700">{pill.label}</span>
                <span className="material-symbols-outlined ml-auto text-[16px] text-slate-300">chevron_right</span>
              </button>
            ))}
          </div>

          {/* ── Core actions — 3 compact square cards derived from engine response ── */}
          <div className="grid grid-cols-3 gap-3">
            {coreActions.map((action) => {
              const t = THEME_MAP[action.theme] ?? DEFAULT_THEME;
              const isDanger = action.id === "drop_out";
              const isActionPending =
                (action.id === "change_school" && changeSchoolMutation.isPending) ||
                (action.id === "drop_out"      && dropSchoolMutation.isPending);

              function handleCoreAction() {
                if (action.id === "change_school") changeSchoolMutation.mutate();
                if (action.id === "participate")   router.push("/school/participate");
                if (action.id === "drop_out")      handleDropSchool();
              }

              return (
                <button key={action.id} id={`school-core-${action.id}`} type="button"
                  onClick={handleCoreAction}
                  disabled={isActionPending}
                  className="group flex aspect-square flex-col items-center justify-center gap-2.5 rounded-3xl p-3 transition-all duration-200 active:scale-[0.94] disabled:opacity-50"
                  style={{ background: t.bg, boxShadow: `0 4px 16px -4px ${t.glow}, inset 0 1px 0 rgba(255,255,255,0.8)`, border: `1.5px solid ${t.color}28` }}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-transform duration-200 group-hover:scale-110 group-active:scale-90"
                    style={{ background: `${t.color}18`, border: `1.5px solid ${t.color}30` }}>
                    {isActionPending ? "⏳" : action.emoji}
                  </div>
                  <span className="text-center text-[10px] font-black uppercase leading-tight tracking-wide"
                    style={{ color: isDanger ? t.color : "#334155" }}>
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Age-specific actions from backend ── */}
          {regularActions.length > 0 && (
            <div className="flex flex-col gap-3 pb-6">
              {regularActions.map((action) => {
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

          {regularActions.length === 0 && <div className="pb-6" />}

        </main>
      </div>
    </>
  );
}
