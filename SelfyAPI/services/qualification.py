"""
Qualification & rank logic — pure functions, no DB access.
Used by life.py (counseling_prompt), exam_prep.py (counseling endpoint),
and aging.py (graduation on age 22).
"""

# -- College profiles per tier -------------------------------------------------
COLLEGE_MAP = {
    "Premier": {
        "name":    "IIT Bombay",
        "branch":  "Computer Science & Engineering",
        "acronym": "IIT",
        "glow":    "rgba(109,40,217,0.55)",
        "bg":      "linear-gradient(135deg, #1e0a38 0%, #2D1462 40%, #4C1D95 100%)",
        "blobA":   "radial-gradient(circle, rgba(167,139,250,0.35), transparent 70%)",
        "blobB":   "radial-gradient(circle, rgba(124,58,237,0.25), transparent 70%)",
    },
    "Mid": {
        "name":    "NIT Trichy",
        "branch":  "Electronics & Communication",
        "acronym": "NIT",
        "glow":    "rgba(16,185,129,0.50)",
        "bg":      "linear-gradient(135deg, #052e1c 0%, #064e35 40%, #065f46 100%)",
        "blobA":   "radial-gradient(circle, rgba(110,231,183,0.35), transparent 70%)",
        "blobB":   "radial-gradient(circle, rgba(52,211,153,0.25), transparent 70%)",
    },
    "Low": {
        "name":    "Amity University",
        "branch":  "Computer Applications",
        "acronym": "PVT",
        "glow":    "rgba(245,158,11,0.50)",
        "bg":      "linear-gradient(135deg, #1c1200 0%, #3d2800 40%, #78350f 100%)",
        "blobA":   "radial-gradient(circle, rgba(253,211,77,0.35), transparent 70%)",
        "blobB":   "radial-gradient(circle, rgba(234,179,8,0.25), transparent 70%)",
    },
}


def compute_rank(grades: int, discipline: int) -> int:
    score = grades * 0.6 + discipline * 0.4
    if score >= 88: return 800
    if score >= 78: return 4000
    if score >= 65: return 18000
    if score >= 50: return 55000
    if score >= 35: return 140000
    return 200000


def rank_to_label(rank: int) -> str:
    if rank < 1000:   return "Rank < 1,000 - IIT Possible"
    if rank < 5000:   return "Rank < 5,000 - NIT Likely"
    if rank < 20000:  return "Rank < 20,000 - State CET"
    if rank < 60000:  return "Rank < 60,000 - Private College"
    if rank < 150000: return "Rank < 1,50,000 - Drop Year?"
    return "Rank Undetermined - Need Help"


def rank_to_tier(rank: int, karma: int) -> str:
    effective = rank - (1000 if karma >= 80 else 0)
    if effective < 5000:  return "Premier"
    if effective < 60000: return "Mid"
    return "Low"


def tier_to_college(tier):
    return COLLEGE_MAP.get(tier or "Low", COLLEGE_MAP["Low"])


def graduation_qualification(tier) -> str:
    if tier == "Premier": return "Premier Graduate"
    if tier == "Mid":     return "Mid-Tier Graduate"
    return "Graduate"
