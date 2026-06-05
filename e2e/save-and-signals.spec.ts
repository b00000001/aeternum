/**
 * DEEP VOID — Save/Load & Signal E2E Tests
 *
 * Tests persistence (manual/auto save, load, migration) and signal mechanics
 * (scanning, maturity, harvest yields).
 *
 * Each test clears localStorage in beforeEach for isolation.
 */
import { expect, test } from "@playwright/test";
import {
  clearAllStorage,
  getAllLogMessages,
  getCommandResult,
  getResourceValue,
  getSignalCount,
  getSignalTypes,
  getTick,
  injectCorruptSave,
  injectLegacySave,
  injectSave,
  parseResourceValue,
  runCommand,
  waitForBoot,
} from "./helpers.js";

// ─── Hooks ──────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  await page.goto("/?test");
  await clearAllStorage(page);
  await page.reload();
  await waitForBoot(page);
});

// ─── Test 1: Manual Save + Refresh ──────────────────────────────────────

test("Manual save + refresh preserves state", async ({ page }) => {
  const initialTick = await getTick(page);
  await runCommand(page, "save");
  const saveMsg = await getCommandResult(page);
  expect(saveMsg).toContain("Colony state saved.");
  await page.reload();
  await waitForBoot(page);
  const bodyText = await page.locator("body").textContent();
  expect(bodyText).toContain("Save restored");
  const restoredTick = await getTick(page);
  expect(restoredTick).toBeGreaterThanOrEqual(initialTick);
  const signalCount = await getSignalCount(page);
  expect(signalCount).toBeGreaterThanOrEqual(1);
});

// ─── Test 2: Autosave + Refresh ─────────────────────────────────────────

test("Autosave preserves state for refresh", async ({ page }) => {
  await page.waitForTimeout(15000);
  const tickBeforeReload = await getTick(page);
  expect(tickBeforeReload).toBeGreaterThan(847);
  await page.reload();
  await waitForBoot(page);
  const restoredTick = await getTick(page);
  expect(restoredTick).toBeGreaterThanOrEqual(tickBeforeReload - 5);
  const bodyText = await page.locator("body").textContent();
  expect(bodyText).toContain("Save restored");
});

// ─── Test 3: Manual Load Reverts ────────────────────────────────────────

test("load reverts to last saved state", async ({ page }) => {
  const initialTick = await getTick(page);
  await runCommand(page, "save");
  await page.waitForTimeout(6000);
  const tickAfterWait = await getTick(page);
  expect(tickAfterWait).toBeGreaterThan(initialTick);
  await runCommand(page, "load");
  const loadMsg = await getCommandResult(page);
  expect(loadMsg).toContain("Save restored from tick");
  const restoredTick = await getTick(page);
  expect(restoredTick).toBeLessThanOrEqual(tickAfterWait);
});

// ─── Test 4: No Save Gracefully ─────────────────────────────────────────

test("fresh boot when no save exists, load warns", async ({ page }) => {
  // The welcome splash is removed after boot; check the log for the init message
  const logMessages = await getAllLogMessages(page);
  const initMsg = logMessages.some(
    (m) => m.includes("COLONIAL AI INITIALIZED") || m.includes("New colony initialized"),
  );
  expect(initMsg).toBe(true);
  await runCommand(page, "load");
  const msg = await getCommandResult(page);
  expect(msg).toContain("No save found");
});

// ─── Test 5: Scan Spawns Signals ────────────────────────────────────────

test("scan increases signal count and reports results", async ({ page }) => {
  const initialCount = await getSignalCount(page);
  expect(initialCount).toBe(1);
  await runCommand(page, "scan");
  const result = await getCommandResult(page);
  expect(result.length).toBeGreaterThan(0);
  const newCount = await getSignalCount(page);
  expect(newCount).toBeGreaterThanOrEqual(2);
  expect(newCount).toBeLessThanOrEqual(4);
});

// ─── Test 6: Signal Variety ─────────────────────────────────────────────

test("produces multiple signal types after repeated scans", async ({ page }) => {
  for (let i = 0; i < 10; i++) {
    await runCommand(page, "scan");
    await page.waitForTimeout(200);
  }
  const types = await getSignalTypes(page);
  const uniqueTypes = new Set(types.map((t) => t.trim()));
  expect(uniqueTypes.size).toBeGreaterThanOrEqual(2);
});

// ─── Test 7: Signal Maturity Over Time ──────────────────────────────────

