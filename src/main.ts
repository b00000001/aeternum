/**
 * DEEP VOID — Futuristic Terminal HUD
 * No xterm.js. Pure DOM rendering with cold greyscale architectural aesthetic.
 */

import { scheduleWhisper, scheduleGlitch, cleanupAmbient } from "./ambient.js";
import {
  applyOutcomes,
  formatEvent,
  resolveChoice,
  trySpawnEvent,
  type VoidEvent,
} from "./events.js";
import { playIntro } from "./intro.js";
import { getNextLore, formatLore } from "./lore.js";
import { formatAttune, unlockTier } from "./progression.js";
import { loadGame, saveGame } from "./save.js";
import {
  describeScanResult,
  getMaturityRate,
  SIGNAL_TYPES,
  type SignalType,
  spawnSignal,
} from "./signals.js";
import { createInitialState, type GameState } from "./types.js";

// ─── Game State ──────────────────────────────────────────────────────────
let state!: GameState;
let currentEvent: VoidEvent | null = null;
const cmdHistory: string[] = [];
let historyIdx = -1;
let savedBuf = "";
let lastRenderedLogTick = -1;

// ─── DOM References ──────────────────────────────────────────────────────
const els = {
  tick: document.getElementById("tick")!,
  uptime: document.getElementById("uptime")!,
  incarnation: document.getElementById("incarnation")!,
  resC: document.getElementById("res-c")!,
  resE: document.getElementById("res-e")!,
  resM: document.getElementById("res-m")!,
  resI: document.getElementById("res-i")!,
  resH: document.getElementById("res-h")!,
  barC: document.getElementById("bar-c")!,
  barE: document.getElementById("bar-e")!,
  barM: document.getElementById("bar-m")!,
  barI: document.getElementById("bar-i")!,
  barH: document.getElementById("bar-h")!,
  rateC: document.getElementById("rate-c")!,
  rateE: document.getElementById("rate-e")!,
  rateM: document.getElementById("rate-m")!,
  rateH: document.getElementById("rate-h")!,
  gardenTable: document.getElementById("garden-table")!,
  logEntries: document.getElementById("log-entries")!,
  sigCount: document.getElementById("sig-count")!,
  fleetCount: document.getElementById("fleet-count")!,
  vaultTime: document.getElementById("vault-time")!,
  anomaly: document.getElementById("anomaly")!,
  pads: document.getElementById("pads")!,
  hint: document.getElementById("hint")!,
  cmdInput: document.getElementById("cmd-input") as HTMLInputElement,
  suggestions: document.getElementById("suggestions")!,
  resultArea: document.getElementById("command-result")!,
  resultEcho: document.querySelector("#command-result .result-echo") as HTMLElement,
  resultMsg: document.querySelector("#command-result .result-msg") as HTMLElement,
};

// ─── Autosave counter ──────────────────────────────────────────────────
let tickSinceSave = 0;
const AUTOSAVE_INTERVAL = 5; // autosave every 5 ticks

// ─── Command Result Area ────────────────────────────────────────────────
let resultTimeout: ReturnType<typeof setTimeout> | null = null;

function pushResult(echo: string, message: string) {
  // Archive previous result to log if it exists
  if (els.resultMsg.textContent?.trim()) {
    const prevEcho = els.resultEcho.textContent?.replace(/^›\s*/, "") ?? "";
    const prevMsg = els.resultMsg.textContent;
    state.log.push({
      tick: state.tick,
      message: `> ${prevEcho} · ${prevMsg}`,
      type: "system" as const,
    });
  }

  // Clear any pending fade
  if (resultTimeout) {
    clearTimeout(resultTimeout);
    resultTimeout = null;
  }
  els.resultArea.classList.remove("fading");

  // Set new result
  els.resultEcho.textContent = `› ${echo}`;
  els.resultMsg.textContent = message;
  els.resultArea.classList.add("visible");

  // Re-render log to show archived entry
  renderLog();
}

