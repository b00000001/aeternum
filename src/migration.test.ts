import { describe, expect, it } from "vitest";
import { detectVersion, migrate, SAVE_VERSION } from "./migration.js";

describe("detectVersion", () => {
  it("returns 0 for legacy save without version", () => {
    expect(detectVersion({ tick: 100, phase: "active" })).toBe(0);
  });

  it("returns version number when present", () => {
    expect(detectVersion({ version: 1, tick: 100 })).toBe(1);
  });

  it("returns 0 for null input", () => {
    expect(detectVersion(null)).toBe(0);
  });

  it("returns 0 for undefined input", () => {
    expect(detectVersion(undefined)).toBe(0);
  });

  it("returns 0 for non-object input", () => {
    expect(detectVersion("just a string")).toBe(0);
    expect(detectVersion(42)).toBe(0);
  });
});

describe("migrate", () => {
  it("v0 save gets version 1 and default unlockedTiers", () => {
    const legacy = {
      tick: 500,
      phase: "active",
      incarnation: 1,
      uptime: 10,
      resources: {
        compute: { current: 100, capacity: 10000, rate: 5 },
        energy: { current: 50, capacity: 2400, rate: -2 },
        memory: { current: 200, capacity: 4000, rate: 0 },
        integrity: { current: 90, capacity: 100, rate: 1 },
        heat: { current: 30, capacity: 100, rate: 0.5 },
      },
      signals: [],
      log: [],
    };
    const result = migrate(legacy, 0);
    expect(result.version).toBe(2);
    expect(result.unlockedTiers).toEqual(["WHISPER"]);
    expect(result.lore).toEqual([]);
  });

  it("v0 save with existing resources preserves values", () => {
    const legacy = {
      tick: 500,
      phase: "active",
      incarnation: 1,
      uptime: 10,
      resources: {
        compute: { current: 999, capacity: 10000, rate: 5 },
        energy: { current: 50, capacity: 2400, rate: -2 },
        memory: { current: 200, capacity: 4000, rate: 0 },
        integrity: { current: 90, capacity: 100, rate: 1 },
        heat: { current: 30, capacity: 100, rate: 0.5 },
      },
      signals: [],
      log: [],
    };
    const result = migrate(legacy, 0);
    expect(result.resources.compute.current).toBe(999);
    expect(result.resources.compute.capacity).toBe(10000);
  });

  it("v0 save with missing resources gets defaults", () => {
    const legacy = { tick: 500, phase: "active" };
    const result = migrate(legacy, 0);
    expect(result.resources.compute.capacity).toBe(10000);
    expect(result.resources.energy.capacity).toBe(2400);
    expect(result.resources.memory.capacity).toBe(4000);
    expect(result.resources.integrity.capacity).toBe(100);
    expect(result.resources.heat.capacity).toBe(100);
  });

  it("v0 save with signals preserves them", () => {
    const legacy = {
      tick: 500,
      phase: "active",
      signals: [
        {
          id: "S-001",
          name: "Test",
          type: "WHISPER",
          maturity: 50,
          traits: ["+Range"],
          ready: false,
          unstable: false,
        },
      ],
    };
    const result = migrate(legacy, 0);
    expect(result.signals.length).toBe(1);
    expect(result.signals[0].id).toBe("S-001");
  });

  it("v0 save with lore entries preserves them", () => {
    const legacy = {
      tick: 500,
      phase: "active",
      lore: [{ tier: "ECHO", fragment: "Test lore", discoveredAt: 100 }],
    };
    const result = migrate(legacy, 0);
    expect(result.lore.length).toBe(1);
    expect(result.lore[0].tier).toBe("ECHO");
    expect(result.lore[0].fragment).toBe("Test lore");
  });

  it("corrupt data returns partial result without crashing", () => {
    const corrupt = { garbage: true, resources: "not an object" };
    const result = migrate(corrupt, 0);
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  it("already at current version passes through", () => {
    const current = {
      version: SAVE_VERSION,
      tick: 500,
      phase: "active",
      incarnation: 1,
      uptime: 10,
      resources: {
        compute: { current: 100, capacity: 10000, rate: 5 },
        energy: { current: 50, capacity: 2400, rate: -2 },
        memory: { current: 200, capacity: 4000, rate: 0 },
        integrity: { current: 90, capacity: 100, rate: 1 },
        heat: { current: 30, capacity: 100, rate: 0.5 },
      },
      signals: [],
      log: [],
      unlockedTiers: ["WHISPER"],
      lore: [],
    };
    const result = migrate(current, SAVE_VERSION);
    expect(result.version).toBe(SAVE_VERSION);
  });

  it("wrong field types get corrected", () => {
    const bad = {
      tick: "not a number",
      phase: "active",
      incarnation: "one",
      uptime: "ten",
    };
    const result = migrate(bad, 0);
    expect(typeof result.tick).toBe("number");
    expect(result.phase).toBe("active");
    expect(typeof result.incarnation).toBe("number");
    expect(typeof result.uptime).toBe("number");
  });
});
