"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/app/components/Header";
import { useCharacterStore } from "@/app/store/useCharacterStore";
import { usePopupStore } from "@/app/store/usePopupStore";
import { apiClient } from "@/lib/apiClient";
import { THEME_MAP, DEFAULT_THEME } from "@/lib/themeMap";

type Club = {
  id: string;
  label: string;
  emoji: string;
  theme: string;
  stat_hint: string;
};

export default function ClubsPage() {
  const rawCharId = useCharacterStore((s) => s.charId);
  const charId = rawCharId ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();
  const showPopup = usePopupStore((s) => s.showPopup);
  const showScenario = usePopupStore((s) => s.showScenario);

  // ── Fetch clubs from engine (via API) ──────────────────────────────────────
  const { data: clubs = [], isLoading: clubsQueryLoading } = useQuery<Club[]>({
    queryKey: ["participate-clubs", charId],
    queryFn: async () => (await apiClient.get(`/participate/${charId}/clubs`)).data,
    enabled: !!rawCharId,
  });

  // Treat pre-hydration (charId not yet set) as loading to prevent empty-state flash
  const isLoading = !rawCharId || clubsQueryLoading;

  const joinMutation = useMutation({
    mutationFn: async (clubKey: string) =>
      (await apiClient.post(`/participate/${charId}/club/join?club=${clubKey}`)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["participate-club", charId] });
      queryClient.invalidateQueries({ queryKey: ["participate-clubs", charId] });
      queryClient.invalidateQueries({ queryKey: ["character", charId] });
      showPopup(data.body, data.title, "emoji_events");
      router.push("/school/participate");
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Something went wrong.";
      showPopup(msg, "Oops!", "error");
    },
  });

  function handleJoin(club: Club) {
    showScenario(
      `Join ${club.label}? ${club.emoji}`,
      `You're about to sign up for ${club.label}. You can only be in one club at a time. Ready?`,
      [
        { label: `Join ${club.label}`, slug: "confirm", variant: "primary" },
        { label: "Cancel", slug: "cancel", variant: "muted" },
      ],
      (slug) => { if (slug === "confirm") joinMutation.mutate(club.id); },
      "emoji_events"
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#FAFBFF]">
      <Header />

      <main className="hide-scrollbar mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* ── Page Header ── */}
        <header className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 px-5 py-3 shadow-sm backdrop-blur-xl">
          <div className="absolute inset-0 bg-linear-to-br from-white/40 via-transparent to-slate-100/40" />
          <div className="relative flex items-center justify-center">
            <Link href="/school/participate" className="absolute left-0">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/15 bg-amber-500/10 shadow-inner transition-all duration-150 hover:bg-white active:scale-95"
              >
                <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
              </button>
            </Link>

            <h1 className="text-2xl font-black tracking-tight text-slate-800/95">Join a Club</h1>

            <div className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/15 bg-amber-500/10 shadow-inner">
              <span className="material-symbols-outlined text-lg text-amber-500">groups</span>
            </div>
          </div>
        </header>

        {/* ── Subtitle ── */}
        <p className="px-1 text-[13px] font-bold text-slate-400">
          Pick one. You can only be in one club at a time.
        </p>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <h1 className="animate-pulse text-xl font-black text-amber-500">Loading clubs...</h1>
          </div>
        )}

        {/* ── Club Grid (3 columns) — rendered from API data ── */}
        {!isLoading && clubs.length > 0 && (
          <div className="grid grid-cols-3 gap-3 pb-6">
            {clubs.map((club) => {
              const t = THEME_MAP[club.theme] ?? DEFAULT_THEME;
              return (
                <button
                  key={club.id}
                  id={`club-join-${club.id}`}
                  type="button"
                  onClick={() => handleJoin(club)}
                  disabled={joinMutation.isPending}
                  className="group flex flex-col items-center justify-center gap-3 rounded-3xl px-3 py-5 transition-all duration-200 active:scale-[0.93] disabled:opacity-50"
                  style={{
                    background: t.bg,
                    border: `1.5px solid ${t.color}28`,
                    boxShadow: `0 4px 16px -4px ${t.glow}, inset 0 1px 0 rgba(255,255,255,0.8)`,
                  }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-transform duration-200 group-hover:scale-110 group-active:scale-90"
                    style={{ background: `${t.color}18`, border: `1.5px solid ${t.color}30` }}
                  >
                    {club.emoji}
                  </div>
                  <span
                    className="text-center text-[11px] font-black leading-tight tracking-wide"
                    style={{ color: "#334155" }}
                  >
                    {club.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && clubs.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-100 bg-white/70 px-6 py-12 text-center shadow-sm backdrop-blur-xl">
            <span className="material-symbols-outlined text-4xl text-slate-300">do_not_disturb_on</span>
            <p className="text-sm font-bold text-slate-400">No clubs available right now.</p>
            <p className="text-xs text-slate-300">You might already be in a club, or clubs haven&apos;t unlocked yet.</p>
          </div>
        )}

      </main>
    </div>
  );
}
