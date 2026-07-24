"use client";
import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Header from "./components/Header";
import { useCharacterStore } from "./store/useCharacterStore";
import { apiClient } from "@/lib/apiClient";
import { usePopupStore } from "./store/usePopupStore";


const STAGE_META: Record<string, { label: string; icon: string }> = {
  "Baby":        { label: "Baby",       icon: "baby_changing_station" },
  "Toddler":     { label: "Toddler",    icon: "child_care" },
  "Pre-School":  { label: "Pre-School", icon: "toys" },
  "School":      { label: "School",     icon: "school" },
  "Exam-Prep":   { label: "Exam Prep",  icon: "menu_book" },
  "University":  { label: "University", icon: "account_balance" },
  "Adult":       { label: "Path",       icon: "trending_up" },
  "Elder":       { label: "Path",       icon: "trending_up" },
};

const STAGE_ROUTES: Record<string, string> = {
  "Pre-School": "/pre-school",
  "School":     "/school",
  "Exam-Prep":  "/exam-prep",
  "University": "/university",
};

function getPathStage(stage: string, age?: number): { label: string; icon: string } {
  if (stage === "School" && age != null) {
    if (age <= 9)  return { label: "Junior School",     icon: "cottage" };
    if (age <= 12) return { label: "Middle School", icon: "school" };
    return               { label: "Senior School",  icon: "domain" };
  }
  return STAGE_META[stage] ?? { label: "Path", icon: "trending_up" };
}

function getStageRoute(stage: string): string {
  return STAGE_ROUTES[stage] ?? "#";
}

type LifeEvent = {
  id: string;
  age: number;
  text: string;
};

