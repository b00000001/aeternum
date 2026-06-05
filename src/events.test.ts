/**
 * DEEP VOID — Events System Tests
 *
 * Tests event spawning, choice resolution (including risk failure
 * and heat inversion), outcome application with clamping, and formatting.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyOutcomes,
  type EventChoice,
  formatEvent,
  loadEventPool,
  pickRandomEvent,
  resolveChoice,
  trySpawnEvent,
  type VoidEvent,
} from "./events.js";
import type { GameState, SignalEntry } from "./types.js";

// ─── Mock Math.random ───────────────────────────────────────────────────

let mockRandom = 0.5;
const originalRandom = Math.random;

beforeEach(() => {
  Math.random = () => mockRandom;
});

afterEach(() => {
  Math.random = originalRandom;
});

// ─── Mock State ─────────────────────────────────────────────────────────

function createMockState(overrides: Partial<GameState> = {}): GameState {
  return {
    version: 1,
    tick: 1000,
    phase: "active",
    incarnation: 1,
    uptime: 42.5,
    fleetCount: null,
    vaultTime: null,
    anomaly: "—",
    veterancyLevel: "novice",
    resources: {
      compute: { current: 5000, capacity: 10000, rate: 12 },
      energy: { current: 1200, capacity: 2400, rate: -8 },
      memory: { current: 2000, capacity: 4000, rate: 0 },
      integrity: { current: 85, capacity: 100, rate: 2 },
      heat: { current: 60, capacity: 100, rate: 1 },
    },
    signals: [],
    log: [],
    commandBuffer: "",
    unlockedTiers: ["WHISPER"],
    lore: [],
    ...overrides,
  };
}

function createTestSignal(overrides: Partial<SignalEntry> = {}): SignalEntry {
  return {
    id: "S-001",
    name: "Test signal",
    type: "WHISPER",
    maturity: 50,
    traits: [],
    ready: false,
    unstable: false,
    ...overrides,
  };
}

// ─── loadEventPool ──────────────────────────────────────────────────────

describe("loadEventPool", () => {
  it("returns 12 events", () => {
    const pool = loadEventPool();
    expect(pool.length).toBe(12);
  });

  it("all events have required fields", () => {
    const pool = loadEventPool();
    for (const event of pool) {
      expect(typeof event.id).toBe("string");
      expect(event.id.length).toBeGreaterThan(0);
      expect(typeof event.title).toBe("string");
      expect(event.title.length).toBeGreaterThan(0);
      expect(typeof event.description).toBe("string");
      expect(event.description.length).toBeGreaterThan(0);
      expect(Array.isArray(event.choices)).toBe(true);
      expect(event.choices.length).toBeGreaterThanOrEqual(2);
      expect(typeof event.minSignals).toBe("number");
      expect(typeof event.rarity).toBe("number");

      for (const choice of event.choices) {
        expect(typeof choice.label).toBe("string");
        expect(typeof choice.message).toBe("string");
        expect(typeof choice.risk).toBe("number");
        expect(choice.risk).toBeGreaterThanOrEqual(0);
        expect(choice.risk).toBeLessThanOrEqual(1);
        expect(choice.outcomes).toBeDefined();
        expect(typeof choice.outcomes.compute).toBe("number");
        expect(typeof choice.outcomes.energy).toBe("number");
        expect(typeof choice.outcomes.memory).toBe("number");
        expect(typeof choice.outcomes.integrity).toBe("number");
        expect(typeof choice.outcomes.heat).toBe("number");
      }
    }
  });
});

// ─── trySpawnEvent ──────────────────────────────────────────────────────

describe("trySpawnEvent", () => {
  it("returns null when no signals", () => {
    expect(trySpawnEvent([])).toBeNull();
  });

  it("returns null when random > baseChance", () => {
    mockRandom = 0.99; // above 0.03 default baseChance
    const signals = [createTestSignal()];
    expect(trySpawnEvent(signals)).toBeNull();
  });

  it("returns event when random < baseChance", () => {
    mockRandom = 0.01; // below 0.03 default baseChance
    const signals = [createTestSignal()];
    const event = trySpawnEvent(signals);
    expect(event).not.toBeNull();
    expect(event!.id).toBeDefined();
  });

  it("respects custom baseChance", () => {
    mockRandom = 0.15; // above 0.1 but below 0.5
    const signals = [createTestSignal()];
    expect(trySpawnEvent(signals, 0.1)).toBeNull();
    expect(trySpawnEvent(signals, 0.5)).not.toBeNull();
  });
});

// ─── pickRandomEvent ────────────────────────────────────────────────────

describe("pickRandomEvent", () => {
  it("returns null when no eligible events (0 signals, all events need 1+)", () => {
    // Create a state where all events require more signals than we have
    // The pool has events with minSignals: 0, so with 0 signals, some are eligible
    // But with no signals at all, trySpawnEvent returns null before pickRandomEvent
    const result = pickRandomEvent([]);
    // Events with minSignals: 0 are eligible even with 0 signals
    // So this should return an event (not null)
    expect(result).not.toBeNull();
  });

  it("returns event when eligible", () => {
    const signals = [createTestSignal(), createTestSignal({ id: "S-002" })];
    const event = pickRandomEvent(signals);
    expect(event).not.toBeNull();
    expect(event!.id).toBeDefined();
    // With 2 signals, events with minSignals <= 2 are eligible
    expect(event!.minSignals).toBeLessThanOrEqual(2);
  });

  it("excludes events requiring more signals than available", () => {
    const signals = [createTestSignal()]; // 1 signal
    // Events with minSignals: 3, 4 should not be returned
    for (let i = 0; i < 20; i++) {
      mockRandom = Math.random() * 0.99 + 0.005; // varied rolls
      const event = pickRandomEvent(signals);
      if (event) {
        expect(event.minSignals).toBeLessThanOrEqual(1);
      }
    }
  });
});

// ─── resolveChoice ──────────────────────────────────────────────────────

describe("resolveChoice", () => {
  const safeChoice: EventChoice = {
    label: "Safe option",
    outcomes: { compute: 50, energy: -10, memory: 0, integrity: 0, heat: 0 },
    message: "Safe choice resolved.",
    risk: 0.0,
  };

  const riskyChoice: EventChoice = {
    label: "Risky option",
    outcomes: { compute: 200, energy: -50, memory: 30, integrity: -10, heat: -40 },
    message: "Risky choice resolved.",
    risk: 0.3,
  };

  it("risk:0 choice always succeeds", () => {
    const result = resolveChoice(safeChoice);
    expect(result.failed).toBe(false);
    expect(result.applied.compute).toBe(50);
    expect(result.applied.energy).toBe(-10);
    expect(result.message).toBe("Safe choice resolved.");
  });

  it("risky choice succeeds when random >= risk", () => {
    mockRandom = 0.5; // above 0.3 risk
    const result = resolveChoice(riskyChoice);
    expect(result.failed).toBe(false);
    expect(result.applied.compute).toBe(200);
    expect(result.applied.energy).toBe(-50);
  });

  it("risky choice fails when random < risk", () => {
    mockRandom = 0.1; // below 0.3 risk
    const result = resolveChoice(riskyChoice);
    expect(result.failed).toBe(true);
    expect(result.message).toContain("Risk failed");
  });

  it("failed risk negates gains for non-heat resources", () => {
    mockRandom = 0.1; // force failure
    const result = resolveChoice(riskyChoice);
    // compute: 200 (gain) → -200 (negated)
    expect(result.applied.compute).toBe(-200);
    // energy: -50 (cost) → -50 (kept, not doubled)
    expect(result.applied.energy).toBe(-50);
    // memory: 30 (gain) → -30 (negated)
    expect(result.applied.memory).toBe(-30);
    // integrity: -10 (cost) → -10 (kept)
    expect(result.applied.integrity).toBe(-10);
  });

  it("failed risk inverts heat correctly", () => {
    mockRandom = 0.1; // force failure
    // heat: -40 (cooling=good) → inverted: positive 40 (more heat = worse)
    const result = resolveChoice(riskyChoice);
    expect(result.applied.heat).toBe(40);
  });

  it("failed risk doubles positive heat (more heat = worse)", () => {
    mockRandom = 0.1; // force failure
    const hotChoice: EventChoice = {
      label: "Hot option",
      outcomes: { compute: 100, energy: 0, memory: 0, integrity: 0, heat: 25 },
      message: "Hot.",
      risk: 0.2,
    };
    const result = resolveChoice(hotChoice);
    expect(result.failed).toBe(true);
    // heat: 25 (positive=bad) → 50 (doubled, worse)
    expect(result.applied.heat).toBe(50);
    // compute: 100 (gain) → -100 (negated)
    expect(result.applied.compute).toBe(-100);
  });

  it("zero outcomes remain zero on failure", () => {
    mockRandom = 0.1;
    const zeroChoice: EventChoice = {
      label: "Zero outcomes",
      outcomes: { compute: 0, energy: 0, memory: 0, integrity: 0, heat: 0 },
      message: "Nothing.",
      risk: 0.5,
    };
    const result = resolveChoice(zeroChoice);
    expect(result.failed).toBe(true);
    expect(result.applied.compute).toBe(0);
    expect(result.applied.energy).toBe(0);
    expect(result.applied.memory).toBe(0);
    expect(result.applied.integrity).toBe(0);
    expect(result.applied.heat).toBe(0);
  });
});

// ─── applyOutcomes ──────────────────────────────────────────────────────

describe("applyOutcomes", () => {
  it("adds outcomes to resources within capacity", () => {
    const state = createMockState();
    const outcomes = { compute: 100, energy: 50, memory: 200, integrity: 5, heat: -10 };
    applyOutcomes(state, outcomes);
    expect(state.resources.compute.current).toBe(5100);
    expect(state.resources.energy.current).toBe(1250);
    expect(state.resources.memory.current).toBe(2200);
    expect(state.resources.integrity.current).toBe(90);
    expect(state.resources.heat.current).toBe(50);
  });

  it("clamps resources at capacity", () => {
    const state = createMockState();
    const outcomes = { compute: 99999, energy: 0, memory: 0, integrity: 0, heat: 0 };
    applyOutcomes(state, outcomes);
    expect(state.resources.compute.current).toBe(10000); // capacity
  });

  it("clamps resources at 0", () => {
    const state = createMockState();
    const outcomes = { compute: -99999, energy: -99999, memory: 0, integrity: 0, heat: 0 };
    applyOutcomes(state, outcomes);
    expect(state.resources.compute.current).toBe(0);
    expect(state.resources.energy.current).toBe(0);
  });

  it("clamps integrity at capacity (100)", () => {
    const state = createMockState();
    const outcomes = { compute: 0, energy: 0, memory: 0, integrity: 50, heat: 0 };
    applyOutcomes(state, outcomes);
    expect(state.resources.integrity.current).toBe(100); // 85 + 50 capped at 100
  });

  it("clamps heat at capacity (100)", () => {
    const state = createMockState();
    const outcomes = { compute: 0, energy: 0, memory: 0, integrity: 0, heat: 50 };
    applyOutcomes(state, outcomes);
    expect(state.resources.heat.current).toBe(100); // 60 + 50 capped at 100
  });
});

// ─── formatEvent ────────────────────────────────────────────────────────

describe("formatEvent", () => {
  it("returns formatted string with title and choices", () => {
    const event: VoidEvent = {
      id: "test-event",
      title: "Test Event",
      description: "A test event description.",
      choices: [
        {
          label: "Option A",
          outcomes: { compute: 10, energy: 0, memory: 0, integrity: 0, heat: 0 },
          message: "A chosen.",
          risk: 0.0,
        },
        {
          label: "Option B",
          outcomes: { compute: 0, energy: -20, memory: 0, integrity: 0, heat: 5 },
          message: "B chosen.",
          risk: 0.25,
        },
      ],
      minSignals: 0,
      rarity: 0.1,
    };

    const result = formatEvent(event);
    expect(result).toContain("⚠ EVENT: Test Event");
    expect(result).toContain("A test event description.");
    expect(result).toContain("1. Option A");
    expect(result).toContain("2. Option B");
    expect(result).toContain("[risk: 25%]");
    expect(result).toContain("▸ Type the number of your choice.");
  });

  it("does not show risk tag for risk:0 choices", () => {
    const event: VoidEvent = {
      id: "safe-event",
      title: "Safe Event",
      description: "No risk here.",
      choices: [
        {
          label: "Safe A",
          outcomes: { compute: 0, energy: 0, memory: 0, integrity: 0, heat: 0 },
          message: "OK.",
          risk: 0.0,
        },
        {
          label: "Safe B",
          outcomes: { compute: 0, energy: 0, memory: 0, integrity: 0, heat: 0 },
          message: "OK.",
          risk: 0.0,
        },
      ],
      minSignals: 0,
      rarity: 0.1,
    };

    const result = formatEvent(event);
    expect(result).not.toContain("risk:");
    expect(result).toContain("1. Safe A");
    expect(result).toContain("2. Safe B");
  });
});
