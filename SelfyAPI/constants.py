"""Canonical tag string constants — API side.

Never use raw "School_Dropout" literal strings in routers.
Import from here so a rename is one change.

Mirror: selfy-ui/lib/tags.ts (keep in sync when renaming)
"""

# ── School ────────────────────────────────────────────────────────────────────
SCHOOL_DROPOUT_TAG  = "School_Dropout"
TUITION_TAG         = "Tuition"
MONITOR_TAG         = "Monitor"

# Tags removed when dropping out
SCHOOL_ENROLLED_TAGS = (TUITION_TAG, MONITOR_TAG)

# ── Exam Prep ─────────────────────────────────────────────────────────────────
COACHING_TAG        = "Coaching"

# ── Clubs ─────────────────────────────────────────────────────────────────────
CLUB_TAG_PREFIX     = "Club_"

# ── Academic reputation ───────────────────────────────────────────────────────
TOPPER_TAG          = "Topper"
SPORTSPERSON_TAG    = "Sportsperson"

# ── Age thresholds ────────────────────────────────────────────────────────────
# Minimum age at which a student can voluntarily drop out of school.
SCHOOL_DROPOUT_MIN_AGE = 13
