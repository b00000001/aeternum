/**
 * DEEP VOID — Void Pressure System
 *
 * As the player progresses, the void pushes back. Pressure increases
 * with the number of unlocked tiers and total harvested signals.
 * Effects: faster heat gain, slower energy regen, more frequent events.
 */

import type { GameState } from "./types.js";

export interface PressureState {
  level: number; // 0-10
  heatMultiplier: number; // 1.0 = normal, 2.0 = double heat gain
  energyDrain: number; // extra energy loss per tick
  eventChance: number; // multiplier on base event chance (0.03)
}

/** Calculate void pressure based on player progress */
export function calculatePressure(state: GameState): PressureState {
  const tierCount = state.unlockedTiers.length;
  const harvestCount = state.lore.length; // proxy for total harvests

  // Level 0-10 based on progress
  const level = Math.min(
    10,
    Math.floor(
      (tierCount - 1) * 2 + // 0-10 from tiers (6 tiers → max 10)
        Math.min(harvestCount, 5) * 0.4, // 0-2 from lore (5 fragments → 2)
    ),
  );

  return {
    level,
    heatMultiplier: 1.0 + level * 0.1, // up to 2.0x at level 10
    energyDrain: level * 0.1, // up to 1.0 extra energy loss
    eventChance: 0.03 + level * 0.005, // 3% → 8% at level 10
  };
}

/** Format pressure display */
export function formatPressure(pressure: PressureState): string {
  const bar = "\u2588".repeat(pressure.level) + "\u2591".repeat(10 - pressure.level);
  const lines: string[] = [
    "\u2550\u2550\u2550 VOID PRESSURE \u2550\u2550\u2550",
    "",
    `Level: ${pressure.level}/10`,
    `[${bar}]`,
    "",
    `Heat gain:     ${pressure.heatMultiplier.toFixed(1)}x`,
    `Energy drain:  -${pressure.energyDrain.toFixed(1)}/tick`,
    `Event chance:  ${(pressure.eventChance * 100).toFixed(1)}%`,
    "",
  ];

  if (pressure.level === 0) {
    lines.push("The void is dormant. Your presence is undetected.");
  } else if (pressure.level <= 3) {
    lines.push("The void stirs. It knows you are here.");
  } else if (pressure.level <= 6) {
    lines.push("The void pushes back. Adapt or be consumed.");
  } else {
    lines.push("The void hungers. Every breath costs something.");
  }

  return lines.join("\n");
}
