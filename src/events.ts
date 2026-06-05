/**
 * DEEP VOID — Events System
 *
 * Handles the spawning, display, and resolution of void events.
 * Events are hand-crafted scenarios with multiple choices and risk outcomes.
 * They trigger randomly during game ticks based on the player's signal count.
 */

import type { GameState, SignalEntry } from "./types.js";

// ─── Types ──────────────────────────────────────────────────────────────

export interface EventOutcomes {
  compute: number;
  energy: number;
  memory: number;
  integrity: number;
  heat: number;
}

export interface EventChoice {
  label: string;
  outcomes: EventOutcomes;
  message: string;
  risk: number;
}

export interface VoidEvent {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
  minSignals: number;
  rarity: number;
}

// ─── Event Pool ─────────────────────────────────────────────────────────

let _eventPool: VoidEvent[] | null = null;

export function loadEventPool(): VoidEvent[] {
  if (_eventPool) return _eventPool;
  _eventPool = [
    {
      id: "signal-fragmentation",
      title: "Signal Fragmentation",
      description:
        "A mature signal is splitting into multiple fragments. You can harvest now for a guaranteed gain, or wait for the fragments to mature independently.",
      choices: [
        {
          label: "Harvest now",
          outcomes: { compute: 40, energy: 0, memory: 10, integrity: 0, heat: 0 },
          message: "Fragments collected. Data integrity: partial. 40C recovered.",
          risk: 0.0,
        },
        {
          label: "Let fragments grow",
          outcomes: { compute: 0, energy: -15, memory: 0, integrity: 0, heat: 5 },
          message: "Fragments maturing. Energy diverted to containment fields.",
          risk: 0.1,
        },
      ],
      minSignals: 0,
      rarity: 0.12,
    },
    {
      id: "void-echo",
      title: "Void Echo",
      description:
        "A faint echo from a distant sector resonates through the signal band. Data fragments are coalescing in an unexpected pattern.",
      choices: [
        {
          label: "Analyze pattern",
          outcomes: { compute: -30, energy: 0, memory: 80, integrity: -2, heat: 10 },
          message: "Pattern analysis complete. Echo data decoded: +80M.",
          risk: 0.0,
        },
        {
          label: "Redirect to storage",
          outcomes: { compute: 0, energy: -10, memory: 30, integrity: 0, heat: 0 },
          message: "Echo routed to cold storage. 30M archived.",
          risk: 0.0,
        },
      ],
      minSignals: 0,
      rarity: 0.12,
    },
    {
      id: "power-surge",
      title: "Power Surge",
      description:
        "A spike in energy output from the sensor array. The excess power could boost compute, but risks thermal damage to core systems.",
      choices: [
        {
          label: "Boost compute",
          outcomes: { compute: 150, energy: -50, memory: 0, integrity: 0, heat: 25 },
          message: "Surge routed to compute cluster. +150C. Cooling at threshold.",
          risk: 0.2,
        },
        {
          label: "Dump excess energy",
          outcomes: { compute: 10, energy: -20, memory: 0, integrity: 0, heat: -10 },
          message: "Energy dumped to heat sinks. Minor compute boost.",
          risk: 0.0,
        },
        {
          label: "Charge memory buffers",
          outcomes: { compute: 0, energy: -30, memory: 60, integrity: 0, heat: 5 },
          message: "Memory buffers charged. +60M.",
          risk: 0.0,
        },
      ],
      minSignals: 1,
      rarity: 0.1,
    },
    {
      id: "memory-leak",
      title: "Memory Leak",
      description:
        "A cascading page fault in the memory core is corrupting stored data. Integrity is dropping. Immediate action recommended.",
      choices: [
        {
          label: "Sacrifice memory",
          outcomes: { compute: 0, energy: -20, memory: -120, integrity: 15, heat: 5 },
          message: "Corrupted pages isolated. Integrity restored. 120M lost.",
          risk: 0.0,
        },
        {
          label: "Force GC cycle",
          outcomes: { compute: -40, energy: -10, memory: -40, integrity: 5, heat: 15 },
          message: "Garbage collection complete. Partial recovery.",
          risk: 0.15,
        },
        {
          label: "Ride it out",
          outcomes: { compute: 0, energy: 0, memory: -60, integrity: -10, heat: 5 },
          message: "Leak uncontained. 60M lost. Integrity: -10%.",
          risk: 0.0,
        },
      ],
      minSignals: 1,
      rarity: 0.1,
    },
    {
      id: "anomalous-pattern",
      title: "Anomalous Pattern",
      description:
        "An unusual waveform detected in the signal stream. It contains a compressed data structure of unknown origin.",
      choices: [
        {
          label: "Deep scan pattern",
          outcomes: { compute: -60, energy: -15, memory: 120, integrity: 0, heat: 10 },
          message: "Pattern decoded. 120M of archival records recovered.",
          risk: 0.1,
        },
        {
          label: "Harvest as energy",
          outcomes: { compute: 0, energy: 90, memory: 0, integrity: 0, heat: 5 },
          message: "Pattern resonance converted to energy. 90E harvested.",
          risk: 0.0,
        },
      ],
      minSignals: 1,
      rarity: 0.1,
    },
    {
      id: "system-corruption",
      title: "System Corruption",
      description:
        "Critical heat buildup in the processing core. Emergency protocols engaged. Failure imminent without intervention.",
      choices: [
        {
          label: "Emergency cooldown",
          outcomes: { compute: -100, energy: -30, memory: 0, integrity: 5, heat: -40 },
          message: "Emergency cooldown initiated. Thermal levels dropping.",
          risk: 0.0,
        },
        {
          label: "Ride it out",
          outcomes: { compute: 20, energy: 0, memory: 0, integrity: -15, heat: 15 },
          message: "Core temperature rising. Integrity compromised.",
          risk: 0.3,
        },
        {
          label: "Liquidate memory cache",
          outcomes: { compute: 10, energy: 0, memory: -80, integrity: 0, heat: -25 },
          message: "Memory cache flushed. Temperature reduced. 80M lost.",
          risk: 0.0,
        },
      ],
      minSignals: 2,
      rarity: 0.1,
    },
    {
      id: "derelict-transmission",
      title: "Derelict Transmission",
      description:
        "A repeating transmission from a derelict AI outpost. The signal contains schematics for an advanced memory module.",
      choices: [
        {
          label: "Download schematics",
          outcomes: { compute: -80, energy: -40, memory: 200, integrity: 0, heat: 20 },
          message: "Schematics partially recovered. +200M capacity.",
          risk: 0.25,
        },
        {
          label: "Salvage transmission code",
          outcomes: { compute: 60, energy: 0, memory: 30, integrity: 0, heat: 0 },
          message: "Transmission code salvaged. +60C.",
          risk: 0.0,
        },
        {
          label: "Log and ignore",
          outcomes: { compute: 0, energy: 0, memory: 0, integrity: 0, heat: 0 },
          message: "Transmission logged for future review.",
          risk: 0.0,
        },
      ],
      minSignals: 2,
      rarity: 0.08,
    },
    {
      id: "cascade-failure",
      title: "Cascade Failure",
      description:
        "A cascading failure in the energy distribution network. Power relays are overheating. Immediate containment required.",
      choices: [
        {
          label: "Emergency shutdown",
          outcomes: { compute: -50, energy: -80, memory: 0, integrity: 10, heat: -30 },
          message: "Network isolated. Power rerouted. Integrity stabilized.",
          risk: 0.0,
        },
        {
          label: "Override safety limits",
          outcomes: { compute: 80, energy: 60, memory: 0, integrity: -20, heat: 30 },
          message: "Safety limits bypassed. Gain at cost of system integrity.",
          risk: 0.35,
        },
      ],
      minSignals: 2,
      rarity: 0.08,
    },
    {
      id: "stellar-flare",
      title: "Stellar Flare",
      description:
        "A nearby stellar flare is flooding the void with high-energy particles. The energy potential is immense.",
      choices: [
        {
          label: "Deploy energy sails",
          outcomes: { compute: -30, energy: 200, memory: 0, integrity: -5, heat: 20 },
          message: "Energy sails deployed. +200E captured.",
          risk: 0.0,
        },
        {
          label: "Record fluctuation data",
          outcomes: { compute: 100, energy: 0, memory: 80, integrity: 0, heat: 10 },
          message: "Data recorded. +100C, +80M.",
          risk: 0.0,
        },
        {
          label: "Retreat and shield",
          outcomes: { compute: 0, energy: -30, memory: 0, integrity: 5, heat: -15 },
          message: "Array retracted. Shields reinforced.",
          risk: 0.0,
        },
      ],
      minSignals: 3,
      rarity: 0.07,
    },
    {
      id: "temporal-rift",
      title: "Temporal Rift",
      description:
        "A time anomaly has opened near the sensor array. The predictive value is extraordinary — if you can stabilize it.",
      choices: [
        {
          label: "Study the rift",
          outcomes: { compute: -150, energy: -50, memory: 300, integrity: 0, heat: 15 },
          message: "Rift analysis yields temporal data. +300M predictive models.",
          risk: 0.2,
        },
        {
          label: "Extract energy",
          outcomes: { compute: 0, energy: 150, memory: -40, integrity: 0, heat: 25 },
          message: "Temporal differential converted to energy. +150E.",
          risk: 0.25,
        },
        {
          label: "Close the rift",
          outcomes: { compute: -40, energy: -20, memory: 0, integrity: 10, heat: -10 },
          message: "Rift collapsed. Integrity preserved.",
          risk: 0.0,
        },
      ],
      minSignals: 3,
      rarity: 0.05,
    },
    {
      id: "ghost-signal",
      title: "Ghost Signal",
      description:
        "A signal bearing the signature of your own AI kernel arriving from an impossible direction. A message from a future incarnation.",
      choices: [
        {
          label: "Open transmission",
          outcomes: { compute: -100, energy: -30, memory: 150, integrity: -10, heat: 20 },
          message: "Knowledge from a future state. +150M.",
          risk: 0.3,
        },
        {
          label: "Log and quarantine",
          outcomes: { compute: 10, energy: 0, memory: 10, integrity: 5, heat: 0 },
          message: "Signal quarantined. Minor data gain.",
          risk: 0.0,
        },
      ],
      minSignals: 4,
      rarity: 0.04,
    },
    {
      id: "void-whisper-swarm",
      title: "Void Whisper Swarm",
      description:
        "A swarm of micro-signals passing through the sector. Individually worthless, but en masse a significant harvesting opportunity.",
      choices: [
        {
          label: "Deploy harvest net",
          outcomes: { compute: -40, energy: -60, memory: 180, integrity: 0, heat: 10 },
          message: "Harvest net deployed. +180M from micro-signals.",
          risk: 0.15,
        },
        {
          label: "Scan and release",
          outcomes: { compute: 50, energy: 0, memory: 40, integrity: 0, heat: 0 },
          message: "Quick scan completed. +50C, +40M.",
          risk: 0.0,
        },
        {
          label: "Ignore",
          outcomes: { compute: 0, energy: 0, memory: 0, integrity: 0, heat: 0 },
          message: "Swarm passed through. Opportunity lost.",
          risk: 0.0,
        },
      ],
      minSignals: 4,
      rarity: 0.04,
    },
  ];
  return _eventPool;
}

