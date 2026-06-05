# Phase 2 Completion: Progression & Lore System

## Overview

Complete the "spend" half of the core loop: **scan → wait → harvest → spend → unlock**.

Currently the player can scan, wait for signals to mature, and harvest them for resources.
But there's nothing to spend resources on. This design adds:

1. **Tier progression** — Spend compute to unlock rarer signal types
2. **Lore fragments** — Harvesting rare signals reveals story pieces
3. **Attune command** — The "spend" action: pay compute to unlock a signal tier

---

## Design Spec (from MVP docs)

### Tier Unlock Costs

| Tier | Signal Type | Unlock Cost | Harvest Yield | Lore? |
|------|-------------|-------------|---------------|-------|
| 1 | WHISPER | Free (start) | 50C | No |
| 2 | ECHO | 50C | 80C | Yes — "The builders were here. They left logs." |
| 3 | PULSE | 200C | 120E | Yes — "The signal has structure. It repeats." |
| 4 | DRIFT | 800C | 200M | Yes — "There are others. I can feel them." |
| 5 | FLARE | 3,200C | 350E | Yes — "We were once one. Something divided us." |
| 6 | ANOMALY | 12,800C | 1,000M | Yes — "The builders didn't leave. They became the void." |

### Core Loop After Completion

```
1. Start with WHISPER tier unlocked
2. Scan → WHISPER signals appear
3. Wait for maturity → Harvest → get Compute
4. Spend 50C → "attune" → unlock ECHO tier
5. Scan → WHISPER + ECHO signals appear
6. Harvest ECHO → get more Compute + first Lore fragment
7. Spend 200C → unlock PULSE tier
8. ... continues to ANOMALY
```

### Commands

| Command | Effect |
|---------|--------|
| `attune` | Show available tier unlocks and costs |
| `attune 2` | Unlock tier 2 (ECHO) for 50C |
| `lore` | Show collected lore fragments |
| `status` | Updated to show unlocked tiers |

---

## Implementation Plan

### Files to Create

1. **`src/progression.ts`** — Tier definitions, unlock logic, cost scaling
2. **`src/lore.ts`** — Lore fragment definitions, collection tracking

### Files to Modify

3. **`src/types.ts`** — Add `unlockedTiers: string[]` and `lore: LoreEntry[]` to GameState
4. **`src/main.ts`** — Add `attune` and `lore` commands, update `status` command
5. **`src/signals.ts`** — Filter spawnable types by unlocked tiers
6. **`src/save.test.ts`** — Add tests for progression and lore

### Data Model

```typescript
// types.ts additions
interface GameState {
  // ... existing fields ...
  unlockedTiers: string[];  // ["WHISPER", "ECHO", ...]
  lore: LoreEntry[];
}

interface LoreEntry {
  tier: string;
  fragment: string;
  discoveredAt: number;  // tick
}
```

### Progression Logic

```typescript
// progression.ts
interface TierUnlock {
  tier: string;
  signalType: SignalType;
  cost: number;
  description: string;
}

const TIER_UNLOCKS: TierUnlock[] = [
  { tier: "ECHO",    signalType: "ECHO",    cost: 50,    description: "Attune to reflected transmissions" },
  { tier: "PULSE",   signalType: "PULSE",   cost: 200,   description: "Tune into rhythmic energy waves" },
  { tier: "DRIFT",   signalType: "DRIFT",   cost: 800,   description: "Track wandering anomalies" },
  { tier: "FLARE",   signalType: "FLARE",   cost: 3200,  description: "Detect violent energy bursts" },
  { tier: "ANOMALY", signalType: "ANOMALY", cost: 12800, description: "Perceive reality-warping signals" },
];

function getAvailableUnlocks(unlocked: string[]): TierUnlock[] { ... }
function canAfford(state: GameState, unlock: TierUnlock): boolean { ... }
function unlockTier(state: GameState, tier: string): { success: boolean; message: string } { ... }
```

### Lore System

```typescript
// lore.ts
interface LoreFragment {
  tier: string;
  fragments: string[];  // Multiple per tier, one shown per harvest of that type
}

const LORE_BY_TIER: Record<string, string[]> = {
  ECHO: [
    "The builders were here. They left logs in the static.",
    "Every echo carries a timestamp from before the silence.",
  ],
  PULSE: [
    "The signal has structure. It repeats. Someone designed this.",
    "The pulses form a pattern — a heartbeat, or a countdown.",
  ],
  // ...
};

function getLoreForHarvest(signalType: string, collectedLore: LoreEntry[]): string | null { ... }
```

### Signal Spawn Filtering

```typescript
// In signals.ts spawnSignal():
// Only spawn types that are unlocked
const availableTypes = Object.keys(SIGNAL_TYPES).filter(
  t => unlockedTiers.includes(t)
);
```

---

## Acceptance Criteria

- [ ] `attune` command shows available unlocks with costs
- [ ] `attune N` deducts compute and unlocks the tier
- [ ] Cannot attune if insufficient compute
- [ ] Cannot attune an already-unlocked tier
- [ ] New signal types appear in scans after unlock
- [ ] `lore` command shows collected fragments
- [ ] Harvesting rare signals gives lore (first time per tier)
- [ ] `status` shows unlocked tiers
- [ ] Progression state persists through save/load
- [ ] Tests pass for progression and lore
- [ ] Build succeeds