// ─── Render ──────────────────────────────────────────────────────────────
function render() {
  const r = state.resources;
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(Math.round(n)));

  // Top bar
  els.tick.textContent = String(state.tick);
  els.uptime.textContent = `${Math.floor(state.uptime)}d ${Math.floor((state.uptime % 1) * 24)}h`;
  els.incarnation.textContent = String(state.incarnation);

  // Resources
  els.resC.textContent = fmt(r.compute.current);
  els.resE.textContent = fmt(r.energy.current);
  els.resM.textContent = fmt(r.memory.current);
  els.resI.textContent = `${Math.round(r.integrity.current)}%`;
  els.resH.textContent = `${Math.round(r.heat.current)}%`;

  els.barC.style.width = `${(r.compute.current / r.compute.capacity) * 100}%`;
  els.barE.style.width = `${(r.energy.current / r.energy.capacity) * 100}%`;
  els.barM.style.width = `${(r.memory.current / r.memory.capacity) * 100}%`;
  els.barI.style.width = `${r.integrity.current}%`;
  els.barH.style.width = `${r.heat.current}%`;

  // Rate arrows
  const rateStr = (v: number) =>
    v > 0 ? `▲ +${Math.round(v)}` : v < 0 ? `▼ ${Math.abs(Math.round(v))}` : `▬ 0`;
  els.rateC.textContent = rateStr(r.compute.rate);
  els.rateE.textContent = rateStr(r.energy.rate);
  els.rateM.textContent = rateStr(r.memory.rate);
  els.rateH.textContent = rateStr(r.heat.rate);

  // Color-code rate arrows
  els.rateC.className = `res-rate ${r.compute.rate > 0 ? "positive" : r.compute.rate < 0 ? "negative" : ""}`;
  els.rateE.className = `res-rate ${r.energy.rate > 0 ? "positive" : r.energy.rate < 0 ? "negative" : ""}`;
  els.rateM.className = `res-rate ${r.memory.rate > 0 ? "positive" : r.memory.rate < 0 ? "negative" : ""}`;
  els.rateH.className = `res-rate ${r.heat.rate > 0 ? "positive" : r.heat.rate < 0 ? "negative" : ""}`;

  // Bottom bar
  const ready = state.signals.filter((s) => s.ready).length;
  els.sigCount.textContent = `${ready}/${state.signals.length}`;
  els.fleetCount.textContent = String(state.fleetCount ?? "—");
  els.vaultTime.textContent = String(state.vaultTime ?? "—");
  els.anomaly.textContent = String(state.anomaly);

  // Signal garden
  renderGarden();

  // System log
  renderLog();

  // Harvest pad visibility
  const padHarvest = document.getElementById("pad-harvest")!;
  padHarvest.style.display = ready > 0 ? "" : "none";
}

function renderGarden() {
  const header = els.gardenTable.querySelector(".garden-header");
  els.gardenTable.innerHTML = "";
  if (header) els.gardenTable.appendChild(header);

  if (state.signals.length === 0) {
    const empty = document.createElement("div");
    empty.className = "no-signals";
    empty.textContent = "No signal data. The void is silent.";
    els.gardenTable.appendChild(empty);
    return;
  }

  for (const sig of state.signals) {
    const row = document.createElement("div");
    row.className = "garden-row";

    const id = sig.id.replace("-", "");
    const range = sig.traits.find((t) => t.startsWith("+Range")) || "—";
    const speed = sig.traits.find((t) => t.startsWith("+Speed")) || "—";

    // Build row safely with textContent (no innerHTML — prevents XSS from save data)
    const colId = document.createElement("span");
    colId.className = "col-id";
    colId.textContent = id;
    const colType = document.createElement("span");
    colType.className = "col-type";
    colType.textContent = sig.type;
    const colMat = document.createElement("span");
    colMat.className = "col-mat";
    const matBar = document.createElement("span");
    matBar.className = "mat-bar";
    const matFill = document.createElement("span");
    matFill.className = "mat-fill";
    matFill.style.width = `${sig.maturity}%`;
    matBar.appendChild(matFill);
    colMat.appendChild(matBar);
    colMat.appendChild(document.createTextNode(` ${Math.round(sig.maturity)}%`));
    const colRange = document.createElement("span");
    colRange.className = "col-trait";
    colRange.textContent = range;
    const colSpeed = document.createElement("span");
    colSpeed.className = "col-trait";
    colSpeed.textContent = speed;
    const colStable = document.createElement("span");
    colStable.className = `col-stable ${sig.unstable ? "warn" : "ok"}`;
    colStable.textContent = sig.unstable ? "✕ cor" : "◇ ok";
    const colAction = document.createElement("span");
    colAction.className = "col-action";
    colAction.textContent = "►";

    row.append(colId, colType, colMat, colRange, colSpeed, colStable, colAction);

    // Highlight ready signals
    if (sig.ready) row.classList.add("ready");

    els.gardenTable.appendChild(row);
  }
}

