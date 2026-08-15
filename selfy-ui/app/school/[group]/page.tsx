"use client";

import Link from "next/link";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/app/components/Header";
import { useCharacterStore } from "@/app/store/useCharacterStore";
import { apiClient } from "@/lib/apiClient";
import { relationTone, type ChipTone } from "@/lib/relationTone";

type Gender = "Male" | "Female" | string;

type NPC = {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: Gender;
  role: string;
  relation_label: string;
  is_significant: boolean;
  avatar_url?: string | null;
};

function genderColor(gender: Gender) {
  return gender === "Female" ? "#FF007F" : "#1D4ED8";
}
function genderTint(gender: Gender) {
  return gender === "Female" ? "rgba(255,0,127,0.10)" : "rgba(29,78,216,0.10)";
}

function ClassmateCard({ npc, sectionColor, sectionGlow }: {
  npc: NPC;
  sectionColor: string;
  sectionGlow: string;
}) {
  const accent   = genderColor(npc.gender);
  const relation = relationTone(npc.relation_label || "Neutral");

  return (
    <div
      className="group relative flex items-center gap-3 overflow-hidden rounded-3xl bg-white px-4 py-3.5 transition-all duration-200 active:scale-[0.99]"
      style={{
        border: `1.5px solid ${sectionColor}18`,
        boxShadow: `0 4px 18px -6px ${sectionGlow}, inset 0 1px 0 rgba(255,255,255,0.9)`,
      }}
    >
      {/* Avatar */}
      <div
        className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-inner"
        style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${genderTint(npc.gender)} 100%)`,
          border: `1.5px solid ${accent}20`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), 0 6px 16px -10px ${accent}`,
        }}
      >
        {npc.avatar_url ? (
          <img src={npc.avatar_url} alt={npc.first_name} className="h-full w-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-[32px]" style={{ color: accent }}>account_circle</span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-black tracking-tight text-slate-800">
              {npc.first_name} {npc.last_name}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
                style={{ background: genderTint(npc.gender), color: accent, border: `1px solid ${accent}18` }}
              >
                {npc.role}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">Age {npc.age}</span>
            </div>
          </div>

          {/* Relation label chip */}
          <span
            className="shrink-0 rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-wide"
            style={{ background: relation.bg, border: `1px solid ${relation.border}`, color: relation.color }}
          >
            {npc.relation_label || "Neutral"}
          </span>
        </div>
      </div>
    </div>
  );
}

const ROLE_CONFIG: Record<string, { title: string; icon: string; color: string; bg: string; glow: string; filter: string[] }> = {
  classmates: {
    title: "Classmates",
    icon: "groups",
    color: "#4F46E5",
    bg: "linear-gradient(135deg, #EEF2FF, #E0E7FF)",
    glow: "rgba(79,70,229,0.16)",
    filter: ["classmate"],
  },
  teachers: {
    title: "Teachers",
    icon: "school",
    color: "#0D9488",
    bg: "linear-gradient(135deg, #F0FDFA, #CCFBF1)",
    glow: "rgba(13,148,136,0.16)",
    filter: ["teacher"],
  },
};

export default function SchoolNpcListPage({ params }: { params: Promise<{ group: string }> }) {
  const { group } = use(params);
  const rawCharId = useCharacterStore((s) => s.charId);
  const charId = rawCharId ?? "";
  const config = ROLE_CONFIG[group] ?? ROLE_CONFIG.classmates;

  const { data: npcs = [], isLoading: npcsQueryLoading } = useQuery<NPC[]>({
    queryKey: ["npcs", charId],
    queryFn: async () => (await apiClient.get(`/character/${charId}/npcs`)).data,
    enabled: !!rawCharId,
  });

  const list = npcs.filter((npc) => config.filter.includes(npc.role.toLowerCase()));

  if (!rawCharId || npcsQueryLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#FAFBFF]">
        <h1 className="animate-pulse text-xl font-black text-indigo-500">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#FAFBFF]">
      <Header />

      <main className="hide-scrollbar mx-auto w-full max-w-2xl flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {/* Header */}
        <header className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 px-5 py-3 shadow-sm backdrop-blur-xl">
          <div className="absolute inset-0 bg-linear-to-br from-white/40 via-transparent to-slate-100/40" />
          <div className="relative flex items-center justify-center">
            <Link href="/school" className="absolute left-0">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 shadow-inner transition-all duration-150 hover:bg-white active:scale-95"
              >
                <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
              </button>
            </Link>

            <h1 className="text-2xl font-black tracking-tight text-slate-800/95">{config.title}</h1>

            <div
              className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl shadow-inner"
              style={{ background: `${config.color}10`, border: `1px solid ${config.color}18` }}
            >
              <span className="material-symbols-outlined text-lg" style={{ color: config.color }}>
                {config.icon}
              </span>
            </div>
          </div>
        </header>

        {/* List */}
        {list.length > 0 ? (
          <div className="flex flex-col gap-3">
            {list.map((npc) => (
              <Link key={npc.id} href={`/school/${group}/${npc.id}`}>
                <ClassmateCard npc={npc} sectionColor={config.color} sectionGlow={config.glow} />
              </Link>
            ))}
          </div>
        ) : (
          <div
            className="rounded-3xl px-4 py-8 text-center text-[13px] font-bold text-slate-400"
            style={{
              background: config.bg,
              border: `1.5px solid ${config.color}18`,
              boxShadow: `0 4px 18px -8px ${config.glow}, inset 0 1px 0 rgba(255,255,255,0.8)`,
            }}
          >
            {group === "classmates"
              ? "No classmates yet. Age up to school age to get a cohort! 🏫"
              : "No teachers yet. Age up to school age to meet your teachers! 🎓"}
          </div>
        )}

        <div className="pb-6" />
      </main>
    </div>
  );
}
