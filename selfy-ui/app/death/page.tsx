"use client";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { useCharacterStore } from "@/app/store/useCharacterStore";

type LifeEvent = { id: string; age: number; text: string };

export default function DeathPage() {
  const router   = useRouter();
  const charId   = useCharacterStore((s) => s.charId);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: character } = useQuery<any>({
    queryKey: ["character", charId],
    queryFn: async () => (await apiClient.get(`/character/${charId}`)).data,
    enabled: !!charId,
  });

  const { data: events = [] } = useQuery<LifeEvent[]>({
    queryKey: ["events", charId],
    queryFn: async () => (await apiClient.get(`/character/${charId}/events`)).data,
    enabled: !!charId,
  });

  // If character is somehow still alive, kick back to home
  useEffect(() => {
    if (character && character.alive) router.push("/");
  }, [character, router]);

  useEffect(() => {
    const audio = new Audio("/sounds/baby-cry.mp3");
    audio.volume = 0.25;
    audio.play().catch(() => {});
    audioRef.current = audio;
    return () => { audio.pause(); };
  }, []);

  // Eulogy = the longest final event text (AI-generated)
  const eulogy = [...events]
    .reverse()
    .find((e) => e.text.length > 120)?.text
    ?? "They lived. They died. The world moved on.";

  const name = character
    ? `${character.first_name} ${character.last_name}`
    : "The Departed";
  const age = character?.age ?? "?";

  return (
    <div className="death-scene">
      {/* ── Stars ── */}
      <div className="stars" aria-hidden="true">
        {Array.from({ length: 80 }).map((_, i) => (
          <span key={i} className="star" style={{
            left:            `${(i * 137.5) % 100}%`,
            top:             `${(i * 97.3) % 60}%`,
            animationDelay:  `${(i * 0.17) % 4}s`,
            width:           `${(i % 3) + 1}px`,
            height:          `${(i % 3) + 1}px`,
          }} />
        ))}
      </div>

      {/* ── Moon ── */}
      <div className="moon" aria-hidden="true" />

      {/* ── Fog ── */}
      <div className="fog fog-1" aria-hidden="true" />
      <div className="fog fog-2" aria-hidden="true" />

      {/* ── Ground ── */}
      <div className="ground" aria-hidden="true" />

      {/* ── Dead tree (left) ── */}
      <div className="dead-tree" aria-hidden="true">
        <div className="trunk" />
        <div className="branch branch-l1" />
        <div className="branch branch-r1" />
        <div className="branch branch-l2" />
      </div>

      {/* ── Main grave scene ── */}
      <div className="grave-scene">
        {/* Stone */}
        <div className="gravestone">
          <div className="engraved-cross" aria-hidden="true" />
          <div className="stone-content">
            <p className="rip">R.I.P.</p>
            <h1 className="char-name">{name}</h1>
            <p className="char-dates">Aged {age}</p>
            <div className="divider" />
            <div className="eulogy-well">
              <p className="eulogy">{eulogy}</p>
            </div>
          </div>
          <div className="crack crack-a" aria-hidden="true" />
          <div className="crack crack-b" aria-hidden="true" />
        </div>

        {/* Mound */}
        <div className="grave-mound" />

        {/* Wilted rose */}
        <div className="dead-rose" aria-hidden="true">🥀</div>
      </div>

      {/* ── CTA ── */}
      <div className="cta-wrap">
        <p className="cta-line">Another soul, another story.</p>
        <button
          id="start-new-life-btn"
          onClick={() => router.push("/new-life")}
          className="cta-btn"
        >
          Start a New Life
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=UnifrakturMaguntia&display=swap');

        /* ── Scene container ── */
        .death-scene {
          position: relative;
          min-height: 100dvh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem 3rem;
          background: radial-gradient(ellipse at 50% 0%, #0a1628 0%, #060c14 55%, #000 100%);
          overflow: hidden;
        }

        /* ── Stars ── */
        .stars { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .star {
          position: absolute;
          border-radius: 50%;
          background: #fff;
          opacity: 0;
          animation: twinkle 4s ease-in-out infinite;
        }
        @keyframes twinkle {
          0%,100% { opacity: 0; }
          50%      { opacity: 0.75; }
        }

        /* ── Moon ── */
        .moon {
          position: absolute;
          top: 7%;
          right: 10%;
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: radial-gradient(circle at 36% 36%, #f6ead4 0%, #c8a96e 100%);
          box-shadow: 0 0 40px 12px rgba(200,169,110,0.22), 0 0 90px 25px rgba(200,169,110,0.08);
          animation: moonPulse 7s ease-in-out infinite alternate;
          z-index: 1;
        }
        @keyframes moonPulse {
          to { box-shadow: 0 0 60px 20px rgba(200,169,110,0.32), 0 0 120px 35px rgba(200,169,110,0.12); }
        }

        /* ── Fog ── */
        .fog {
          position: absolute;
          bottom: 20%;
          left: -10%;
          width: 120%;
          height: 70px;
          border-radius: 50%;
          background: rgba(160,200,210,0.05);
          filter: blur(22px);
          pointer-events: none;
          z-index: 2;
        }
        .fog-1 { animation: drift 16s ease-in-out infinite alternate; }
        .fog-2 { bottom: 25%; opacity: 0.45; animation: drift 22s ease-in-out infinite alternate-reverse; }
        @keyframes drift {
          to { transform: translateX(5%) scaleY(1.4); }
        }

        /* ── Ground ── */
        .ground {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 26%;
          background: linear-gradient(180deg, #0b1a0b 0%, #050d05 100%);
          border-top: 1px solid #172017;
          z-index: 3;
        }

        /* ── Dead tree ── */
        .dead-tree {
          position: absolute;
          bottom: 24%;
          left: 4%;
          width: 56px;
          height: 150px;
          z-index: 4;
          pointer-events: none;
        }
        .trunk {
          position: absolute;
          bottom: 0; left: 50%;
          transform: translateX(-50%);
          width: 9px;
          height: 110px;
          background: #130e06;
          border-radius: 3px;
        }
        .branch {
          position: absolute;
          background: #130e06;
          border-radius: 2px;
          transform-origin: 0% 50%;
        }
        .branch-l1 { width: 38px; height: 6px; top: 22%; left: 50%; transform: rotate(-38deg); }
        .branch-r1 { width: 30px; height: 5px; top: 38%; left: 50%; transform: rotate(42deg); }
        .branch-l2 { width: 22px; height: 4px; top: 12%; left: 50%; transform: rotate(-58deg); }

        /* ── Grave scene ── */
        .grave-scene {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 10;
          animation: riseIn 2s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Gravestone ── */
        .gravestone {
          position: relative;
          width: min(330px, 88vw);
          background: linear-gradient(155deg, #28282e 0%, #17171b 45%, #0f0f12 100%);
          border-radius: 50% 50% 5px 5px / 28% 28% 5px 5px;
          padding: 2.75rem 2rem 2rem;
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.7),
            0 40px 80px rgba(0,0,0,0.75),
            inset 0 1px 0 rgba(255,255,255,0.07),
            0 0 60px rgba(109,40,217,0.05);
          overflow: hidden;
        }

        .stone-content { text-align: center; position: relative; z-index: 2; }

        .rip {
          font-family: 'UnifrakturMaguntia', cursive;
          font-size: 1.6rem;
          color: rgba(255,255,255,0.5);
          margin: 0.4rem 0 0.1rem;
          letter-spacing: 0.12em;
        }

        .char-name {
          font-family: 'IM Fell English', serif;
          font-size: clamp(1.35rem, 4.5vw, 1.65rem);
          color: rgba(255,255,255,0.88);
          margin: 0.15rem 0;
          line-height: 1.2;
          text-shadow: 0 0 24px rgba(200,169,110,0.25);
        }

        .char-dates {
          font-family: 'IM Fell English', serif;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.25em;
          margin: 0.2rem 0 0.6rem;
        }

        .divider {
          width: 55%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          margin: 0 auto 0.8rem;
        }

        .eulogy-well {
          max-height: 190px;
          overflow-y: auto;
          scrollbar-width: none;
          -webkit-mask-image: linear-gradient(180deg, #000 70%, transparent 100%);
          mask-image: linear-gradient(180deg, #000 70%, transparent 100%);
        }
        .eulogy-well::-webkit-scrollbar { display: none; }

        .eulogy {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: clamp(0.95rem, 3vw, 1.0rem);
          color: rgba(255,255,255,0.45);
          line-height: 1.75;
          white-space: pre-line;
        }

        /* Stone cracks */
        .crack {
          position: absolute;
          pointer-events: none;
          background: rgba(0,0,0,0.6);
          box-shadow: 1px 0 0 rgba(255,255,255,0.035);
        }
        .crack-a { width: 1px; height: 55px; top: 28%; left: 18%; transform: rotate(10deg); border-radius: 1px; }
        .crack-b { width: 1px; height: 38px; top: 52%; right: 22%; transform: rotate(-14deg); border-radius: 1px; }

        /* ── Grave mound ── */
        .grave-mound {
          width: min(270px, 75vw);
          height: 26px;
          background: linear-gradient(180deg, #182818 0%, #0c1a0c 100%);
          border-radius: 50% 50% 0 0;
          border-top: 1px solid #223322;
          margin-top: -3px;
          z-index: 11;
        }
        
        @keyframes sway {
          from { transform: rotate(-6deg); }
          to   { transform: rotate(6deg) translateY(2px); }
        }

        /* ── CTA ── */
        .cta-wrap {
          z-index: 10;
          text-align: center;
          margin-top: 2.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          animation: riseIn 2.6s cubic-bezier(0.16,1,0.3,1) both;
        }
        .cta-line {
          font-family: 'IM Fell English', serif;
          font-style: italic;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.28);
          letter-spacing: 0.06em;
        }
        .cta-btn {
          padding: 0.7rem 2.2rem;
          background: linear-gradient(135deg, #3b1f6e 0%, #6D28D9 100%);
          color: #fff;
          border: none;
          border-radius: 999px;
          font-size: 0.88rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          cursor: pointer;
          box-shadow: 0 0 32px rgba(109,40,217,0.45), 0 6px 20px rgba(0,0,0,0.5);
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .cta-btn:hover {
          transform: translateY(-3px) scale(1.04);
          box-shadow: 0 0 50px rgba(109,40,217,0.65), 0 10px 30px rgba(0,0,0,0.5);
        }
        .cta-btn:active { transform: scale(0.97); }
      `}</style>
    </div>
  );
}