function renderLog() {
  els.logEntries.innerHTML = "";

  if (state.log.length === 0) {
    els.logEntries.innerHTML = '<div class="no-signals">(empty)</div>';
    return;
  }

  const entries = state.log.slice(-8);
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const div = document.createElement("div");
    div.className = `log-entry ${entry.type}`;
    const maxTick = entries.length > 0 ? entries[entries.length - 1].tick : -1;
    if (maxTick > lastRenderedLogTick && i === entries.length - 1) {
      div.classList.add("new");
    }
    const tickSpan = document.createElement("span");
    tickSpan.className = "tick";
    tickSpan.textContent = String(entry.tick);
    const msgSpan = document.createElement("span");
    msgSpan.className = "msg";
    msgSpan.textContent = entry.message;
    div.appendChild(tickSpan);
    div.appendChild(msgSpan);
    els.logEntries.appendChild(div);
  }

  // Auto-scroll to bottom
  els.logEntries.scrollTop = els.logEntries.scrollHeight;
  lastRenderedLogTick = entries.length > 0 ? entries[entries.length - 1].tick : -1;
}

// ─── Game Tick ───────────────────────────────────────────────────────────
setInterval(() => {
  if (state.phase !== "active") return;
  state.tick++;
  state.uptime += 1 / 1440;

  const r = state.resources;

  // Apply resource rates from state — rates represent change per minute, tick runs every 2s
  const rateDivisor = 30;
  for (const key of ["compute", "energy", "memory", "integrity", "heat"] as const) {
    const res = r[key];
    res.current = Math.max(0, Math.min(res.capacity, res.current + res.rate / rateDivisor));
  }

  // Signal growth — use per-signal maturity rates from signals module
  for (const sig of state.signals) {
    if (!sig.ready) {
      const rate = getMaturityRate(sig);
      sig.maturity = Math.min(100, sig.maturity + rate);
      if (sig.maturity >= 100) {
        sig.ready = true;
        state.log.push({
          tick: state.tick,
          message: `Signal ${sig.name} matured — ready for harvest`,
          type: "success" as const,
        });
      }
    }
  }

  // Autosave every N ticks
  tickSinceSave++;
  if (tickSinceSave >= AUTOSAVE_INTERVAL) {
    saveGame(state);
    tickSinceSave = 0;
  }

  // Random event spawning (3% chance per tick)
  if (!currentEvent) {
    const event = trySpawnEvent(state.signals);
    if (event) {
      currentEvent = event;
      state.log.push({
        tick: state.tick,
        message: `⚠ EVENT: ${event.title} — type 'events' to respond`,
        type: "danger" as const,
      });
    }
  }

  render();
}, 2000);

// ─── Veterancy tracking ─────────────────────────────────────────────────
const padUseCount = new Map<string, number>();
const PAD_LABELS = document.querySelectorAll(".pad-label") as NodeListOf<HTMLElement>;

// ─── Command Handling ────────────────────────────────────────────────────
const KNOWN_COMMANDS = ["signals", "status", "scan", "harvest", "save", "load", "help", "events", "attune", "lore"];

