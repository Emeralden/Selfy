"use client";
import Link from "next/link";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCharacterStore } from "../store/useCharacterStore";
import { apiClient } from "@/lib/apiClient";
import Header from "../components/Header";

// ── Stage icon helper ────────────────────────────────────────────────────────
function getStageIcon(stage: string): string {
  const map: Record<string, string> = {
    "Baby":       "baby_changing_station",
    "Toddler":    "child_care",
    "Pre-School": "toys",
    "School":     "school",
    "Exam-Prep":  "menu_book",
    "University": "account_balance",
    "Adult":      "trending_up",
    "Elder":      "elderly",
  };
  return map[stage] ?? "person";
}

const PRIMARY   = "#6D28D9";
const HERO_BG   = "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 60%, #DDD6FE 100%)";
const HERO_GLOW = "0 8px 24px -8px rgba(109,40,217,0.12)";
const HERO_BORDER = "rgba(109,40,217,0.12)";

export default function UserPage() {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const setCharId   = useCharacterStore((s) => s.setCharId);
  const charId      = useCharacterStore((s) => s.charId);

  // ── Auth user ─────────────────────────────────────────────────────────────
  const { data: user, isLoading: isUserLoading } = useQuery<{
    username: string;
    active_character_id: string | null;
  }>({
    queryKey: ["authMe"],
    queryFn: async () => (await apiClient.get("/auth/me")).data,
  });

  const CHAR_ID = charId ?? user?.active_character_id ?? "";

  // ── Active character ──────────────────────────────────────────────────────
  const { data: character } = useQuery<any>({
    queryKey: ["character", CHAR_ID],
    queryFn: async () => (await apiClient.get(`/character/${CHAR_ID}`)).data,
    enabled: !!CHAR_ID,
  });

  // ── Shelve mutation ───────────────────────────────────────────────────────
  const shelveMutation = useMutation({
    mutationFn: async () => (await apiClient.post("/character/shelve")).data,
    onSuccess: () => {
      setCharId("");
      queryClient.invalidateQueries({ queryKey: ["authMe"] });
      queryClient.invalidateQueries({ queryKey: ["character"] });
      router.push("/new-life");
    },
  });

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout").catch(() => {});
    } finally {
      queryClient.clear();
      setCharId("");
      router.push("/login");
    }
  };

  const joinedDate = user
    ? new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long" })
    : null;

  if (isUserLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <h1 className="animate-pulse text-xl font-black text-primary">Loading...</h1>
      </div>
    );
  }

  const hasActiveChar = !!character && character.alive !== false;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#FAFBFF]">
      <Header />

      <main className="hide-scrollbar mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* ── Page header ── */}
        <header className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 px-5 py-3 shadow-sm backdrop-blur-xl">
          <div className="absolute inset-0 bg-linear-to-br from-white/40 via-transparent to-slate-100/40" />
          <div className="relative flex items-center justify-center">

            <Link href="/" className="absolute left-0">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-inner transition-all duration-150 hover:opacity-80 active:scale-95"
                style={{ background: `${PRIMARY}14`, border: `1px solid ${PRIMARY}25` }}
              >
                <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
              </button>
            </Link>

            <h1 className="text-2xl font-black tracking-tight text-slate-800/95">Profile</h1>

            <div
              className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl shadow-inner"
              style={{ background: `${PRIMARY}14`, border: `1px solid ${PRIMARY}25` }}
            >
              <span className="material-symbols-outlined text-lg" style={{ color: PRIMARY }}>
                manage_accounts
              </span>
            </div>

          </div>
        </header>

        {/* ── Account Hero Card — always primary purple ── */}
        <div
          className="relative overflow-hidden rounded-3xl border px-5 py-5"
          style={{ background: HERO_BG, boxShadow: HERO_GLOW, borderColor: HERO_BORDER }}
        >
          <div
            className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(167,139,250,0.15), transparent 70%)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.10), transparent 70%)" }}
          />

          <div className="relative z-10 flex flex-col gap-1.5">
            <h2 className="text-[22px] font-black tracking-tight" style={{ color: PRIMARY }}>
              @{user?.username ?? "—"}
            </h2>
            {joinedDate && (
              <span
                className="flex w-fit items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-bold"
                style={{ background: `${PRIMARY}12`, color: PRIMARY }}
              >
                <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                {joinedDate}
              </span>
            )}
          </div>
        </div>

        {/* ── Active Character Card ── */}
        {character && (
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-50 px-5 py-3.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: `${PRIMARY}12`, border: `1px solid ${PRIMARY}20` }}
              >
                <span className="material-symbols-outlined text-[17px]" style={{ color: PRIMARY }}>
                  sports_esports
                </span>
              </div>
              <span className="text-[13px] font-black uppercase tracking-widest text-on-surface-variant">
                Active Character
              </span>
            </div>

            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: `${PRIMARY}10`, border: `1px solid ${PRIMARY}18` }}
                  >
                    <span className="material-symbols-outlined text-xl" style={{ color: PRIMARY }}>
                      {getStageIcon(character.stage)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[17px] font-black tracking-tight text-on-surface">
                      {character.first_name} {character.last_name}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                      {character.stage} · Age {character.age}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[18px] font-black tracking-tight text-primary">
                    ₹{character.money}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
                    Balance
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Lives Section ── */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-50 px-5 py-3.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: `${PRIMARY}12`, border: `1px solid ${PRIMARY}20` }}
            >
              <span className="material-symbols-outlined text-[17px]" style={{ color: PRIMARY }}>
                diversity_3
              </span>
            </div>
            <span className="text-[13px] font-black uppercase tracking-widest text-on-surface-variant">
              Lives
            </span>
          </div>

          <div className="divide-y divide-slate-50">

            {/* Start New Life */}
            <button
              type="button"
              onClick={() => shelveMutation.mutate()}
              disabled={shelveMutation.isPending}
              className="group flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50/60 active:bg-slate-100/60 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]" style={{ color: PRIMARY }}>
                  add_circle
                </span>
                <div className="flex flex-col items-start">
                  <span className="text-[14px] font-black text-on-surface">Start New Life</span>
                  <span className="text-[11px] text-on-surface-variant/60">
                    {hasActiveChar ? "Parks current character to resume later" : "Begin a fresh story"}
                  </span>
                </div>
              </div>
              {shelveMutation.isPending ? (
                <span className="material-symbols-outlined animate-spin text-[18px] text-primary/40">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant/30">
                  chevron_right
                </span>
              )}
            </button>

            {/* Resume Saved Lives */}
            <Link
              href="/user/saved-lives"
              className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50/60"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]" style={{ color: PRIMARY }}>
                  bookmarks
                </span>
                <div className="flex flex-col items-start">
                  <span className="text-[14px] font-black text-on-surface">Resume Saved Lives</span>
                  <span className="text-[11px] text-on-surface-variant/60">Switch to a saved character</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant/30">
                chevron_right
              </span>
            </Link>

          </div>
        </div>

        {/* ── Account Settings ── */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-50 px-5 py-3.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: `${PRIMARY}12`, border: `1px solid ${PRIMARY}20` }}
            >
              <span className="material-symbols-outlined text-[17px]" style={{ color: PRIMARY }}>
                settings
              </span>
            </div>
            <span className="text-[13px] font-black uppercase tracking-widest text-on-surface-variant">
              Account
            </span>
          </div>

          <div className="divide-y divide-slate-50">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant/50">
                  badge
                </span>
                <span className="text-[14px] font-semibold text-on-surface-variant">Username</span>
              </div>
              <span className="text-[14px] font-black text-on-surface">@{user?.username ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* ── Logout ── */}
        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center justify-center gap-2 overflow-hidden rounded-3xl border border-red-100 bg-red-50 px-5 py-4 transition-all duration-200 hover:bg-red-100 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px] text-red-500 transition-transform duration-200 group-hover:-translate-x-0.5">
            logout
          </span>
          <span className="text-[15px] font-black tracking-tight text-red-500">Log Out</span>
        </button>

        <div className="pb-4" />

      </main>
    </div>
  );
}
