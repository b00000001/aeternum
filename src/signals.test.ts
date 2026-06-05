/**
 * DEEP VOID — Signal Spawning Module Tests
 *
 * Tests pure functions in signals.ts: createRng, spawnSignal,
 * getMaturityRate, describeScanResult, validateRarityWeights.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  createRng,
  describeScanResult,
  getMaturityRate,
  SIGNAL_TYPES,
  type SignalType,
  spawnSignal,
  validateRarityWeights,
} from "./signals.js";
import type { SignalEntry } from "./types.js";

// ─── Helpers ────────────────────────────────────────────────────────────

function createTestSignal(overrides: Partial<SignalEntry> = {}): SignalEntry {
  return {
    id: "S-001",
    name: "Silent whisper",
    type: "WHISPER",
    maturity: 50,
    traits: [],
    ready: false,
    unstable: false,
    ...overrides,
  };
}

// ─── createRng ──────────────────────────────────────────────────────────

describe("createRng", () => {
  it("returns Math.random when no seed provided", () => {
    const rng = createRng();
    const value = rng();
    expect(typeof value).toBe("number");
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });

  it("returns deterministic sequence when seeded", () => {
    const rng1 = createRng(42);
    const rng2 = createRng(42);
    const seq1 = Array.from({ length: 5 }, () => rng1());
    const seq2 = Array.from({ length: 5 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it("different seeds produce different sequences", () => {
    const rng1 = createRng(42);
    const rng2 = createRng(99);
    const val1 = rng1();
    const val2 = rng2();
    expect(val1).not.toBe(val2);
  });
});

// ─── spawnSignal ────────────────────────────────────────────────────────

describe("spawnSignal", () => {
  let seededRng: () => number;

  beforeEach(() => {
    seededRng = createRng(42);
  });

  it("returns a valid SignalEntry", () => {
    const sig = spawnSignal([], seededRng);
    expect(sig.id).toMatch(/^S-\d{3}$/);
    expect(sig.name.length).toBeGreaterThan(0);
    expect(sig.type).toBeDefined();
    expect(SIGNAL_TYPES[sig.type as SignalType]).toBeDefined();
    expect(sig.maturity).toBeGreaterThanOrEqual(0);
    expect(sig.maturity).toBeLessThanOrEqual(5);
    expect(sig.traits.length).toBeGreaterThanOrEqual(0);
    expect(sig.ready).toBe(false);
  });

  it("generates unique IDs across 10 spawns", () => {
    const ids = new Set<string>();
    const allIds: string[] = [];
    for (let i = 0; i < 10; i++) {
      const sig = spawnSignal(allIds, seededRng);
      ids.add(sig.id);
      allIds.push(sig.id);
    }
    expect(ids.size).toBe(10);
  });

  it("respects unlockedTypes filter", () => {
    const rng = createRng(123);
    const types = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const sig = spawnSignal([], rng, ["ECHO", "PULSE"]);
      types.add(sig.type);
    }
    for (const t of types) {
      expect(["ECHO", "PULSE"]).toContain(t);
    }
  });

  it("defaults to WHISPER when unlockedTypes is empty", () => {
    const rng = createRng(42);
    const sig = spawnSignal([], rng, []);
    expect(sig.type).toBe("WHISPER");
  });

  it("generates thematic name from type word pools", () => {
    const rng = createRng(42);
    const sig = spawnSignal([], rng, ["WHISPER"]);
    expect(sig.name.length).toBeGreaterThan(0);
    expect(sig.name).toContain(" ");
  });
});

// ─── getMaturityRate ────────────────────────────────────────────────────

describe("getMaturityRate", () => {
  it("returns base rate for unmodified signal", () => {
    const sig = createTestSignal({ type: "WHISPER" });
    expect(getMaturityRate(sig)).toBe(0.5);
  });

  it("+Speed trait increases rate by 20%", () => {
    const sig = createTestSignal({ type: "WHISPER", traits: ["+Speed"] });
    expect(getMaturityRate(sig)).toBeCloseTo(0.5 * 1.2);
  });

  it("+Power trait increases rate by 10%", () => {
    const sig = createTestSignal({ type: "WHISPER", traits: ["+Power"] });
    expect(getMaturityRate(sig)).toBeCloseTo(0.5 * 1.1);
  });

  it("+Resonance trait increases rate by 50%", () => {
    const sig = createTestSignal({ type: "ANOMALY", traits: ["+Resonance"] });
    expect(getMaturityRate(sig)).toBeCloseTo(0.05 * 1.5);
  });

  it("unstable signals grow 30% slower", () => {
    const sig = createTestSignal({ type: "WHISPER", unstable: true });
    expect(getMaturityRate(sig)).toBeCloseTo(0.5 * 0.7);
  });

  it("traits and unstable combine multiplicatively", () => {
    const sig = createTestSignal({
      type: "WHISPER",
      traits: ["+Speed", "+Power"],
      unstable: true,
    });
    const expected = 0.5 * 1.2 * 1.1 * 0.7;
    expect(getMaturityRate(sig)).toBeCloseTo(expected);
  });

  it("returns 0.1 fallback for unknown type", () => {
    const sig = createTestSignal({ type: "FAKE" });
    expect(getMaturityRate(sig)).toBe(0.1);
  });
});

// ─── validateRarityWeights ──────────────────────────────────────────────

describe("validateRarityWeights", () => {
  it("returns null when weights sum to 1.0", () => {
    // The built-in SIGNAL_TYPES weights sum to 1.0
    expect(validateRarityWeights()).toBeNull();
  });
});

// ─── describeScanResult ─────────────────────────────────────────────────

describe("describeScanResult", () => {
  it("returns correct description for signals", () => {
    const signals: SignalEntry[] = [createTestSignal({ name: "Silent whisper", type: "WHISPER" })];
    const result = describeScanResult(signals);
    expect(result).toContain("Common");
    expect(result).toContain("Whisper");
    expect(result).toContain("Silent whisper");
  });

  it("returns void message for empty array", () => {
    const result = describeScanResult([]);
    expect(result).toBe("No new signals detected. The void is silent.");
  });

  it("groups multiple signals of same type", () => {
    const signals: SignalEntry[] = [
      createTestSignal({ id: "S-001", name: "Sig A", type: "WHISPER" }),
      createTestSignal({ id: "S-002", name: "Sig B", type: "WHISPER" }),
    ];
    const result = describeScanResult(signals);
    expect(result).toContain("2x");
    expect(result).toContain("Whispers");
  });

  it("lists different types separately", () => {
    const signals: SignalEntry[] = [
      createTestSignal({ id: "S-001", name: "Sig A", type: "WHISPER" }),
      createTestSignal({ id: "S-002", name: "Sig B", type: "ECHO" }),
    ];
    const result = describeScanResult(signals);
    expect(result).toContain("Whisper");
    expect(result).toContain("Echo");
  });
});
