"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import Header from "../../../components/Header";
import { useMemo } from "react";

const PRIMARY = "#334155"; // Slate-700
const PRIMARY_LIGHT = "#94a3b8"; // Slate-400

export default function CemeteryDetailsPage() {
  const { charId } = useParams();

  // ── Character Details ──────────────────────────────────────────────────────
  const { data: character, isLoading: isCharLoading } = useQuery<any>({
    queryKey: ["character", charId],
    queryFn: async () => (await apiClient.get(`/character/${charId}`)).data,
    enabled: !!charId,
  });

  // ── Character Events (Logs) ────────────────────────────────────────────────
  const { data: events = [], isLoading: isEventsLoading } = useQuery<any[]>({
    queryKey: ["events", charId],
    queryFn: async () => (await apiClient.get(`/character/${charId}/events`)).data,
    enabled: !!charId,
  });

  const { data: netWorthData } = useQuery<any>({
    queryKey: ["net-worth", charId],
    queryFn: async () => (await apiClient.get(`/character/${charId}/net-worth`)).data,
    enabled: !!charId,
  });

  // Extract eulogy (last event) and the rest of the logs
  const { eulogy, lifeEvents } = useMemo(() => {
    if (!events.length) return { eulogy: null, lifeEvents: [] };
    const sorted = [...events].sort((a, b) => a.age - b.age);
    const last = sorted.pop();
    return { eulogy: last, lifeEvents: sorted };
  }, [events]);

  const isLoading = isCharLoading || isEventsLoading;

  // Group events by age
  const eventsByAge = useMemo(() => {
    const map = new Map<number, any[]>();
    for (const evt of lifeEvents) {
      if (!map.has(evt.age)) map.set(evt.age, []);
      map.get(evt.age)!.push(evt);
    }
    return Array.from(map.keys())
      .sort((a, b) => a - b)
      .map((age) => ({
        age,
        events: map.get(age) || [],
      }));
  }, [lifeEvents]);

  if (isLoading || !character) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-[#FAFBFF]">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <span className="animate-pulse text-[15px] font-black text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }

  // Frosted glass style
  const frosted = {
    background: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(255,255,255,0.4)",
    backdropFilter: "blur(10px)",
  } as React.CSSProperties;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#FAFBFF]">
      <Header />

      <main className="hide-scrollbar mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5 space-y-6">
        
        {/* ── Tombstone Header ── */}
        <header 
          className="relative overflow-hidden rounded-3xl p-6 shadow-sm border border-slate-200"
          style={{ background: "linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)" }}
        >
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            
            <Link href="/user/cemetery" className="absolute left-0 top-0">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150 hover:bg-white/10 active:scale-95"
              >
                <span className="material-symbols-outlined text-slate-300">arrow_back</span>
              </button>
            </Link>

            {/* Avatar portrait */}
            <div
              className="relative mb-4 flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-lg border border-slate-600 bg-slate-800"
            >
              {character.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={character.avatar_url} 
                  alt="Avatar" 
                  className="absolute h-full w-full object-cover scale-[1.2] translate-y-[0.5rem] grayscale-[0.2]" 
                />
              ) : (
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "3rem", color: "rgba(255,255,255,0.2)" }}
                >
                  deceased
                </span>
              )}
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">
              {character.first_name} {character.last_name}
            </h1>
            <p className="mt-1 text-[13px] font-bold uppercase tracking-widest text-slate-300">
              Lived {character.age} years
            </p>

            {/* Eulogy */}
            {eulogy && (
              <div 
                className="mt-6 rounded-2xl p-5 w-full text-left bg-white/10 border border-white/10 backdrop-blur-md"
              >
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-slate-400 mt-1">format_quote</span>
                  <p className="text-[14px] leading-relaxed text-slate-100 italic">
                    {eulogy.text}
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ── Final Stats ── */}
        <div className="flex justify-center">
          <div 
            className="flex w-full flex-col items-center justify-center rounded-3xl p-6 shadow-sm border border-slate-200"
            style={{ 
              background: "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.9) 100%)",
              backdropFilter: "blur(12px)"
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-500 text-[20px]">account_balance</span>
              <span className="text-[12px] font-black uppercase tracking-widest text-slate-500">Final Net Worth</span>
            </div>
            <span className="text-3xl font-black tracking-tight text-slate-800">
              ₹{netWorthData?.net_worth?.toLocaleString() || character.cash.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ── Life Logs ── */}
        <div className="mt-8">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-black text-slate-700">
            <span className="material-symbols-outlined text-slate-400">history</span>
            Life History
          </h2>
          
          <div className="space-y-6">
            {eventsByAge.map(({ age, events }) => (
              <div key={age} className="rounded-3xl p-4 bg-white border border-slate-100 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-6 w-2 rounded-full bg-slate-300" />
                  <span className="text-sm font-black uppercase tracking-widest text-slate-600">
                    Year {age}
                  </span>
                </div>
                
                <div className="ml-3 space-y-3 border-l-2 border-slate-100 pl-6">
                  {events.map((evt: any) => (
                    <div key={evt.id} className="flex items-start gap-2 py-1.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                      <p className="text-sm leading-snug text-slate-600">
                        {evt.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {eventsByAge.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">
                No life events recorded.
              </p>
            )}
          </div>
        </div>

        <div className="pb-8" />
      </main>
    </div>
  );
}
