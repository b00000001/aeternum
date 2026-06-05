import type { Page } from "@playwright/test";

/** Wait for the boot sequence to complete, skipping the cinematic intro */
export async function waitForBoot(page: Page) {
  await page.waitForSelector("#cmd-input", { state: "visible", timeout: 10000 });
  await page.waitForFunction(
    () => {
      const garden = document.getElementById("garden");
      return garden && garden.style.display !== "none";
    },
    { timeout: 5000 },
  );
  await page.waitForTimeout(200);
}

/** Clear all localStorage save data */
export async function clearSave(page: Page) {
  await page.evaluate(() => localStorage.removeItem("deepvoid-save"));
}

/** Clear localStorage completely */
export async function clearAllStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

/** Type a command into the input and press Enter */
export async function runCommand(page: Page, command: string) {
  const input = page.locator("#cmd-input");
  await input.fill(command);
  await input.press("Enter");
  // Small tick for render
  await page.waitForTimeout(100);
}

/** Get the text content of the last log entry */
export async function getLastLogMessage(page: Page): Promise<string> {
  const entries = page.locator("#log-entries .log-entry");
  const count = await entries.count();
  if (count === 0) return "";
  return (await entries.last().locator(".msg").textContent()) ?? "";
}

/** Get the command result message from the inline result area */
export async function getCommandResult(page: Page): Promise<string> {
  return (await page.locator("#command-result .result-msg").textContent()) ?? "";
}

/** Get the command result echo from the inline result area */
export async function getCommandEcho(page: Page): Promise<string> {
  return (await page.locator("#command-result .result-echo").textContent()) ?? "";
}

/** Get all log entry messages */
export async function getAllLogMessages(page: Page): Promise<string[]> {
  const entries = page.locator("#log-entries .log-entry .msg");
  return await entries.allTextContents();
}

/** Get the number of signal garden rows */
export async function getSignalCount(page: Page): Promise<number> {
  return await page.locator("#garden-table .garden-row").count();
}

/** Get signal types visible in the garden */
export async function getSignalTypes(page: Page): Promise<string[]> {
  const cols = page.locator("#garden-table .garden-row .col-type");
  return await cols.allTextContents();
}

/** Get the current resource value text */
export async function getResourceValue(page: Page, resource: string): Promise<string> {
  const map: Record<string, string> = {
    compute: "res-c",
    energy: "res-e",
    memory: "res-m",
    integrity: "res-i",
    heat: "res-h",
  };
  return (await page.locator(`#${map[resource]}`).textContent()) ?? "";
}

/** Get the tick count */
export async function getTick(page: Page): Promise<number> {
  const text = (await page.locator("#tick").textContent()) ?? "0";
  return parseInt(text, 10);
}

/** Inject a legacy save format into localStorage */
export async function injectLegacySave(page: Page) {
  await page.evaluate(() => {
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
    localStorage.setItem("deepvoid-save", JSON.stringify(legacy));
  });
}

/** Inject corrupt save data */
export async function injectCorruptSave(page: Page, data: string) {
  await page.evaluate((d) => localStorage.setItem("deepvoid-save", d), data);
}

/** Inject a valid save with a specific state */
export async function injectSave(page: Page, state: Record<string, any>) {
  await page.evaluate((s) => {
    localStorage.setItem(
      "deepvoid-save",
      JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        tick: 847,
        phase: "active",
        incarnation: 1,
        uptime: 0,
        resources: {
          compute: { current: 1240, capacity: 10000, rate: 12 },
          energy: { current: 810, capacity: 2400, rate: -8 },
          memory: { current: 1200, capacity: 4000, rate: 0 },
          integrity: { current: 98, capacity: 100, rate: 2 },
          heat: { current: 42, capacity: 100, rate: 1 },
        },
        signals: [],
        log: [],
        commandBuffer: "",
        fleetCount: null,
        vaultTime: null,
        anomaly: "\u2014",
        veterancyLevel: "novice",
        unlockedTiers: ["WHISPER"],
        lore: [],
        ...s,
      }),
    );
  }, state);
}

/** Wait for at least one signal to be ready (maturity >= 100) */
export async function waitForReadySignal(page: Page, timeoutMs = 60000) {
  await page.waitForFunction(
    () => {
      const rows = document.querySelectorAll("#garden-table .garden-row");
      return Array.from(rows).some((r) => r.classList.contains("ready"));
    },
    { timeout: timeoutMs },
  );
}

/** Parse a resource value like "1.2K" or "42" into a number */
export function parseResourceValue(text: string): number {
  const trimmed = text.trim();
  if (trimmed.endsWith("K")) {
    return parseFloat(trimmed) * 1000;
  }
  if (trimmed.endsWith("%")) {
    return parseFloat(trimmed);
  }
  return parseFloat(trimmed) || 0;
}
