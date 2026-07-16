// Shared action card theme map — imported by all phase pages.
// Add new themes here; every page picks them up automatically.

export interface ThemeEntry {
  color: string;
  bg: string;
  glow: string;
}

export const THEME_MAP: Record<string, ThemeEntry> = {
  amber:  { color: "#F59E0B", bg: "linear-gradient(135deg, #FFFBEB, #FEF3C7)", glow: "rgba(245,158,11,0.18)"  },
  indigo: { color: "#6366F1", bg: "linear-gradient(135deg, #EEF2FF, #E0E7FF)", glow: "rgba(99,102,241,0.18)"  },
  pink:   { color: "#EC4899", bg: "linear-gradient(135deg, #FDF2F8, #FCE7F3)", glow: "rgba(236,72,153,0.18)"  },
  green:  { color: "#10B981", bg: "linear-gradient(135deg, #ECFDF5, #D1FAE5)", glow: "rgba(16,185,129,0.18)"  },
  sky:    { color: "#0EA5E9", bg: "linear-gradient(135deg, #F0F9FF, #E0F2FE)", glow: "rgba(14,165,233,0.18)"  },
  orange: { color: "#F97316", bg: "linear-gradient(135deg, #FFF7ED, #FFEDD5)", glow: "rgba(249,115,22,0.18)"  },
  red:    { color: "#EF4444", bg: "linear-gradient(135deg, #FFF1F2, #FFE4E6)", glow: "rgba(239,68,68,0.18)"   },
  joy:    { color: "#FF6B00", bg: "linear-gradient(135deg, #FFF7ED, #FFEDD5)", glow: "rgba(255,107,0,0.18)"   },
  purple: { color: "#6D28D9", bg: "linear-gradient(135deg, #F5F3FF, #EDE9FE)", glow: "rgba(109,40,217,0.18)"  },
  slate:  { color: "#64748B", bg: "linear-gradient(135deg, #F8FAFC, #F1F5F9)", glow: "rgba(100,116,139,0.18)" },
};

export const DEFAULT_THEME = THEME_MAP.joy;