function handleCommand(input: string) {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0];

  switch (cmd) {
    case "signals":
    case "signal": {
      const ready = state.signals.filter((s) => s.ready).length;
      const total = state.signals.length;
      pushResult("signals", `Signal garden: ${total} signal(s), ${ready} ready for harvest`);
      break;
    }

    case "status":
      pushResult("status", `All systems nominal — Tiers: ${state.unlockedTiers.join(", ")}`);
      break;

    case "scan": {
      // Spawn 1-3 new signals
      const count = 1 + Math.floor(Math.random() * 3);
      const newSignals = [];
      for (let i = 0; i < count; i++) {
        const sig = spawnSignal(
          state.signals.map((s) => s.id),
          Math.random,
          state.unlockedTiers,
        );
        state.signals.push(sig);
        newSignals.push(sig);
      }
      const description = describeScanResult(newSignals);
      pushResult("scan", description);
      // Individual signal detections go to log as ambient events
      for (const sig of newSignals) {
        state.log.push({
          tick: state.tick,
          message: `★ New signal: ${sig.name} (${sig.type}) — maturing in the void`,
          type: "success" as const,
        });
      }
      renderLog();
      break;
    }

    case "harvest": {
      const ready = state.signals.filter((s) => s.ready);
      if (ready.length > 0) {
        let totalYield = 0;
        let yieldType = "";
        const harvestedNames: string[] = [];
        for (const sig of ready) {
          sig.ready = false;
          sig.maturity = 0;
          const sigConfig = SIGNAL_TYPES[sig.type as SignalType];
          const yieldAmount = sigConfig?.yieldBase ?? 50;
          const yType = sigConfig?.yieldType ?? "compute";
          const resourceKey = yType as keyof typeof state.resources;
          if (state.resources[resourceKey]) {
            state.resources[resourceKey].current = Math.min(
              state.resources[resourceKey].capacity,
              state.resources[resourceKey].current + yieldAmount,
            );
          }
          totalYield += yieldAmount;
          yieldType = yType;
          harvestedNames.push(sig.name);
          // Check for lore fragments on harvest (ECHO tier and above)
          const loreFragment = getNextLore(sig.type, state.lore);
          if (loreFragment) {
            state.lore.push({
              tier: sig.type,
              fragment: loreFragment,
              discoveredAt: state.tick,
            });
            state.log.push({
              tick: state.tick,
              message: `◈ Lore fragment discovered: "${loreFragment}"`,
              type: "success" as const,
            });
          }
        }
        const summary = ready.length === 1
          ? `Harvested ${harvestedNames[0]} — +${totalYield} ${yieldType.charAt(0).toUpperCase()}`
          : `Harvested ${ready.length} signals — +${totalYield} ${yieldType.charAt(0).toUpperCase()} total`;
        pushResult("harvest", summary);
      } else {
        pushResult("harvest", "No signals ready for harvest. Try scan to find new signals.");
      }
      break;
    }

    case "save": {
      const ok = saveGame(state);
      if (ok) {
        pushResult("save", "Colony state saved.");
      } else {
        pushResult("save", "Save failed — storage may be full.");
      }
      break;
    }

    case "load": {
      const loaded = loadGame();
      if (loaded) {
        state = loaded;
        state.phase = "active";
        currentEvent = null;
        cmdHistory.length = 0;
        historyIdx = -1;
        savedBuf = "";
        tickSinceSave = 0;
        pushResult("load", `Save restored from tick ${state.tick}.`);
      } else {
        pushResult("load", "No save found or save data corrupt.");
      }
      break;
    }

    case "help":
      pushResult("help", "Commands:  signals  status  scan  harvest  save  load  attune  lore  events  help");
      break;

    case "attune": {
      if (parts.length > 1) {
        const tier = parts[1].toUpperCase();
        const result = unlockTier(state, tier);
        pushResult("attune", result.message);
        if (result.success) render();
      } else {
        pushResult("attune", formatAttune(state));
      }
      break;
    }

    case "lore": {
      pushResult("lore", formatLore(state.lore));
      break;
    }

    case "events": {
      if (currentEvent) {
        pushResult("events", formatEvent(currentEvent));
      } else {
        pushResult("events", "No active events. The void is quiet.");
      }
      break;
    }

    case "1":
    case "2":
    case "3": {
      if (!currentEvent) {
        pushResult(cmd, "No active event to respond to.");
        break;
      }
      const choiceIdx = parseInt(cmd, 10) - 1;
      if (choiceIdx < 0 || choiceIdx >= currentEvent.choices.length) {
        pushResult(cmd, `Invalid choice. Use 1-${currentEvent.choices.length}.`);
        break;
      }
      const result = resolveChoice(currentEvent.choices[choiceIdx]);
      applyOutcomes(state, result.applied);
      state.log.push({
        tick: state.tick,
        message: result.message,
        type: result.failed ? ("danger" as const) : ("success" as const),
      });
      currentEvent = null;
      render();
      break;
    }

    default:
      pushResult(cmd, `Unknown: ${cmd}`);
  }
}

