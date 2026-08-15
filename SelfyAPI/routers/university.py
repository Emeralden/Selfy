import uuid

from SelfyAPI.routers.actions import make_action_router
from SelfyAPI.routers.utils import get_char_or_404
from SelfyAPI.services.qualification import tier_to_college, rank_to_tier, compute_rank

router = make_action_router("university", "university")


@router.get("/{char_id}/standing")
def get_standing(char_id: uuid.UUID, session):
    """Return CGPA + college standing — replaces frontend getCGPA()."""
    from SelfyAPI.dependencies import SessionDep  # noqa: avoid circular
    char = get_char_or_404(session, char_id)
    grades = char.grades or 50

    # `level` uses the canonical vocabulary from lib/levelColors.ts
    if grades >= 90:   cgpa, label, level = "9.5+",     "Topper 🏆",       "elite"
    elif grades >= 80: cgpa, label, level = "8.5–9.4",  "Distinction ✅",  "strong"
    elif grades >= 65: cgpa, label, level = "7.5–8.4",  "First Class 📘",  "good"
    elif grades >= 50: cgpa, label, level = "6.5–7.4",  "Pass Class 📋",   "average"
    elif grades >= 35: cgpa, label, level = "5.0–6.4",  "Borderline ⚠️", "below"
    else:              cgpa, label, level = "< 5.0",    "Detained 💀",     "critical"

    rank  = compute_rank(grades, char.discipline or 50)
    tier  = rank_to_tier(rank, char.karma or 50)

    return {
        "cgpa":    cgpa,
        "label":   label,
        "level":   level,
        "college": tier_to_college(tier),
        "tier":    tier,
    }
