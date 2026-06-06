import { describe, expect, it } from "vitest";
import { PoolGenerator } from "../pool.js";

describe("PoolGenerator", () => {
  const pool = new PoolGenerator();

  it("isAvailable returns true", () => {
    expect(pool.isAvailable()).toBe(true);
  });

  it("generateSignalName returns a string for each type", async () => {
    for (const type of ["WHISPER", "ECHO", "PULSE", "DRIFT", "FLARE", "ANOMALY"]) {
      const name = await pool.generateSignalName(type);
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it("generateSignalName handles unknown type", async () => {
    const name = await pool.generateSignalName("FAKE");
    expect(name).toContain("Unknown");
  });

  it("generateSignalDescription returns a string", async () => {
    const desc = await pool.generateSignalDescription("WHISPER");
    expect(desc.length).toBeGreaterThan(10);
  });

  it("generateLore returns fragments for known tiers", async () => {
    for (const tier of ["WHISPER", "ECHO", "PULSE", "DRIFT", "FLARE", "ANOMALY"]) {
      const lore = await pool.generateLore(tier, "");
      expect(lore.length).toBeGreaterThan(5);
    }
  });

  it("generateWhisper returns a non-empty string", async () => {
    const whisper = await pool.generateWhisper();
    expect(whisper.length).toBeGreaterThan(5);
  });

  it("generateEventDescription returns text for known events", async () => {
    const desc = await pool.generateEventDescription("Power Surge");
    expect(desc.length).toBeGreaterThan(10);
  });

  it("generateEventDescription handles unknown event", async () => {
    const desc = await pool.generateEventDescription("Unknown Event");
    expect(desc).toContain("Unknown Event");
  });
});