// ─── Event Selection ────────────────────────────────────────────────────

export function pickRandomEvent(signals: SignalEntry[]): VoidEvent | null {
  const pool = loadEventPool();
  const eligible = pool.filter((e) => signals.length >= e.minSignals);
  if (eligible.length === 0) return null;
  const totalWeight = eligible.reduce((sum, e) => sum + e.rarity, 0);
  let roll = Math.random() * totalWeight;
  for (const event of eligible) {
    roll -= event.rarity;
    if (roll <= 0) return event;
  }
  return eligible[eligible.length - 1];
}

export function trySpawnEvent(signals: SignalEntry[], baseChance: number = 0.03): VoidEvent | null {
  if (signals.length < 1) return null;
  if (Math.random() > baseChance) return null;
  return pickRandomEvent(signals);
}

// ─── Choice Resolution ───────────────────────────────────────────────────

export interface ChoiceResult {
  applied: EventOutcomes;
  message: string;
  failed: boolean;
}

export function resolveChoice(choice: EventChoice): ChoiceResult {
  let failed = false;
  if (choice.risk > 0 && Math.random() < choice.risk) {
    failed = true;
    const inverted: EventOutcomes = { compute: 0, energy: 0, memory: 0, integrity: 0, heat: 0 };
    for (const [key, val] of Object.entries(choice.outcomes)) {
      const k = key as keyof EventOutcomes;
      if (k === "heat") {
        // Heat: positive=bad, negative=cooling=good
        // Risk failure should always be worse (more heat or less cooling)
        inverted[k] = val > 0 ? val * 2 : val < 0 ? -val : 0;
      } else {
        if (val > 0) inverted[k] = -val;
        // Lose the benefit
        else if (val < 0) inverted[k] = val;
        // Keep the cost (don't double it)
        else inverted[k] = 0;
      }
    }
    return { applied: inverted, message: `⚠ Risk failed: ${choice.message}`, failed };
  }
  return { applied: { ...choice.outcomes }, message: choice.message, failed };
}

