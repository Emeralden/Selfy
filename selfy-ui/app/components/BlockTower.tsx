"use client";

import { useRef, useEffect, useCallback } from "react";

// ── BlockTower ────────────────────────────────────────────────────────────────
// Game content only — no shell. Wrap in <GameCanvas> to show as a popup.

interface BlockTowerProps {
  onDone: (result: "success" | "fail") => void;
  isLoading?: boolean;
}

const BLOCK_DEFS = [
  { name: "joy",    hex: "#FF6B00" },
  { name: "mind",   hex: "#1D4ED8" },
  { name: "savvy",  hex: "#00C800" },
  { name: "appeal", hex: "#FF007F" },
  { name: "body",   hex: "#FF2400" },
];

const BW = 48;
const BH = 24;
const GRAV = 0.55;
const TRAY_H = 52;
const TOLERANCES = [0.48, 0.42, 0.34, 0.24, 0.14].map((t) => t * BW);

type BlockState = "tray" | "held" | "falling" | "settled" | "sliding";

interface Block {
  id: number; x: number; y: number; vx: number; vy: number;
  color: string; name: string; state: BlockState; trayX: number; trayY: number;
}

interface GS {
  blocks: Block[]; heldId: number | null; px: number; py: number;
  phase: "playing" | "ending" | "done"; groundY: number; trayY: number;
  W: number; H: number; rafId: number; flashAlpha: number;
  flashResult: "success" | "fail" | null; hintText: string; hintAlpha: number;
}

