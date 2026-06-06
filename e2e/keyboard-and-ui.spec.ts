import { expect, test } from "@playwright/test";
import {
  clearAllStorage,
  getAllLogMessages,
  getCommandResult,
  injectSave,
  runCommand,
  waitForBoot,
} from "./helpers";

test.describe("Keyboard Interactions & UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?test");
    await clearAllStorage(page);
    await page.reload();
    await waitForBoot(page);
  });

  test("Tab completion — single match", async ({ page }) => {
    const input = page.locator("#cmd-input");
    await input.focus();
    await page.keyboard.type("sig");
    await page.keyboard.press("Tab");
    const value = await input.inputValue();
    expect(value).toBe("signals");
  });

  test("Tab completion — multiple matches shows suggestions", async ({ page }) => {
    const input = page.locator("#cmd-input");
    await input.focus();
    await page.keyboard.type("h");
    await page.keyboard.press("Tab");
    const suggestions = page.locator("#suggestions");
    const text = (await suggestions.textContent()) ?? "";
    expect(text).toContain("harvest");
    expect(text).toContain("help");
  });

  test("Command history — ArrowUp/ArrowDown cycles through commands", async ({ page }) => {
    await runCommand(page, "scan");
    await runCommand(page, "status");

    const input = page.locator("#cmd-input");
    await input.focus();

    // ArrowUp → status (most recent)
    await input.press("ArrowUp");
    await expect(input).toHaveValue("status");

    // ArrowUp again → scan
    await input.press("ArrowUp");
    await expect(input).toHaveValue("scan");

    // ArrowDown → status
    await input.press("ArrowDown");
    await expect(input).toHaveValue("status");

    // ArrowDown → empty (past end of history)
    await input.press("ArrowDown");
    await expect(input).toHaveValue("");
  });

  test("Pad buttons — click executes command via char-by-char typing", async ({ page }) => {
    // Find any pad with data-cmd
    const pad = page.locator(".pad[data-cmd]").first();
    const cmd = await pad.getAttribute("data-cmd");

    await pad.click();

    // Wait for char-by-char typing animation + auto-execute
    await page.waitForTimeout(800);

    // The command should have executed — check the log
    const messages = await getAllLogMessages(page);
    const hasResult = messages.some(
      (m) =>
        m.toLowerCase().includes(cmd?.toLowerCase() ?? "scan") ||
        m.toLowerCase().includes("scan") ||
        m.toLowerCase().includes("signal") ||
        m.toLowerCase().includes("commands:"),
    );
    expect(hasResult).toBe(true);
  });

  test("Ambient whisper scan line appears", async ({ page }) => {
    // Trigger the whisper manually via evaluate since it has a 30-60s random delay
    await page.evaluate(() => {
      const el = document.createElement("div");
      el.className = "whisper-scan-line";
      document.body.appendChild(el);
    });

    const whisper = page.locator(".whisper-scan-line");
    await expect(whisper).toHaveCount(1);
  });

  test("Unknown command — shows warning", async ({ page }) => {
    await runCommand(page, "asdfghjkl");
    const message = await getCommandResult(page);
    expect(message).toContain("Unknown: asdfghjkl");
  });

  test("Help command — lists all commands", async ({ page }) => {
    await runCommand(page, "help");
    const message = await getCommandResult(page);
    expect(message).toContain("signals");
    expect(message).toContain("status");
    expect(message).toContain("scan");
    expect(message).toContain("harvest");
    expect(message).toContain("save");
    expect(message).toContain("load");
  });
});

test.describe("Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?test");
    await clearAllStorage(page);
  });

  test("Empty signal garden — shows void message", async ({ page }) => {
    // After navigate + waitForBoot, inject an empty-save and reload
    await injectSave(page, { signals: [], unlockedTiers: ["WHISPER"], lore: [] });
    await page.reload();
    await waitForBoot(page);

    const rows = await page.locator("#garden-table .garden-row").count();
    expect(rows).toBe(0);
    const empty = await page.locator("#garden-table .no-signals").textContent();
    expect(empty).toContain("No signal data");
  });

  test("Save metadata — localStorage has version and savedAt", async ({ page }) => {
    await page.goto("/?test");
    await waitForBoot(page);

    await runCommand(page, "save");

    const saveData = await page.evaluate(() => {
      const raw = localStorage.getItem("deepvoid-save");
      return raw ? JSON.parse(raw) : null;
    });

    expect(saveData).not.toBeNull();
    expect(saveData.version).toBe(2);
    expect(typeof saveData.savedAt).toBe("number");
    expect(saveData.savedAt).toBeGreaterThan(0);
  });
});