export default function Page() {
  const queryClient   = useQueryClient();
  const charId        = useCharacterStore((s) => s.charId);

  const justBorn      = useCharacterStore((s) => s.justBorn);
  const clearJustBorn = useCharacterStore((s) => s.clearJustBorn);

  useEffect(() => {
    if (justBorn) {
      clearJustBorn();
    }
  }, [justBorn, clearJustBorn]);

  const authUser = queryClient.getQueryData<{ active_character_id: string | null }>(["authMe"]);
  const CHAR_ID  = charId ?? authUser?.active_character_id ?? "";

  const { data: character, isLoading: isCharacterLoading } = useQuery<any>({
    queryKey: ['character', CHAR_ID],
    queryFn: async () => {
      const res = await apiClient.get(`/character/${CHAR_ID}`);
      return res.data;
    },
    enabled: !!CHAR_ID,
  });

  const { data: events = [], isLoading: isEventsLoading } = useQuery<LifeEvent[]>({
    queryKey: ['events', CHAR_ID],
    queryFn: async () => {
      const res = await apiClient.get(`/character/${CHAR_ID}/events`);
      return res.data;
    },
    enabled: !!CHAR_ID,
  });

  const ages = useMemo(() => {
    const timelineAges = new Set<number>(events.map((event) => event.age));
    if (character) {
      timelineAges.add(character.age);
    }

    return [...timelineAges].sort((a: number, b: number) => b - a);
  }, [character, events]);

  const getEventsForAge = (age: number) =>
    events.filter((event) => event.age === age);

  const ageUpMutation = useMutation({
    mutationFn: async () => {
      if (!character) throw new Error("Character has not loaded yet.");
      const res = await apiClient.patch(`/life/${character.id}/age_up`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['character', CHAR_ID] });
      queryClient.invalidateQueries({ queryKey: ['events', CHAR_ID] });
      
      if (data.scenarios && data.scenarios.length > 0) {
         usePopupStore.getState().enqueueScenarios(data.scenarios);
      }
    },
  });

  const handleAgeUp = () => {
    ageUpMutation.mutate();
  };

  if (isCharacterLoading || isEventsLoading || !character) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <h1 className="animate-pulse text-xl font-black text-primary">Loading...</h1>
      </div>
    );
  }
  

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header/>

      <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/avatar" className="flex h-12 w-12 overflow-hidden items-center justify-center rounded-xl bg-white transition-transform active:scale-95 border border-primary/20 shadow-sm shrink-0">
            {character.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={character.avatar_url} alt="Avatar" className="h-full w-full object-contain scale-[1.23] translate-y-[0.5rem]" />
            ) : (
              <span className="material-symbols-outlined text-2xl text-primary">account_circle</span>
            )}
          </Link>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold leading-tight tracking-tight text-on-surface">
              {`${character.first_name} ${character.last_name}`}
            </span>
            <span className="text-[10px] font-bold uppercase leading-tight tracking-wider text-on-surface-variant/70">
              {character.stage}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/finances" className="flex items-center gap-3 text-right transition-opacity hover:opacity-80 active:scale-95">
            <div className="h-4 w-px bg-outline-variant" />
            <span className="text-xl font-black tracking-tight text-primary">
              {`₹${character.cash}`}
            </span>
          </Link>
        </div>
      </div>

      <main className="hide-scrollbar mx-auto w-full max-w-2xl flex-1 space-y-6 overflow-y-auto px-6 py-6">
        {ages.map((age: number) => {
          const isCurrent = age === character.age; 
          
          return (
            <div key={age} className="rounded-4xl py-4">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-6 w-2 rounded-full ${isCurrent ? 'bg-primary shadow-[0_0_12px_rgba(109,40,217,0.4)]' : 'bg-slate-300'}`} />
                  <span className={`text-sm font-black uppercase tracking-widest ${isCurrent ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                    Year {age}
                  </span>
                </div>
                
                {isCurrent && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                    Current
                  </span>
                )}
              </div>
              <div className="ml-3 space-y-3 border-l-2 border-slate-100 pl-6">
                {getEventsForAge(age).map((event: LifeEvent) => (
                  <div key={event.id} className="flex items-start gap-2 py-1.5">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${isCurrent ? 'bg-primary' : 'bg-slate-300'}`} />
                    <p className={`text-sm leading-snug ${isCurrent ? 'text-on-surface/80' : 'text-on-surface/60'}`}>
                      {event.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </main>

      <div className="w-full shrink-0 border-t border-outline-variant bg-white px-6 pb-6 pt-4 shadow-[0_-12px_40px_rgba(0,0,0,0.05)]">
        <div className="mx-auto max-w-2xl">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-2.5 py-2 shadow-sm">
              <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-joy/15">
                <span className="text-xs">🎈</span>
              </div>
              <div className="grow">
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
                    Joy
                  </span>
                  <span className="text-[9px] font-bold text-joy">
                    {`${character.joy}%`}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-joy shadow-[0_0_8px_rgba(255,107,0,0.4)]"
                    style={{ width: `${character.joy}%`}}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-2.5 py-2 shadow-sm">
              <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-savvy/15">
                <span className="text-xs">🕶️</span>
              </div>
              <div className="grow">
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
                    Savvy
                  </span>
                  <span className="text-[9px] font-bold text-savvy">
                    {`${character.savvy}%`}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-savvy shadow-[0_0_8px_rgba(0,200,0,0.4)]"
                    style={{ width:`${character.savvy}%`}}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-2.5 py-2 shadow-sm">
              <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-mind/15">
                <span className="text-xs">🧠</span>
              </div>
              <div className="grow">
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
                    Mind
                  </span>
                  <span className="text-[9px] font-bold text-mind">
                    {`${character.mind}%`}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-mind shadow-[0_0_8px_rgba(29,78,216,0.4)]"
                    style={{ width:`${character.mind}%`}}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-2.5 py-2 shadow-sm">
              <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-appeal/15">
                <span className="text-xs">🪞</span>
              </div>
              <div className="grow">
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
                    Appeal
                  </span>
                  <span className="text-[9px] font-bold text-appeal">
                    {`${character.appeal}%`}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-appeal shadow-[0_0_8px_rgba(255,0,127,0.4)]"
                    style={{ width:`${character.appeal}%`}}
                  />
                </div>
              </div>
            </div>

            <div className="col-span-2 flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-2.5 py-2 shadow-sm">
              <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-body/15">
                <span className="text-xs">💪</span>
              </div>
              <div className="grow">
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
                    Body
                  </span>
                  <span className="text-[9px] font-bold text-body">
                    {`${character.body}%`}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-body shadow-[0_0_8px_rgba(255,36,0,0.4)]"
                    style={{ width:`${character.body}%`}}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex h-36 gap-3 items-stretch">
            <div className="flex w-[30%] flex-col gap-2">
              <Link href="/self" className="flex flex-1">
                <button
                  type="button"
                  className="group flex-1 w-full flex flex-col items-center justify-center rounded-2xl border border-joy/10 bg-linear-to-b from-joy/5 to-white py-2 shadow-lg shadow-joy/5 transition-all active:scale-95"
                >
                  <div className="flex h-8 w-8 items-center justify-center">
                    <span className="material-symbols-outlined text-xl text-joy">favorite</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant leading-none">
                    Self
                  </span>
                </button>
              </Link>

              <Link href="/social" className="flex flex-1">
                <button
                  type="button"
                  className="group flex-1 w-full flex flex-col items-center justify-center rounded-2xl border border-appeal/10 bg-linear-to-b from-appeal/5 to-white py-2 shadow-lg shadow-appeal/5 transition-all active:scale-95"
                >
                  <div className="flex h-8 w-8 items-center justify-center">
                    <span className="material-symbols-outlined text-xl text-appeal">diversity_1</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant leading-none">
                    Social
                  </span>
                </button>
              </Link>
            </div>

            <div className="flex h-full grow items-center justify-center">
              <button
                type="button"
                onClick={handleAgeUp}
                className="group flex h-28 w-full flex-col items-center justify-center gap-1 rounded-4xl bg-linear-to-b from-[#8B5CF6] to-primary px-4 text-white shadow-md transition-all duration-300 active:scale-[0.98]"
              >
                <span className="text-xl font-black tracking-tight text-white">
                  {`Year ${character.age + 1}`}
                </span>
                <span className="material-symbols-outlined text-2xl font-bold text-white transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </button>
            </div>

            <div className="flex w-[30%] flex-col gap-2">
              {(() => {
                const stageRoute = getStageRoute(character?.stage ?? "");
                const hasRoute   = stageRoute !== "#";
                const btn = (
                  <button
                    type="button"
                    className={`group flex-1 w-full flex flex-col items-center justify-center rounded-2xl border border-savvy/10 bg-linear-to-b from-savvy/5 to-white py-2 shadow-lg shadow-savvy/5 transition-all${hasRoute ? " active:scale-95" : " cursor-default"}`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center">
                      <span className="material-symbols-outlined text-xl text-savvy">{getPathStage(character?.stage ?? "", character?.age).icon}</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      {getPathStage(character?.stage ?? "", character?.age).label.split(" ").map((word, i) => (
                        <span key={i} className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant leading-none">
                          {word}
                        </span>
                      ))}
                    </div>
                  </button>
                );
                return hasRoute
                  ? <Link href={stageRoute} className="flex flex-1">{btn}</Link>
                  : <div className="flex flex-1">{btn}</div>;
              })()}

              <Link href="/lifestyle" className="flex flex-1">
                <button
                  type="button"
                  className="group flex-1 flex flex-col items-center justify-center rounded-2xl border border-mind/10 bg-linear-to-b from-mind/5 to-white py-2 shadow-lg shadow-mind/5 transition-all active:scale-95"
                >
                  <div className="flex h-8 w-8 items-center justify-center">
                    <span className="material-symbols-outlined text-xl text-mind">casino</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant leading-none">
                    Lifestyle
                  </span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
