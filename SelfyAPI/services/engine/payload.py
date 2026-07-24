"""Helpers to convert DB models to engine payload dicts."""

from SelfyAPI.models.character import Character
from SelfyAPI.models.npc import NPC


def char_state(char: Character) -> dict:
    """Dump Character stats into engine payload format."""
    return {
        "age":         char.age,
        "body":        char.body,
        "mind":        char.mind,
        "joy":         char.joy,
        "appeal":      char.appeal,
        "savvy":       char.savvy,
        "immunity":    char.immunity,
        "discipline":  char.discipline,
        "sociability": char.sociability,
        "karma":       char.karma,
        "grades":      char.grades,
        "cash":       char.cash,
        "fertility":   char.fertility,
        "tags":        list(char.tags or []),
        "country":     char.country,
        "state":       char.state,
        "stage":       char.stage.value if char.stage else "Baby",
        "gender":      char.gender.value if char.gender else "Male",
        "first_name":  char.first_name,
        "id":          str(char.id) if char.id else "",
    }


def npc_state(npc: NPC) -> dict:
    """Dump NPC into engine payload format."""
    return {
        "id":             str(npc.id),
        "age":            npc.age,
        "temperament":    npc.temperament,
        "affection":      npc.affection,
        "trust":          npc.trust,
        "respect":        npc.respect,
        "resentment":     npc.resentment,
        "is_significant": npc.is_significant,
        "role":           npc.role or "",
    }


def apply_stat_changes(char: Character, changes: dict) -> None:
    """Write engine stat_changes back onto the Character model."""
    for stat, new_val in changes.items():
        if hasattr(char, stat):
            setattr(char, stat, new_val)


def apply_npc_changes(npc: NPC, changes: dict) -> None:
    """Write engine npc_changes back onto the NPC model."""
    for stat, new_val in changes.items():
        if stat == "relation_label":
            npc.relation_label = new_val
        elif hasattr(npc, stat):
            setattr(npc, stat, new_val)
