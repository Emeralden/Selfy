/**
 * relationTone — maps a relation_label string to chip display colors.
 * Single source of truth — was copy-pasted across social/page.tsx,
 * school/[group]/page.tsx, and social/[npcId]/page.tsx.
 *
 * Labels come from the engine (script.py → relation_label()).
 */

export type ChipTone = {
  color: string;
  bg: string;
  border: string;
};

const TONE_MAP: Record<string, ChipTone> = {
  attached:    { color: "#047857", bg: "#ECFDF5", border: "rgba(4,120,87,0.16)" },
  close:       { color: "#0F766E", bg: "#F0FDFA", border: "rgba(15,118,110,0.16)" },
  warm:        { color: "#B45309", bg: "#FFFBEB", border: "rgba(180,83,9,0.16)" },
  formal:      { color: "#0369A1", bg: "#F0F9FF", border: "rgba(3,105,161,0.16)" },
  complicated: { color: "#C2410C", bg: "#FFF7ED", border: "rgba(194,65,12,0.16)" },
  strained:    { color: "#D97706", bg: "#FFFBEB", border: "rgba(217,119,6,0.16)" },
  tense:       { color: "#DC2626", bg: "#FEF2F2", border: "rgba(220,38,38,0.16)" },
  fractured:   { color: "#B91C1C", bg: "#FEF2F2", border: "rgba(185,28,28,0.18)" },
  distant:     { color: "#64748B", bg: "#F8FAFC", border: "rgba(100,116,139,0.16)" },
};

const NEUTRAL: ChipTone = { color: "#64748B", bg: "#F8FAFC", border: "rgba(100,116,139,0.16)" };

export function relationTone(label: string): ChipTone {
  return TONE_MAP[label.trim().toLowerCase()] ?? NEUTRAL;
}
