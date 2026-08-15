/**
 * Canonical tag string constants — frontend side.
 *
 * Never use raw "School_Dropout" string literals in page files.
 * Import from here so a tag rename is a 1-line change.
 *
 * Mirror: SelfyAPI/constants.py (keep in sync when renaming)
 */

export const TAGS = {
  // ── School ──────────────────────────────────────────────────────────────────
  SCHOOL_DROPOUT: "School_Dropout",
  TUITION:        "Tuition",
  MONITOR:        "Monitor",

  // ── Exam Prep ───────────────────────────────────────────────────────────────
  COACHING:       "Coaching",

  // ── Clubs ───────────────────────────────────────────────────────────────────
  CLUB_PREFIX:    "Club_",

  // ── Academic reputation (granted by actions/engine) ──────────────────────
  TOPPER:         "Topper",
  SPORTSPERSON:   "Sportsperson",

  // ── Life stage flags ────────────────────────────────────────────────────────
  PREMIER_GRADUATE: "Premier Graduate",
  MID_TIER_GRADUATE: "Mid-Tier Graduate",
} as const;

export type TagKey = keyof typeof TAGS;

/** Returns true if the tags array contains the Club_ prefix tag. */
export function hasClubTag(tags: string[]): boolean {
  return tags.some((t) => t.startsWith(TAGS.CLUB_PREFIX));
}

/** Minimum age to show marital status on the self page. */
export const MIN_MARITAL_AGE = 18;
