"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/Header";
import { useCharacterStore } from "../store/useCharacterStore";
import { apiClient } from "@/lib/apiClient";
import { relationTone, type ChipTone } from "@/lib/relationTone";

type Gender = "Male" | "Female" | string;

type NPC = {
  id: string;
  first_name: string;
  last_name: string;
  gender: Gender;
  role: string;
  relation_label: string;
  is_significant: boolean;
  avatar_url?: string | null;
};

type SectionTone = {
  title: string;
  icon: string;
  color: string;
  bg: string;
  glow: string;
};


const SECTION_TONES: Record<string, SectionTone> = {
  intimacy: {
    title: "INTIMACY",
    icon: "favorite",
    color: "#DB2777",
    bg: "linear-gradient(135deg, #FDF2F8, #FCE7F3)",
    glow: "rgba(219,39,119,0.16)",
  },
  family: {
    title: "FAMILY",
    icon: "home",
    color: "#0D9488",
    bg: "linear-gradient(135deg, #F0FDFA, #CCFBF1)",
    glow: "rgba(13,148,136,0.16)",
  },
  friends: {
    title: "FRIENDS",
    icon: "groups",
    color: "#4F46E5",
    bg: "linear-gradient(135deg, #EEF2FF, #E0E7FF)",
    glow: "rgba(79,70,229,0.16)",
  },
  extended: {
    title: "EXTENDED",
    icon: "diversity_3",
    color: "#EA580C",
    bg: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
    glow: "rgba(234,88,12,0.16)",
  },
};

const INTIMACY_ROLES = new Set([
  "girlfriend",
  "boyfriend",
  "spouse",
  "wife",
  "husband",
  "fiance",
  "fiancee"
]);

const FAMILY_ROLES = new Set(["father", "mother", "parent"]);

const FRIEND_ROLES = new Set([
  "friend",
  "best friend",
  "classmate",
  "school friend",
  "college friend",
]);

function normalizeRole(role: string): string {
  return role.trim().toLowerCase();
}

function genderColor(gender: Gender): string {
  return gender === "Female" ? "#FF007F" : "#1D4ED8";
}

function genderTint(gender: Gender): string {
  return gender === "Female" ? "rgba(255,0,127,0.10)" : "rgba(29,78,216,0.10)";
}



function getFullName(npc: NPC): string {
  return `${npc.first_name} ${npc.last_name}`.trim();
}

function SocialCard({ npc, tone }: { npc: NPC; tone: SectionTone }) {
  const accent = genderColor(npc.gender);
  const relation = relationTone(npc.relation_label || "Neutral");

  return (
    <div
      className="group relative flex items-center gap-3 overflow-hidden rounded-3xl bg-white px-4 py-3.5 transition-all duration-200 active:scale-[0.99]"
      style={{
        border: `1.5px solid ${tone.color}18`,
        boxShadow: `0 4px 18px -6px ${tone.glow}, inset 0 1px 0 rgba(255,255,255,0.9)`,
      }}
    >
      <div
        className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-inner"
        style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${genderTint(npc.gender)} 100%)`,
          border: `1.5px solid ${accent}20`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), 0 6px 16px -10px ${accent}`,
        }}
      >
        {npc.avatar_url ? (
          <img
            src={npc.avatar_url}
            alt={`${npc.first_name} avatar`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="material-symbols-outlined text-[32px]" style={{ color: accent }}>
            account_circle
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-black tracking-tight text-slate-800">
              {getFullName(npc)}
            </h3>
            <div className="mt-1 flex min-w-0 items-center gap-2">
              <span
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wide"
                style={{
                  background: genderTint(npc.gender),
                  color: accent,
                  border: `1px solid ${accent}18`,
                }}
              >
                <span className="truncate">{npc.role}</span>
              </span>
            </div>
          </div>

          <span
            className="shrink-0 rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-wide"
            style={{
              background: relation.bg,
              border: `1px solid ${relation.border}`,
              color: relation.color,
            }}
          >
            {npc.relation_label || "Neutral"}
          </span>
        </div>
      </div>
    </div>
  );
}

function SocialSection({
  tone,
  npcs,
  emptyText,
}: {
  tone: SectionTone;
  npcs: NPC[];
  emptyText?: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl shadow-inner"
            style={{ background: `${tone.color}10`, border: `1px solid ${tone.color}18` }}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ color: tone.color }}>
              {tone.icon}
            </span>
          </div>
          <h2 className="text-[12px] font-black uppercase tracking-widest text-slate-500">
            {tone.title}
          </h2>
        </div>
      </div>

      {npcs.length > 0 ? (
        <div className="flex flex-col gap-3">
          {npcs.map((npc) => (
            <Link key={npc.id} href={`/social/${npc.id}`}>
              <SocialCard npc={npc} tone={tone} />
            </Link>
          ))}
        </div>
      ) : (
        emptyText && (
          <div
            className="rounded-3xl px-4 py-4 text-center text-[12px] font-bold text-slate-400"
            style={{
              background: tone.bg,
              border: `1.5px solid ${tone.color}18`,
              boxShadow: `0 4px 18px -8px ${tone.glow}, inset 0 1px 0 rgba(255,255,255,0.8)`,
            }}
          >
            {emptyText}
          </div>
        )
      )}
    </section>
  );
}

