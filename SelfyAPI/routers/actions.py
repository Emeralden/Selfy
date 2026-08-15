"""Generic action router factory — stamps out get_actions + do_action for any phase."""

import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException

from SelfyAPI.dependencies import RedisDep, SessionDep
from SelfyAPI.services.engine import client as engine
from SelfyAPI.services.engine.payload import char_state
from SelfyAPI.services.engine.pipeline import resolve_and_persist
from SelfyAPI.services.rate_limiter import within_limit
from SelfyAPI.routers.utils import get_char_or_404


def make_action_router(
    prefix: str,
    phase: str,
    *,
    result_fields: list[str] | None = None,
    post_resolve=None,
) -> APIRouter:
    """Create a router with standard get_actions + do_action endpoints for *phase*.

    Args:
        result_fields: engine result keys to forward in the response.
        post_resolve:  async (response, char, redis, stats_apply) -> response
                       hook to modify the response after resolve_and_persist.
    """
    router = APIRouter(prefix=f"/{prefix}")

    @router.get("/{char_id}/actions")
    async def get_actions(char_id: uuid.UUID, session: SessionDep):
        char = get_char_or_404(session, char_id)
        return await engine.resolve("action.available", {
            "phase": phase,
            "age":   char.age,
            "tags":  list(char.tags or []),
        })

    @router.get("/{char_id}/action")
    async def do_action(
        char_id: uuid.UUID,
        action_name: str,
        session: SessionDep,
        redis: RedisDep,
        bg_tasks: BackgroundTasks,
        outcome: str | None = None,
    ):
        char = get_char_or_404(session, char_id)

        # 1. Validate action is available for this age/tags
        available = await engine.resolve("action.available", {
            "phase": phase,
            "age":   char.age,
            "tags":  list(char.tags or []),
        })
        action_meta = next((a for a in available if a["id"] == action_name), None)
        if not action_meta:
            raise HTTPException(status_code=403, detail="Action not available.")

        # 2. Rate-limit
        stats_apply = await within_limit(
            redis, char_id, char.age, action_name, action_meta["yearly_limit"]
        )

        response = await resolve_and_persist(
            engine_type="action.resolve",
            engine_payload={
                "phase":          phase,
                "action_id":      action_name,
                "outcome_choice": outcome,
                "state":          char_state(char),
            },
            char=char,
            session=session,
            redis=redis,
            bg_tasks=bg_tasks,
            apply_stats=stats_apply,
            apply_tags=stats_apply,
            result_fields=result_fields,
        )

        if post_resolve:
            response = await post_resolve(response, char, redis, stats_apply)

        return response

    return router
