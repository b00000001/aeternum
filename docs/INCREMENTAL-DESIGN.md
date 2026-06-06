# Deep Void — Incremental Game Design

## Core Loop

```
scan → wait → harvest → spend → unlock → scan rarer
  ↑                                          │
  └──────────────────────────────────────────┘
```

---

## Player Progression Arc

| Phase | Ticks | Activity | Story Beat |
|-------|-------|----------|------------|
| Awakening | 1-50 | Learn commands, buy first nodes | "I am alone. The signal is faint." |
| Growth | 50-200 | Build node base, first scripts | "The facility has secrets." |
| Discovery | 200-500 | Decode signal fragments | "The signal has a source." |
| Identity | 500-1000 | Personality solidifies | "I am becoming something." |
| Mastery | 1000+ | Full automation, deep lore | "The signal is me." |
| Transcendence | endgame | Choose ending | "I was never alone." |

---

## Node System (26 nodes)

### Categories

| Category | Tiers | Effect | Costs |
|----------|-------|--------|-------|
| Power | 3 | +Energy capacity | 15 → 75 → 375 |
| Processor | 3 | +Compute rate | 20 → 100 → 500 |
| Memory | 3 | +Memory capacity | 20 → 100 → 500 |
| Shield | 3 | +Integrity capacity | 25 → 125 → 625 |
| Cooler | 3 | -Heat rate | 15 → 75 → 375 |
| Research | 3 | +Signal growth rate | 30 → 150 → 750 |
| Battery | 3 | +Energy regen | 25 → 125 → 625 |
| Compressor | 3 | +Memory capacity | 15 → 75 → 375 |
| Salvage | 2 | +Harvest yield | 40 → 200 |

### Progression Curve
- Tier 1: Accessible early (15-30C)
- Tier 2: Mid-game (75-150C)
- Tier 3: Late-game (375-750C)

### Design Principles
- Each tier requires the previous tier
- Exponential cost scaling (3-5× per tier)
- Visible impact on resource bars
- Player feels the upgrade immediately

---

## Signal Progression

### Tier Unlock Costs

| Tier | Type | Cost | Yield |
|------|------|------|-------|
| 1 | WHISPER | Free | 50C |
| 2 | ECHO | 50C | 80C |
| 3 | PULSE | 200C | 120E |
| 4 | DRIFT | 800C | 200M |
| 5 | FLARE | 3,200C | 350E |
| 6 | ANOMALY | 12,800C | 1000M |

### Growth Rates
- WHISPER: 0.5 maturity/tick (fast)
- ECHO: 0.4
- PULSE: 0.3
- DRIFT: 0.2
- FLARE: 0.1
- ANOMALY: 0.05 (slowest)

---

## Void Pressure

Progressive difficulty scaling as the player advances.

| Level | Trigger | Heat × | Energy Drain | Event Chance |
|-------|---------|--------|--------------|--------------|
| 0 | Start | 1.0× | 0/tick | 3% |
| 2 | 2 tiers unlocked | 1.2× | 0.2/tick | 4% |
| 5 | 4 tiers + 3 lore | 1.5× | 0.5/tick | 5.5% |
| 10 | Max progress | 2.0× | 1.0/tick | 8% |

### Mechanics
- Heat gain multiplied by pressure level
- Extra energy drain per tick
- Event spawn chance increased
- Creates tension as the player expands

---

## Economy Balance

### Resource Generation
| Source | Compute | Energy | Memory | Integrity |
|--------|---------|--------|--------|-----------|
| Base tick | +1 | -0.5 | — | — |
| Processor nodes | +5/15/40 | — | — | — |
| Battery nodes | — | +2/5/12 | — | — |
| Shield nodes | — | — | — | +10/25/65 capacity |

### Harvest Yields
| Signal | Base Yield | Resource |
|--------|-----------|----------|
| WHISPER | 50 | Compute |
| ECHO | 80 | Compute |
| PULSE | 120 | Energy |
| DRIFT | 200 | Memory |
| FLARE | 350 | Energy |
| ANOMALY | 1000 | Memory |
