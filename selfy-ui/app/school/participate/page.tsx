"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/app/components/Header";
import ChoicePicker from "@/app/components/ChoicePicker";
import { useCharacterStore } from "@/app/store/useCharacterStore";
import { useActionHandler, type PhaseAction } from "@/lib/useActionHandler";
import { usePopupStore } from "@/app/store/usePopupStore";
import { apiClient } from "@/lib/apiClient";
import { THEME_MAP, DEFAULT_THEME } from "@/lib/themeMap";

type ClubInfo = { club: string; emoji: string; key: string } | { club: null };

export default function ParticipatePage() {
  const rawCharId = useCharacterStore((s) => s.charId);
  const charId = rawCharId ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();
  const showPopup = usePopupStore((s) => s.showPopup);
  const showScenario = usePopupStore((s) => s.showScenario);

  // ── Character ──────────────────────────────────────────────────────────────
  const { data: character } = useQuery({
    queryKey: ["character", charId],
    queryFn: async () => (await apiClient.get(`/character/${charId}`)).data,
    enabled: !!rawCharId,
  });

  // ── Club status ────────────────────────────────────────────────────────────
  const { data: clubInfo, isLoading: clubInfoLoading } = useQuery<ClubInfo>({
    queryKey: ["participate-club", charId],
    queryFn: async () => (await apiClient.get(`/participate/${charId}/club`)).data,
    enabled: !!rawCharId,
  });

  // ── Activity actions ───────────────────────────────────────────────────────
  const { data: activities = [] } = useQuery<PhaseAction[]>({
    queryKey: ["participate-actions", charId, character?.age],
    queryFn: async () => (await apiClient.get(`/participate/${charId}/actions`)).data,
    enabled: !!rawCharId && character?.age != null,
  });

  // ── Available clubs (non-empty means clubs are unlocked for this char) ──────
  const { data: availableClubs = [], isLoading: clubsLoading } = useQuery<{ id: string }[]>({
    queryKey: ["participate-clubs", charId, character?.age],
    queryFn: async () => (await apiClient.get(`/participate/${charId}/clubs`)).data,
    enabled: !!rawCharId && character?.age != null,
  });

  // Include !rawCharId so pre-hydration (charId null, queries disabled) shows skeleton
  const clubCardLoading = !rawCharId || clubInfoLoading || clubsLoading;


  const { handleAction, pickOutcome, dismissChoice, pendingChoice, isPending } =
    useActionHandler({
      phase: "participate",
      charId,
      popupIcon: "emoji_events",
      extraInvalidate: [["participate-actions", charId]],
    });

  // ── Leave club ─────────────────────────────────────────────────────────────
  const leaveClubMutation = useMutation({
    mutationFn: async () => (await apiClient.delete(`/participate/${charId}/club/leave`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participate-club", charId] });
      queryClient.invalidateQueries({ queryKey: ["character", charId] });
      showPopup("You've officially left the club. The door's always open if you change your mind.", "Left the Club 👋", "emoji_events");
    },
    onError: () => showPopup("Something went wrong.", "Oops!", "error"),
  });

  function handleLeaveClub() {
    if (!clubInfo?.club) return;
    showScenario(
      "Leave the Club? 🚪",
      `Are you sure you want to leave ${clubInfo.club}? You can always join another one later.`,
      [
        { label: "Yes, leave", slug: "confirm", variant: "danger" },
        { label: "Cancel", slug: "cancel", variant: "muted" },
      ],
      (slug) => { if (slug === "confirm") leaveClubMutation.mutate(); },
      "emoji_events"
    );
  }

  const hasClub = !!clubInfo?.club;
  const clubsUnlocked = availableClubs.length > 0 || hasClub;

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
              <Link href="/school" className="absolute left-0">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 shadow-inner transition-all duration-150 hover:bg-white active:scale-95"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
                </button>
              </Link>

              <h1 className="text-2xl font-black tracking-tight text-slate-800/95">Participate</h1>

              <div className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/15 bg-amber-500/10 shadow-inner">
                <span className="material-symbols-outlined text-lg text-amber-500">emoji_events</span>
              </div>
            </div>
          </header>

          {/* ── Club Hero Card ── */}
          {clubCardLoading ? (
            /* Skeleton */
            <div
              className="animate-pulse rounded-3xl p-5"
              style={{ background: "linear-gradient(135deg,#F5F3FF,#EDE9FE)", border: "1.5px solid rgba(139,92,246,0.15)", minHeight: "88px" }}
            >
              <div className="h-3 w-20 rounded-full bg-violet-200/60" />
              <div className="mt-3 h-5 w-36 rounded-full bg-violet-200/80" />
              <div className="mt-2 h-3 w-48 rounded-full bg-violet-200/50" />
            </div>
          ) : hasClub ? (
            /* In a club — same deep purple as school Report Card */
            <div
              className="relative overflow-hidden rounded-3xl p-5"
              style={{
                background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 50%, #5B21B6 100%)",
                boxShadow: "0 8px 24px -8px rgba(109,40,217,0.35)",
              }}
            >
              <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, #C4B5FD, transparent 70%)" }} />
              <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-15"
                style={{ background: "radial-gradient(circle, #DDD6FE, transparent 70%)" }} />

              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-purple-200/70">Active Club</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-3xl">{(clubInfo as { club: string; emoji: string }).emoji}</span>
                    <h2 className="text-2xl font-black tracking-tight text-white">{(clubInfo as { club: string }).club}</h2>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-1"
                    style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)" }}>
                    <span className="text-[12px] font-black tracking-wide text-white">Member in good standing</span>
                  </div>
                </div>

                <button
                  id="participate-leave-club"
                  type="button"
                  onClick={handleLeaveClub}
                  disabled={leaveClubMutation.isPending}
                  className="rounded-2xl px-4 py-2 text-[12px] font-black tracking-wide transition-all duration-150 active:scale-95 disabled:opacity-50"
                  style={{ background: "rgba(0,0,0,0.20)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.25)" }}
                >
                  {leaveClubMutation.isPending ? "Leaving…" : "Leave"}
                </button>
              </div>
            </div>
          ) : (
            /* No club — soft light card like Tuition card */
            <div
              className="relative overflow-hidden rounded-3xl px-5 py-6"
              style={{
                background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 55%, #DDD6FE 100%)",
                border: "1.5px solid rgba(139,92,246,0.25)",
                boxShadow: "0 6px 24px -6px rgba(109,40,217,0.15), inset 0 1px 0 rgba(255,255,255,0.8)",
              }}
            >
              <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full opacity-40"
                style={{ background: "radial-gradient(circle, #C4B5FD, transparent 70%)" }} />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-2xl"
                    style={{ background: "rgba(109,40,217,0.10)", border: "1.5px solid rgba(109,40,217,0.20)" }}>
                    {clubsUnlocked ? "🏅" : "🔒"}
                  </div>
                  <div>
                    <p className="text-[15px] font-black tracking-tight text-violet-900">
                      {clubsUnlocked ? "No Club Yet" : "Clubs Locked"}
                    </p>
                    <p className="text-[11px] font-bold text-violet-500/80">
                      {clubsUnlocked ? "Find your people. Join a club." : "Keep aging up — clubs open when you're older."}
                    </p>
                  </div>
                </div>

                {clubsUnlocked && (
                  <button
                    id="participate-join-club"
                    type="button"
                    onClick={() => router.push("/school/participate/clubs")}
                    className="flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[13px] font-black tracking-wide transition-all duration-200 active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #6D28D9, #5B21B6)",
                      color: "#fff",
                      boxShadow: "0 6px 16px -4px rgba(109,40,217,0.4)",
                    }}
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Join
                  </button>
                )}
              </div>
            </div>
          )}


          {/* ── Activities ── */}
          {activities.length > 0 && (
            <div className="flex flex-col gap-3 pb-6">
              {activities.map((action) => {
                const t = THEME_MAP[action.theme] ?? DEFAULT_THEME;
                return (
                  <button
                    key={action.id}
                    id={`participate-action-${action.id}`}
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

          {activities.length === 0 && <div className="pb-6" />}

        </main>
      </div>
    </>
  );
}