export default function SocialPage() {
  const rawCharId = useCharacterStore((s) => s.charId);
  const charId = rawCharId ?? "";

  const { data: npcs = [], isLoading: npcsQueryLoading } = useQuery<NPC[]>({
    queryKey: ["npcs", charId],
    queryFn: async () => (await apiClient.get(`/character/${charId}/npcs`)).data,
    enabled: !!rawCharId,
  });

  const isLoading = !rawCharId || npcsQueryLoading;

  const { intimacy, family, friends, extended } = useMemo(() => {
    const significant = npcs.filter((npc) => npc.is_significant);

    const intimacyList = significant.filter((npc) =>
      INTIMACY_ROLES.has(normalizeRole(npc.role)),
    );
    const familyList = significant.filter((npc) =>
      FAMILY_ROLES.has(normalizeRole(npc.role)),
    );
    const friendsList = significant.filter((npc) =>
      FRIEND_ROLES.has(normalizeRole(npc.role)),
    );
    const extendedList = significant.filter((npc) => {
      const role = normalizeRole(npc.role);
      return (
        !INTIMACY_ROLES.has(role) &&
        !FAMILY_ROLES.has(role) &&
        !FRIEND_ROLES.has(role)
      );
    });

    return {
      intimacy: intimacyList,
      family: familyList,
      friends: friendsList,
      extended: extendedList,
    };
  }, [npcs]);

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <h1 className="animate-pulse text-xl font-black text-primary">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#FAFBFF]">
      <Header />

      <main className="hide-scrollbar mx-auto w-full max-w-2xl flex-1 space-y-5 overflow-y-auto px-5 py-5">
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

            <h1 className="text-2xl font-black tracking-tight text-slate-800/95">Social</h1>

            <div className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl border border-appeal/10 bg-appeal/5 shadow-inner">
              <span className="material-symbols-outlined text-lg text-appeal">diversity_1</span>
            </div>
          </div>
        </header>

        {intimacy.length > 0 && (
          <SocialSection tone={SECTION_TONES.intimacy} npcs={intimacy} />
        )}

        <SocialSection
          tone={SECTION_TONES.family}
          npcs={family}
          emptyText="Parents will show here once this life has family data."
        />

        {friends.length > 0 && (
          <SocialSection tone={SECTION_TONES.friends} npcs={friends} />
        )}

        {extended.length > 0 && (
          <SocialSection tone={SECTION_TONES.extended} npcs={extended} />
        )}

        <div className="pb-6" />
      </main>
    </div>
  );
}
