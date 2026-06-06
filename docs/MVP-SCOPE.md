# Deep Void — MVP Scope & Build Plan

## The Question

> What's the smallest thing we can build that proves this concept is fun?

Not a demo. Not a prototype. A **playable game** with a complete loop.

---

## The MVP Target

**Single player. Terminal-native. Signal Ecology only.**

No fleets, no temporal mechanics, no megastructure, no multiplayer, no LLM integration. One complete mechanic loop that nails the terminal aesthetic, the story mystery, and the daily check-in rhythm.

---

## Build Plan

### Phase 1: Terminal Shell (3-5 days)
- Boot sequence + HUD
- Command input with history/tab completion
- Action pads with char-by-char typing
- 5 resources with rate arrows
- Signal garden table

### Phase 2: Signal Engine (3-5 days)
- 6 signal types with weighted rarity
- Real-time growth (2s ticks)
- Harvest mechanics
- Lore fragments
- Save/load with localStorage
- Progression: attune tiers

### Phase 3: Polish + Story (2-3 days)
- Ambient effects (whisper scan, glitch)
- Cinematic intro sequence
- Void events with risk/reward
- Boot sequence refinements

**Total: ~8-13 days for working MVP**

---

## What's IN the MVP

1. **Boot Sequence** — 20s cinematic intro, once per device
2. **Terminal HUD** — 5 resources, signal garden, system log
3. **Commands** — 14 commands with tab completion
4. **Signal Ecology** — 6 types, spawn, grow, harvest
5. **Progression** — Attune tiers, upgrade nodes, breed signals
6. **Events** — 12 void events with choices
7. **Lore** — 12 fragments revealing the story
8. **Persistence** — localStorage with autosave and migration

---

## What's OUT (Post-MVP)

| Feature | When | Why |
|---------|------|-----|
| Fleet Programming | Post-MVP v1 | Needs AI rule engine |
| Signal Breeding | Post-MVP v1 | Needs genome system |
| Multiplayer | Post-MVP v1 | Needs server |
| LLM Integration | Post-MVP v1 | Enhancement only |
| Temporal Mechanics | Post-MVP v2 | Complex math |
| Shared Megastructure | Post-MVP v2 | Needs multiplayer |
