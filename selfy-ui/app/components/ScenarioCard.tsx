"use client";

import { usePopupStore } from "../store/usePopupStore";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function ScenarioCard() {
  const { message, title, icon, choices, onChoice, clearPopup } =
    usePopupStore();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(false);

  const hasChoices = choices && choices.length > 0;

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  // Show "Tap anywhere" hint after 10s — only for simple (no-choice) popups
  useEffect(() => {
    if (!message || hasChoices) {
      setShowHint(false);
      return;
    }
    setShowHint(false);
    const t = setTimeout(() => setShowHint(true), 10_000);
    return () => clearTimeout(t);
  }, [message, hasChoices]);

  if (!message) return null;

  const handleDismiss = () => {
    clearPopup();
    if (!hasChoices) {
      router.push("/");
    }
  };

  const handleChoice = (slug: string) => {
    clearPopup();
    onChoice?.(slug);
  };

  const variantStyles: Record<string, string> = {
    primary:
      "bg-primary text-white shadow-[0_4px_16px_rgba(109,40,217,0.35)] hover:bg-[#5B21B6] active:scale-[0.97]",
    danger:
      "bg-rose-500 text-white shadow-[0_4px_16px_rgba(244,63,94,0.35)] hover:bg-rose-600 active:scale-[0.97]",
    muted:
      "bg-white border border-slate-200 text-on-surface-variant hover:bg-slate-50 active:scale-[0.97] shadow-sm",
  };

  return (
    /* ── Backdrop — tap anywhere dismisses simple popup ── */
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={hasChoices ? undefined : handleDismiss}
    >
      {/* Dark vignette */}
      <div className="absolute inset-0 bg-slate-950/30 vignette-overlay" />

      {/* Card */}
      <div
        ref={cardRef}
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
        {/* ── Top gradient strip ── */}
        <div className="h-1 w-full bg-linear-to-r from-violet-500 via-primary to-purple-400 rounded-t-4xl" />

        <div className="px-6 pt-6 pb-5">
          {/* Icon bubble */}
          <div className="flex justify-center mb-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner"
              style={{
                background: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)",
              }}
            >
              <span
                className="material-symbols-outlined text-[28px] text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {icon}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-center text-[22px] font-black tracking-tight text-on-surface leading-tight mb-2">
            {title}
          </h3>

          {/* Body text */}
          <p className="text-center text-[14px] leading-relaxed text-on-surface-variant font-medium px-1">
            {message}
          </p>
        </div>

        {/* ── Choices variant ── */}
        {hasChoices ? (
          <div className="px-5 pb-5 pt-0 flex flex-col gap-2.5">
            <div
              className="h-px w-full mb-1"
              style={{
                background:
                  "linear-gradient(to right, transparent, #E2E8F0, transparent)",
              }}
            />
            {choices.map((choice) => (
              <button
                key={choice.slug}
                id={`scenario-choice-${choice.slug}`}
                onClick={() => handleChoice(choice.slug)}
                className={[
                  "flex items-center gap-3 w-full rounded-2xl px-4 py-3",
                  "text-left text-sm font-bold tracking-tight",
                  "transition-all duration-150",
                  variantStyles[choice.variant ?? "muted"],
                ].join(" ")}
              >
                {choice.icon && (
                  <span
                    className="material-symbols-outlined text-[18px] shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {choice.icon}
                  </span>
                )}
                <span>{choice.label}</span>
                <span className="material-symbols-outlined text-[16px] ml-auto opacity-60">
                  chevron_right
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* ── Simple variant: delayed "tap anywhere" hint ── */
          <div
            className={[
              "flex justify-center pb-5 pt-0 transition-all duration-500",
              showHint ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none",
            ].join(" ")}
            aria-hidden={!showHint}
          >
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant/50 select-none">
              Tap anywhere to continue
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
