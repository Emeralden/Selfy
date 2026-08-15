"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Header from "@/app/components/Header";
import ChoicePicker from "@/app/components/ChoicePicker";
import { useCharacterStore } from "@/app/store/useCharacterStore";
import { apiClient } from "@/lib/apiClient";
import { useActionHandler, type PhaseAction } from "@/lib/useActionHandler";
import { THEME_MAP, DEFAULT_THEME } from "@/lib/themeMap";

type Gender = "Male" | "Female" | string;

type NPC = {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: Gender;
  role: string;
  affection: number;
  trust: number;
  respect: number;
  relation_label: string;
  avatar_url?: string | null;
};

type Stat = {
  label: string;
  value: number;
};

function getFullName(npc: NPC): string {
  return `${npc.first_name} ${npc.last_name}`.trim();
}

function genderColor(gender: Gender): string {
  return gender === "Female" ? "#FF007F" : "#1D4ED8";
}

function genderTint(gender: Gender): string {
  return gender === "Female" ? "rgba(255,0,127,0.08)" : "rgba(29,78,216,0.08)";
}

function genderDark(gender: Gender): string {
  return gender === "Female" ? "#531846" : "#0F172A";
}

function clampStat(value: number): number {
  return Math.max(0, Math.min(100, value ?? 0));
}

function relationTone(label: string) {
  const key = label.trim().toLowerCase();
  if (key === "attached")    return { color: "#047857", bg: "#ECFDF5", dot: "#10B981", border: "rgba(4,120,87,0.20)" };
  if (key === "close")       return { color: "#0F766E", bg: "#F0FDFA", dot: "#14B8A6", border: "rgba(15,118,110,0.20)" };
  if (key === "warm")        return { color: "#B45309", bg: "#FFFBEB", dot: "#F59E0B", border: "rgba(180,83,9,0.20)" };
  if (key === "formal")      return { color: "#0369A1", bg: "#F0F9FF", dot: "#38BDF8", border: "rgba(3,105,161,0.20)" };
  if (key === "complicated") return { color: "#C2410C", bg: "#FFF7ED", dot: "#F97316", border: "rgba(194,65,12,0.20)" };
  if (key === "strained")    return { color: "#D97706", bg: "#FFFBEB", dot: "#FBBF24", border: "rgba(217,119,6,0.20)" };
  if (key === "tense")       return { color: "#DC2626", bg: "#FEF2F2", dot: "#F87171", border: "rgba(220,38,38,0.20)" };
  if (key === "fractured")   return { color: "#B91C1C", bg: "#FEF2F2", dot: "#EF4444", border: "rgba(185,28,28,0.22)" };
  if (key === "distant")     return { color: "#64748B", bg: "#F8FAFC", dot: "#94A3B8", border: "rgba(100,116,139,0.20)" };
  return                            { color: "#64748B", bg: "#F8FAFC", dot: "#94A3B8", border: "rgba(100,116,139,0.20)" };
}

export default function NpcPage() {
  const params = useParams<{ npcId: string }>();
  const npcId = params.npcId;
  const charId = useCharacterStore((s) => s.charId) ?? "";

  const { data: npc, isLoading } = useQuery<NPC>({
    queryKey: ["npc", charId, npcId],
    queryFn: async () => (await apiClient.get(`/character/${charId}/npcs/${npcId}`)).data,
    enabled: !!charId && !!npcId,
  });

  const { data: socialActions = [] } = useQuery<PhaseAction[]>({
    queryKey: ["social-actions", charId, npcId],
    queryFn: async () =>
      (await apiClient.get(`/social/${charId}/actions`, { params: { npc_id: npcId } })).data,
    enabled: !!charId && !!npcId,
  });

  const { handleAction, pickOutcome, dismissChoice, pendingChoice, isPending } =
    useActionHandler({
      phase: "social",
      charId,
      extraParams: { npc_id: npcId },
      popupIcon: "diversity_1",
      extraInvalidate: [
        ["npc", charId, npcId],
        ["npcs", charId],
        ["social-actions", charId, npcId],
      ],
    });

  if (isLoading || !npc) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <h1 className="animate-pulse text-xl font-black text-primary">Loading...</h1>
      </div>
    );
  }

  const accent = genderColor(npc.gender);
  const darkText = genderDark(npc.gender);
  const statRows: Stat[] = [
    { label: "Affection", value: clampStat(npc.affection) },
    { label: "Trust", value: clampStat(npc.trust) },
    { label: "Respect", value: clampStat(npc.respect) },
  ];

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

        <main className="hide-scrollbar mx-auto w-full max-w-2xl flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <header className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 px-5 py-3 shadow-sm backdrop-blur-xl">
            <div className="absolute inset-0 bg-linear-to-br from-white/40 via-transparent to-slate-100/40" />
            <div className="relative flex items-center justify-center">
              <Link href="/social" className="absolute left-0">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 shadow-inner transition-all duration-150 hover:bg-white active:scale-95"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
                </button>
              </Link>

              <div className="min-w-0 px-12 text-center">
                <h1 className="truncate text-2xl font-black tracking-tight text-slate-800/95">
                  {npc.role}
                </h1>
              </div>

              <div
                className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl shadow-inner"
                style={{ background: genderTint(npc.gender), border: `1px solid ${accent}18` }}
              >
                <span className="material-symbols-outlined text-lg" style={{ color: accent }}>
                  diversity_1
                </span>
              </div>
            </div>
          </header>

          <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-4">
              <div
                className="flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-[20px]"
                style={{ background: genderTint(npc.gender), border: `1.5px solid ${accent}20` }}
              >
                {npc.avatar_url ? (
                  <img
                    src={npc.avatar_url}
                    alt={`${npc.first_name} avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-[38px]" style={{ color: accent }}>
                    person
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  className="truncate text-[20px] font-black tracking-tight"
                  style={{ color: darkText }}
                >
                  {getFullName(npc)}
                </h2>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-400">Age {npc.age}</p>
                {(() => {
                  const rt = relationTone(npc.relation_label || "Neutral");
                  return (
                    <div
                      className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                      style={{ background: rt.bg, border: `1px solid ${rt.border}` }}
                    >
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: rt.dot }} />
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: rt.color }}>
                        {npc.relation_label || "Neutral"}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {statRows.map((stat) => (
                <div key={stat.label}>
                  <div className="mb-1.5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                    <span style={{ color: darkText }}>{stat.label}</span>
                    <span style={{ color: accent }}>{stat.value}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${stat.value}%`, background: accent }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {socialActions.length > 0 && (
            <div className="flex flex-col gap-3 pb-6">
              {socialActions.map((action) => {
                const t = THEME_MAP[action.theme] ?? DEFAULT_THEME;
                return (
                  <button
                    key={action.id}
                    id={`social-action-${action.id}`}
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
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-[15px] font-black tracking-tight text-slate-800">
                        {action.label}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                        {action.description}
                      </p>
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

          {socialActions.length === 0 && <div className="pb-6" />}
        </main>
      </div>
    </>
  );
}
