/**
 * DEEP VOID — Progression System
 *
 * Handles tier unlocking. Players spend Compute to attune to
 * rarer signal types, expanding what can appear in scans.
 */

import type { GameState } from "./types.js";

export interface TierUnlock {
  tier: string;
  cost: number;
  description: string;
}

const TIER_UNLOCKS: TierUnlock[] = [
  {
    tier: "ECHO",
    cost: 50,
    description: "Attune to reflected transmissions",
  },
  {
    tier: "PULSE",
    cost: 200,
    description: "Tune into rhythmic energy waves",
  },
  {
    tier: "DRIFT",
    cost: 800,
    description: "Track wandering anomalies",
  },
  {
    tier: "FLARE",
    cost: 3200,
    description: "Detect violent energy bursts",
  },
  {
    tier: "ANOMALY",
    cost: 12800,
    description: "Perceive reality-warping signals",
  },
];

/** Get tiers that haven't been unlocked yet */
export function getAvailableUnlocks(unlockedTiers: string[]): TierUnlock[] {
  return TIER_UNLOCKS.filter((t) => !unlockedTiers.includes(t.tier));
}

/** Get the unlock info for a specific tier */
export function getTierUnlock(tier: string): TierUnlock | undefined {
  return TIER_UNLOCKS.find((t) => t.tier === tier);
}

/** Get all tier unlocks (for migration / data access) */
export function getTierUnlocks(): TierUnlock[] {
  return TIER_UNLOCKS;
}

/** Check if the player can afford to unlock a tier */
export function canUnlock(state: GameState, tier: string): { ok: boolean; reason?: string } {
  if (state.unlockedTiers.includes(tier)) {
    return { ok: false, reason: `${tier} is already unlocked` };
  }
  const unlock = getTierUnlock(tier);
  if (!unlock) {
    return { ok: false, reason: `Unknown tier: ${tier}` };
  }
  const compute = state.resources.compute.current;
  if (compute < unlock.cost) {
    return { ok: false, reason: `Need ${unlock.cost}C, have ${Math.round(compute)}C` };
  }
  return { ok: true };
}

/** Attempt to unlock a tier. Deducts compute on success. */
export function unlockTier(state: GameState, tier: string): { success: boolean; message: string } {
  const check = canUnlock(state, tier);
  if (!check.ok) {
    return { success: false, message: check.reason! };
  }
  const unlock = getTierUnlock(tier)!;
  state.resources.compute.current -= unlock.cost;
  state.unlockedTiers.push(tier);
  return {
    success: true,
    message: `Attuned to ${tier} — ${unlock.description}. (-${unlock.cost}C)`,
  };
}

/** Format the attune display for the player */
export function formatAttune(state: GameState): string {
  const available = getAvailableUnlocks(state.unlockedTiers);
  const unlocked = state.unlockedTiers;
  const lines: string[] = [];
  lines.push(`Unlocked: ${unlocked.join(", ")}`);
  lines.push("");
  if (available.length === 0) {
    lines.push("All signal tiers unlocked.");
  } else {
    lines.push("Available attunements:");
    for (const t of available) {
      const afford = state.resources.compute.current >= t.cost;
      const marker = afford ? "◇" : "○";
      lines.push(`  ${marker} ${t.tier} — ${t.cost}C — ${t.description}`);
    }
    lines.push("");
    lines.push("▸ Type attune <tier> to unlock (e.g. attune ECHO)");
  }
  return lines.join("\n");
}
