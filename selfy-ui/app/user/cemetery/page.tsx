"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import Header from "../../components/Header";

const PRIMARY = "#334155"; // Slate-700 for a tombstone/cemetery vibe

export default function CemeteryPage() {
  // ── Deceased characters ──────────────────────────────────────────────────────
  const { data: cemeteryChars = [], isLoading } = useQuery<any[]>({
    queryKey: ["cemetery-characters"],
    queryFn: async () => (await apiClient.get("/character/cemetery")).data,
  });

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#FAFBFF]">
      <Header />

      <main className="hide-scrollbar mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* ── Page header ── */}
        <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 px-5 py-3 shadow-sm backdrop-blur-xl">
          <div className="absolute inset-0 bg-linear-to-br from-slate-100/40 via-transparent to-slate-200/40" />
          <div className="relative flex items-center justify-center">
            <Link href="/user" className="absolute left-0">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-inner transition-all duration-150 hover:opacity-80 active:scale-95"
                style={{ background: `${PRIMARY}14`, border: `1px solid ${PRIMARY}25` }}
              >
                <span className="material-symbols-outlined text-slate-600">arrow_back</span>
              </button>
            </Link>

            <h1 className="text-2xl font-black tracking-tight text-slate-800/95">Cemetery</h1>

            <div
              className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl shadow-inner"
              style={{ background: `${PRIMARY}14`, border: `1px solid ${PRIMARY}25` }}
            >
              <span className="material-symbols-outlined text-lg" style={{ color: PRIMARY }}>
                deceased
              </span>
            </div>
          </div>
        </header>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <span className="animate-pulse text-[15px] font-black text-slate-500">Loading...</span>
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && cemeteryChars.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-white/60 px-6 py-14">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-3xl"
              style={{ background: `${PRIMARY}10`, border: `1px solid ${PRIMARY}18` }}
            >
              <span className="material-symbols-outlined text-3xl" style={{ color: PRIMARY }}>
                sentiment_satisfied
              </span>
            </div>
            <div className="text-center">
              <p className="text-[16px] font-black text-slate-700">No fallen characters yet</p>
              <p className="mt-1 text-[12px] text-slate-500">
                Your characters who pass away will be remembered here.
              </p>
            </div>
            <Link href="/user">
              <button
                type="button"
                className="rounded-2xl px-5 py-2.5 text-[13px] font-black text-white transition-all active:scale-95 bg-slate-700"
              >
                Back to Profile
              </button>
            </Link>
          </div>
        )}

        {/* ── Deceased character cards ── */}
        {!isLoading && cemeteryChars.length > 0 && (
          <div className="flex flex-col gap-3">
            {cemeteryChars.map((char: any) => (
              <Link key={char.id} href={`/user/cemetery/${char.id}`}>
                <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.98]">
                  <div className="flex items-center justify-between px-5 py-4">
                    {/* Character info */}
                    <div className="flex items-center gap-4">
                      {char.avatar_url ? (
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={char.avatar_url} 
                            alt="Avatar" 
                            className="h-full w-full object-cover scale-[1.3] translate-y-2"
                          />
                        </div>
                      ) : (
                        <div
                          className="flex h-14 w-14 items-center justify-center rounded-2xl"
                          style={{ background: `${PRIMARY}10`, border: `1px solid ${PRIMARY}18` }}
                        >
                          <span
                            className="material-symbols-outlined text-2xl"
                            style={{ color: PRIMARY }}
                          >
                            deceased
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-[16px] font-black tracking-tight text-slate-800">
                          {char.first_name} {char.last_name}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                          Lived to {char.age}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center text-slate-400 group-hover:text-slate-600 transition-colors">
                      <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </div>
                  </div>

                  {/* Location */}
                  {(char.state || char.country) && (
                    <div className="flex items-center gap-1.5 border-t border-slate-100 px-5 py-2.5 bg-slate-50/50">
                      <span className="material-symbols-outlined text-[13px] text-slate-400">
                        location_on
                      </span>
                      <span className="text-[12px] font-semibold text-slate-500">
                        {[char.state, char.country].filter(Boolean).join(", ")}
                      </span>
                      <span className="ml-auto text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        {char.gender}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="pb-4" />
      </main>
    </div>
  );
}
