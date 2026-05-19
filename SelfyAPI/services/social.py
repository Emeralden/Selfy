import random

from sqlmodel import select

from SelfyAPI.dependencies import SessionDep
from SelfyAPI.models.character import Character, Gender
from SelfyAPI.models.npc import NPC
from SelfyAPI.services.naming import generate_name


def get_reputation(char:Character):
    achievements = 0
    scandals = 0
    
    raw_rep = (char.appeal * 0.3) + (char.savvy * 0.2) + (achievements * 0.4) - (scandals * 0.5)

    reputation = raw_rep * 1.5

    return reputation


def spawn_relatives(char:Character, session:SessionDep):
    archetypes = [{"role": "Rival Cousin", 
                 "resentment": 30,
                 "temperament": 20,
                 "affection": -10,
                 "age": random.randint(char.age-1, char.age+1),
                 "gender": char.gender,
                 "is_significant": True
                }, 
                {"role": "Nosy Aunt", 
                 "strictness": 40, 
                 "affection": -20,
                 "empathy": -10,
                 "respect": 10,
                 "age": random.randint(25,40),
                 "gender": "Female",
                 "is_significant": True}]
    
    for archetype in archetypes:
        first_name, last_name = generate_name(archetype["gender"], char.country, char.state)
        archetype["gender"] = Gender(archetype["gender"])
        npc = NPC(first_name=first_name,
                  last_name=last_name,
                  char_id=char.id,
                  **archetype)
        session.add(npc)
    
    session.commit()
    return



def spawn_school_cohort(char: Character, session:SessionDep, num_kids:int):

    for _ in range(num_kids):
        gender = random.choice(["Male", "Female"])
        first_name, last_name = generate_name(gender, char.country, char.state)

        kid = NPC(
        first_name=first_name,
        last_name=last_name,
        age=random.randint((char.age)-1, (char.age)+1),
        gender=gender,
        role="classmate",
        char_id=char.id,
        )

        session.add(kid)

    gender = random.choice(["Male", "Female"])
    first_name, last_name = generate_name(gender, char.country, char.state)
    teacher = NPC(
        first_name=first_name,
        last_name=last_name,
        age=random.randint(25, 50),
        gender=gender,
        role="teacher",
        char_id=char.id,
        )
    
    session.commit()
    return


def purge_npcs(char:Character, session:SessionDep):

    query = select(NPC).where(
        NPC.char_id == char.id,
        NPC.role.in_(["classmate", "teacher"]),
        NPC.is_significant ==False
    )

    npcs = session.exec(query).all()

    for npc in npcs:
        session.delete(npc)
    
    session.commit()
    return


def relation_label(npc:NPC):
    a = npc.affection
    t = npc.trust
    r = npc.respect
    rs = npc.resentment
 
    if a>70 and t>70:
        return "Attached"

    elif (a>60 and t>60) and r>40 and rs<50:
        return "Close"

    elif (a>50 and (t>40 or r>40)) and rs<60:
        return "Warm"

    elif a>60 and rs>50:
        return "Complicated"

    elif r>50 and (t<40 or rs>40):
        return "Strained"

    elif t>60 and a<40:
        return "Formal"

    elif rs>60 and (a<40 and t<40):
        return "Fractured"

    elif rs>=50 and (a<50 or t<50):
        return "Tense"

    elif a<30 and t<30:
        return "Distant"


    return "Neutral"
    

