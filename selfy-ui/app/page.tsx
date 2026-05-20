"use client";
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type LifeEvent = {
  id: string;
  age: number;
  text: string;
};

export default function Page() {

  const CHAR_ID = "1cf00299-f2ef-4471-a4fd-51eb639919d7";
  const queryClient = useQueryClient();

  const { data: character, isLoading: isCharacterLoading } = useQuery<any>({
    queryKey: ['character', CHAR_ID],
    queryFn: async () => {
      const response = await fetch(`http://127.0.0.1:8000/character/${CHAR_ID}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    }
  });

  const { data: events = [], isLoading: isEventsLoading } = useQuery<LifeEvent[]>({
    queryKey: ['events', CHAR_ID],
    queryFn: async () => {
      const response = await fetch(`http://127.0.0.1:8000/character/${CHAR_ID}/events`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    }
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

      const response = await fetch(`http://127.0.0.1:8000/life/${character.id}/age_up`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed to age up!");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character', CHAR_ID] });
      queryClient.invalidateQueries({ queryKey: ['events', CHAR_ID] });
    },
  });

  const handleAgeUp = () => {
    ageUpMutation.mutate();
  };

  if (isCharacterLoading || isEventsLoading || !character) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <h1 className="animate-pulse text-xl font-black text-primary">Loading Simulation...</h1>
      </div>
    );
  }
  

  return (
    <div className="flex h-dvh flex-col bg-background font-body text-on-surface overflow-hidden">
      <header className="w-full shrink-0 border-b border-outline-variant/30 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 pb-1 pt-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
            <span className="material-symbols-outlined text-[18px] text-slate-500">person</span>
          </div>

          <span className="brand-text inline-block text-primary antialiased">selfy</span>

          <div className="flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px] text-primary">
              account_balance_wallet
            </span>
          </div>
        </div>

        <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-xl text-primary">account_circle</span>
            </div>
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
            <div className="flex items-center gap-3 text-right">
              <div className="h-4 w-px bg-outline-variant" />
              <span className="text-xl font-black tracking-tight text-primary">
                {`₹${character.money}`}
              </span>
            </div>
          </div>
        </div>
      </header>

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
                
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${isCurrent ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-on-surface-variant/70'}`}>
                  {isCurrent ? "Current" : "Archived"}
                </span>
              </div>
              <div className="ml-3 space-y-3 border-l-2 border-slate-100 pl-6">
                {getEventsForAge(age).map((event: LifeEvent) => (
                  <div key={event.id} className="py-2">
                    
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${isCurrent ? 'bg-primary' : 'bg-slate-300'}`} />
                      <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isCurrent ? 'text-on-surface-variant' : 'text-on-surface-variant/70'}`}>
                        Memory
                      </span>
                    </div>

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
              <button
                type="button"
                className="group flex-1 flex flex-col items-center justify-center rounded-2xl border border-appeal/10 bg-linear-to-b from-appeal/5 to-white py-2 shadow-lg shadow-appeal/5 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined mb-0.5 text-xl text-appeal">group</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
                  Social
                </span>
              </button>

              <button
                type="button"
                className="flex-1 rounded-2xl border border-savvy/10 bg-linear-to-b from-savvy/5 to-white py-2 transition-all active:scale-95"
              />
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
              <button
                type="button"
                className="flex-1 rounded-2xl border border-joy/10 bg-linear-to-b from-joy/5 to-white py-2 transition-all active:scale-95"
              />
              <button
                type="button"
                className="flex-1 rounded-2xl border border-mind/10 bg-linear-to-b from-mind/5 to-white py-2 transition-all active:scale-95"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
