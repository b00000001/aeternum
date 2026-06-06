/**
 * DEEP VOID — Signal Breeding System
 *
 * Combine two mature signals to create a hybrid offspring.
 * Offspring inherit traits from both parents with mutation chance.
 */

import { SIGNAL_TYPES, type SignalType } from "./signals.js";
import type { GameState, SignalEntry } from "./types.js";

// ─── Types ──────────────────────────────────────────────────────────────

export interface BreedingResult {
  success: boolean;
  offspring: SignalEntry | null;
  message: string;
}

// ─── Trait Mutation ──────────────────────────────────────────────────────

const MUTATION_CHANCE = 0.15; // 15% chance per trait to mutate
const MUTATION_PREFIXES = ["~", "++", "!!"];

function mutateTrait(trait: string): string {
  // Preserve the trait name — only change the prefix
  // This ensures mutated traits still match getMaturityRate() etc.
  const prefix = MUTATION_PREFIXES[Math.floor(Math.random() * MUTATION_PREFIXES.length)];
  const clean = trait.replace(/^[+~!]+/, "");
  return `${prefix}${clean}`;
}

// ─── Breeding Logic ──────────────────────────────────────────────────────

export function canBreed(
  state: GameState,
  id1: string,
  id2: string,
): { ok: boolean; reason?: string } {
  if (id1 === id2) return { ok: false, reason: "Cannot breed a signal with itself" };

  const sig1 = state.signals.find((s) => s.id === id1);
  const sig2 = state.signals.find((s) => s.id === id2);

  if (!sig1) return { ok: false, reason: `Signal ${id1} not found` };
  if (!sig2) return { ok: false, reason: `Signal ${id2} not found` };
  if (!sig1.ready)
    return {
      ok: false,
      reason: `${sig1.name} is not ready (maturity ${Math.round(sig1.maturity)}%)`,
    };
  if (!sig2.ready)
    return {
      ok: false,
      reason: `${sig2.name} is not ready (maturity ${Math.round(sig2.maturity)}%)`,
    };

  return { ok: true };
}

export function breedSignals(state: GameState, id1: string, id2: string): BreedingResult {
  const check = canBreed(state, id1, id2);
  if (!check.ok) return { success: false, offspring: null, message: check.reason! };

  const parent1 = state.signals.find((s) => s.id === id1)!;
  const parent2 = state.signals.find((s) => s.id === id2)!;

  // Determine offspring type — weighted toward rarer parent
  const type1 = SIGNAL_TYPES[parent1.type as SignalType];
  const type2 = SIGNAL_TYPES[parent2.type as SignalType];
  const rarer = (type1?.rarity ?? 0.5) < (type2?.rarity ?? 0.5) ? parent1 : parent2;
  const offspringType = rarer.type;

  // Generate ID — find max existing
  const maxId = state.signals.reduce((max, s) => {
    const match = s.id.match(/^S-(\d+)$/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  const newId = `S-${String(maxId + 1).padStart(3, "0")}`;

  // Inherit traits — union of both parents, with mutation chance
  const allTraits = [...parent1.traits, ...parent2.traits];
  const uniqueTraits = [...new Set(allTraits)];
  const inherited = uniqueTraits.map((t) => (Math.random() < MUTATION_CHANCE ? mutateTrait(t) : t));

  // Cap at 3 traits
  const finalTraits = inherited.slice(0, 3);

  // Generate name — combine parent names
  const name1 = parent1.name.split(" ")[0]; // prefix
  const name2 = parent2.name.split(" ")[1] ?? parent2.name.split(" ")[0]; // suffix
  const offspringName = `${name1} ${name2}`;

  // Unstable if either parent was unstable (30% chance)
  const unstable = parent1.unstable || parent2.unstable ? Math.random() < 0.3 : false;

  const offspring: SignalEntry = {
    id: newId,
    name: offspringName,
    type: offspringType,
    maturity: 0,
    traits: finalTraits,
    ready: false,
    unstable,
  };

  state.signals.push(offspring);

  // Remove parents (they're consumed in breeding)
  state.signals = state.signals.filter((s) => s.id !== id1 && s.id !== id2);

  const traitDisplay = finalTraits.length > 0 ? ` [${finalTraits.join(", ")}]` : "";
  const unstableTag = unstable ? " ⚠ unstable" : "";

  return {
    success: true,
    offspring,
    message: `Breeding complete: ${offspringName} (${offspringType})${traitDisplay}${unstableTag}. Parents consumed.`,
  };
}

export function formatBreeding(state: GameState): string {
  const readySignals = state.signals.filter((s) => s.ready);
  if (readySignals.length < 2) {
    return "Need at least 2 mature signals to breed. Type signals to check maturity.";
  }

  const lines: string[] = ["═══ BREEDING LAB ═══", ""];
  lines.push("Ready signals for breeding:");
  for (const sig of readySignals) {
    const traits = sig.traits.length > 0 ? ` [${sig.traits.join(", ")}]` : "";
    lines.push(`  ${sig.id} ${sig.name} (${sig.type})${traits}`);
  }
  lines.push("");
  lines.push("▸ Type breed <id1> <id2> to combine two signals");
  lines.push("▸ Parents are consumed. Offspring inherits traits with mutation chance.");
  return lines.join("\n");
}
