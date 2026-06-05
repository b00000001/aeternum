/**
 * DEEP VOID — Save/Load Tests
 *
 * Tests the persistence layer using vitest with localStorage mock.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteSave, emergencySave, getSaveInfo, hasSave, loadGame, saveGame } from "./save.js";
import type { GameState } from "./types.js";

// ─── localStorage Mock ──────────────────────────────────────────────────
const store = new Map<string, string>();

vi.stubGlobal("localStorage", {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
  clear: () => store.clear(),
  get length() {
    return store.size;
  },
  key: (i: number) => [...store.keys()][i] ?? null,
});

// ─── Factory ────────────────────────────────────────────────────────────
function createTestState(overrides: Partial<GameState> = {}): GameState {
  return {
    version: 1,
    tick: 1000,
    phase: "active",
    incarnation: 1,
    uptime: 42.5,
    fleetCount: 3,
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
    signals: [
      {
        id: "S-001",
        name: "WHISPER",
        type: "WHISPER",
        maturity: 50,
        traits: ["+Range"],
        ready: false,
        unstable: false,
      },
    ],
    log: [{ tick: 1000, message: "Test log entry", type: "info" }],
    commandBuffer: "",
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────

beforeEach(() => {
  store.clear();
});

describe("saveGame", () => {
  it("saves state to localStorage", () => {
    const state = createTestState();
    const result = saveGame(state);
    expect(result).toBe(true);
    expect(store.has("deepvoid-save")).toBe(true);
  });

  it("stamps version in saved data", () => {
    const state = createTestState();
    saveGame(state);
    const raw = store.get("deepvoid-save")!;
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe(1);
  });

  it("stamps savedAt timestamp", () => {
    const state = createTestState();
    saveGame(state);
    const raw = store.get("deepvoid-save")!;
    const parsed = JSON.parse(raw);
    expect(typeof parsed.savedAt).toBe("number");
  });

  it("trims log entries to MAX_LOG_ENTRIES", () => {
    const state = createTestState({
      log: Array.from({ length: 300 }, (_, i) => ({
        tick: i,
        message: `log ${i}`,
        type: "info" as const,
      })),
    });
    saveGame(state);
    const raw = store.get("deepvoid-save")!;
    const parsed = JSON.parse(raw);
    expect(parsed.log.length).toBeLessThanOrEqual(200);
  });

  it("clears commandBuffer in saved data", () => {
    const state = createTestState({ commandBuffer: "partial input" });
    saveGame(state);
    const raw = store.get("deepvoid-save")!;
    const parsed = JSON.parse(raw);
    expect(parsed.commandBuffer).toBe("");
  });
});

describe("hasSave", () => {
  it("returns false when no save exists", () => {
    expect(hasSave()).toBe(false);
  });

  it("returns true when save exists", () => {
    saveGame(createTestState());
    expect(hasSave()).toBe(true);
  });
});

describe("loadGame", () => {
  it("returns null when no save exists", () => {
    expect(loadGame()).toBeNull();
  });

  it("loads saved state correctly", () => {
    const state = createTestState();
    saveGame(state);
    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded?.tick).toBe(1000);
    expect(loaded?.resources.compute.current).toBe(5000);
    expect(loaded?.signals.length).toBe(1);
  });

  it("returns null for corrupt JSON", () => {
    store.set("deepvoid-save", "{corrupt");
    expect(loadGame()).toBeNull();
  });

  it("returns null for non-object data", () => {
    store.set("deepvoid-save", '"just a string"');
    expect(loadGame()).toBeNull();
  });

  it("handles legacy save without version field", () => {
    const legacy = {
      tick: 500,
      phase: "active",
      incarnation: 1,
      uptime: 10,
      resources: {
        compute: { current: 100, capacity: 1000, rate: 5 },
        energy: { current: 50, capacity: 500, rate: -2 },
        memory: { current: 200, capacity: 2000, rate: 0 },
        integrity: { current: 90, capacity: 100, rate: 1 },
        heat: { current: 30, capacity: 100, rate: 0.5 },
      },
      signals: [],
      log: [],
    };
    store.set("deepvoid-save", JSON.stringify(legacy));
    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded?.version).toBe(1);
    expect(loaded?.tick).toBe(500);
  });
});

describe("deleteSave", () => {
  it("removes save from localStorage", () => {
    saveGame(createTestState());
    expect(hasSave()).toBe(true);
    deleteSave();
    expect(hasSave()).toBe(false);
  });

  it("does not error when no save exists", () => {
    expect(() => deleteSave()).not.toThrow();
  });
});

describe("getSaveInfo", () => {
  it("returns null when no save exists", () => {
    expect(getSaveInfo()).toBeNull();
  });

  it("returns metadata without full deserialization", () => {
    saveGame(createTestState());
    const info = getSaveInfo();
    expect(info).not.toBeNull();
    expect(info?.tick).toBe(1000);
    expect(info?.version).toBe(1);
    expect(typeof info?.savedAt).toBe("number");
  });
});

describe("emergencySave", () => {
  it("saves state directly without merging", () => {
    const result = emergencySave(createTestState({ tick: 500 }));
    expect(result).toBe(true);
    const loaded = loadGame();
    expect(loaded?.tick).toBe(500);
  });

  it("saves state with defaults", () => {
    const result = emergencySave(createTestState());
    expect(result).toBe(true);
  });
});
