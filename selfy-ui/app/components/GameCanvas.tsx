"use client";

// ── GameCanvas ────────────────────────────────────────────────────────────────
// Universal popup shell for interactive games.
// Same visual system as ScenarioCard / ChoicePicker — one strip, one card.
// Usage:
//   <GameCanvas title="Draw Something" emoji="🖍️" onClose={fn}>
//     <DrawingCanvas onDone={fn} />
//   </GameCanvas>

interface GameCanvasProps {
  title: string;
  emoji: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function GameCanvas({ title, emoji, onClose, children }: GameCanvasProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      {/* Dark vignette */}
      <div className="absolute inset-0 bg-slate-950/30 vignette-overlay" />

      {/* Card — same shell as ScenarioCard */}
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
        {/* Top gradient strip — same as ScenarioCard */}
        <div className="h-1 w-full bg-linear-to-r from-violet-500 via-primary to-purple-400 rounded-t-4xl" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">{emoji}</span>
            <h3 className="text-[17px] font-black tracking-tight text-on-surface">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Game content injected here */}
        {children}
      </div>
    </div>
  );
}
