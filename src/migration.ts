/**
 * DEEP VOID — Save Migration System
 *
 * Handles format versioning for localStorage saves. Each migration
 * transforms GameState from one version to the next. Migrations are
 * applied sequentially: v0 → v1 → v2 → ... → current.
 *
 * To add a new migration:
 *  1. Bump SAVE_VERSION
 *  2. Add a new function to the `migrations` array at the next index
 *  3. The function receives the output of the previous migration
 */

// ─── Version Constant ────────────────────────────────────────────────────

/** Current save format version. Bump this when adding a new migration. */
export const SAVE_VERSION = 1;

// ─── Migration Type ──────────────────────────────────────────────────────

/** A single migration step: takes untyped save data, returns (possibly) transformed data. */
export type Migration = (data: any) => any;

// ─── Helpers ─────────────────────────────────────────────────────────────

/** Clamp a number between min and max. Return fallback if not a finite number. */
function num(val: any, fallback: number, min = -Infinity, max = Infinity): number {
  if (typeof val !== "number" || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, val));
}

/** Return val if it's a string, otherwise fallback. */
function str(val: any, fallback: string): string {
  return typeof val === "string" ? val : fallback;
}

/** Return val if it's an array, otherwise fallback. */
function arr(val: any, fallback: any[] = []): any[] {
  return Array.isArray(val) ? val : fallback;
}

/** Return val if it's a non-null object, otherwise fallback. */
function obj(val: any, fallback: Record<string, any> = {}): Record<string, any> {
  return val !== null && typeof val === "object" && !Array.isArray(val) ? val : fallback;
}

/** Build a default resource block. */
function defaultResource(data: any, key: string, capacity: number) {
  const r = obj(data?.[key]);
  return {
    current: num(r.current, capacity * 0.1),
    capacity: num(r.capacity, capacity),
    rate: num(r.rate, 0),
  };
}

// ─── Migrations ──────────────────────────────────────────────────────────
//
// Index 0 = migration from v0 → v1
// Index 1 = migration from v1 → v2 (future)
// ...

const migrations: Migration[] = [
  // ── v0 → v1: Introduce version field, enforce shape ──────────────────
  (data: any) => {
    const d = obj(data);

    // Resources — build from whatever was saved (or defaults)
    const resources = d.resources
      ? {
          compute: defaultResource(d.resources, "compute", 10000),
          energy: defaultResource(d.resources, "energy", 2400),
          memory: defaultResource(d.resources, "memory", 4000),
          integrity: defaultResource(d.resources, "integrity", 100),
          heat: defaultResource(d.resources, "heat", 100),
        }
      : {
          compute: { current: 1240, capacity: 10000, rate: 12 },
          energy: { current: 810, capacity: 2400, rate: -8 },
          memory: { current: 1200, capacity: 4000, rate: 0 },
          integrity: { current: 98, capacity: 100, rate: 2 },
          heat: { current: 42, capacity: 100, rate: 1 },
        };

    // Signals — keep existing entries, ensure array shape
    const signals = arr(d.signals).map((s: any) => {
      const sig = obj(s);
      return {
        id: str(sig.id, "S-???"),
        name: str(sig.name, "UNKNOWN"),
        type: str(sig.type, "UNKNOWN"),
        maturity: num(sig.maturity, 0, 0, 100),
        traits: arr(sig.traits),
        ready: Boolean(sig.ready),
        unstable: Boolean(sig.unstable),
      };
    });

    // Log — keep recent entries, ensure shape
    const log = arr(d.log).map((entry: any) => {
      const e = obj(entry);
      const validTypes = ["info", "success", "warning", "danger", "system"];
      const logType = str(e.type, "info");
      return {
        tick: num(e.tick, 0),
        message: str(e.message, ""),
        type: validTypes.includes(logType) ? logType : "info",
      };
    });

    // Clean up veterancy — clamp to valid set
    const validVet = ["novice", "competent", "expert"];
    const vet = str(d.veterancyLevel, "novice");
    const veterancyLevel = validVet.includes(vet) ? vet : "novice";

    return {
      version: 1,
      tick: num(d.tick, 0),
      phase: d.phase === "active" ? "active" : "boot",
      incarnation: num(d.incarnation, 1, 1),
      uptime: num(d.uptime, 0, 0),
      fleetCount: typeof d.fleetCount === "number" ? d.fleetCount : null,
      vaultTime: typeof d.vaultTime === "number" ? d.vaultTime : null,
      anomaly: str(d.anomaly, "—"),
      veterancyLevel,
      resources,
      signals,
      log,
      commandBuffer: str(d.commandBuffer, ""),
      unlockedTiers: arr(d.unlockedTiers, ["WHISPER"]),
      lore: arr(d.lore).map((l: any) => {
        const loreEntry = obj(l);
        return {
          tier: str(loreEntry.tier, "UNKNOWN"),
          fragment: str(loreEntry.fragment, ""),
          discoveredAt: num(loreEntry.discoveredAt, 0),
        };
      }),
    };
  },

  // ── v1 → v2: (placeholder for future) ───────────────────────────────
  // (data) => { ... return { ...data, version: 2, newField: ... }; },
];

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Apply all necessary migrations to bring save data from `fromVersion`
 * to the current SAVE_VERSION. Returns a fully-formed GameState.
 *
 * If `fromVersion` >= SAVE_VERSION, data is returned after a shape check.
 */
export function migrate(data: any, fromVersion: number): any {
  let current = obj(data);

  for (let v = fromVersion; v < SAVE_VERSION; v++) {
    const migrationFn = migrations[v];
    if (typeof migrationFn !== "function") {
      console.warn(`[migration] No migration function for v${v} → v${v + 1}. Skipping.`);
      continue;
    }
    try {
      current = migrationFn(current);
    } catch (err) {
      console.error(`[migration] Failed at v${v} → v${v + 1}:`, err);
      // Return whatever we have rather than crashing
      break;
    }
  }

  // Final safety net — ensure version stamp is current
  if (current && typeof current === "object") {
    current.version = SAVE_VERSION;
  }

  return current;
}

/**
 * Detect the save version from raw localStorage data.
 * Returns 0 if no version field is present (legacy save).
 */
export function detectVersion(data: any): number {
  if (data && typeof data === "object" && typeof data.version === "number") {
    return data.version;
  }
  return 0;
}