export default function BlockTower({ onDone, isLoading = false }: BlockTowerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gs = useRef<GS>({
    blocks: [], heldId: null, px: 0, py: 0, phase: "playing",
    groundY: 0, trayY: 0, W: 0, H: 0, rafId: 0, flashAlpha: 0,
    flashResult: null, hintText: "Drag a block to start!", hintAlpha: 1,
  });

  const settled = () => gs.current.blocks.filter((b) => b.state === "settled");

  const returnToTray = (b: Block) => {
    b.state = "tray"; b.x = b.trayX; b.y = b.trayY; b.vx = 0; b.vy = 0;
  };

  const triggerEnd = useCallback((result: "success" | "fail") => {
    const g = gs.current;
    if (g.phase !== "playing") return;
    g.phase = "ending"; g.flashResult = result; g.flashAlpha = 0.6;
    g.hintText = result === "success" ? "🎉 Tower complete!" : "💥 It fell!";
    setTimeout(() => { g.phase = "done"; onDone(result); }, 900);
  }, [onDone]);

  const tick = useCallback(() => {
    const g = gs.current;
    if (g.phase === "done") return;
    if (g.flashAlpha > 0) g.flashAlpha = Math.max(0, g.flashAlpha - 0.012);
    if (g.heldId !== null) {
      const b = g.blocks.find((b) => b.id === g.heldId);
      if (b) { b.x = g.px; b.y = g.py; }
    }
    g.blocks.forEach((block) => {
      if (block.state !== "falling" && block.state !== "sliding") return;
      block.vy += GRAV; block.x += block.vx; block.y += block.vy;
      if (block.x - BW / 2 < 0) { block.x = BW / 2; block.vx *= -0.25; }
      if (block.x + BW / 2 > g.W) { block.x = g.W - BW / 2; block.vx *= -0.25; }
      if (block.state === "falling") {
        const stack = settled().sort((a, b) => a.y - b.y);
        let landed = false;
        for (const other of stack) {
          const blockBottom = block.y + BH / 2;
          const targetTop   = other.y - BH / 2;
          const prevBottom  = blockBottom - block.vy;
          if (prevBottom <= targetTop && blockBottom >= targetTop) {
            if (Math.abs(block.x - other.x) < BW) {
              block.y = other.y - BH; block.vy = 0;
              const off = block.x - other.x;
              const tol = TOLERANCES[Math.min(stack.length, TOLERANCES.length - 1)];
              if (Math.abs(off) > tol) {
                block.vx = (off > 0 ? 1 : -1) * 2.8; block.vy = 0.8; block.state = "sliding";
              } else {
                block.vx = 0; block.state = "settled";
                g.hintText = stack.length >= 3 ? "So close! Keep going!" : "Nice! Keep stacking!";
                if (settled().length === 5) triggerEnd("success");
              }
              landed = true; break;
            }
          }
        }
        if (!landed && block.y + BH / 2 >= g.groundY) {
          block.y = g.groundY - BH / 2; block.vy = 0;
          if (stack.length === 0) { block.vx = 0; block.state = "settled"; g.hintText = "Great! Stack the rest!"; }
          else { returnToTray(block); g.hintText = "Missed! Try again!"; }
        }
      } else if (block.state === "sliding") {
        if (block.y > g.H + 40) triggerEnd("fail");
      }
    });
  }, [triggerEnd]);

  const render = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d")!;
    const g   = gs.current;
    const { W, H, groundY, flashAlpha, flashResult } = g;
    ctx.fillStyle = "#FAFBFF"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#F1F5F9"; ctx.beginPath();
    (ctx as any).roundRect(8, groundY + 8, W - 16, H - groundY - 12, 10); ctx.fill();
    ctx.save(); ctx.strokeStyle = "#CBD5E1"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 6]);
    ctx.beginPath(); ctx.moveTo(16, groundY); ctx.lineTo(W - 16, groundY); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
    for (let i = 0; i < 5; i++) {
      const lineY = groundY - BH * i - BH;
      ctx.save(); ctx.strokeStyle = "rgba(148,163,184,0.15)"; ctx.lineWidth = 1; ctx.setLineDash([3, 8]);
      ctx.beginPath(); ctx.moveTo(W / 2 - BW / 2 - 10, lineY); ctx.lineTo(W / 2 + BW / 2 + 10, lineY);
      ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }
    g.blocks.forEach((block) => {
      if (block.state === "sliding" && block.y > H) return;
      ctx.save();
      const bx = block.x - BW / 2; const by = block.y - BH / 2;
      ctx.shadowColor = block.color + "55"; ctx.shadowBlur = block.state === "held" ? 22 : 10;
      ctx.shadowOffsetY = block.state === "held" ? 12 : 4;
      ctx.beginPath(); (ctx as any).roundRect(bx, by, BW, BH, 8);
      ctx.fillStyle = block.color; ctx.fill();
      ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      const shine = ctx.createLinearGradient(bx, by, bx, by + BH * 0.65);
      shine.addColorStop(0, "rgba(255,255,255,0.42)"); shine.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath(); (ctx as any).roundRect(bx + 2, by + 2, BW - 4, BH * 0.55, [6, 6, 0, 0]);
      ctx.fillStyle = shine; ctx.fill();
      ctx.beginPath(); (ctx as any).roundRect(bx, by, BW, BH, 8);
      ctx.strokeStyle = "rgba(0,0,0,0.07)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    });
    if (flashAlpha > 0 && flashResult) {
      const flashHex = flashResult === "success" ? "#00C800" : "#FF2400";
      ctx.fillStyle = flashHex + Math.floor(flashAlpha * 255).toString(16).padStart(2, "0");
      ctx.fillRect(0, 0, W, H);
    }
    ctx.fillStyle = `rgba(100,116,139,${g.hintAlpha})`;
    ctx.font = "600 10px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText(g.hintText.toUpperCase(), W / 2, 10);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width; const H = rect.height;
    canvas.width = W; canvas.height = H;
    const groundY = H - TRAY_H - 6; const trayY = H - TRAY_H / 2;
    const spacing = W / (BLOCK_DEFS.length + 1);
    const blocks: Block[] = BLOCK_DEFS.map((def, i) => ({
      id: i, x: spacing * (i + 1), y: trayY, vx: 0, vy: 0,
      color: def.hex, name: def.name, state: "tray",
      trayX: spacing * (i + 1), trayY,
    }));
    gs.current = { ...gs.current, blocks, groundY, trayY, W, H, px: W / 2, py: H / 2 };
    const loop = () => { tick(); render(canvas); gs.current.rafId = requestAnimationFrame(loop); };
    gs.current.rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gs.current.rafId);
  }, [tick, render]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    const g = gs.current; if (g.phase !== "playing") return;
    const pos = getPos(e);
    const block = g.blocks.find((b) => b.state === "tray" && Math.abs(b.x - pos.x) < BW / 2 + 4 && Math.abs(b.y - pos.y) < BH / 2 + 8);
    if (block) { block.state = "held"; g.heldId = block.id; g.px = pos.x; g.py = pos.y; g.hintText = "Release to drop!"; }
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getPos(e); gs.current.px = pos.x; gs.current.py = pos.y;
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const g = gs.current; if (g.heldId === null) return;
    const block = g.blocks.find((b) => b.id === g.heldId);
    if (block) { block.state = "falling"; block.vy = 1.5; block.vx = 0; }
    g.heldId = null; g.hintText = "Drag blocks to stack them!";
  };

  return (
    <div
      className="mx-5 mb-5 overflow-hidden rounded-2xl"
      style={{ height: 290, border: "1.5px solid #E2E8F0", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.04)" }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
    </div>
  );
}
