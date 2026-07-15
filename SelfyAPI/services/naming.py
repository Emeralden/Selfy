"""Name generation — delegates to selfy-engine."""

from SelfyAPI.services.engine import client as engine


async def generate_name_async(gender: str, country: str, state: str, family_name: str = None) -> tuple[str, str]:
    """Async version — use this in async contexts."""
    result = await engine.resolve("names.generate", {
        "gender": gender,
        "country": country,
        "state": state,
        "family_name": family_name,
    })
    if "error" in result:
        raise ValueError(result["error"])
    return result["first_name"], result["last_name"]


async def get_states(country: str) -> list[str]:
    result = await engine.resolve("names.states", {"country": country})
    if isinstance(result, dict) and "error" in result:
        return []
    return result
