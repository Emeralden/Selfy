/**
 * Canonical stage metadata — single source of truth for stage display.
 * Import this instead of redefining the map in every page.
 *
 * Used by: app/page.tsx, app/user/page.tsx, app/user/saved-lives/page.tsx
 */

export type StageMeta = {
  label: string;
  icon: string;   // Material Symbols icon name
  route?: string; // Primary route for this stage (undefined = no dedicated page)
};

export const STAGE_META: Record<string, StageMeta> = {
  "Baby":       { label: "Baby",       icon: "baby_changing_station" },
  "Toddler":    { label: "Toddler",    icon: "child_care" },
  "Pre-School": { label: "Pre-School", icon: "toys",            route: "/pre-school" },
  "School":     { label: "School",     icon: "school",          route: "/school" },
  "Exam-Prep":  { label: "Exam Prep",  icon: "menu_book",       route: "/exam-prep" },
  "University": { label: "University", icon: "account_balance",  route: "/university" },
  "Adult":      { label: "Path",       icon: "trending_up" },
  "Elder":      { label: "Path",       icon: "trending_up" },
};

/** Fallback for unknown stages. */
const FALLBACK: StageMeta = { label: "Path", icon: "trending_up" };

export function getStageMeta(stage: string): StageMeta {
  return STAGE_META[stage] ?? FALLBACK;
}

export function getStageRoute(stage: string): string {
  return STAGE_META[stage]?.route ?? "#";
}

/**
 * Returns a more granular label for the School stage based on age + dropout tag.
 * For all other stages just returns getStageMeta(stage).
 */
export function getSchoolStageLabel(
  stage: string,
  age?: number,
  tags?: string[],
): { label: string; icon: string } {
  if (stage === "School") {
    if (tags?.includes("School_Dropout")) return { label: "Dropped", icon: "block" };
    if (age != null) {
      if (age <= 9)  return { label: "Junior School", icon: "cottage" };
      if (age <= 12) return { label: "Middle School", icon: "school" };
      return               { label: "Senior School",  icon: "domain" };
    }
  }
  const meta = getStageMeta(stage);
  return { label: meta.label, icon: meta.icon };
}
