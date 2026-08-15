"""Shared router-level helpers.

Tiny utilities that every router needs but that don't belong
in services/ (too thin) or dependencies/ (not FastAPI plumbing).
"""

import uuid

from fastapi import HTTPException

from SelfyAPI.models.character import Character


def get_char_or_404(session, char_id: uuid.UUID) -> Character:
    """Fetch a Character by ID or raise 404. One-liner for every router."""
    char = session.get(Character, char_id)
    if not char:
        raise HTTPException(status_code=404, detail="Character not found.")
    return char


def remove_tag(char: Character, session, tag: str, *, missing_detail: str | None = None) -> None:
    """Remove *tag* from char.tags and commit.

    Args:
        char:           The Character model (already fetched).
        session:        Active SQLModel session.
        tag:            Exact tag string to remove.
        missing_detail: Custom 400 message when the tag isn't present.
                        If None, silently no-ops instead of raising.

    Raises:
        HTTPException(400) if missing_detail is set and tag is absent.
    """
    tags = list(char.tags or [])
    if tag not in tags:
        if missing_detail:
            raise HTTPException(status_code=400, detail=missing_detail)
        return
    char.tags = [t for t in tags if t != tag]
    session.add(char)
    session.commit()
