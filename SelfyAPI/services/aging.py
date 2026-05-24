
import random

from SelfyAPI.dependencies import SessionDep
from SelfyAPI.models.character import Character, Stage
from SelfyAPI.models.npc import NPC
from SelfyAPI.services.social import purge_npcs, relation_label, spawn_extended, spawn_school_cohort


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
    if char.neuroticism>70:
        char.joy+=random.randint(-5,5)
    if char.composure>70:
        char.joy = (char.joy + base)//2
    
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
            if npc.loyalty>80:
                npc.affection-=0
            elif npc.loyalty<20:
                npc.affection-=4
            else:
                npc.affection-=2
        
        npc.relation_label = relation_label(npc)


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
        

def transition_stage(char:Character, session:SessionDep):

    if char.age==4:
        char.stage = Stage.CHILDHOOD
        grade = (0.5 * char.mind) + (0.5 * char.discipline)
        char.contextual = {
            "grade": grade,
            "performance": "Average"
        }
    if char.age==5:
        spawn_school_cohort(char, session, 15)
        spawn_extended(char, session)
    if char.age==12:
        char.stage = Stage.HIGH_SCHOOL
        purge_npcs(char, session)
        spawn_school_cohort(char, session, 15)
    if char.age==18:
        char.stage = Stage.COLLEGE
        purge_npcs(char, session)
        spawn_school_cohort(char, session, 10)
    if char.age==22:
        char.stage = Stage.ADULT
        char.contextual = {}
        purge_npcs(char, session)
    if char.age==61:
        char.stage = Stage.ELDER


def calculate_grades(char: Character, efforts, skips):
    
    effort_bonus  = min(15, efforts * 20)
    penalty = skips * 8
    grade = char.contextual["grade"]

    grade += effort_bonus - penalty
    performance = ""

    if grade>=90:
        performance="Topper"
    elif grade>=75:
        performance="Above Avg"
    elif grade>=50:
        performance="Average"
    elif grade>=35:
        performance="Struggling"
    elif grade<35:
        performance="Failing"

    contextual = dict(char.contextual or {})
    contextual["performance"] = performance
    contextual["grade"] = grade
    char.contextual = contextual
    
    return performance


