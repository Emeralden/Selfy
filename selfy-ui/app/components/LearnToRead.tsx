"use client";

import { useState, useEffect } from "react";

interface LearnToReadProps {
  onClose: () => void;
  onDone: (result: "correct" | "wrong") => void;
  isLoading?: boolean;
}

const ITEMS = [
  { emoji: "🐱", name: "Cat",   distractors: ["Car", "Apple"] },
  { emoji: "🍎", name: "Apple", distractors: ["Cat",  "Car"]  },
  { emoji: "🚗", name: "Car",   distractors: ["Apple", "Cat"] },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function LearnToRead({ onClose, onDone, isLoading = false }: LearnToReadProps) {
  const [item]    = useState(() => ITEMS[Math.floor(Math.random() * ITEMS.length)]);
  const [choices, setChoices] = useState<string[]>([]);
  const [picked,  setPicked]  = useState<string | null>(null);

  // Shuffle choices once on mount
  useEffect(() => {
    setChoices(shuffle([item.name, ...item.distractors]));
  }, [item]);

  const handlePick = (choice: string) => {
    if (picked || isLoading) return;
    setPicked(choice);
    const result = choice === item.name ? "correct" : "wrong";
    // Brief pause so the flash is visible before popup fires
    setTimeout(() => onDone(result), 1000);
  };

  const isCorrect = (c: string) => picked && c === item.name;
  const isWrong   = (c: string) => picked && c !== item.name && c === picked;

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-950/30 vignette-overlay" />

      {/* Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={[
          "relative z-10 w-full max-w-sm overflow-hidden",
          "rounded-4xl border border-white/60",
          "bg-white/95 backdrop-blur-2xl",
          "shadow-[0_32px_80px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.5)_inset]",
          "flex flex-col",
          "animate-in zoom-in-95 fade-in duration-200",
        ].join(" ")}
      >
        {/* Top strip — mind blue theme */}
        <div
          className="h-1 w-full rounded-t-4xl"
          style={{ background: "linear-gradient(to right, #1D4ED8, #60A5FA, #1D4ED8)" }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <h3 className="text-[17px] font-black tracking-tight text-on-surface">
              Learn to Read
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
        <p className="text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-5 mb-3">
          What is this?
        </p>

        {/* Emoji display */}
        <div
          className="mx-5 flex items-center justify-center rounded-3xl mb-5"
          style={{
            height: 160,
            background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
            border: "1.5px solid #BFDBFE",
            boxShadow: "inset 0 2px 12px rgba(29,78,216,0.07)",
          }}
        >
          {/* Result flash overlay */}
          {picked && (
            <div
              className="absolute inset-0 rounded-3xl transition-opacity duration-300 pointer-events-none"
              style={{
                background: picked === item.name
                  ? "rgba(0,200,0,0.12)"
                  : "rgba(255,36,0,0.12)",
              }}
            />
          )}
          <span
            className="text-[96px] leading-none select-none transition-transform duration-200"
            style={{ filter: "drop-shadow(0 8px 20px rgba(29,78,216,0.15))" }}
          >
            {item.emoji}
          </span>
        </div>

        {/* Divider */}
        <div
          className="mx-5 h-px mb-4"
          style={{ background: "linear-gradient(to right, transparent, #E2E8F0, transparent)" }}
        />

        {/* Choice buttons */}
        <div className="px-5 pb-5 flex flex-col gap-2.5">
          {choices.map((choice) => {
            let bg = "bg-white border border-slate-200 text-on-surface";
            let shadow = "shadow-sm";

            if (isCorrect(choice)) {
              bg = "bg-[#00C800] border-transparent text-white";
              shadow = "shadow-[0_4px_16px_rgba(0,200,0,0.4)]";
            } else if (isWrong(choice)) {
              bg = "bg-[#FF2400] border-transparent text-white";
              shadow = "shadow-[0_4px_16px_rgba(255,36,0,0.3)]";
            }

            return (
              <button
                key={choice}
                id={`read-choice-${choice.toLowerCase()}`}
                onClick={() => handlePick(choice)}
                disabled={!!picked || isLoading}
                className={[
                  "flex items-center justify-center w-full rounded-2xl px-4 py-3",
                  "text-[15px] font-black tracking-wide",
                  "transition-all duration-200 active:scale-[0.97]",
                  "disabled:cursor-default",
                  bg,
                  shadow,
                ].join(" ")}
              >
                {/* Correct tick / wrong X shown after pick */}
                {isCorrect(choice) && (
                  <span className="material-symbols-outlined text-[18px] mr-2">check_circle</span>
                )}
                {isWrong(choice) && (
                  <span className="material-symbols-outlined text-[18px] mr-2">cancel</span>
                )}
                {choice}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