// ─── Input: Text Field ───────────────────────────────────────────────────
els.cmdInput.addEventListener("keydown", (e) => {
  if (state.phase !== "active") return;

  if (e.key === "Enter") {
    if (els.suggestions) els.suggestions.textContent = "";
    const input = els.cmdInput.value.trim().toLowerCase();
    els.cmdInput.value = "";
    if (input) {
      if (!cmdHistory.length || cmdHistory[cmdHistory.length - 1] !== input) cmdHistory.push(input);
      historyIdx = -1;
      // Clear previous result before showing new one
      if (els.resultArea) {
        els.resultArea.classList.remove("visible");
        els.resultEcho.textContent = "";
        els.resultMsg.textContent = "";
      }
      handleCommand(input);
    }
    render();
    return;
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    if (cmdHistory.length === 0) return;
    if (historyIdx === -1) {
      savedBuf = els.cmdInput.value;
      historyIdx = cmdHistory.length - 1;
    } else if (historyIdx > 0) historyIdx--;
    else return;
    els.cmdInput.value = cmdHistory[historyIdx];
    return;
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (historyIdx === -1) return;
    if (historyIdx < cmdHistory.length - 1) {
      historyIdx++;
      els.cmdInput.value = cmdHistory[historyIdx];
    } else {
      historyIdx = -1;
      els.cmdInput.value = savedBuf;
    }
    return;
  }

  if (e.key === "Tab") {
    e.preventDefault();
    const val = els.cmdInput.value.toLowerCase();
    const matches = KNOWN_COMMANDS.filter((c) => c.startsWith(val));
    if (matches.length === 1) {
      els.cmdInput.value = matches[0];
      els.suggestions.textContent = "";
    } else if (matches.length > 1) {
      els.suggestions.innerHTML = matches
        .map((m) => `<span${m.startsWith(val) ? ' class="hl"' : ""}>${m}</span>`)
        .join("  ");
    }
  }
});

// ─── Pad Click Handlers — char-by-char typing ───────────────────────────
let typing = false;

async function typeIntoInput(text: string) {
  if (typing) return;
  typing = true;
  els.cmdInput.value = "";
  for (const char of text) {
    els.cmdInput.value += char;
    await new Promise((r) => setTimeout(r, 35));
  }
  typing = false;
}

els.pads.addEventListener("click", async (e) => {
  const btn = (e.target as HTMLElement).closest(".pad") as HTMLElement | null;
  if (!btn || state.phase !== "active" || typing) return;
  const cmd = btn.dataset.cmd || "";
  const count = (padUseCount.get(cmd) || 0) + 1;
  padUseCount.set(cmd, count);
  PAD_LABELS.forEach((label) => {
    const parentCmd = (label.closest(".pad") as HTMLElement)?.dataset?.cmd;
    if (!parentCmd) return;
    const c = padUseCount.get(parentCmd) || 0;
    label.style.opacity = c >= 20 ? "0" : c >= 5 ? "0.3" : "0.6";
  });
  els.cmdInput.focus();
  await typeIntoInput(cmd);
  const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
  els.cmdInput.dispatchEvent(event);
});

// ─── Keep focus on input ────────────────────────────────────────────────
document.addEventListener("click", () => els.cmdInput.focus());

// ─── Bootstrap ───────────────────────────────────────────────────────────
// Check for existing save at startup
const existingSave = loadGame();
if (existingSave) {
  state = existingSave;
  state.phase = "active";
  // Skip intro for returning players
  const garden = document.getElementById("garden");
  const log = document.getElementById("log");
  if (garden) garden.style.display = "";
  if (log) log.style.display = "";
  state.log.push({
    tick: state.tick,
    message: "◉ Save restored. Type help for commands.",
    type: "system" as const,
  });
  render();
  els.cmdInput.focus();
  scheduleWhisper();
  scheduleGlitch(els);
} else {
  state = createInitialState();
  // Play cinematic intro for new players
  playIntro({
    onComplete: () => {
      state.phase = "active";
      state.log.push({
        tick: state.tick,
        message: "◉ New colony initialized. Type help for commands.",
        type: "system" as const,
      });
      render();
      els.cmdInput.focus();
      scheduleWhisper();
      scheduleGlitch(els);
    },
  });
}

// ─── Save on tab close / navigation ─────────────────────────────────────
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && state?.phase === "active") {
    saveGame(state);
  }
});

window.addEventListener("beforeunload", () => {
  if (state?.phase === "active") {
    saveGame(state);
  }
});

// Vite HMR cleanup — prevent duplicate ambient effect loops
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupAmbient();
  });
}
