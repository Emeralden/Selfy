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

    tags = GEOGRAPHY[country]["states"][state]["tags"]

    firsts = []
    lasts = []

    for tag in tags:
        firsts += NAMES[tag]["first_names"][gender]
        lasts += NAMES[tag]["last_names"]
    
    first_name = random.choice(firsts)

    if not family_name:
        last_name = random.choice(lasts)
    else:
        last_name = family_name

    return first_name, last_name