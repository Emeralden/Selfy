import uuid

from SelfyAPI.dependencies import SessionDep
from SelfyAPI.routers.actions import make_action_router
from SelfyAPI.routers.utils import get_char_or_404, remove_tag
from SelfyAPI.constants import COACHING_TAG
from SelfyAPI.services.qualification import compute_rank, rank_to_label, rank_to_tier, tier_to_college

router = make_action_router("exam-prep", "exam")


@router.delete("/{char_id}/coaching")
async def leave_coaching(char_id: uuid.UUID, session: SessionDep):
    """Remove the Coaching tag — player dropped out of coaching."""
    char = get_char_or_404(session, char_id)
    remove_tag(char, session, COACHING_TAG, missing_detail="Not currently enrolled in coaching.")
    return {"ok": True}


@router.get("/{char_id}/rank")
def get_rank(char_id: uuid.UUID, session: SessionDep):
    """Return AIR projection + stress data — replaces frontend getAIR()."""
    char = get_char_or_404(session, char_id)
    rank  = compute_rank(char.grades or 50, char.discipline or 50)
    tier  = rank_to_tier(rank, char.karma or 50)
    label = rank_to_label(rank)

    # `level` uses the canonical vocabulary from lib/levelColors.ts
    if rank < 1000:    air, stress, level = "< 1,000",    20, "elite"
    elif rank < 5000:  air, stress, level = "< 5,000",    40, "strong"
    elif rank < 20000: air, stress, level = "< 20,000",   60, "average"
    elif rank < 60000: air, stress, level = "< 60,000",   75, "below"
    elif rank < 150000:air, stress, level = "< 1,50,000", 90, "poor"
    else:              air, stress, level = "Undetermined",100,"critical"

    return {
        "rank":    rank,
        "air":     air,
        "label":   label,
        "tier":    tier,
        "stress":  stress,
        "level":   level,
        "college": tier_to_college(tier),
    }
