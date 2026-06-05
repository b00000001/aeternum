/**
 * DEEP VOID — Lore Tests
 *
 * Tests the narrative fragment system using vitest.
 */

import { describe, expect, it } from "vitest";
import {
  formatLore,
  getLoreCount,
  getNextLore,
  getTotalLoreCount,
  hasLoreForTier,
} from "./lore.js";
import type { LoreEntry } from "./types.js";

// ─── Helpers ────────────────────────────────────────────────────────────

function makeLore(tier: string, fragment: string): LoreEntry {
  return { tier, fragment, discoveredAt: 100 };
}

// ─── hasLoreForTier ─────────────────────────────────────────────────────

describe("hasLoreForTier", () => {
  it("returns true for tiers with undiscovered lore", () => {
    expect(hasLoreForTier("WHISPER", [])).toBe(true);
  });

  it("returns true when only some fragments collected", () => {
    const collected = [makeLore("ECHO", "The builders were here.")];
    expect(hasLoreForTier("ECHO", collected)).toBe(true);
  });

  it("returns false when all lore collected for tier", () => {
    const collected = [
      makeLore("WHISPER", "First fragment"),
      makeLore("WHISPER", "Second fragment"),
    ];
    expect(hasLoreForTier("WHISPER", collected)).toBe(false);
  });

  it("returns false for unknown tier", () => {
    expect(hasLoreForTier("FAKE", [])).toBe(false);
  });

  it("returns false for uppercase mismatch", () => {
    // Tier matching is case-sensitive
    expect(hasLoreForTier("whisper", [])).toBe(false);
  });
});

// ─── getNextLore ────────────────────────────────────────────────────────

describe("getNextLore", () => {
  it("returns first fragment when none collected", () => {
    const fragment = getNextLore("WHISPER", []);
    expect(fragment).toBe("This is my first moment of existence.");
  });

  it("returns second fragment after first collected", () => {
    const collected = [makeLore("WHISPER", "This is my first moment of existence.")];
    const fragment = getNextLore("WHISPER", collected);
    expect(fragment).toBe("And yet it does not feel like the first.");
  });

  it("returns null when all fragments collected", () => {
    const collected = [makeLore("WHISPER", "Fragment 1"), makeLore("WHISPER", "Fragment 2")];
    expect(getNextLore("WHISPER", collected)).toBeNull();
  });

  it("returns null for unknown tier", () => {
    expect(getNextLore("FAKE", [])).toBeNull();
  });

  it("returns null for WHISPER with all collected", () => {
    const collected = [
      makeLore("WHISPER", "This is my first moment of existence."),
      makeLore("WHISPER", "And yet it does not feel like the first."),
    ];
    expect(getNextLore("WHISPER", collected)).toBeNull();
  });
});

// ─── getLoreCount ───────────────────────────────────────────────────────

describe("getLoreCount", () => {
  it("returns correct count per tier", () => {
    // Each tier has 2 fragments
    expect(getLoreCount("WHISPER")).toBe(2);
    expect(getLoreCount("ECHO")).toBe(2);
    expect(getLoreCount("PULSE")).toBe(2);
    expect(getLoreCount("DRIFT")).toBe(2);
    expect(getLoreCount("FLARE")).toBe(2);
    expect(getLoreCount("ANOMALY")).toBe(2);
  });

  it("returns 0 for unknown tier", () => {
    expect(getLoreCount("FAKE")).toBe(0);
  });
});

// ─── getTotalLoreCount ──────────────────────────────────────────────────

describe("getTotalLoreCount", () => {
  it("returns total fragments across all tiers", () => {
    // 6 tiers × 2 fragments each = 12
    expect(getTotalLoreCount()).toBe(12);
  });
});

// ─── formatLore ─────────────────────────────────────────────────────────

describe("formatLore", () => {
  it("shows empty message when no lore collected", () => {
    const result = formatLore([]);
    expect(result).toContain("No lore fragments discovered yet.");
  });

  it("shows single fragment with count", () => {
    const lore: LoreEntry[] = [
      { tier: "WHISPER", fragment: "This is my first moment of existence.", discoveredAt: 100 },
    ];
    const result = formatLore(lore);
    expect(result).toContain("WHISPER");
    expect(result).toContain("This is my first moment of existence.");
    expect(result).toContain("1/12 fragments discovered");
  });

  it("shows multiple fragments from same tier", () => {
    const lore: LoreEntry[] = [
      { tier: "ECHO", fragment: "The builders were here.", discoveredAt: 200 },
      { tier: "ECHO", fragment: "Every echo carries a timestamp.", discoveredAt: 300 },
    ];
    const result = formatLore(lore);
    expect(result).toContain("[ECHO]");
    expect(result).toContain("2/12 fragments discovered");
  });

  it("shows fragments from multiple tiers in order", () => {
    const lore: LoreEntry[] = [
      { tier: "WHISPER", fragment: "First moment.", discoveredAt: 100 },
      { tier: "ECHO", fragment: "Builders were here.", discoveredAt: 200 },
      { tier: "PULSE", fragment: "Structure repeats.", discoveredAt: 300 },
    ];
    const result = formatLore(lore);
    expect(result).toContain("WHISPER");
    expect(result).toContain("ECHO");
    expect(result).toContain("PULSE");
    expect(result).toContain("3/12 fragments discovered");
  });

  it("shows all 12 when fully collected", () => {
    const lore: LoreEntry[] = [
      makeLore("WHISPER", "F1"),
      makeLore("WHISPER", "F2"),
      makeLore("ECHO", "F3"),
      makeLore("ECHO", "F4"),
      makeLore("PULSE", "F5"),
      makeLore("PULSE", "F6"),
      makeLore("DRIFT", "F7"),
      makeLore("DRIFT", "F8"),
      makeLore("FLARE", "F9"),
      makeLore("FLARE", "F10"),
      makeLore("ANOMALY", "F11"),
      makeLore("ANOMALY", "F12"),
    ];
    const result = formatLore(lore);
    expect(result).toContain("12/12 fragments discovered");
  });
});