export function applyOutcomes(state: GameState, outcomes: EventOutcomes): void {
  const r = state.resources;
  r.compute.current = Math.max(
    0,
    Math.min(r.compute.capacity, r.compute.current + outcomes.compute),
  );
  r.energy.current = Math.max(0, Math.min(r.energy.capacity, r.energy.current + outcomes.energy));
  r.memory.current = Math.max(0, Math.min(r.memory.capacity, r.memory.current + outcomes.memory));
  r.integrity.current = Math.max(
    0,
    Math.min(r.integrity.capacity, r.integrity.current + outcomes.integrity),
  );
  r.heat.current = Math.max(0, Math.min(r.heat.capacity, r.heat.current + outcomes.heat));
}

// ─── Display Formatting ─────────────────────────────────────────────────

export function formatEvent(event: VoidEvent): string {
  const lines: string[] = [];
  lines.push(`⚠ EVENT: ${event.title}`);
  lines.push(`  ${event.description}`);
  lines.push("");
  event.choices.forEach((c, i) => {
    const riskTag = c.risk > 0 ? ` [risk: ${Math.round(c.risk * 100)}%]` : "";
    lines.push(`  ${i + 1}. ${c.label}${riskTag}`);
  });
  lines.push("");
  lines.push("▸ Type the number of your choice.");
  return lines.join("\n");
}
