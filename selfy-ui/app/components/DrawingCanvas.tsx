"use client";

import { useRef, useState, useEffect } from "react";

// ── DrawingCanvas ─────────────────────────────────────────────────────────────
// Game content only — no shell. Wrap in <GameCanvas> to show as a popup.

interface DrawingCanvasProps {
  onDone: (dataUrl: string) => void;
  isLoading?: boolean;
}

const COLORS = [
  { name: "mind",   hex: "#1D4ED8" },
  { name: "savvy",  hex: "#00C800" },
  { name: "appeal", hex: "#FF007F" },
];

export default function DrawingCanvas({ onDone, isLoading = false }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos   = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState(COLORS[0].hex);
  const [isEmpty, setIsEmpty] = useState(true);

  // Init canvas with white fill
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width  = width;
    canvas.height = height;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    isDrawing.current = true;
    const pos = getPos(e);
    lastPos.current = pos;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
    ctx.fill();
    setIsEmpty(false);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing.current || !lastPos.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth   = 14;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setIsEmpty(false);
  };

  const endDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDrawing.current = false;
    lastPos.current   = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  return (
    <>
      {/* Canvas area */}
      <div
        className="relative mx-5 overflow-hidden rounded-2xl bg-white"
        style={{ height: 260, border: "1.5px solid #E2E8F0", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.04)" }}
      >
        {/* Paper lines */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 27px, #94A3B8 27px, #94A3B8 28px)" }}
        />
        {/* Empty hint */}
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 select-none">
            <span className="text-4xl opacity-20">✏️</span>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300">Scribble here</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerCancel={endDraw}
        />
      </div>

      {/* Color picker + clear */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          {COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => setColor(c.hex)}
              className="transition-all duration-150 active:scale-90"
              style={{
                width:  color === c.hex ? 34 : 28,
                height: color === c.hex ? 34 : 28,
                borderRadius: "50%",
                background: c.hex,
                boxShadow: color === c.hex
                  ? `0 0 0 2px white, 0 0 0 4px ${c.hex}`
                  : "0 2px 6px rgba(0,0,0,0.18)",
                transition: "all 0.15s ease",
              }}
              aria-label={c.name}
            />
          ))}
        </div>
        <button
          onClick={clearCanvas}
          disabled={isEmpty}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold text-slate-400 hover:bg-rose-50 hover:text-rose-500 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
          Clear
        </button>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px" style={{ background: "linear-gradient(to right, transparent, #E2E8F0, transparent)" }} />

      {/* Done button */}
      <div className="px-5 py-4">
        <button
          id="drawing-done"
          onClick={() => onDone(canvasRef.current!.toDataURL("image/png"))}
          disabled={isLoading}
          className="w-full rounded-2xl py-3 text-[15px] font-black tracking-wide text-white transition-all duration-150 active:scale-[0.97] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #FF8C42 0%, #FF6B00 100%)", boxShadow: "0 6px 20px -4px rgba(255,107,0,0.45)" }}
        >
          {isLoading ? (
            <>
              <span className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Sending...
            </>
          ) : (
            <>Done! 🎨</>
          )}
        </button>
      </div>
    </>
  );
}
