"use client";
import Link from "next/link";
import Header from "../components/Header";
import { useQuery } from "@tanstack/react-query";
import { useCharacterStore } from "../store/useCharacterStore";
import { apiClient } from "@/lib/apiClient";

interface NPC {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    relation_label: string;
}

export default function Page() {

    const CHAR_ID = useCharacterStore((s) => s.charId) ?? "";

    const {data: npcs = [], isLoading} = useQuery<NPC[]>({
        queryKey : ["npcs", CHAR_ID],
        queryFn : async () => {
            const res = await apiClient.get(`/character/${CHAR_ID}/npcs`);
            return res.data;
        }
    });

    const intimacy = npcs.filter(npc => ["Girlfriend", "Wife", "Fling", "Ex"].includes(npc.role));
    const family = npcs.filter(npc => ["Mother", "Father", "Brother", "Sister"].includes(npc.role));
    const friends = npcs.filter(npc => ["Friend", "Best Friend"].includes(npc.role));
    const extended = npcs.filter(npc => ["Aunt", "Cousin", "Uncle"].includes(npc.role));

    return (
        <div className="flex h-dvh flex-col overflow-hidden">
        <Header/>

        <main className="hide-scrollbar mx-auto w-full max-w-2xl flex-1 space-y-8 overflow-y-auto px-6 py-6">
            <header className="relative mb-8 overflow-hidden rounded-3xl border border-white/40 bg-white/70 px-5 py-5 shadow-sm backdrop-blur-xl">

                <div className="absolute inset-0 bg-linear-to-br from-white/40 via-transparent to-slate-100/40" />

                <div className="relative flex items-center justify-center">

                <Link href="/" className="absolute left-0">
                    <button
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 shadow-inner transition-all duration-150 hover:bg-white active:scale-95"
                    >
                    <span className="material-symbols-outlined text-on-surface-variant">
                        arrow_back
                    </span>
                    </button>
                </Link>

                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-800/95">
                    Social
                    </h2>
                </div>

                <div className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 shadow-inner">
                    <span className="material-symbols-outlined text-lg text-primary">
                    hub
                    </span>
                </div>

                </div>
            </header>

            <div className="relative space-y-8">
            {intimacy.length > 0 && (
            <section>
                <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50/10">
                    <span className="material-symbols-outlined text-xl text-pink-600">
                    favorite
                    </span>
                </div>

                <h3 className="text-[12px] font-black uppercase tracking-widest text-pink-900">
                    INTIMACY
                </h3>
                </div>

                <div className="space-y-3">
                    {intimacy.map((npc) => (
                    <Link key={npc.id} href={`/social/${npc.id}`}>
                    <div className="shadow-intimacy flex items-center justify-between rounded-xl border border-pink-100/30 bg-white p-3">
                        <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/10">
                            <span className="material-symbols-outlined text-xl text-pink-600">
                            person
                            </span>
                        </div>

                        <div>
                            <h4 className="text-base font-bold text-pink-900">
                                {npc.first_name} {npc.last_name}
                            </h4>

                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">
                                {npc.role}
                            </p>
                        </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-full border border-emerald-100/50 bg-emerald-50 px-2.5 py-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />

                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                            {npc.relation_label}
                        </span>
                        </div>
                    </div>
                    </Link>
                    ))}
                </div>
            </section>
            )}

            <section>
                <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50/10">
                    <span className="material-symbols-outlined text-xl text-teal-600">
                    family_restroom
                    </span>
                </div>

                <h3 className="text-[12px] font-black uppercase tracking-widest text-teal-900">
                    FAMILY
                </h3>
                </div>

                <div className="space-y-3">
                    {family.map((npc) => (
                        <Link key={npc.id} href={`/social/${npc.id}`}>
                        <div className="shadow-family flex items-center justify-between rounded-xl border border-teal-100/30 bg-white p-3">                
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10">
                            <span className="material-symbols-outlined text-xl text-teal-600">
                                person
                            </span>
                            </div>

                            <div>
                            <h4 className="text-base font-bold text-teal-900">
                                {npc.first_name} {npc.last_name}
                            </h4>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">
                                {npc.role}
                            </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-full border border-amber-100/50 bg-amber-50 px-2.5 py-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                            {npc.relation_label}
                            </span>
                        </div>
                        </div>
                        </Link>
                    ))}
                    </div>
            </section>

            {friends.length > 0 && (
            <section>
                <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50/10">
                    <span className="material-symbols-outlined text-xl text-indigo-600">
                    group
                    </span>
                </div>

                <h3 className="text-[12px] font-black uppercase tracking-widest text-indigo-900">
                    FRIENDS
                </h3>
                </div>

                <div className="space-y-3">
                    {friends.map((npc) => (
                    <Link key={npc.id} href={`/social/${npc.id}`}>
                    <div className="shadow-friends flex items-center justify-between rounded-xl border border-indigo-100/30 bg-white p-3">
                        <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10">
                            <span className="material-symbols-outlined text-xl text-indigo-600">
                            person
                            </span>
                        </div>

                        <div>
                            <h4 className="text-base font-bold text-indigo-900">
                                {npc.first_name} {npc.last_name}
                            </h4>

                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">
                                {npc.role}
                            </p>
                        </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-full border border-emerald-100/50 bg-emerald-50 px-2.5 py-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />

                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                            {npc.relation_label}
                        </span>
                        </div>
                    </div>
                    </Link>
                ))}
                </div>
            </section>
            )}

            {extended.length > 0 && (
            <section>
                <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50/10">
                    <span className="material-symbols-outlined text-xl text-orange-600">
                    diversity_3
                    </span>
                </div>

                <h3 className="text-[12px] font-black uppercase tracking-widest text-orange-900">
                    EXTENDED
                </h3>
                </div>

                <div className="space-y-3">
                    {extended.map((npc) => (
                    <Link key={npc.id} href={`/social/${npc.id}`}>
                    <div className="shadow-extended flex items-center justify-between rounded-xl border border-orange-100/30 bg-white p-3">
                        <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10">
                            <span className="material-symbols-outlined text-xl text-orange-600">
                            person
                            </span>
                        </div>

                        <div>
                            <h4 className="text-base font-bold text-orange-900">
                                {npc.first_name} {npc.last_name}
                            </h4>

                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">
                                {npc.role}
                            </p>
                        </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-full border border-red-100/50 bg-red-50 px-2.5 py-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />

                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-700">
                            {npc.relation_label}
                        </span>
                        </div>
                    </div>
                    </Link>
                    ))}
                </div>
            </section>
            )}
            </div>
        </main>
        </div>
    );
}