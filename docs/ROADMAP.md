# Deep Void — Post-MVP Roadmap

## Current Status (v0.3.0)

### Completed
- ✅ Terminal HUD + 5 resources
- ✅ Signal Ecology (6 tiers, spawn/grow/harvest/breed)
- ✅ Progression (attune + 26 nodes + breeding)
- ✅ LLM Integration (auto-detect + curated fallback)
- ✅ Void Pressure (progressive difficulty)
- ✅ 12 void events with risk/reward
- ✅ 12 lore fragments across 6 tiers
- ✅ Save/load with migration v0→v2
- ✅ Cinematic intro + ambient effects
- ✅ Full test suite (206 tests)
- ✅ Pushed to GitHub

---

## Post-MVP v1 (Next)

### Fleet Programming — The Signature Mechanic
**Effort: High | Impact: Very High**

The most unique feature in the GDD. Players write WHEN/THEN rules for autonomous fleet exploration.

```
#01 WHEN resource detected AND cargo < 80%
    THEN move → harvest → return
    PRIORITY: 1 COOLDOWN: 60min
```

**Key components:**
- Rule engine with priority and cooldowns
- Sector simulation with resource nodes
- Simulator for testing rules without risk
- Starter rulebook with 10-15 examples
- Event-driven fleet status log

### Multiplayer Foundation
**Effort: Very High | Impact: High**

Requires server infrastructure:
- WebSocket server for real-time sync
- Player accounts and authentication
- Resonance chains (invite-only groups)
- Shared sector discoveries

---

## Post-MVP v2 (Far Future)

### Temporal Mechanics
**Effort: High | Impact: High**

- Time dilation across sectors
- Temporal vaults for resource storage
- Delayed messages between players
- Paradox prevention systems

### Shared Megastructure
**Effort: Very High | Impact: Very High**

- Global collaborative construction
- Reddit-style proposals and voting
- Faction colors on completed sections
- Contribution tracking with progress bars

---

## Nice-to-Have

| Feature | Effort | Notes |
|---------|--------|-------|
| Void Pressure counter-mechanics | Medium | Ways to reduce pressure |
| Research/tech tree | Medium | Deeper progression |
- Tutorial/onboarding | Medium | First-time player guidance |
| More lore fragments | Low | 5+ per tier instead of 2 |
| Export/import saves | Low | Share progress |
| Sound effects | Low | Browser notification API |
| Mobile command buttons | Low | Touch-friendly action pads |

---

## Implementation Priority

| Priority | Feature | Why |
|----------|---------|-----|
| 1 | Fleet Programming | Unique mechanic, core to vision |
| 2 | More lore + onboarding | Polish, deeper engagement |
| 3 | Void Pressure counter-mechanics | Balance |
| 4 | Multiplayer foundation | Community |
| 5 | Temporal Mechanics | Depth |
| 6 | Shared Megastructure | Endgame |
