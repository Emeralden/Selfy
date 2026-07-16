"use client";
import Header from "@/app/components/Header";
import { useCharacterStore } from "@/app/store/useCharacterStore";
import { usePopupStore } from "@/app/store/usePopupStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/apiClient";


export default function Page() {

    const router = useRouter()
    const queryClient = useQueryClient();

    const params = useParams()
    const CHAR_ID = useCharacterStore((s) => s.charId) ?? "";
    const npcId = params.npcId

    const { showPopup } = usePopupStore();

    const interactMutation = useMutation({
    mutationFn: async (actionSlug: string) => {
      const res = await apiClient.post(`/social/${CHAR_ID}/interact`, {
        action: actionSlug,
        npc_id: npcId,
      });
      return res.data;
    },
    onSuccess: (data) => {
      showPopup(data.message || data); 
    },
    onError: (error) => {
      showPopup(error.message);
    }
  });

    const { data: npc, isLoading} = useQuery<any>({
    queryKey: ['npc', npcId],
    queryFn: async () => {
      const res = await apiClient.get(`/character/${CHAR_ID}/npcs/${npcId}`);
      return res.data;
    }
    });

    if (isLoading || !npc) {
        return (
            <div className="flex h-dvh items-center justify-center bg-background">
                <h1 className="animate-pulse text-xl font-black text-primary">Loading...</h1>
            </div>
        )
    }

    const intimacy = ["Girlfriend", "Wife", "Fling", "Ex"].includes(npc.role);
    const family = ["Mother", "Father", "Brother", "Sister"].includes(npc.role);
    const friends = ["Friend", "Best Friend"].includes(npc.role);
    const extended = ["Aunt", "Cousin", "Uncle"].includes(npc.role);

    const stats = [
    { label: "Affection", value: npc.affection },
    { label: "Trust", value: npc.trust },
    { label: "Respect", value: npc.respect },
    { label: "Resentment", value: npc.resentment },
    ];

    let theme = {
        icon: "diversity_3",
        shadow: "shadow-extended",
        border: "border-orange-700/10",
        bgLight: "bg-orange-50/10",
        textDark: "text-orange-900",
        textBright: "text-orange-600",
        bgBright: "bg-orange-600",
        barShadow: "shadow-[0_0_8px_rgba(234,88,12,0.4)]"
    };

    if (intimacy) {
        theme = {
        icon: "favorite",
        shadow: "shadow-intimacy",
        border: "border-pink-700/10",
        bgLight: "bg-pink-500/10",
        textDark: "text-pink-900",
        textBright: "text-pink-600",
        bgBright: "bg-pink-600",
        barShadow: "shadow-[0_0_8px_rgba(219,39,119,0.4)]"
        };
    } else if (family) {
        theme = {
        icon: "family_restroom",
        shadow: "shadow-family",
        border: "border-teal-700/10",
        bgLight: "bg-teal-500/10",
        textDark: "text-teal-900",
        textBright: "text-teal-600",
        bgBright: "bg-teal-600",
        barShadow: "shadow-[0_0_8px_rgba(13,148,136,0.4)]"
        };
    } else if (friends) {
        theme = {
        icon: "group",
        shadow: "shadow-friends",
        border: "border-indigo-700/10",
        bgLight: "bg-indigo-500/10",
        textDark: "text-indigo-900",
        textBright: "text-indigo-600",
        bgBright: "bg-indigo-600",
        barShadow: "shadow-[0_0_8px_rgba(79,70,229,0.4)]"
        };
    }

  return (

    <div className="min-h-screen bg-background text-on-surface antialiased">
      <Header/>

      <main className="hide-scrollbar mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-6 py-6">
        <header className="relative mb-8 overflow-hidden rounded-3xl border border-white/40 bg-white/70 px-5 py-5 shadow-sm backdrop-blur-xl">

            <div className="absolute inset-0 bg-linear-to-br from-white/40 via-transparent to-slate-100/40" />

            <div className="relative flex items-center justify-center">
                <Link href="/social" className="absolute left-0">
                <button
                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${theme.border} ${theme.bgLight} shadow-inner transition-all duration-150 hover:bg-white active:scale-95`}
                >
                <span className="material-symbols-outlined text-on-surface-variant">
                    arrow_back
                </span>
                </button>
                </Link>

                <div className="text-center">
                <h2 className="text-2xl font-black tracking-tight text-slate-800/95">
                    {npc.first_name} {npc.last_name}
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant/60">
                    {npc.role}
                </p>
                </div>

                <div className={`absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl border ${theme.border} ${theme.bgLight} shadow-inner`}>
                <span className={`material-symbols-outlined text-lg ${theme.textBright}`}>
                    {theme.icon}
                </span>
                </div>
            </div>
            </header>

    <section className={`${theme.shadow} mb-8 rounded-3xl border border-pink-100/30 bg-white p-5`}>
        <div className="flex items-stretch gap-5">
        
        <div className={`flex w-24 shrink-0 items-center justify-center rounded-xl ${theme.bgLight}`}>
        <span className={`material-symbols-outlined text-3xl ${theme.textBright}`}>
            person
        </span>
        </div>


        <div className="flex-1 min-w-0 space-y-3">
        {stats.map((stat) => (
            <div key={stat.label}>
            <div className="mb-1.5 flex justify-between">
                <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textDark}`}>
                {stat.label}
                </span>

                <span className={`text-[10px] font-bold ${theme.textBright}`}>
                {`${stat.value}`}
                </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                className={`h-full ${theme.bgBright} ${theme.barShadow}`}
                style={{ width: `${stat.value}%` }}
                />
            </div>
            </div>
        ))}
        </div>
    </div>
