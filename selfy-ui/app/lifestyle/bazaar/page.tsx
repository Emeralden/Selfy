"use client";

import Link from "next/link";
import Header from "@/app/components/Header";

const COLOR  = "#F59E0B";
const BG     = "linear-gradient(135deg, #FFFBEB, #FEF3C7)";
const GLOW   = "rgba(245,158,11,0.16)";

export default function BazaarPage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#FAFBFF]">
      <Header />

      <main className="hide-scrollbar mx-auto w-full max-w-2xl flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {/* Header */}
        <header className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 px-5 py-3 shadow-sm backdrop-blur-xl">
          <div className="absolute inset-0 bg-linear-to-br from-white/40 via-transparent to-slate-100/40" />
          <div className="relative flex items-center justify-center">
            <Link href="/lifestyle" className="absolute left-0">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-inner transition-all duration-150 hover:opacity-80 active:scale-95"
                style={{ background: `${COLOR}10`, border: `1px solid ${COLOR}18` }}
              >
                <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
              </button>
            </Link>

            <h1 className="text-2xl font-black tracking-tight text-slate-800/95">Bazaar</h1>

            <div
              className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl shadow-inner"
              style={{ background: `${COLOR}10`, border: `1px solid ${COLOR}18` }}
            >
              <span className="material-symbols-outlined text-lg" style={{ color: COLOR }}>
                storefront
              </span>
            </div>
          </div>
        </header>

        {/* Empty state */}
        <div
          className="rounded-3xl px-4 py-10 text-center text-[13px] font-bold text-slate-400"
          style={{
            background: BG,
            border: `1.5px solid ${COLOR}18`,
            boxShadow: `0 4px 18px -8px ${GLOW}, inset 0 1px 0 rgba(255,255,255,0.8)`,
          }}
        >
          <span className="mb-3 block text-4xl">🛒</span>
          <p className="text-[14px] font-black text-slate-600">The bazaar is empty.</p>
          <p className="mt-1 text-[12px] font-semibold text-slate-400">
            Age up to unlock shopping and trading! 🎂
          </p>
        </div>

        <div className="pb-6" />
      </main>
    </div>
  );
}
