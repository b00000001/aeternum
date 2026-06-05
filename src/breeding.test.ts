import { describe, expect, it } from "vitest";
import { breedSignals, canBreed, formatBreeding } from "./breeding.js";
import { createInitialState, type GameState, type SignalEntry } from "./types.js";

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(),
    tick: 1000,
    phase: "active",
    resources: {
      compute: { current: 5000, capacity: 10000, rate: 12 },
      energy: { current: 1200, capacity: 2400, rate: -8 },
      memory: { current: 2000, capacity: 4000, rate: 0 },
      integrity: { current: 85, capacity: 100, rate: 2 },
      heat: { current: 60, capacity: 100, rate: 1 },
    },
    unlockedTiers: ["WHISPER", "ECHO"],
    lore: [],
    ...overrides,
  };
}

function makeSignal(overrides: Partial<SignalEntry> = {}): SignalEntry {
  return {
    id: "S-001",
    name: "Silent whisper",
    type: "WHISPER",
    maturity: 100,
    traits: ["+Range"],
    ready: true,
    unstable: false,
    ...overrides,
  };
}

describe("canBreed", () => {
  it("returns ok for two ready signals", () => {
    const state = createTestState({
      signals: [makeSignal({ id: "S-001" }), makeSignal({ id: "S-002" })],
    });
    expect(canBreed(state, "S-001", "S-002").ok).toBe(true);
  });

  it("rejects breeding with self", () => {
    const state = createTestState({ signals: [makeSignal()] });
    const result = canBreed(state, "S-001", "S-001");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("itself");
  });

  it("rejects unknown signal", () => {
    const state = createTestState({ signals: [] });
    const result = canBreed(state, "S-999", "S-001");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("not found");
  });

  it("rejects immature signal", () => {
    const state = createTestState({
      signals: [
        makeSignal({ id: "S-001", ready: true }),
        makeSignal({ id: "S-002", ready: false, maturity: 50 }),
      ],
    });
    const result = canBreed(state, "S-001", "S-002");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("not ready");
  });
});

describe("breedSignals", () => {
  it("creates offspring and removes parents", () => {
    const state = createTestState({
      signals: [
        makeSignal({ id: "S-001", type: "WHISPER", name: "Silent whisper" }),
        makeSignal({ id: "S-002", type: "ECHO", name: "Reflected echo" }),
      ],
    });
    const result = breedSignals(state, "S-001", "S-002");
    expect(result.success).toBe(true);
    expect(result.offspring).not.toBeNull();
    expect(state.signals.length).toBe(1);
    expect(state.signals[0].id).toBe("S-003");
    expect(state.signals[0].maturity).toBe(0);
    expect(state.signals[0].ready).toBe(false);
  });

  it("inherits traits from both parents", () => {
    const state = createTestState({
      signals: [
        makeSignal({ id: "S-001", traits: ["+Range"] }),
        makeSignal({ id: "S-002", traits: ["+Speed"] }),
      ],
    });
    const result = breedSignals(state, "S-001", "S-002");
    // Traits come from both parents (possibly mutated)
    expect(result.offspring!.traits.length).toBeGreaterThanOrEqual(1);
    expect(result.offspring!.traits.length).toBeLessThanOrEqual(3);
  });

  it("fails gracefully for invalid inputs", () => {
    const state = createTestState({ signals: [] });
    const result = breedSignals(state, "S-001", "S-002");
    expect(result.success).toBe(false);
    expect(result.offspring).toBeNull();
  });

  it("can produce unstable offspring from unstable parent", () => {
    // Run multiple times to catch the 30% chance
    let foundUnstable = false;
    for (let i = 0; i < 20; i++) {
      const state = createTestState({
        signals: [
          makeSignal({ id: "S-001", unstable: true }),
          makeSignal({ id: "S-002", unstable: false }),
        ],
      });
      const result = breedSignals(state, "S-001", "S-002");
      if (result.offspring?.unstable) foundUnstable = true;
    }
    expect(foundUnstable).toBe(true);
  });
});

describe("formatBreeding", () => {
  it("shows ready signals", () => {
    const state = createTestState({
      signals: [
        makeSignal({ id: "S-001", name: "Signal A" }),
        makeSignal({ id: "S-002", name: "Signal B" }),
      ],
    });
    const display = formatBreeding(state);
    expect(display).toContain("S-001");
    expect(display).toContain("S-002");
    expect(display).toContain("breed");
  });

  it("shows message when not enough signals", () => {
    const state = createTestState({ signals: [makeSignal()] });
    const display = formatBreeding(state);
    expect(display).toContain("at least 2");
  });
});
