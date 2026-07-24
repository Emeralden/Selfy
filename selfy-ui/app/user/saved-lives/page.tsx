"use client";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useCharacterStore } from "../../store/useCharacterStore";
import { apiClient } from "@/lib/apiClient";
import Header from "../../components/Header";

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

const PRIMARY = "#6D28D9";

export default function SavedLivesPage() {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const setCharId   = useCharacterStore((s) => s.setCharId);

  // ── Saved characters ──────────────────────────────────────────────────────
  const { data: savedChars = [], isLoading } = useQuery<any[]>({
    queryKey: ["saved-characters"],
    queryFn: async () => (await apiClient.get("/character/saved")).data,
  });

  // ── Confirm-delete state (charId → timeout ref) ─────────────────────────
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestDelete = (charId: string) => {
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    setConfirmingDelete(charId);
    // Auto-cancel after 3 s if user doesn't confirm
    confirmTimerRef.current = setTimeout(() => setConfirmingDelete(null), 3000);
  };

  // ── Delete mutation ───────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (charId: string) =>
      (await apiClient.delete(`/character/${charId}/delete`)).data,
    onSuccess: () => {
      setConfirmingDelete(null);
      queryClient.invalidateQueries({ queryKey: ["saved-characters"] });
    },
  });

  // ── Resume mutation ───────────────────────────────────────────────────────
  const resumeMutation = useMutation({
    mutationFn: async (charId: string) =>
      (await apiClient.post(`/character/${charId}/resume`)).data,
    onSuccess: (_data, charId) => {
      setCharId(charId);
      // Invalidate all relevant caches — previous active char is now a saved life
      queryClient.invalidateQueries({ queryKey: ["authMe"] });
      queryClient.invalidateQueries({ queryKey: ["character"] });
      queryClient.invalidateQueries({ queryKey: ["saved-characters"] });
      router.push("/");
    },
  });

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#FAFBFF]">
      <Header />

      <main className="hide-scrollbar mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* ── Page header ── */}
        <header className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 px-5 py-3 shadow-sm backdrop-blur-xl">
          <div className="absolute inset-0 bg-linear-to-br from-white/40 via-transparent to-slate-100/40" />
          <div className="relative flex items-center justify-center">

            <Link href="/user" className="absolute left-0">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-inner transition-all duration-150 hover:opacity-80 active:scale-95"
                style={{ background: `${PRIMARY}14`, border: `1px solid ${PRIMARY}25` }}
              >
                <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
              </button>
            </Link>

            <h1 className="text-2xl font-black tracking-tight text-slate-800/95">Saved Lives</h1>

            <div
              className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl shadow-inner"
              style={{ background: `${PRIMARY}14`, border: `1px solid ${PRIMARY}25` }}
            >
              <span className="material-symbols-outlined text-lg" style={{ color: PRIMARY }}>
                bookmarks
              </span>
            </div>

          </div>
        </header>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <span className="animate-pulse text-[15px] font-black text-primary">Loading...</span>
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && savedChars.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-white/60 px-6 py-14">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-3xl"
              style={{ background: `${PRIMARY}10`, border: `1px solid ${PRIMARY}18` }}
            >
              <span className="material-symbols-outlined text-3xl" style={{ color: PRIMARY }}>
                bookmarks
              </span>
            </div>
            <div className="text-center">
              <p className="text-[16px] font-black text-on-surface">No saved lives yet</p>
              <p className="mt-1 text-[12px] text-on-surface-variant/60">
                Start a new life from your profile to save your current character.
              </p>
            </div>
            <Link href="/user">
              <button
                type="button"
                className="rounded-2xl px-5 py-2.5 text-[13px] font-black text-white transition-all active:scale-95"
                style={{ background: PRIMARY }}
              >
                Back to Profile
              </button>
            </Link>
          </div>
        )}

        {/* ── Saved character cards ── */}
        {!isLoading && savedChars.length > 0 && (
          <div className="flex flex-col gap-3">
            {savedChars.map((char: any) => (
              <div
                key={char.id}
                className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between px-5 py-4">
                  {/* Character info */}
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ background: `${PRIMARY}10`, border: `1px solid ${PRIMARY}18` }}
                    >
                      <span
                        className="material-symbols-outlined text-xl"
                        style={{ color: PRIMARY }}
                      >
                        {getStageIcon(char.stage)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[16px] font-black tracking-tight text-on-surface">
                        {char.first_name} {char.last_name}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                        {char.stage} · Age {char.age}
                      </span>
                    </div>
                  </div>

                  {/* Cash + actions */}
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[15px] font-black tracking-tight text-primary">
                      ₹{char.cash}
                    </span>
                    <div className="flex items-center gap-2">

                      {/* Delete — tap once to arm, tap again to confirm */}
                      {confirmingDelete === char.id ? (
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(char.id)}
                          disabled={deleteMutation.isPending}
                          className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-black text-red-500 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {deleteMutation.isPending && deleteMutation.variables === char.id ? (
                            <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                          )}
                          Sure?
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => requestDelete(char.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400 transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-400 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}

                      {/* Resume */}
                      <button
                        type="button"
                        onClick={() => resumeMutation.mutate(char.id)}
                        disabled={resumeMutation.isPending}
                        className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-[12px] font-black text-white transition-all active:scale-95 disabled:opacity-50"
                        style={{ background: PRIMARY }}
                      >
                        {resumeMutation.isPending && resumeMutation.variables === char.id ? (
                          <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                        )}
                        Resume
                      </button>

                    </div>
                  </div>
                </div>

                {/* Location */}
                {(char.state || char.country) && (
                  <div className="flex items-center gap-1.5 border-t border-slate-50 px-5 py-2.5">
                    <span className="material-symbols-outlined text-[13px] text-on-surface-variant/40">
                      location_on
                    </span>
                    <span className="text-[12px] font-semibold text-on-surface-variant/50">
                      {[char.state, char.country].filter(Boolean).join(", ")}
                    </span>
                    <span className="ml-auto text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/30">
                      {char.gender}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="pb-4" />

      </main>
    </div>
  );
}
