import json
import os
import random

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

NAMES_PATH = os.path.join(BASE_DIR, "data", "names.json")
GEO_PATH = os.path.join(BASE_DIR, "data", "geography.json")

with open(NAMES_PATH, 'r') as file:
    NAMES = json.load(file)

with open(GEO_PATH, 'r') as file:
    GEOGRAPHY = json.load(file)

def generate_name(gender:str, country:str, state:str, family_name:str = None):

    name_group = GEOGRAPHY[country]["states"][state]["name_group"]
    print(name_group)
    firsts = NAMES[name_group]["first_names"][gender]
    lasts = NAMES[name_group]["last_names"]
    
    first_name = random.choice(firsts)

    if not family_name:
        last_name = random.choice(lasts)
    else:
        last_name = family_name

    return first_name, last_name

def get_states(country: str) -> list[str]:
    if country not in GEOGRAPHY:
        return []
    return sorted(GEOGRAPHY[country]["states"].keys())