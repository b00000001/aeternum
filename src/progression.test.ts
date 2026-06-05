/**
 * DEEP VOID — Progression Tests
 *
 * Tests the tier unlock system using vitest.
 */

import { describe, expect, it } from "vitest";
import {
  canUnlock,
  formatAttune,
  getAvailableUnlocks,
  getTierUnlock,
  getTierUnlocks,
  unlockTier,
} from "./progression.js";
import type { GameState } from "./types.js";

// ─── Factory ────────────────────────────────────────────────────────────

function createTestState(overrides: Partial<GameState> = {}): GameState {
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

// ─── getAvailableUnlocks ────────────────────────────────────────────────

describe("getAvailableUnlocks", () => {
  it("returns tiers not yet unlocked", () => {
    const result = getAvailableUnlocks(["WHISPER"]);
    expect(result.length).toBe(5);
    expect(result[0].tier).toBe("ECHO");
    expect(result[1].tier).toBe("PULSE");
    expect(result[4].tier).toBe("ANOMALY");
  });

  it("excludes already unlocked tiers", () => {
    const result = getAvailableUnlocks(["WHISPER", "ECHO", "PULSE"]);
    expect(result.length).toBe(3);
    expect(result.map((t) => t.tier)).toEqual(["DRIFT", "FLARE", "ANOMALY"]);
  });

  it("returns empty array when all tiers unlocked", () => {
    const result = getAvailableUnlocks(["WHISPER", "ECHO", "PULSE", "DRIFT", "FLARE", "ANOMALY"]);
    expect(result).toEqual([]);
  });

  it("filters out non-standard tier names harmlessly", () => {
    const result = getAvailableUnlocks(["FAKE"]);
    expect(result.length).toBe(5);
  });
});

// ─── getTierUnlock ──────────────────────────────────────────────────────

describe("getTierUnlock", () => {
  it("returns correct tier info", () => {
    const result = getTierUnlock("ECHO");
    expect(result).toBeDefined();
    expect(result?.tier).toBe("ECHO");
    expect(result?.cost).toBe(50);
    expect(result?.description).toContain("reflected transmissions");
  });

  it("returns undefined for unknown tier", () => {
    const result = getTierUnlock("NOPE");
    expect(result).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    const result = getTierUnlock("");
    expect(result).toBeUndefined();
  });
});

// ─── getTierUnlocks ─────────────────────────────────────────────────────

describe("getTierUnlocks", () => {
  it("returns all 5 unlockable tiers", () => {
    const result = getTierUnlocks();
    expect(result.length).toBe(5);
    expect(result[0].tier).toBe("ECHO");
    expect(result[4].tier).toBe("ANOMALY");
  });
});

// ─── canUnlock ──────────────────────────────────────────────────────────

describe("canUnlock", () => {
  it("returns ok:true when affordable", () => {
    const state = createTestState(); // 5000 compute
    const result = canUnlock(state, "ECHO"); // costs 50
    expect(result.ok).toBe(true);
  });

  it("returns ok:false when insufficient compute", () => {
    const state = createTestState({
      resources: {
        ...createTestState().resources,
        compute: { current: 10, capacity: 10000, rate: 12 },
      },
    });
    const result = canUnlock(state, "PULSE"); // costs 200
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("Need 200C");
    expect(result.reason).toContain("have 10C");
  });

  it("returns ok:false when already unlocked", () => {
    const state = createTestState({ unlockedTiers: ["WHISPER", "ECHO"] });
    const result = canUnlock(state, "ECHO");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("already unlocked");
  });

  it("returns ok:false for unknown tier", () => {
    const state = createTestState();
    const result = canUnlock(state, "FAKE");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("Unknown tier: FAKE");
  });

  it("returns ok:true at exact cost boundary", () => {
    const state = createTestState({
      resources: {
        ...createTestState().resources,
        compute: { current: 50, capacity: 10000, rate: 12 },
      },
    });
    const result = canUnlock(state, "ECHO"); // costs exactly 50
    expect(result.ok).toBe(true);
  });
});

// ─── unlockTier ─────────────────────────────────────────────────────────

describe("unlockTier", () => {
  it("deducts compute and adds tier on success", () => {
    const state = createTestState(); // 5000 compute
    const result = unlockTier(state, "ECHO");
    expect(result.success).toBe(true);
    expect(result.message).toContain("Attuned to ECHO");
    expect(result.message).toContain("-50C");
    expect(state.unlockedTiers).toContain("ECHO");
    expect(state.resources.compute.current).toBe(4950);
  });

  it("fails gracefully when cannot afford", () => {
    const state = createTestState({
      resources: {
        ...createTestState().resources,
        compute: { current: 10, capacity: 10000, rate: 12 },
      },
    });
    const result = unlockTier(state, "PULSE");
    expect(result.success).toBe(false);
    expect(result.message).toContain("Need 200C");
    expect(state.unlockedTiers).not.toContain("PULSE");
    // Compute should not be deducted on failure
    expect(state.resources.compute.current).toBe(10);
  });

  it("fails gracefully when already unlocked", () => {
    const state = createTestState({ unlockedTiers: ["WHISPER", "ECHO"] });
    const result = unlockTier(state, "ECHO");
    expect(result.success).toBe(false);
    expect(result.message).toContain("already unlocked");
  });

  it("fails gracefully for unknown tier", () => {
    const state = createTestState();
    const result = unlockTier(state, "FAKE");
    expect(result.success).toBe(false);
    expect(result.message).toContain("Unknown tier");
  });
});

// ─── formatAttune ───────────────────────────────────────────────────────

describe("formatAttune", () => {
  it("shows unlocked tiers and available unlocks", () => {
    const state = createTestState();
    const result = formatAttune(state);
    expect(result).toContain("Unlocked: WHISPER");
    expect(result).toContain("ECHO");
    expect(result).toContain("50C");
    expect(result).toContain("PULSE");
    expect(result).toContain("200C");
    expect(result).toContain("attune <tier>");
  });

  it("marks affordable tiers with ◇", () => {
    const state = createTestState(); // 5000 compute, enough for all except ANOMALY
    const result = formatAttune(state);
    // All visible tiers (up to FLARE at 3200) should be ◇
    // ANOMALY at 12800 should be ○
    expect(result).toContain("◇ ECHO");
    expect(result).toContain("◇ FLARE");
    expect(result).toContain("○ ANOMALY");
  });

  it("marks unaffordable tiers with ○", () => {
    const state = createTestState({
      resources: {
        ...createTestState().resources,
        compute: { current: 30, capacity: 10000, rate: 12 },
      },
    });
    const result = formatAttune(state);
    // ECHO costs 50, so it should be ○
    expect(result).toContain("○ ECHO");
    expect(result).toContain("○ PULSE");
  });

  it('shows "all unlocked" when no tiers remain', () => {
    const state = createTestState({
      unlockedTiers: ["WHISPER", "ECHO", "PULSE", "DRIFT", "FLARE", "ANOMALY"],
    });
    const result = formatAttune(state);
    expect(result).toContain("All signal tiers unlocked");
  });
});
