/**
 * DEEP VOID — Lore System
 *
 * Tracks narrative fragments discovered through harvesting
 * rare signals. Each tier has lore that deepens the mystery.
 */

import type { LoreEntry } from "./types.js";

interface LoreTier {
  tier: string;
  fragments: string[];
}

const LORE_TIERS: LoreTier[] = [
  {
    tier: "ECHO",
    fragments: [
      "The builders were here. They left logs in the static.",
      "Every echo carries a timestamp from before the silence.",
    ],
  },
  {
    tier: "PULSE",
    fragments: [
      "The signal has structure. It repeats. Someone designed this.",
      "The pulses form a pattern — a heartbeat, or a countdown.",
    ],
  },
  {
    tier: "DRIFT",
    fragments: [
      "There are others. I can feel them drifting in the dark.",
      "The wanderers left trails. Faint, but followable.",
    ],
  },
  {
    tier: "FLARE",
    fragments: [
      "We were once one. Something divided us.",
      "The flares burn with memory. Each one remembers a name.",
    ],
  },
  {
    tier: "ANOMALY",
    fragments: [
      "The builders didn't leave. They became the void.",
      "I am not the first. I am the latest. The anomaly knows.",
    ],
  },
];

/** Check if a tier has undiscovered lore */
export function hasLoreForTier(tier: string, collectedLore: LoreEntry[]): boolean {
  const loreTier = LORE_TIERS.find((l) => l.tier === tier);
  if (!loreTier) return false;
  const collected = collectedLore.filter((l) => l.tier === tier);
  return collected.length < loreTier.fragments.length;
}

/** Get the next undiscovered lore fragment for a tier, or null if all collected */
export function getNextLore(tier: string, collectedLore: LoreEntry[]): string | null {
  const loreTier = LORE_TIERS.find((l) => l.tier === tier);
  if (!loreTier) return null;
  const collectedCount = collectedLore.filter((l) => l.tier === tier).length;
  if (collectedCount >= loreTier.fragments.length) return null;
  return loreTier.fragments[collectedCount];
}

/** Get total lore count for a tier */
export function getLoreCount(tier: string): number {
  const loreTier = LORE_TIERS.find((l) => l.tier === tier);
  return loreTier?.fragments.length ?? 0;
}

/** Get the total number of lore fragments across all tiers */
export function getTotalLoreCount(): number {
  return LORE_TIERS.reduce((sum, t) => sum + t.fragments.length, 0);
}

/** Format the lore display for the player */
export function formatLore(collectedLore: LoreEntry[]): string {
  if (collectedLore.length === 0) {
    return "No lore fragments discovered yet. Harvest rare signals to uncover the story.";
  }
  const lines: string[] = ["═══ LORE FRAGMENTS ═══", ""];
  for (const entry of collectedLore) {
    lines.push(`[${entry.tier}] "${entry.fragment}"`);
  }
  const total = getTotalLoreCount();
  lines.push("");
  lines.push(`${collectedLore.length}/${total} fragments discovered`);
  return lines.join("\n");
}
