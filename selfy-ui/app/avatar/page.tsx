"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCharacterStore } from "../store/useCharacterStore";
import { apiClient } from "@/lib/apiClient";
import Header from "../components/Header";
import Link from "next/link";

const OPTIONS = {
  top: ["hat", "hijab", "turban", "winterHat1", "winterHat02", "winterHat03", "winterHat04", "bob", "bun", "curly", "curvy", "dreads", "frida", "fro", "froBand", "longButNotTooLong", "miaWallace", "shavedSides", "straight02", "straight01", "straightAndStrand", "dreads01", "dreads02", "frizzle", "shaggy", "shaggyMullet", "shortCurly", "shortFlat", "shortRound", "shortWaved", "sides", "theCaesar", "theCaesarAndSidePart", "bigHair"],
  accessories: ["", "kurt", "prescription01", "prescription02", "round", "sunglasses", "wayfarers", "eyepatch"],
  clothing: ["blazerAndShirt", "blazerAndSweater", "collarAndSweater", "graphicShirt", "hoodie", "overall", "shirtCrewNeck", "shirtScoopNeck", "shirtVNeck"],
  eyes: ["closed", "cry", "default", "eyeRoll", "happy", "hearts", "side", "squint", "surprised", "winkWacky", "wink", "xDizzy"],
  eyebrows: ["angryNatural", "defaultNatural", "flatNatural", "frownNatural", "raisedExcitedNatural", "sadConcernedNatural", "unibrowNatural", "upDownNatural", "angry", "default", "raisedExcited", "sadConcerned", "upDown"],
  mouth: ["concerned", "default", "disbelief", "eating", "grimace", "sad", "screamOpen", "serious", "smile", "tongue", "twinkle", "vomit"],
  facialHair: ["", "beardLight", "beardMajestic", "beardMedium", "moustacheFancy", "moustacheMagnum"],
  skinColor: ["614335", "d08b5b", "ae5d29", "edb98a", "ffdbb4", "fd9841", "f8d25c"],
  hairColor: ["a55728", "2c1b18", "b58143", "d6b370", "724133", "4a312c", "f59797", "ecdcbf", "c93305", "e8e1e1"],
  clothesColor: ["262e33", "65c9ff", "5199e4", "25557c", "e6e6e6", "929598", "3c4f5c", "b1e2ff", "a7ffc4", "ffafb9", "ffffb1", "ff488e", "ff5c5c", "ffffff"]
};

const CATEGORIES = [
  { id: 'top', label: 'Hair / Top' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'eyes', label: 'Eyes' },
  { id: 'eyebrows', label: 'Eyebrows' },
  { id: 'mouth', label: 'Mouth' },
  { id: 'facialHair', label: 'Facial Hair' },
  { id: 'skinColor', label: 'Skin Color' },
  { id: 'hairColor', label: 'Hair Color' },
  { id: 'clothesColor', label: 'Clothing Color' },
];

export default function AvatarBuilder() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const charId = useCharacterStore((s) => s.charId);
  const authUser = queryClient.getQueryData<{ active_character_id: string | null }>(["authMe"]);
  const CHAR_ID = charId ?? authUser?.active_character_id ?? "";

  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('top');
  const [avatarParams, setAvatarParams] = useState<Record<string, string>>({
    seed: 'Felix',
    top: 'shortFlat',
    accessories: '',
    clothing: 'shirtCrewNeck',
    eyes: 'default',
    eyebrows: 'default',
    mouth: 'default',
    facialHair: '',
    skinColor: 'ffdbb4',
    hairColor: '2c1b18',
    clothesColor: '65c9ff'
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadChar() {
      if (!CHAR_ID) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/character/${CHAR_ID}`);
        if (res.data.avatar_url) {
          const urlParams = new URL(res.data.avatar_url).searchParams;
          const newParams = { ...avatarParams };
          for (const key of Object.keys(OPTIONS)) {
            const val = urlParams.get(key);
            if (val) newParams[key] = val;
          }
          if (urlParams.get('seed')) newParams.seed = urlParams.get('seed')!;
          setAvatarParams(newParams);
        } else {
          setAvatarParams(p => ({ ...p, seed: res.data.first_name || 'Felix' }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadChar();
  }, [CHAR_ID]);

  const generateUrl = (params: Record<string, string>) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
    
    // Enforce display of optional items
    q.set('facialHairProbability', params.facialHair ? '100' : '0');
    q.set('accessoriesProbability', params.accessories ? '100' : '0');
    if (params.hairColor) {
      q.set('facialHairColor', params.hairColor);
    }
    
    return `https://api.dicebear.com/9.x/avataaars/svg?${q.toString()}`;
  };

  const handleSave = async () => {
    if (!CHAR_ID) return;
    setSaving(true);
    try {
      const url = generateUrl(avatarParams);
      await apiClient.patch(`/character/${CHAR_ID}/avatar`, { avatar_url: url });
      queryClient.invalidateQueries({ queryKey: ['character', CHAR_ID] });
      router.push("/");
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <h1 className="animate-pulse text-xl font-black text-primary">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface">
      <div className="flex items-center justify-between p-4 border-b border-outline-variant bg-white">
        <button onClick={() => router.push("/")} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h1 className="text-lg font-black text-on-surface">Style Avatar</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white shadow-md active:scale-95 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="flex flex-col items-center justify-center p-8 bg-slate-50">
        <div className="relative h-48 w-48 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-primary/20 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={generateUrl(avatarParams)}
            alt="Avatar Preview"
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      <div className="flex overflow-x-auto border-y border-outline-variant bg-white px-2 py-3 no-scrollbar shrink-0">
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-slate-100 text-on-surface-variant hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-white">
        <div className="grid grid-cols-3 gap-3">
          {activeCategory.includes('Color') ? (
            OPTIONS[activeCategory as keyof typeof OPTIONS].map((hex) => (
              <button
                key={hex}
                onClick={() => setAvatarParams({ ...avatarParams, [activeCategory]: hex })}
                className={`relative flex h-16 w-full items-center justify-center rounded-2xl border-2 transition-all active:scale-95 ${
                  avatarParams[activeCategory] === hex ? 'border-primary shadow-lg scale-105' : 'border-transparent shadow-sm'
                }`}
                style={{ backgroundColor: `#${hex}` }}
              >
                {avatarParams[activeCategory] === hex && (
                  <span className="material-symbols-outlined text-white drop-shadow-md">check_circle</span>
                )}
              </button>
            ))
          ) : (
            OPTIONS[activeCategory as keyof typeof OPTIONS].map((opt) => (
              <button
                key={opt || 'none'}
                onClick={() => setAvatarParams({ ...avatarParams, [activeCategory]: opt })}
                className={`flex flex-col items-center justify-center rounded-2xl p-2 transition-all active:scale-95 ${
                  avatarParams[activeCategory] === opt
                    ? 'bg-primary/10 border-2 border-primary shadow-sm'
                    : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                }`}
              >
                <div className="h-14 w-14 mb-1 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={generateUrl({ ...avatarParams, [activeCategory]: opt })}
                    alt={opt || 'none'}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant text-center leading-tight">
                  {opt ? opt.replace(/([A-Z])/g, ' $1').trim() : 'None'}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
