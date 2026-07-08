"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Header from "../components/Header";
import DrawingCanvas from "../components/DrawingCanvas";
import BlockTower from "../components/BlockTower";
import LearnToRead from "../components/LearnToRead";
import SchoolFest from "../components/SchoolFest";
import { useCharacterStore } from "../store/useCharacterStore";
import { usePopupStore } from "../store/usePopupStore";
import { apiClient } from "@/lib/apiClient";



const ACTIVITIES = [
  {
    id: "draw",
    label: "Draw Something Weird",
    emoji: "🖍️",
    grad: "linear-gradient(145deg, #FFF0E5 0%, #FFB077 45%, #FF6B00 100%)",
    glow: "rgba(255, 107, 0, 0.35)",
    labelBg: "rgba(255,107,0,0.08)",
    labelColor: "#7C2D12",
    emojiGlow: "drop-shadow(0 6px 16px rgba(255,107,0,0.55))",
    noiseOpacity: 0.04,
  },
  {
    id: "blocks",
    label: "Build Block Tower",
    emoji: "🧱",
    grad: "linear-gradient(145deg, #DCFCE7 0%, #6EE76E 45%, #00C800 100%)",
    glow: "rgba(0, 200, 0, 0.32)",
    labelBg: "rgba(0,200,0,0.08)",
    labelColor: "#14532D",
    emojiGlow: "drop-shadow(0 6px 16px rgba(0,200,0,0.5))",
    noiseOpacity: 0.04,
  },
  {
    id: "read",
    label: "Learn to Read",
    emoji: "📖",
    grad: "linear-gradient(145deg, #DBEAFE 0%, #93C5FD 45%, #1D4ED8 100%)",
    glow: "rgba(29, 78, 216, 0.32)",
    labelBg: "rgba(29,78,216,0.08)",
    labelColor: "#1E3A8A",
    emojiGlow: "drop-shadow(0 6px 16px rgba(29,78,216,0.5))",
    noiseOpacity: 0.04,
  },
  {
    id: "fest",
    label: "School Fest",
    emoji: "🌟",
    grad: "linear-gradient(145deg, #FFE4F0 0%, #FF80BF 45%, #FF007F 100%)",
    glow: "rgba(255, 0, 127, 0.32)",
    labelBg: "rgba(255,0,127,0.08)",
    labelColor: "#831843",
    emojiGlow: "drop-shadow(0 6px 16px rgba(255,0,127,0.5))",
    noiseOpacity: 0.04,
  },
];





const ACTION_SLUGS: Record<string, string> = {
  draw:   "draw_weird",
  blocks: "build_blocks",
  read:   "learn_read",
  fest:   "school_fest",
};