</section>

        <div className="space-y-8">
          <section>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50/10">
                <span className="material-symbols-outlined text-xl text-pink-600">
                  favorite
                </span>
              </div>

              <h3 className="text-[12px] font-black uppercase tracking-widest text-pink-900">
                Positive Engagements
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                ["groups", "Hang out", "hang_out"],
                ["auto_awesome", "Give Compliment", "compliment"],
              ].map(([icon, label, slug]) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => interactMutation.mutate(slug)}
                  className="shadow-intimacy flex items-center justify-between rounded-xl border border-pink-100/30 bg-white p-4 text-left transition-transform active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-600">
                      <span className="material-symbols-outlined text-xl text-white">
                        {icon}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-pink-900">
                      {label}
                    </h4>
                  </div>

                  <span className="material-symbols-outlined text-pink-300">
                    chevron_right
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50/10">
                <span className="material-symbols-outlined text-xl text-teal-600">
                  payments
                </span>
              </div>

              <h3 className="text-[12px] font-black uppercase tracking-widest text-teal-900">
                Financial Interactions
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                ["request_quote", "Request Money", "request_money"],
                ["redeem", "Send Gift", "gift"],
              ].map(([icon, label, slug]) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => interactMutation.mutate(slug)}
                  className="shadow-family flex items-center justify-between rounded-xl border border-teal-100/30 bg-white p-4 text-left transition-transform active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600">
                      <span className="material-symbols-outlined text-xl text-white">
                        {icon}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-teal-900">
                      {label}
                    </h4>
                  </div>

                  <span className="material-symbols-outlined text-teal-300">
                    chevron_right
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50/10">
                <span className="material-symbols-outlined text-xl text-orange-600">
                  gavel
                </span>
              </div>

              <h3 className="text-[12px] font-black uppercase tracking-widest text-orange-900">
                Conflict Resolution
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                ["forum", "Talk Trash", "talk_trash"],
                ["handshake", "Apologize", "apologize"],
              ].map(([icon, label, slug]) => (
                <button
                  key={slug}
                  onClick ={() => (
                    interactMutation.mutate(slug)
                  )}
                  className="shadow-extended flex items-center justify-between rounded-xl border border-orange-100/30 bg-white p-4 text-left transition-transform active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-600">
                      <span className="material-symbols-outlined text-xl text-white">
                        {icon}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-orange-900">
                      {label}
                    </h4>
                  </div>

                  <span className="material-symbols-outlined text-orange-300">
                    chevron_right
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
