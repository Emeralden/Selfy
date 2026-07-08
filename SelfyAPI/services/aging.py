
import random

from SelfyAPI.dependencies import SessionDep
from SelfyAPI.models.character import Character, Stage
from SelfyAPI.models.npc import NPC
from SelfyAPI.services.director import generate_eulogy
from SelfyAPI.services.engine.dispatcher import subscribe_age_up
from SelfyAPI.services.social import purge_npcs, relation_label, spawn_extended, spawn_school_cohort

# Tags that are only valid within a specific age window.
# When the character ages out, they get stripped automatically.
_EXPIRING_TAGS: dict[int, list[str]] = {
    14: ["Monitor", "Tuition"],   # school phase ends after age 13
}

@subscribe_age_up(priority=5)
def process_school(char, session, redis, bg_tasks, log_memory):
    """Strip school-phase tags once the character ages out of their window."""
    tags_to_remove = _EXPIRING_TAGS.get(char.age + 1, [])  # +1 because age increments at priority 10
    if tags_to_remove and char.tags:
        char.tags = [t for t in char.tags if t not in tags_to_remove]

def transition_stage(char:Character, session:SessionDep):

    if char.age==1:
        char.stage = Stage.TODDLER
    if char.age==3:
        char.stage = Stage.PRE_SCHOOL
    if char.age==6:
        char.stage = Stage.SCHOOL
        spawn_school_cohort(char, session, 15)
        spawn_extended(char, session)
    if char.age==16:
        char.stage = Stage.EXAM_PREP
        purge_npcs(char, session)
        spawn_school_cohort(char, session, 15)
    if char.age==18:
        char.stage = Stage.UNIVERSITY
        purge_npcs(char, session)
        spawn_school_cohort(char, session, 20)
    if char.age==22:
        char.stage = Stage.ADULT
        char.contextual = {}
        purge_npcs(char, session)
    if char.age==61:
        char.stage = Stage.ELDER

@subscribe_age_up(priority=10)
def process_base_aging(char, session, redis, bg_tasks, log_memory):
    char.age += 1
    log_memory(f"I am now {char.age} years old.")
    transition_stage(char, session)

def stat_decay(char: Character):

    if char.age > 30:
        if char.immunity>80:
            char.body-=1
        elif char.immunity<20:
            char.body-=4
        else:
            char.body-=2
    
    if char.age < 25:
        if char.discipline>80:
            char.mind+=4
        elif char.discipline<20:
            char.mind+=1
        else:
            char.mind+=2
    
    base=50
    if char.joy<base:
        char.joy+=1
    elif char.joy>base:
        char.joy-=1
    
    if 70>char.age>40:
        char.appeal-=1
    elif char.age>70:
        char.appeal-=3

def relationship_decay(char:Character, npcs:list[NPC]):

    for npc in npcs:
        npc.age += 1
        if char.sociability>80:
            npc.affection-=0
        else:
            if npc.temperament>70:
                npc.affection-=0
            elif npc.temperament<30:
                npc.affection-=4
            else:
                npc.affection-=2
        
        npc.relation_label = relation_label(npc)

@subscribe_age_up(priority=20)
def process_stat_decay(char, session, redis, bg_tasks, log_memory):
    stat_decay(char)
    relationship_decay(char, char.npcs)


def roll_reaper(char:Character):
    
    death_roll=False

    if char.body<=0:
        death_roll=True
    if char.age>80:
        chance = 5 + ((char.age-80)*2)
        if random.randint(0,100) <= chance:
            death_roll=True
    
    if death_roll and char.karma<=90:
        char.alive=False
        
@subscribe_age_up(priority=30)
def process_reaper(char, session, redis, bg_tasks, log_memory):
    roll_reaper(char)

@subscribe_age_up(priority=999)
async def process_funeral(char, session, redis, bg_tasks, log_memory):
    if not char.alive:
        eulogy = await generate_eulogy(char.id, f"{char.first_name} {char.last_name}", char.age, session)
        log_memory(eulogy)

