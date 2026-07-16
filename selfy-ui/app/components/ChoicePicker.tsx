"use client";
import { useState } from "react";

// ── ChoicePicker ──────────────────────────────────────────────────────────────
// Shell matches ScenarioCard exactly — same strip, same icon bubble, same card.
// Bottom section: LearnToRead-style option buttons instead of a text message.

export interface OutcomeMeta {
  label: string;
  tone: string;
}

export interface ChoiceAction {
  id: string;
  label: string;
  emoji: string;
  theme: string;
  description?: string;
  outcomes: Record<string, OutcomeMeta>;
}

interface ChoicePickerProps {
  action: ChoiceAction;
  onPick: (outcomeKey: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function ChoicePicker({
  action,
  onPick,
  onClose,
  isLoading = false,
}: ChoicePickerProps) {
  const outcomeEntries = Object.entries(action.outcomes);
  const [picked, setPicked] = useState<string | null>(null);

  const handlePick = (key: string) => {
    if (picked || isLoading) return;
    setPicked(key);      // flash visual feedback instantly
    onPick(key);         // fire mutation immediately in parallel
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      {/* Dark vignette */}
      <div className="absolute inset-0 bg-slate-950/30 vignette-overlay" />

      {/* ── Card — same shell as ScenarioCard ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={[
          "relative z-10 w-full max-w-sm overflow-hidden",
          "rounded-4xl border border-white/60",
          "bg-white/90 backdrop-blur-2xl",
          "shadow-[0_32px_80px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.5)_inset]",
          "flex flex-col",
          "animate-in zoom-in-95 fade-in duration-200",
        ].join(" ")}
      >
        {/* ── Top gradient strip — same as ScenarioCard ── */}
        <div className="h-1 w-full bg-linear-to-r from-violet-500 via-primary to-purple-400 rounded-t-4xl" />

        <div className="px-6 pt-6 pb-5">
          {/* Icon bubble — same as ScenarioCard */}
          <div className="flex justify-center mb-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner"
              style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)" }}
            >
              <span className="text-[28px] leading-none">{action.emoji}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-center text-[22px] font-black tracking-tight text-on-surface leading-tight mb-2">
            {action.label}
          </h3>

          {/* Description — big emoji if short (picture prompt), subtitle if long */}
          {action.description && (
            action.description.length <= 4
              ? (
                <div className="flex justify-center mt-1 mb-1">
                  <span className="text-7xl leading-none select-none">{action.description}</span>
                </div>
              ) : (
                <p className="text-center text-[13px] font-semibold text-on-surface-variant/70 mt-0 mb-1">
                  {action.description}
                </p>
              )
          )}
        </div>

        {/* ── Options — LearnToRead-style cards ── */}
        <div className="px-5 pb-5 pt-0 flex flex-col gap-2.5">
          <div
            className="h-px w-full mb-1"
            style={{ background: "linear-gradient(to right, transparent, #E2E8F0, transparent)" }}
          />
          {outcomeEntries.map(([key, meta]) => {
            const isSelected = picked === key;
            const isDimmed   = picked && picked !== key;
            return (
              <button
                key={key}
                id={`choice-${action.id}-${key}`}
                type="button"
                onClick={() => handlePick(key)}
                disabled={isLoading}
                className={[
                  "flex items-center justify-center w-full rounded-2xl px-4 py-3",
                  "text-[15px] font-black tracking-wide",
                  "transition-all duration-150 disabled:cursor-default",
                  isSelected
                    ? "bg-primary/10 border border-primary/40 text-primary scale-[0.96] shadow-[0_0_0_3px_rgba(109,40,217,0.12)]"
                    : isDimmed
                    ? "bg-white border border-slate-200 text-on-surface shadow-sm opacity-40"
                    : "bg-white border border-slate-200 text-on-surface shadow-sm hover:border-slate-300 hover:shadow-md active:scale-[0.97]",
                ].join(" ")}
              >
                {meta.label}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
