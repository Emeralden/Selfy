/**
 * Single source of truth for all semantic level → color mappings.
 *
 * One canonical vocabulary. APIs return one of these `level` strings.
 * The human-readable label ("Topper 🏆", "IIT Possible 🔥") is separate —
 * that's the `label` field. This map only owns colors.
 */
export const LEVEL_COLORS: Record<string, string> = {
  elite:    "#10B981",  // best possible outcome
  strong:   "#F59E0B",  // above average, solid
  good:     "#3B82F6",  // respectable, above midpoint
  average:  "#F97316",  // middle of the road
  below:    "#EF4444",  // below expectations
  poor:     "#DC2626",  // struggling
  critical: "#991B1B",  // worst / at-risk
};

/** Single safe accessor — falls back to slate for unknown levels. */
export function levelColor(level: string | undefined): string {
  return LEVEL_COLORS[level ?? ""] ?? "#64748B";
}
