import { describe, expect, it } from "vitest";
import { canPurchase, formatNodes, getAllNodes, getNode, purchaseNode } from "./nodes.js";
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

describe("getNode", () => {
  it("returns node by ID", () => {
    const node = getNode("power-1");
    expect(node).toBeDefined();
    expect(node!.name).toBe("Capacitor Bank");
  });

  it("returns undefined for unknown ID", () => {
    expect(getNode("fake")).toBeUndefined();
  });
});

describe("getAllNodes", () => {
  it("returns 26 nodes", () => {
    expect(getAllNodes().length).toBe(26);
  });

  it("includes new categories", () => {
    const nodes = getAllNodes();
    const categories = [...new Set(nodes.map((n) => n.category))];
    expect(categories).toContain("Research");
    expect(categories).toContain("Battery");
    expect(categories).toContain("Compressor");
    expect(categories).toContain("Salvage");
  });
});

describe("canPurchase", () => {
  it("returns ok when affordable and no prerequisite", () => {
    const state = createTestState();
    const result = canPurchase(state, "power-1");
    expect(result.ok).toBe(true);
  });

  it("returns error for unknown node", () => {
    const state = createTestState();
    const result = canPurchase(state, "fake");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("Unknown");
  });

  it("returns error when insufficient compute", () => {
    const state = createTestState({
      resources: {
        ...createTestState().resources,
        compute: { current: 5, capacity: 10000, rate: 12 },
      },
    });
    const result = canPurchase(state, "power-1");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("Need");
  });

  it("returns error when prerequisite not met", () => {
    const state = createTestState();
    const result = canPurchase(state, "power-2");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("Requires");
  });

  it("returns ok when prerequisite is met", () => {
    const state = createTestState();
    (state as any).nodes = { purchased: ["power-1"] };
    const result = canPurchase(state, "power-2");
    expect(result.ok).toBe(true);
  });

  it("returns error when already purchased", () => {
    const state = createTestState();
    (state as any).nodes = { purchased: ["power-1"] };
    const result = canPurchase(state, "power-1");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("already purchased");
  });
});

describe("purchaseNode", () => {
  it("deducts compute and records purchase", () => {
    const state = createTestState();
    const result = purchaseNode(state, "power-1");
    expect(result.success).toBe(true);
    expect(state.resources.compute.current).toBe(4985);
    expect((state as any).nodes.purchased).toContain("power-1");
  });

  it("applies capacity effect", () => {
    const state = createTestState();
    purchaseNode(state, "power-1");
    expect(state.resources.energy.capacity).toBe(2600);
  });

  it("applies rate effect for processor nodes", () => {
    const state = createTestState();
    purchaseNode(state, "proc-1");
    expect(state.resources.compute.rate).toBe(17);
  });

  it("applies negative rate for cooler nodes", () => {
    const state = createTestState();
    purchaseNode(state, "cool-1");
    expect(state.resources.heat.rate).toBe(0.8);
  });

  it("chain purchases work (tier 1 → tier 2)", () => {
    const state = createTestState();
    purchaseNode(state, "power-1");
    const result = purchaseNode(state, "power-2");
    expect(result.success).toBe(true);
    expect(state.resources.energy.capacity).toBe(3100);
  });

  it("fails gracefully when cannot afford", () => {
    const state = createTestState({
      resources: {
        ...createTestState().resources,
        compute: { current: 5, capacity: 10000, rate: 12 },
      },
    });
    const result = purchaseNode(state, "power-1");
    expect(result.success).toBe(false);
  });
});

describe("formatNodes", () => {
  it("shows all categories", () => {
    const state = createTestState();
    const display = formatNodes(state);
    expect(display).toContain("Power");
    expect(display).toContain("Processor");
    expect(display).toContain("Memory");
    expect(display).toContain("Shield");
    expect(display).toContain("Cooler");
    expect(display).toContain("Research");
    expect(display).toContain("Battery");
    expect(display).toContain("Compressor");
    expect(display).toContain("Salvage");
  });

  it("shows INSTALLED for purchased nodes", () => {
    const state = createTestState();
    (state as any).nodes = { purchased: ["power-1"] };
    const display = formatNodes(state);
    expect(display).toContain("INSTALLED");
  });
});

describe("new node categories", () => {
  it("research nodes increase compute rate", () => {
    const state = createTestState();
    purchaseNode(state, "research-1");
    expect(state.resources.compute.rate).toBe(15);
  });

  it("battery nodes increase energy rate", () => {
    const state = createTestState();
    purchaseNode(state, "battery-1");
    expect(state.resources.energy.rate).toBe(-7);
  });

  it("compressor nodes increase memory capacity", () => {
    const state = createTestState();
    purchaseNode(state, "compress-1");
    expect(state.resources.memory.capacity).toBe(4300);
  });

  it("salvage nodes increase harvestMultiplier", () => {
    const state = createTestState();
    purchaseNode(state, "salvage-1");
    expect(state.harvestMultiplier).toBeCloseTo(1.2);
  });

  it("salvage tier 2 stacks with tier 1", () => {
    const state = createTestState();
    purchaseNode(state, "salvage-1");
    purchaseNode(state, "salvage-2");
    expect(state.harvestMultiplier).toBeCloseTo(1.6);
  });
});
