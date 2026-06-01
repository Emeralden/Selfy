# Selfy

[![Live App](https://img.shields.io/badge/Live-App-brightgreen?style=for-the-badge)](selfy-web.vercel.app)
[![API Docs](https://img.shields.io/badge/API-Docs-blue?style=for-the-badge)](selfy-yu0z.onrender.com/docs)

<img width="926" height="342" alt="Screenshot 2026-05-28 170553-Picsart-AiImageEnhancer" src="https://github.com/user-attachments/assets/e866ee36-0f75-46ea-9831-a3d729f0c5cc" />


A full-stack life simulation game where you are born, age, build relationships, make choices, and eventually die. It is powered by a stateful backend, an LLM narrative engine, and a real-time reactive frontend.

---

## Overview

Selfy models a human life as a sequence of discrete state transitions. Each "year" advances the simulation along with stats decay, NPCs age, life stage thresholds crossing, and probabilistic events firing. Event narratives are enriched asynchronously by Gemini 2.5 Flash and cached in Redis to minimise latency on repeat rolls.

The system separates concerns cleanly: the **frontend** manages UI state and auth token refresh transparently, the **backend** owns all game logic and truth, and **Redis** serves as both a rate-limit store and an LLM cache layer.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLIENT                                │
│                                                                 │
│       Next.js App Router · React Query · Zustand · Axios        │
│                                                                 │
│  AuthGuard ── GET /auth/me ──► syncs active_character_id        │
│  apiClient ── 401 interceptor ──► POST /auth/refresh ──► retry  │
└─────────────────────────┬───────────────────────────────────────┘
                          |
                          │ HTTPS · HttpOnly Cookies (SameSite=None)
                          |
┌─────────────────────────▼───────────────────────────────────────┐
│                     API (uvicorn)                               │
│                                                                 │
│            FastAPI · SQLModel · Argon2 · PyJWT                  │
│                                                                 │
│  ┌──────────────────┐     ┌──────────────────────────────────┐  │
│  │  PostgreSQL (PG) │     │     Upstash Redis (HTTP)         │  │
│  │  ─ users         │     │  ─ cooldowns:{char_id}  (hash)   │  │
│  │  ─ characters    │     │  ─ char:{char_id}:school (hash)  │  │
│  │  ─ npcs          │     │  ─ event:{id}:{tone}:v{v} (str)  │  │
│  │  ─ life events   │     └──────────────────────────────────┘  │
│  └──────────────────┘                                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │             Gemini 2.5 Flash (google-genai)              │   │
│  │      sync SDK · run_in_executor · BackgroundTasks        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend

| Layer | Technology |
|---|---|
| Framework | FastAPI (async ASGI via uvicorn) |
| ORM / Schema | SQLModel (Pydantic v2 + SQLAlchemy core) |
| Database | PostgreSQL |
| Cache | Upstash Redis (serverless HTTP) |
| Auth | JWT dual-token (PyJWT) + Argon2 password hashing |
| LLM | Google Gemini 2.5 Flash via `google-genai` SDK |
| Containerisation | Docker (python:3.12-slim) |

### Frontend

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Server State | TanStack React Query v5 |
| Client State | Zustand v5 with `persist` middleware |
| HTTP | Axios with response interceptor |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS v4 |

---

## System Design Decisions

### Dual-Token Authentication

* Uses **short-lived access tokens (15 min)** + **long-lived refresh tokens (30 days)**
* Tokens stored as:

  * `HttpOnly`
  * `Secure`
  * `SameSite=None`
* Prevents JavaScript access → protects against XSS token theft
* `SameSite=None` enables cross-origin auth between Vercel + Render

**Auto Refresh Flow**

* Axios interceptor catches `401`
* Silently calls `POST /auth/refresh`
* Retries original request automatically
* Retry guard prevents infinite refresh loops

---

### Redis as an Ephemeral Engine

Uses Upstash Redis for two core systems:

#### Action Cooldowns

* Stored as:

  ```txt
  cooldowns:{char_id}
  ```
* Tracks yearly action limits
* Fully reset on `age_up`

#### LLM Narrative Cache

* Cached as:

  ```txt
  event:{id}:{tone}:v{version}
  ```
* Prevents repeated Gemini generations
* First encounter:

  * returns base event instantly
  * enriches narrative in background
* Future encounters:

  * serve cached narrative immediately
* 20% refresh chance keeps content from feeling stale

---

### Non-Blocking LLM Integration

* `google-genai` SDK is synchronous
* Direct calls would block FastAPI's async event loop

**Solution**

* Offloaded using:

  ```python
  run_in_executor()
  ```
* Gemini enrichment runs as a `BackgroundTask`
* `age_up` returns immediately while AI generation happens asynchronously

---

### Stateful NPC Lifecycle

NPCs are persistent entities with evolving emotional stats:

```txt
affection · trust · respect · resentment
temperament · loyalty · strictness · empathy
```

#### Relationship System

* `relationship_decay()` updates bonds every year
* Relationship labels dynamically evolve:

  * Attached
  * Close
  * Warm
  * Complicated
  * Strained
  * Fractured
  * Distant

#### Lifecycle Management

* Stage transitions regenerate social circles
* Temporary NPCs are purged
* Important characters persist across life stages

---

### Probabilistic Aging Engine

`age_up` is the core simulation loop.

Each year:

1. Calculates academic performance
2. Advances age + life stage
3. Applies stat decay formulas
4. Updates relationships
5. Rolls mortality probability
6. Selects condition-based life events
7. Resets yearly Redis state

Everything commits in a single transactional cycle.

---

### Condition-Driven Event System

Events are fully data-driven via `events.json`.

Each event contains:

* conditions
* age buckets
* narrative templates

Example:

```json
{
  "id": "arranged_marriage_01",
  "conditions": [
    ["country", "==", "IN"],
    ["stage", "==", "Adult"]
  ]
}
```

#### Benefits

* No hardcoded event logic
* Easily extensible
* New events require only JSON edits

---

### Locale-Aware Geography & Naming

Uses a geography graph:

```txt
country → state → name_group
```

Names are resolved separately via:

```txt
names.json
```

#### Advantages

* Shared cultural name pools
* Flexible regional expansion
* Geography and naming remain decoupled

---

### Frontend Authentication Flow

`AuthGuard` controls app routing.

#### Flow

* Calls `GET /auth/me` on mount
* Redirect logic:

  * not authenticated → `/login`
  * no character → `/new-life`
  * existing character → dashboard

#### State Management

* Zustand + `persist` middleware
* Survives refreshes via localStorage
* React Query caches auth state to avoid redundant requests
* 
---

## Data Model

```
User
 ├── id (UUID PK)
 ├── username (unique, indexed)
 ├── hashed_password (Argon2)
 └── active_character_id (FK → Character)

Character
 ├── id (UUID PK)
 ├── user_id (FK → User)
 ├── first_name, last_name, gender, country, state
 ├── age, stage, alive, money
 ├── Stats: body, mind, joy, appeal, savvy
 ├── Traits: composure, neuroticism, discipline, empathy,
 │           sociability, karma, hubris, avarice,
 │           fertility, immunity, metabolism, sexuality
 ├── contextual (JSON) — stage-specific data (grades, performance)
 ├── echoes (JSON) — major life milestones
 └── npcs → [NPC]

NPC
 ├── id (UUID PK)
 ├── char_id (FK → Character)
 ├── first_name, last_name, age, gender, role, alive
 ├── NPC Traits: empathy, temperament, strictness, loyalty
 ├── Relationship Stats: affection, trust, respect, resentment
 ├── relation_label (computed, stored)
 └── is_significant (survives stage purges)

LifeEvent
 ├── id (UUID PK)
 ├── char_id (FK → Character)
 ├── age
 └── text
```

---

## Project Structure

```
Selfy/
├── SelfyAPI/
│   ├── main.py              # App entrypoint, CORS, lifespan
│   ├── config.py            # Pydantic settings
│   ├── database.py          # Engine, session, table init
│   ├── cache.py             # Upstash Redis singleton
│   ├── dependencies.py      # FastAPI Annotated deps
│   ├── security.py          # JWT + Argon2 utils
│   ├── models/
│   │   ├── user.py
│   │   ├── character.py
│   │   ├── npc.py
│   │   └── event.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── life.py
│   │   ├── character.py
│   │   ├── social.py
│   │   └── school.py
│   └── services/
│       ├── aging.py         # Stat decay, stage transitions, death roll
│       ├── social.py        # NPC spawning, relationship labels, purging
│       ├── scenarios.py     # Event rolling, condition evaluation, enrichment
│       ├── llm.py           # Gemini call + Redis cache write
│       ├── naming.py        # Locale-aware name generation
│       └── actions.py       # Social action handlers, cooldown logic
├── data/
│   ├── geography.json       # Country → state → name_group map
│   ├── names.json           # Name pools keyed by cultural group
│   └── events.json          # Age-bucketed, condition-gated life events
├── selfy-ui/
│   ├── app/
│   │   ├── page.tsx         # Life hub (timeline + stats + age-up)
│   │   ├── new-life/        # Character creation form
│   │   ├── social/          # NPC list + interaction pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── components/      # AuthGuard, Header, ActionPopup
│   │   ├── store/           # Zustand stores (character, popup)
│   │   └── schemas/         # Zod validation schemas
│   └── lib/
│       └── apiClient.ts     # Axios instance + 401 refresh interceptor
├── Dockerfile
└── requirements.txt
```
