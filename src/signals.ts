/**
 * DEEP VOID — Signal Spawning Module
 *
 * Handles signal generation with weighted rarity, trait assignment,
 * unique ID generation, and maturity rate configuration.
 *
 * Signals are the core collectible of the game — they spawn in the void,
 * grow over time, and are harvested for resources. Each signal type
 * has different rarity, growth speed, and trait affinities.
 */

import type { SignalEntry } from "./types.js";

// ─── Types ──────────────────────────────────────────────────────────────

export type SignalType = "WHISPER" | "ECHO" | "PULSE" | "DRIFT" | "FLARE" | "ANOMALY";

export interface SignalTypeConfig {
  rarity: number; // Weight for random selection (0-1, sum across types = 1)
  baseMaturity: number; // Base growth per tick (0-1, applied as percentage points)
  traitPool: string[]; // Possible traits this type can roll
  name: string; // Display name
  description: string; // Lore-flavored description
  yieldBase: number; // Base resource yield on harvest
  yieldType: string; // Primary resource yielded ('compute', 'energy', 'memory')
}

// ─── Signal Type Registry ───────────────────────────────────────────────

/**
 * All signal types with their configuration.
 * Rarity weights sum to 1.0 across all 6 tiers.
 * Higher rarity = slower growth but better traits and yields.
 */
export const SIGNAL_TYPES: Record<SignalType, SignalTypeConfig> = {
  WHISPER: {
    rarity: 0.35,
    baseMaturity: 0.5,
    traitPool: ["+Range", "+Speed", "+Yield"],
    name: "Whisper",
    description: "A faint data current — common and reliable. The background noise of the void.",
    yieldBase: 50,
    yieldType: "compute",
  },
  ECHO: {
    rarity: 0.25,
    baseMaturity: 0.4,
    traitPool: ["+Range", "+Duration", "+Yield"],
    name: "Echo",
    description: "A reflected transmission from a distant source. Holds more data than a whisper.",
    yieldBase: 80,
    yieldType: "compute",
  },
  PULSE: {
    rarity: 0.2,
    baseMaturity: 0.3,
    traitPool: ["+Speed", "+Power", "+Yield"],
    name: "Pulse",
    description: "A rhythmic energy wave. Grows slower but contains denser information.",
    yieldBase: 120,
    yieldType: "energy",
  },
  DRIFT: {
    rarity: 0.12,
    baseMaturity: 0.2,
    traitPool: ["+Range", "+Stealth", "+Yield"],
    name: "Drift",
    description:
      "A wandering anomaly — elusive and hard to track. Stealth reduces detection chance.",
    yieldBase: 200,
    yieldType: "memory",
  },
  FLARE: {
    rarity: 0.06,
    baseMaturity: 0.1,
    traitPool: ["+Power", "+Speed", "+Duration"],
    name: "Flare",
    description: "A violent burst of exotic energy. Grows very slowly but yields immense power.",
    yieldBase: 350,
    yieldType: "energy",
  },
  ANOMALY: {
    rarity: 0.02,
    baseMaturity: 0.05,
    traitPool: ["+Void", "+Echo", "+Resonance"],
    name: "Anomaly",
    description: "Unknown. Unclassifiable. Reality-warping data that defies all known models.",
    yieldBase: 1000,
    yieldType: "memory",
  },
};

// ─── Rarity Labels ──────────────────────────────────────────────────────

const RARITY_LABELS: Record<string, { label: string; color: string }> = {
  WHISPER: { label: "Common", color: "#a0a8b0" },
  ECHO: { label: "Uncommon", color: "#70b8d0" },
  PULSE: { label: "Rare", color: "#d0a070" },
  DRIFT: { label: "Very Rare", color: "#c060d0" },
  FLARE: { label: "Extremely Rare", color: "#d06040" },
  ANOMALY: { label: "Transcendent", color: "#40d0c0" },
};

// ─── Name Generation ────────────────────────────────────────────────────

/**
 * Generate a thematic name for a signal based on its type and traits.
 * Uses a pool of prefix/suffix words that match the signal's character.
 */
const NAME_PREFIXES: Record<string, string[]> = {
  WHISPER: ["Silent", "Faint", "Distant", "Murmuring", "Shallow"],
  ECHO: ["Resonant", "Reflected", "Double", "Reverberant", "Ghost"],
  PULSE: ["Throbbing", "Rhythmic", "Beating", "Pulsar", "Oscillating"],
  DRIFT: ["Wandering", "Nomadic", "Floating", "Lost", "Wayward"],
  FLARE: ["Burning", "Explosive", "Blazing", "Solar", "Radiant"],
  ANOMALY: ["Void-Touched", "Impossible", "Singular", "Transcendent", "Null"],
};

