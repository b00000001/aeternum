import { describe, expect, it } from "vitest";
import { calculatePressure, formatPressure } from "./pressure.js";
import { createInitialState, type GameState } from "./types.js";

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
    unlockedTiers: ["WHISPER"],
    lore: [],
    harvestMultiplier: 1.0,
    ...overrides,
  };
}

describe("calculatePressure", () => {
  it("returns level 0 for fresh game", () => {
    const state = createTestState();
    const pressure = calculatePressure(state);
    expect(pressure.level).toBe(0);
    expect(pressure.heatMultiplier).toBe(1.0);
    expect(pressure.energyDrain).toBe(0);
    expect(pressure.eventChance).toBeCloseTo(0.03);
  });

  it("increases with more tiers", () => {
    const state = createTestState({
      unlockedTiers: ["WHISPER", "ECHO", "PULSE"],
    });
    const pressure = calculatePressure(state);
    expect(pressure.level).toBeGreaterThanOrEqual(2);
    expect(pressure.level).toBeLessThanOrEqual(6);
  });

  it("increases with more lore", () => {
    const state = createTestState({
      lore: [
        { tier: "WHISPER", fragment: "test", discoveredAt: 100 },
        { tier: "WHISPER", fragment: "test2", discoveredAt: 101 },
        { tier: "WHISPER", fragment: "test3", discoveredAt: 102 },
      ],
    });
    const pressure = calculatePressure(state);
    expect(pressure.level).toBeGreaterThanOrEqual(1);
  });

  it("caps at level 10", () => {
    const state = createTestState({
      unlockedTiers: ["WHISPER", "ECHO", "PULSE", "DRIFT", "FLARE", "ANOMALY"],
      lore: Array.from({ length: 20 }, (_, i) => ({
        tier: "WHISPER",
        fragment: `lore ${i}`,
        discoveredAt: 100 + i,
      })),
    });
    const pressure = calculatePressure(state);
    expect(pressure.level).toBe(10);
    expect(pressure.heatMultiplier).toBe(2.0);
    expect(pressure.eventChance).toBeCloseTo(0.08);
  });

  it("heatMultiplier scales linearly with level", () => {
    const state = createTestState();
    for (let lvl = 0; lvl <= 10; lvl++) {
      // Manually set state to produce target level
      const tierCount = Math.floor(lvl / 2) + 1;
      const loreCount = Math.ceil(lvl / 2);
      state.unlockedTiers = Array.from({ length: tierCount }, (_, i) => `T${i}`);
      state.lore = Array.from({ length: loreCount }, (_, i) => ({
        tier: "T",
        fragment: `${i}`,
        discoveredAt: i,
      }));
      const pressure = calculatePressure(state);
      expect(pressure.heatMultiplier).toBeGreaterThanOrEqual(1.0);
      expect(pressure.heatMultiplier).toBeLessThanOrEqual(2.0);
    }
  });
});

describe("formatPressure", () => {
  it("contains level number", () => {
    const pressure = calculatePressure(createTestState());
    const display = formatPressure(pressure);
    expect(display).toContain("Level: 0/10");
  });

  it("contains progress bar", () => {
    const pressure = calculatePressure(createTestState());
    const display = formatPressure(pressure);
    expect(display).toContain("[");
    expect(display).toContain("]");
  });

  it("shows heat multiplier", () => {
    const pressure = calculatePressure(createTestState());
    const display = formatPressure(pressure);
    expect(display).toContain("1.0x");
  });

  it("shows event chance percentage", () => {
    const pressure = calculatePressure(createTestState());
    const display = formatPressure(pressure);
    expect(display).toContain("3.0%");
  });

  it("shows flavor text for level 0", () => {
    const pressure = calculatePressure(createTestState());
    const display = formatPressure(pressure);
    expect(display).toContain("dormant");
  });

  it("shows escalating flavor text", () => {
    const highPressure = { level: 8, heatMultiplier: 1.8, energyDrain: 0.8, eventChance: 0.07 };
    const display = formatPressure(highPressure);
    expect(display).toContain("Level: 8/10");
    expect(display).toContain("hungers");
  });
});
