import inspect
from dataclasses import dataclass
from typing import Callable

@dataclass
class EventHandler:
    priority: int
    func: Callable
    name: str

AGE_UP_HANDLERS: list[EventHandler] = []

def subscribe_age_up(priority: int = 10):
    """DECORATOR: Use this to attach a function to the Age Up shout!"""
    def decorator(func):
        AGE_UP_HANDLERS.append(EventHandler(priority, func, func.__name__))
        AGE_UP_HANDLERS.sort(key=lambda x: x.priority)
        return func
    return decorator

async def emit_age_up(char, session, redis, bg_tasks, log_memory):
    results = []
    for handler in AGE_UP_HANDLERS:
        if not char.alive and handler.priority < 900:
            continue 
        if inspect.iscoroutinefunction(handler.func):
            res = await handler.func(char, session, redis, bg_tasks, log_memory)
        else:
            res = handler.func(char, session, redis, bg_tasks, log_memory)
        if res:
            results.append(res)
    return results