export default function PreSchoolPage() {
  const charId     = useCharacterStore((s) => s.charId) ?? "";
  const { showPopup } = usePopupStore();

  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [showDrawing, setShowDrawing] = useState(false);
  const [showBlocks,  setShowBlocks]  = useState(false);
  const [showRead,    setShowRead]    = useState(false);
  const [showFest,    setShowFest]    = useState(false);

  const queryClient = useQueryClient();

  // ── Star count — lives in RQ cache, survives remounts ────────────────────
  const { data: stars = 0 } = useQuery({
    queryKey: ["edu-stars", charId],
    queryFn: async () => {
      const res = await apiClient.get(`/pre-school/${charId}/stars`);
      return res.data.stars as number;
    },
    enabled: !!charId,
  });

  // ── Education action mutation ────────────────────────────────────────────
  const educationMutation = useMutation({
    mutationFn: async (actionKey: string) => {
      // Format: "action_name" or "action_name:outcome"
      const [action_name, outcome] = actionKey.split(":");
      const res = await apiClient.get(`/pre-school/${charId}/action`, {
        params: { action_name, ...(outcome ? { outcome } : {}) },
      });
      return res.data as { title: string; body: string; stars: number };
    },
    onSuccess: (data) => {
      if (typeof data.stars === "number") {
        queryClient.setQueryData(["edu-stars", charId], data.stars);
      }
      showPopup(data.body, data.title, "palette");
    },
    onError: (err: any) => {
      showPopup(err?.response?.data?.detail ?? "Something went wrong.", "Oops!", "error");
    },
  });

  const handleActivityTap = (id: string) => {
    if (id === "draw") {
      setShowDrawing(true);
      return;
    }
    if (id === "blocks") { setShowBlocks(true); return; }
    if (id === "read")   { setShowRead(true);   return; }
    if (id === "fest")   { setShowFest(true);   return; }
    setActiveCard(activeCard === id ? null : id);
  };

  const handleDrawingDone = (_dataUrl: string) => {
    setShowDrawing(false);
    const slug = ACTION_SLUGS["draw"];
    if (slug) educationMutation.mutate(slug);
  };

  const handleBlocksDone = (result: "success" | "fail") => {
    setShowBlocks(false);
    educationMutation.mutate(`build_blocks:${result}`);
  };

  const handleReadDone = (result: "correct" | "wrong") => {
    setShowRead(false);
    educationMutation.mutate(`learn_read:${result}`);
  };

  const handleFestDone = (role: "lion" | "tree" | "astronaut") => {
    setShowFest(false);
    educationMutation.mutate(`school_fest:${role}`);
  };

  return (
    <>
    {showDrawing && (
      <DrawingCanvas
        onClose={() => setShowDrawing(false)}
        onDone={handleDrawingDone}
        isLoading={educationMutation.isPending}
      />
    )}
    {showBlocks && (
      <BlockTower
        onClose={() => setShowBlocks(false)}
        onDone={handleBlocksDone}
        isLoading={educationMutation.isPending}
      />
    )}
    {showRead && (
      <LearnToRead
        onClose={() => setShowRead(false)}
        onDone={handleReadDone}
        isLoading={educationMutation.isPending}
      />
    )}
    {showFest && (
      <SchoolFest
        onClose={() => setShowFest(false)}
        onDone={handleFestDone}
        isLoading={educationMutation.isPending}
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

            <h1 className="text-2xl font-black tracking-tight text-slate-800/95">Pre-School</h1>

            <div className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 shadow-inner">
              <span className="material-symbols-outlined text-lg text-primary">toys</span>
            </div>

          </div>
        </header>

        {/* ── Sticker Chart ── */}
        <div
          className="relative overflow-hidden rounded-3xl p-5"
          style={{
            background: "linear-gradient(160deg, #FFFDE7 0%, #FFF9C4 40%, #FFF3E0 75%, #FCE4EC 100%)",
            boxShadow: "0 8px 32px -8px rgba(255,180,0,0.22), 0 2px 8px -2px rgba(255,120,180,0.12)",
            border: "2.5px dashed rgba(255,180,50,0.45)",
          }}
        >
          {/* rainbow stripe top bar */}
          <div
            className="pointer-events-none absolute top-0 left-0 right-0 h-2 rounded-t-3xl"
            style={{
              background: "linear-gradient(90deg, #FF6B6B, #FFB347, #FFE066, #88D8B0, #6EC6FF, #C589E8)",
            }}
          />

          {/* polka dot texture overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, #7C3AED 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10 flex items-center justify-between mt-1">
            <div>
              <h2 className="text-2xl font-black tracking-tight" style={{ color: "#7C2D12", textShadow: "0 1px 0 rgba(255,255,255,0.8)" }}>
                Sticker Chart ⭐
              </h2>
              <p className="mt-1 text-sm font-bold" style={{ color: "#A16207" }}>
                Collect all 5 to make Mommy proud!
              </p>
            </div>

            {/* count badge — crayon-circle style */}
            <div
              className="flex h-16 w-16 flex-col items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, #FFE066 0%, #FFB347 100%)",
                boxShadow: "0 4px 16px -4px rgba(255,160,0,0.5), inset 0 1px 0 rgba(255,255,255,0.6)",
                border: "2.5px solid rgba(255,255,255,0.7)",
              }}
            >
              <span className="text-2xl font-black leading-none" style={{ color: "#7C2D12" }}>{stars}</span>
              <span className="text-[10px] font-black leading-none" style={{ color: "#92400E" }}>/ 5</span>
            </div>
          </div>

          {/* ── Star slots row ── */}
          {(() => {
            const slotColors = [
              { filled: "#FF6B6B", empty: "#FFD6D6", border: "#FF8888" },
              { filled: "#FFB347", empty: "#FFE5C0", border: "#FFCC77" },
              { filled: "#FFE066", empty: "#FFF5C0", border: "#FFD700" },
              { filled: "#88D8B0", empty: "#C8F0DC", border: "#66C893" },
              { filled: "#C589E8", empty: "#EDD8FF", border: "#B066DD" },
            ];
            return (
              <div className="relative z-10 mt-4 flex items-center gap-2.5">
                {Array.from({ length: 5 }).map((_, i) => {
                  const c = slotColors[i];
                  const earned = i < stars;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center justify-center rounded-2xl py-2.5 gap-0.5 transition-all duration-500"
                      style={{
                        background: earned ? c.filled : c.empty,
                        border: `2px ${earned ? "solid" : "dashed"} ${c.border}`,
                        transform: earned ? "scale(1.07) rotate(-1deg)" : "scale(1)",
                        boxShadow: earned ? `0 4px 12px -4px ${c.filled}88` : "none",
                      }}
                    >
                      <span
                        className="text-xl leading-none transition-all duration-300"
                        style={{
                          filter: earned ? `drop-shadow(0 2px 6px ${c.filled})` : "grayscale(1) opacity(0.35)",
                          transform: earned ? "rotate(5deg)" : "none",
                          display: "inline-block",
                        }}
                      >
                        ⭐
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

        </div>

        {/* ── Section label ── */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Activities
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* ── 2×2 Toy Block Grid ── */}
        <div className="grid grid-cols-2 gap-4 pb-4">
          {ACTIVITIES.map((act) => (
            <button
              key={act.id}
              id={`activity-${act.id}`}
              type="button"
              onClick={() => handleActivityTap(act.id)}
              className="group relative overflow-hidden rounded-3xl transition-all duration-200 active:scale-[0.93]"
              style={{
                background: act.grad,
                boxShadow: `0 12px 36px -8px ${act.glow}, inset 0 1px 0 rgba(255,255,255,0.7)`,
                aspectRatio: "1 / 1",
                border: "none",
                outline: activeCard === act.id ? `2.5px solid ${act.glow.replace("0.32", "0.8")}` : "none",
                outlineOffset: "2px",
              }}
              aria-pressed={activeCard === act.id}
            >
              {/* top-left frosted glass pill — label */}
              <div
                className="absolute top-3 left-3 right-3 flex items-center justify-center rounded-xl px-2 py-1"
                style={{
                  background: "rgba(255,255,255,0.45)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.65)",
                }}
              >
                <span
                  className="text-[10px] font-black uppercase tracking-widest leading-none text-center"
                  style={{ color: act.labelColor }}
                >
                  {act.label}
                </span>
              </div>

              {/* inner highlight ring */}
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl"
                style={{
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.04)",
                }}
              />

              {/* emoji */}
              <div className="flex h-full items-center justify-center">
                <span
                  className="text-7xl leading-none transition-transform duration-200 group-hover:scale-110 group-active:scale-90 mt-5"
                  style={{ filter: act.emojiGlow }}
                  aria-hidden="true"
                >
                  {act.emoji}
                </span>
              </div>
            </button>
          ))}
        </div>

      </main>
    </div>
    </>
  );
}
