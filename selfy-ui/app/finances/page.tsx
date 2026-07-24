"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Header from "../components/Header";
import { useCharacterStore } from "../store/useCharacterStore";
import { apiClient } from "@/lib/apiClient";

type Investment = {
  id: string;
  type: string;
  name: string;
  purchase_price: number;
  current_value: number;
  purchased_at_age: number;
};

type Asset = {
  id: string;
  type: string;
  name: string;
  current_value: number;
};

type Debt = {
  id: string;
  type: string;
  principal: number;
  remaining_balance: number;
  interest_rate: number;
};

type Character = {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  stage: string;
  cash: number;
  income?: number;
  expenses?: number;
  monthly_income?: number;
  monthly_expenses?: number;
  investments?: Investment[];
  assets?: Asset[];
  debts?: Debt[];
};

type AuthUser = {
  active_character_id: string | null;
};

type HeroMetric = {
  label: string;
  value: string;
  icon: string;
  tone: string;
  note: string;
};

type DropdownItem = {
  id: string;
  name: string;
  meta: string;
  value: number;
  detail?: string;
};

type DropdownCardProps = {
  title: string;
  icon: string;
  total: number;
  tone: string;
  items: DropdownItem[];
  emptyText: string;
  defaultOpen?: boolean;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const titleCase = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function DropdownCard({
  title,
  icon,
  total,
  tone,
  items,
  emptyText,
  defaultOpen = false,
}: DropdownCardProps) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-xl"
    >
      <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-4 transition-all active:scale-[0.99] [&::-webkit-details-marker]:hidden">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner"
          style={{ background: `${tone}16`, border: `1px solid ${tone}28` }}
        >
          <span className="material-symbols-outlined text-[22px]" style={{ color: tone }}>
            {icon}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-black tracking-tight text-slate-900">{title}</p>
          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {items.length ? `${items.length} item${items.length === 1 ? "" : "s"}` : "Nothing yet"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-black text-slate-900">{formatCurrency(total)}</p>
          <span className="material-symbols-outlined mt-1 text-[20px] text-slate-400 transition-transform group-open:rotate-180">
            expand_more
          </span>
        </div>
      </summary>

      <div className="border-t border-slate-100 px-4 pb-4 pt-2">
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/80 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-800">{item.name}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                    {item.meta}
                    {item.detail ? ` - ${item.detail}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-black text-slate-900">
                  {formatCurrency(item.value)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50/80 px-4 py-5 text-center">
            <p className="text-sm font-bold text-slate-400">{emptyText}</p>
          </div>
        )}
      </div>
    </details>
  );
}

export default function FinancesPage() {
  const queryClient = useQueryClient();
  const charId = useCharacterStore((s) => s.charId);
  const authUser = queryClient.getQueryData<AuthUser>(["authMe"]);
  const activeCharId = charId ?? authUser?.active_character_id ?? "";

  const { data: character, isLoading } = useQuery<Character>({
    queryKey: ["character", activeCharId],
    queryFn: async () => (await apiClient.get(`/character/${activeCharId}`)).data,
    enabled: !!activeCharId,
  });

  if (isLoading || !character) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <h1 className="animate-pulse text-xl font-black text-primary">Counting coins...</h1>
      </div>
    );
  }

  const investments = character.investments ?? [];
  const assets = character.assets ?? [];
  const debts = character.debts ?? [];

  const cash = character.cash ?? 0;
  const income = character.monthly_income ?? character.income ?? 0;
  const expenses = character.monthly_expenses ?? character.expenses ?? 0;
  const investmentTotal = investments.reduce((sum, item) => sum + item.current_value, 0);
  const assetTotal = assets.reduce((sum, item) => sum + item.current_value, 0);
  const debtTotal = debts.reduce((sum, item) => sum + item.remaining_balance, 0);
  const netWorth = cash + investmentTotal + assetTotal - debtTotal;

  const heroMetrics: HeroMetric[] = [
    {
      label: "Cash",
      value: formatCurrency(cash),
      icon: "payments",
      tone: "#00FF87",
      note: "",
    },
    {
      label: "Income",
      value: income ? formatCurrency(income) : "Not tracked",
      icon: "payment_arrow_down",
      tone: "#00D0FF",
      note: "Annual",
    },
    {
      label: "Expenses",
      value: expenses ? formatCurrency(expenses) : "Not tracked",
      icon: "receipt_long",
      tone: "#FF9500",
      note: "monthly",
    },
    {
      label: "Investments",
      value: formatCurrency(investmentTotal),
      icon: "monitoring",
      tone: "#B755FF",
      note: `${investments.length} holding${investments.length === 1 ? "" : "s"}`,
    },
    {
      label: "Assets",
      value: formatCurrency(assetTotal),
      icon: "home_work",
      tone: "#00FFD1",
      note: `${assets.length} owned`,
    },
    {
      label: "Debt",
      value: formatCurrency(debtTotal),
      icon: "credit_card",
      tone: "#FF2A55",
      note: "",
    },
  ];

  const investmentItems = investments.map((investment) => ({
    id: investment.id,
    name: investment.name,
    meta: titleCase(investment.type),
    value: investment.current_value,
    detail: `bought at ${formatCurrency(investment.purchase_price)}`,
  }));

  const assetItems = assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    meta: titleCase(asset.type),
    value: asset.current_value,
  }));

  const debtItems = debts.map((debt) => ({
    id: debt.id,
    name: titleCase(debt.type),
    meta: `${debt.interest_rate}% interest`,
    value: debt.remaining_balance,
    detail: `principal ${formatCurrency(debt.principal)}`,
  }));

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#F8FAF7]">
      <Header />

      <main className="hide-scrollbar mx-auto w-full max-w-2xl flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <header className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/75 px-5 py-3 shadow-sm backdrop-blur-xl">
          <div className="absolute inset-0 bg-linear-to-br from-emerald-50/80 via-transparent to-amber-50/70" />
          <div className="relative flex items-center justify-center">
            <Link href="/" className="absolute left-0">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/15 bg-emerald-500/10 shadow-inner transition-all duration-150 hover:opacity-80 active:scale-95"
              >
                <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
              </button>
            </Link>

            <h1 className="text-2xl font-black tracking-tight text-slate-800/95">Finances</h1>

            <div className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 shadow-inner">
              <span className="material-symbols-outlined text-lg text-emerald-600">
                account_balance_wallet
              </span>
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[2rem] bg-[#065F46] p-5 text-white shadow-[0_24px_60px_-28px_rgba(6,95,70,0.6)]">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.1),transparent_45%)]" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-100/90">
                  Net Worth
                </p>
                <h2 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl text-white">
                  {formatCurrency(netWorth)}
                </h2>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {heroMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ color: metric.tone }}
                    >
                      {metric.icon}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
                      {metric.note}
                    </span>
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-emerald-100/70">
                    {metric.label}
                  </p>
                  <p className="mt-1 truncate text-sm font-black text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3 pb-6">
          <DropdownCard
            title="Investments"
            icon="monitoring"
            total={investmentTotal}
            tone="#7C3AED"
            items={investmentItems}
            emptyText="No investments yet."
            defaultOpen={investmentItems.length > 0}
          />

          <DropdownCard
            title="Assets"
            icon="home_work"
            total={assetTotal}
            tone="#0F766E"
            items={assetItems}
            emptyText="No owned assets yet."
          />

          <DropdownCard
            title="Businesses"
            icon="storefront"
            total={0}
            tone="#D97706"
            items={[]}
            emptyText="Businesses are not tracked yet."
          />

          <DropdownCard
            title="Debts"
            icon="credit_card"
            total={debtTotal}
            tone="#E11D48"
            items={debtItems}
            emptyText="No debts."
          />
        </section>
      </main>
    </div>
  );
}