const NAME_SUFFIXES: Record<string, string[]> = {
  WHISPER: ["whisper", "murmur", "breath", "ripple", "current"],
  ECHO: ["echo", "reflection", "reverie", "shadow", "twin"],
  PULSE: ["pulse", "wave", "beat", "thrum", "oscillation"],
  DRIFT: ["drift", "wanderer", "nomad", "drifter", "vagrant"],
  FLARE: ["flare", "burst", "eruption", "nova", "outburst"],
  ANOMALY: ["anomaly", "aberration", "enigma", "paradox", "singularity"],
};

function generateSignalName(type: SignalType, rng: () => number): string {
  const prefixes = NAME_PREFIXES[type];
  const suffixes = NAME_SUFFIXES[type];
  const prefix = prefixes[Math.floor(rng() * prefixes.length)];
  const suffix = suffixes[Math.floor(rng() * suffixes.length)];
  return `${prefix} ${suffix}`;
}

// ─── ID Generation ──────────────────────────────────────────────────────

/**
 * Generate a unique signal ID in the format S-XXX where XXX is
 * a zero-padded sequence number. Ensures no collision with existing IDs.
 */
function generateSignalId(existingIds: string[], rng: () => number): string {
  // Find the highest existing sequence number
  let maxSeq = 0;
  for (const id of existingIds) {
    const match = id.match(/^S-(\d+)$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }
  // Generate next sequential ID, but add occasional gaps for organic feel
  const nextSeq = maxSeq + 1 + (rng() < 0.3 ? Math.floor(rng() * 5) : 0);
  return `S-${String(nextSeq).padStart(3, "0")}`;
}

// ─── Trait Selection ────────────────────────────────────────────────────

/**
 * Select 1-3 traits from the type's trait pool with weighted preference
 * toward higher-impact traits for rarer signal types.
 */
function selectTraits(config: SignalTypeConfig, rng: () => number, isUnstable: boolean): string[] {
  const pool = [...config.traitPool];
  const numTraits = pool.length <= 2 ? pool.length : rng() < 0.5 ? 1 : rng() < 0.8 ? 2 : 3;

  const selected: string[] = [];
  const available = [...pool];

  for (let i = 0; i < numTraits; i++) {
    if (available.length === 0) break;
    const idx = Math.floor(rng() * available.length);
    selected.push(available[idx]);
    available.splice(idx, 1);
  }

  // Unstable signals gain a corrupted trait variant (cap at 3 total)
  if (isUnstable) {
    const corrupted = selected.map((t) => t.replace("+", "~"));
    for (const c of corrupted) {
      if (selected.length >= 3) break;
      selected.push(c);
    }
  }

  return selected;
}

// ─── RNG with Seed Support ──────────────────────────────────────────────

/**
 * Simple seeded PRNG (Mulberry32) for reproducible signal generation.
 * Falls back to Math.random if no seed provided.
 */
export function createRng(seed?: number): () => number {
  if (seed === undefined) return () => Math.random();

  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Spawn Signal ───────────────────────────────────────────────────────

/**
 * Spawn a new signal with weighted random type selection.
 *
 * The spawning process:
 * 1. Weighted random selection of signal type based on rarity weights
 * 2. Generate unique ID (S-XXX format, no collisions)
 * 3. Generate thematic name from type-specific word pools
 * 4. Roll traits (1-3 from type's trait pool)
 * 5. Roll unstable flag (5% base chance, higher for rare types)
 * 6. Set initial maturity (0-5% random starting progress)
 *
 * @param existingIds - Array of existing signal IDs to avoid collisions
 * @param rng - Random number generator function (defaults to Math.random)
 * @returns A fully-initialized SignalEntry
 */
export function spawnSignal(
  existingIds: string[] = [],
  rng: () => number = Math.random,
): SignalEntry {
  // 1. Weighted random type selection
  const type = selectWeightedType(rng);

  // 2. Generate ID
  const id = generateSignalId(existingIds, rng);

  // 3. Generate name
  const name = generateSignalName(type, rng);

  // 4. Unstable roll — base 5%, +2% per rarity tier below WHISPER
  const config = SIGNAL_TYPES[type];
  const typeIndex = Object.keys(SIGNAL_TYPES).indexOf(type);
  const unstableChance = 0.05 + typeIndex * 0.02;
  const unstable = rng() < unstableChance;

  // 5. Select traits
  const traits = selectTraits(config, rng, unstable);

  // 6. Maturity starts at 0-5% for variety
  const initialMaturity = rng() * 5;

  return {
    id,
    name,
    type,
    maturity: initialMaturity,
    traits,
    ready: false,
    unstable,
  };
}

// ─── Weighted Random Selection ──────────────────────────────────────────

/**
 * Select a signal type using weighted random selection based on rarity.
 * Higher rarity = lower probability of being selected.
 */
function selectWeightedType(rng: () => number): SignalType {
  const types = Object.keys(SIGNAL_TYPES) as SignalType[];
  const weights = types.map((t) => SIGNAL_TYPES[t].rarity);

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let roll = rng() * totalWeight;

  for (let i = 0; i < types.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return types[i];
  }

  // Fallback (shouldn't happen if weights sum correctly)
  return types[types.length - 1];
}

// ─── Type Info ──────────────────────────────────────────────────────────

/**
 * Get the configuration for a signal type by its string identifier.
 * Returns undefined for unknown types.
 */
export function getSignalTypeInfo(type: string): SignalTypeConfig | undefined {
  const upper = type.toUpperCase() as SignalType;
  return SIGNAL_TYPES[upper];
}

// ─── Rarity Label ───────────────────────────────────────────────────────

/**
 * Get a human-readable rarity label and color for a signal type.
 * Returns a default for unknown types.
 */
export function getRarityLabel(rarity: string): { label: string; color: string } {
  const upper = rarity.toUpperCase();
  return RARITY_LABELS[upper] || { label: "Unknown", color: "#888" };
}

// ─── Maturity Rate ──────────────────────────────────────────────────────

/**
 * Calculate maturity increase per tick for a given signal.
 * Modified by traits and unstable status.
 *
 * Base rate comes from signal type's baseMaturity.
 * Traits modify: +Speed adds 20%, +Power adds 10%, unstable reduces by 30%.
 */
export function getMaturityRate(signal: SignalEntry): number {
  const config = SIGNAL_TYPES[signal.type as SignalType];
  if (!config) return 0.1; // Fallback rate

  let rate = config.baseMaturity;

  // Trait modifiers
  if (signal.traits.includes("+Speed")) rate *= 1.2;
  if (signal.traits.includes("+Power")) rate *= 1.1;
  if (signal.traits.includes("+Resonance")) rate *= 1.5;

  // Unstable signals grow slower (chaotic data is harder to parse)
  if (signal.unstable) rate *= 0.7;

  return rate;
}

// ─── Batch Spawn ────────────────────────────────────────────────────────

/**
 * Spawn multiple signals at once. Used for initial state generation
 * and scan results.
 *
 * @param count - Number of signals to spawn
 * @param existingSignals - Current signals (for ID collision avoidance)
 * @param rng - RNG function
 * @returns Array of new SignalEntries
 */
export function spawnSignals(
  count: number,
  existingSignals: { id: string }[] = [],
  rng: () => number = Math.random,
): SignalEntry[] {
  const existingIds = existingSignals.map((s) => s.id);
  const newSignals: SignalEntry[] = [];

  for (let i = 0; i < count; i++) {
    const allIds = [...existingIds, ...newSignals.map((s) => s.id)];
    const signal = spawnSignal(allIds, rng);
    newSignals.push(signal);
  }

  return newSignals;
}

// ─── Scan Result ────────────────────────────────────────────────────────

/**
 * Generate a scan result — a themed description of what the scan detected.
 * Used by the 'scan' command to provide flavor text.
 */
export function describeScanResult(signals: SignalEntry[]): string {
  if (signals.length === 0) {
    return "No new signals detected. The void is silent.";
  }

  const byType = new Map<string, SignalEntry[]>();
  for (const sig of signals) {
    const existing = byType.get(sig.type) || [];
    existing.push(sig);
    byType.set(sig.type, existing);
  }

  const parts: string[] = [];
  for (const [type, sigs] of byType) {
    const { label } = getRarityLabel(type);
    const count = sigs.length;
    const config = SIGNAL_TYPES[type as SignalType];
    if (count === 1) {
      parts.push(`${label} ${config?.name || type} detected: "${sigs[0].name}"`);
    } else {
      parts.push(`${count}x ${label} ${config?.name || type}s detected`);
    }
  }

  return parts.join("\n");
}

// ─── Validation ─────────────────────────────────────────────────────────

/**
 * Validate that signal type rarity weights sum to 1.0.
 * Returns warning string if off, null if valid.
 */
export function validateRarityWeights(): string | null {
  const types = Object.keys(SIGNAL_TYPES) as SignalType[];
  const total = types.reduce((sum, t) => sum + SIGNAL_TYPES[t].rarity, 0);
  if (Math.abs(total - 1.0) > 0.001) {
    return `Warning: Rarity weights sum to ${total.toFixed(4)}, expected 1.0`;
  }
  return null;
}
