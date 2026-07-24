import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100/30 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
        
        <Link href="/user">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 transition-opacity hover:opacity-70 active:scale-95">
            <span className="material-symbols-outlined text-[18px] text-primary">density_medium</span>
          </div>
        </Link>

        <Link href="/">
          <span className="brand-text inline-block text-primary antialiased">selfy</span>
        </Link>

        <Link
          href="/finances"
          className="text-primary transition-opacity hover:opacity-80 active:scale-95"
        >
          <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
        </Link>

      </div>
    </header>
  );
}
