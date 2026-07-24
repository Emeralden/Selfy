from SelfyAPI.models.character import Character


def get_net_worth(character: Character) -> int:
    return (
        character.cash
        + sum(a.current_value for a in character.assets)
        + sum(i.current_value for i in character.investments)
        - sum(d.remaining_balance for d in character.debts)
    )