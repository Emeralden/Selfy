"""Age-Up event dispatcher — wave-parallel, barrier-separated pipeline.

HANDLER CONTRACT
────────────────
    async def handler(snapshot: dict, session, redis, bg_tasks, log_memory)
        -> Callable | None

    snapshot  : frozen view of char state at the START of this wave.
                All handlers in the wave see the SAME snapshot — no
                read-after-write hazards between sibling handlers.
    return    : an `apply(char)` callable (sync or async) that performs
                char/session mutations, OR None if nothing to apply.

DO NOT write to char inside the handler body — only I/O here.
Mutations belong exclusively in the returned apply() closure.

WAVE / BARRIER MODEL
────────────────────
  Wave N  →  gather() all handlers concurrently (only I/O overlaps)
          →  apply()  closures in priority order  (fast, no I/O)
  ──────── BARRIER ────────  char state is now fully committed
  Wave N+1 sees the applied output of Wave N.
"""

import asyncio
import inspect
from dataclasses import dataclass
from itertools import groupby
from typing import Callable

from SelfyAPI.services.engine.payload import char_state, npc_state


@dataclass
class EventHandler:
    priority: int
    wave: int
    func: Callable
    name: str


AGE_UP_HANDLERS: list[EventHandler] = []


def subscribe_age_up(priority: int = 10, wave: int = 1):
    """Register a handler in the age-up pipeline.

    Args:
        priority: Apply order within the wave. Lower runs first.
                  Keep priorities unique within a wave.
        wave:     Barrier group. Same wave = parallel gather, sequential apply.
                  Higher wave number = runs after lower waves have fully applied.

    Wave layout (current):
        1  — age increment only              (wave 2 snapshots the new age)
        2  — tag cleanup / avatar / stage /  (5 engine calls in parallel)
             stat decay / relations
        3  — death check                     (needs decayed stats from wave 2)
        4  — scripted + ambient events       (read-only char)
        5  — redis cleanup (bg) + funeral    (always runs)
    """
    def decorator(func):
        AGE_UP_HANDLERS.append(EventHandler(priority, wave, func, func.__name__))
        AGE_UP_HANDLERS.sort(key=lambda h: (h.wave, h.priority))
        return func
    return decorator


def _build_snapshot(char) -> dict:
    """Build a frozen char snapshot that includes alive status, last_name, and NPC states."""
    snap = char_state(char)
    snap["alive"] = char.alive
    snap["last_name"] = char.last_name
    snap["_npcs"] = [npc_state(n) for n in (char.npcs or [])]
    return snap


async def emit_age_up(char, session, redis, bg_tasks, log_memory) -> list:
    """Run all registered age-up handlers in wave-parallel batches.

    For each wave:
      1. Snapshot char (consistent read baseline for every handler in the wave).
      2. Gather: fire all handler bodies concurrently — only HTTP/redis I/O overlaps.
      3. Apply:  execute returned closures in priority order — fast, no I/O.
    """
    results = []

    for _, wave_iter in groupby(AGE_UP_HANDLERS, key=lambda h: h.wave):
        wave_handlers = list(wave_iter)

        # Dead characters only run cleanup/funeral (priority ≥ 900).
        active = [h for h in wave_handlers if char.alive or h.priority >= 900]
        if not active:
            continue

        # ── GATHER PHASE ────────────────────────────────────────────────────
        # One snapshot per wave — every sibling handler reads identical state.
        snapshot = _build_snapshot(char)

        apply_fns = await asyncio.gather(
            *[h.func(snapshot, session, redis, bg_tasks, log_memory) for h in active]
        )

        # ── APPLY PHASE ─────────────────────────────────────────────────────
        # Run closures in priority order. No awaits between mutations keeps
        # this phase deterministic and free of interleaving surprises.
        for i, h in enumerate(active):
            fn = apply_fns[i]
            if fn is None:
                continue
            if inspect.iscoroutinefunction(fn):
                res = await fn(char)
            else:
                res = fn(char)
            if res is not None:
                results.append(res)

    return results