test("signal becomes ready when maturity reaches 100%", async ({ page }) => {
  await injectSave(page, {
    tick: 850,
    phase: "active",
    incarnation: 1,
    uptime: 5,
    resources: {
      compute: { current: 1240, capacity: 10000, rate: 12 },
      energy: { current: 810, capacity: 2400, rate: -8 },
      memory: { current: 1200, capacity: 4000, rate: 0 },
      integrity: { current: 98, capacity: 100, rate: 2 },
      heat: { current: 42, capacity: 100, rate: 1 },
    },
    signals: [
      {
        id: "S-001",
        name: "Silent whisper",
        type: "WHISPER",
        maturity: 99.5,
        traits: ["+Range", "+Speed"],
        ready: false,
        unstable: false,
      },
    ],
    log: [{ tick: 850, message: "Test start", type: "info" }],
    commandBuffer: "",
    fleetCount: null,
    vaultTime: null,
    anomaly: "—",
    veterancyLevel: "novice",
  });
  await page.reload();
  await waitForBoot(page);
  await page.waitForFunction(
    () => {
      const rows = document.querySelectorAll("#garden-table .garden-row");
      return Array.from(rows).some((r) => r.classList.contains("ready"));
    },
    { timeout: 10000 },
  );
  const logMessages = await getAllLogMessages(page);
  const matureMessages = logMessages.filter((m) => m.includes("matured"));
  expect(matureMessages.length).toBeGreaterThanOrEqual(1);
});

// ─── Test 8: Harvest Yields Correct Amount ──────────────────────────────

test("WHISPER harvest gives +50 compute", async ({ page }) => {
  await injectSave(page, {
    tick: 850,
    phase: "active",
    incarnation: 1,
    uptime: 5,
    resources: {
      compute: { current: 1000, capacity: 10000, rate: 12 },
      energy: { current: 810, capacity: 2400, rate: -8 },
      memory: { current: 1200, capacity: 4000, rate: 0 },
      integrity: { current: 98, capacity: 100, rate: 2 },
      heat: { current: 42, capacity: 100, rate: 1 },
    },
    signals: [
      {
        id: "S-001",
        name: "Silent whisper",
        type: "WHISPER",
        maturity: 100,
        traits: ["+Range"],
        ready: true,
        unstable: false,
      },
    ],
    log: [{ tick: 850, message: "Ready for harvest", type: "info" }],
    commandBuffer: "",
    fleetCount: null,
    vaultTime: null,
    anomaly: "—",
    veterancyLevel: "novice",
  });
  await page.reload();
  await waitForBoot(page);
  const computeBefore = parseResourceValue(await getResourceValue(page, "compute"));
  await runCommand(page, "harvest");
  const harvestMsg = await getCommandResult(page);
  expect(harvestMsg).toContain("+50");
  expect(harvestMsg).toContain("C");
  // Compute ticks at +12/2s between reads — just verify it increased and log confirms +50
  const computeAfter = parseResourceValue(await getResourceValue(page, "compute"));
  expect(computeAfter).toBeGreaterThan(computeBefore);
});

// ─── Test 9: Harvest When Nothing Ready ─────────────────────────────────

test("shows warning when no signals are ready", async ({ page }) => {
  await runCommand(page, "harvest");
  const msg = await getCommandResult(page);
  expect(msg).toContain("No signals ready for harvest");
  await runCommand(page, "scan");
  await runCommand(page, "harvest");
  const msg2 = await getCommandResult(page);
  expect(msg2).toContain("No signals ready for harvest");
});

// ─── Test 10: Legacy Save Migration ─────────────────────────────────────

test("loads v0 save and migrates to v1", async ({ page }) => {
  await injectLegacySave(page);
  await page.reload();
  await waitForBoot(page);
  const bodyText = await page.locator("body").textContent();
  expect(bodyText).toContain("Save restored");
  const tick = await getTick(page);
  expect(tick).toBe(500);
  const compute = parseResourceValue(await getResourceValue(page, "compute"));
  expect(compute).toBe(100);
});

// ─── Test 11: Corrupt Save Handling ─────────────────────────────────────

test("boots fresh when save data is corrupt JSON", async ({ page }) => {
  await injectCorruptSave(page, "{broken");
  await page.reload();
  await waitForBoot(page);
  const bodyText = await page.locator("body").textContent();
  expect(bodyText).not.toContain("Save restored");
  const tick = await getTick(page);
  expect(tick).toBe(847);
  const signalCount = await getSignalCount(page);
  expect(signalCount).toBe(1);
});

test("boots fresh when save data is non-object", async ({ page }) => {
  await injectCorruptSave(page, '"just a string"');
  await page.reload();
  await waitForBoot(page);
  const bodyText = await page.locator("body").textContent();
  expect(bodyText).not.toContain("Save restored");
  const tick = await getTick(page);
  expect(tick).toBe(847);
});
