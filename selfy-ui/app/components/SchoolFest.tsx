"use client";

import { useState } from "react";

interface SchoolFestProps {
  onClose: () => void;
  onDone: (role: "lion" | "tree" | "astronaut") => void;
  isLoading?: boolean;
}

const ROLES = [
  {
    id:    "lion"      as const,
    emoji: "🦁",
    label: "Lion",
    grad:  "linear-gradient(145deg, #FFF7ED 0%, #FED7AA 50%, #F97316 100%)",
    glow:  "rgba(249,115,22,0.35)",
    ring:  "#F97316",
  },
  {
    id:    "tree"      as const,
    emoji: "🌳",
    label: "Tree",
    grad:  "linear-gradient(145deg, #F0FDF4 0%, #86EFAC 50%, #16A34A 100%)",
    glow:  "rgba(22,163,74,0.35)",
    ring:  "#16A34A",
  },
  {
    id:    "astronaut" as const,
    emoji: "🚀",
    label: "Astronaut",
    grad:  "linear-gradient(145deg, #EFF6FF 0%, #93C5FD 50%, #1D4ED8 100%)",
    glow:  "rgba(29,78,216,0.35)",
    ring:  "#1D4ED8",
  },
] as const;

export default function SchoolFest({ onClose, onDone, isLoading = false }: SchoolFestProps) {
  const [picked, setPicked] = useState<"lion" | "tree" | "astronaut" | null>(null);

  const handlePick = (id: "lion" | "tree" | "astronaut") => {
    if (picked || isLoading) return;
    setPicked(id);
    setTimeout(() => onDone(id), 650);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-950/30 vignette-overlay" />

      {/* Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={[
          "relative z-10 w-full max-w-sm overflow-hidden",
          "rounded-[32px] border border-white/60",
          "bg-white/95 backdrop-blur-2xl",
          "shadow-[0_32px_80px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.5)_inset]",
          "flex flex-col",
          "animate-in zoom-in-95 fade-in duration-200",
        ].join(" ")}
      >
        {/* Top strip — appeal pink theme */}
        <div
          className="h-1 w-full rounded-t-[32px]"
          style={{ background: "linear-gradient(to right, #FF007F, #FF80BF, #FF007F)" }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌟</span>
            <h3 className="text-[17px] font-black tracking-tight text-on-surface">
              School Fest Performance
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Prompt */}
        <p className="text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-5 mb-4">
          Who do you want to be?
        </p>

        {/* Role cards row */}
        <div className="px-5 pb-5 flex gap-3">
          {ROLES.map((role) => {
            const isChosen = picked === role.id;
            const isDimmed = picked && picked !== role.id;

            return (
              <button
                key={role.id}
                id={`fest-role-${role.id}`}
                onClick={() => handlePick(role.id)}
                disabled={!!picked || isLoading}
                className={[
                  "flex-1 min-w-0 flex flex-col items-center gap-2 rounded-3xl py-4 px-2",
                  "transition-all duration-200 active:scale-95 disabled:cursor-default",
                  isDimmed ? "opacity-30" : "opacity-100",
                ].join(" ")}
                style={{
                  background: role.grad,
                  boxShadow: isChosen
                    ? `0 0 0 3px ${role.ring}, 0 12px 32px -6px ${role.glow}`
                    : `0 8px 24px -6px ${role.glow}, inset 0 1px 0 rgba(255,255,255,0.7)`,
                  transform: isChosen ? "scale(1.05)" : undefined,
                }}
              >
                {/* Emoji */}
                <span
                  className="text-[52px] leading-none"
                  style={{
                    filter: `drop-shadow(0 6px 14px ${role.glow})`,
                    transform: isChosen ? "scale(1.1)" : undefined,
                    transition: "transform 0.2s ease",
                  }}
                >
                  {role.emoji}
                </span>

                {/* Label pill */}
                <div
                  className="w-full rounded-xl px-2 py-1 text-center"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(255,255,255,0.7)",
                  }}
                >
                  <span
                    className="block truncate text-[10px] font-black uppercase tracking-widest"
                    style={{ color: role.ring }}
                  >
                    {role.label}
                  </span>
                </div>

                {/* Chosen checkmark */}
                {isChosen && (
                  <span
                    className="material-symbols-outlined text-[18px] animate-in zoom-in-50 duration-200"
                    style={{ color: role.ring }}
                  >
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
