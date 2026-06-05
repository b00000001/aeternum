export interface GameState {
  version: number;
  tick: number;
  phase: "boot" | "active";
  incarnation: number;
  uptime: number;
  fleetCount: number | null;
  vaultTime: number | null;
  anomaly: string;
  veterancyLevel: "novice" | "competent" | "expert";
  resources: {
    compute: { current: number; capacity: number; rate: number };
    energy: { current: number; capacity: number; rate: number };
    memory: { current: number; capacity: number; rate: number };
    integrity: { current: number; capacity: number; rate: number };
    heat: { current: number; capacity: number; rate: number };
  };
  signals: SignalEntry[];
  log: LogEntry[];
  commandBuffer: string;
  unlockedTiers: string[];
  lore: LoreEntry[];
  nodes?: { purchased: string[] };
}

export interface SignalEntry {
  id: string;
  name: string;
  type: string;
  maturity: number; // 0-100
  traits: string[];
  ready: boolean;
  unstable: boolean;
}

export interface LogEntry {
  tick: number;
  message: string;
  type: "info" | "success" | "warning" | "danger" | "system";
}

export interface LoreEntry {
  tier: string;
  fragment: string;
  discoveredAt: number;
}

export function createInitialState(): GameState {
  return {
    version: 1,
    tick: 847,
    phase: "boot",
    incarnation: 1,
    uptime: 0,
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
        name: "WHISPER",
        type: "WHISPER",
        maturity: 31,
        traits: ["+Range", "+Speed"],
        ready: false,
        unstable: false,
      },
    ],
    fleetCount: null,
    vaultTime: null,
    anomaly: "—",
    veterancyLevel: "novice" as const,
    log: [
      { tick: 847, message: "★ Signal detected: WHISPER — growing in the void.", type: "success" },
      { tick: 842, message: "◉ System: COLONIAL AI INITIALIZED — v0.3", type: "system" },
    ],
    commandBuffer: "",
    unlockedTiers: ["WHISPER"],
    lore: [],
  };
}
