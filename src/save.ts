/**
 * DEEP VOID — Save/Load Persistence Module
 *
 * Handles all localStorage interactions for game state persistence.
 * Uses the migration system from migration.ts for forward-compatible
 * save format upgrades.
 *
 * Save key: 'deepvoid-save'
 * Current version: 1 (managed by migration.ts)
 */

import { detectVersion, migrate, SAVE_VERSION } from "./migration.js";
import type { GameState } from "./types.js";

// ─── Constants ──────────────────────────────────────────────────────────

/** localStorage key for the save data blob */
const SAVE_KEY = "deepvoid-save";

/** Max log entries to persist (trim before save to keep size reasonable) */
const MAX_LOG_ENTRIES = 200;

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Trim state before serialization to prevent bloat.
 * - Keeps only the most recent log entries
 * - Clears transient UI state (commandBuffer)
 */
function trimState(state: GameState): Omit<GameState, "version"> & { version?: number } {
  const { version: _ver, ...rest } = state;
  return {
    ...rest,
    log: rest.log.slice(-MAX_LOG_ENTRIES),
    commandBuffer: "", // transient — don't persist incomplete input
  };
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Save the current game state to localStorage.
 * Automatically trims log entries and stamps the version.
 *
 * @param state - The current game state to persist
 * @returns true if the save succeeded, false on error
 */
export function saveGame(state: GameState): boolean {
  try {
    const trimmed = trimState(state);
    const payload = {
      ...trimmed,
      version: SAVE_VERSION,
      savedAt: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error("[save] Failed to save game:", err);
    return false;
  }
}

/**
 * Load game state from localStorage.
 * Automatically detects the save version and runs any needed migrations.
 *
 * @returns The loaded GameState, or null if no save exists or data is corrupt
 */
export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      console.warn("[save] Corrupt save data (JSON parse failed)");
      localStorage.removeItem(SAVE_KEY);
      return null;
    }

    if (!data || typeof data !== "object") {
      console.warn("[save] Corrupt save data (not an object)");
      localStorage.removeItem(SAVE_KEY);
      return null;
    }

    // Detect version and migrate
    const version = detectVersion(data);
    const migrated = migrate(data, version);

    // Validate the migrated result has essential fields
    if (!migrated.resources || !migrated.signals || typeof migrated.tick !== "number") {
      console.warn("[save] Migrated data missing essential fields");
      localStorage.removeItem(SAVE_KEY);
      return null;
    }

    // Persist migrated save so future loads don't re-migrate
    if (version < SAVE_VERSION) {
      try {
        localStorage.setItem(
          SAVE_KEY,
          JSON.stringify({ ...migrated, version: SAVE_VERSION, savedAt: Date.now() }),
        );
      } catch {
        /* best effort */
      }
    }

    // Cast and return
    return migrated as GameState;
  } catch (err) {
    console.error("[save] Failed to load game:", err);
    return null;
  }
}

/**
 * Delete the save data from localStorage.
 */
export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.error("[save] Failed to delete save:", err);
  }
}

/**
 * Check if a save exists in localStorage.
 * Does NOT validate the save data — use loadGame() for validation.
 */
export function hasSave(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Get lightweight metadata from the save without full deserialization.
 * Useful for loading screens, save file listings, etc.
 *
 * @returns Save metadata, or null if no save exists or data is corrupt
 */
export function getSaveInfo(): {
  tick: number;
  uptime: number;
  incarnation: number;
  version: number;
  savedAt: number | null;
} | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }

    if (!data || typeof data !== "object") return null;

    return {
      tick: typeof data.tick === "number" ? data.tick : 0,
      uptime: typeof data.uptime === "number" ? data.uptime : 0,
      incarnation: typeof data.incarnation === "number" ? data.incarnation : 1,
      version: typeof data.version === "number" ? data.version : 0,
      savedAt: typeof data.savedAt === "number" ? data.savedAt : null,
    };
  } catch {
    return null;
  }
}

/**
 * Perform an emergency save — forces save even if state is partially corrupt.
 * Used when the game detects an impending crash or tab close.
 */
export function emergencySave(currentState: GameState): boolean {
  return saveGame(currentState);
}

/**
 * Autosave the game. Identical to saveGame but logs differently
 * so consumers can differentiate autosaves from manual saves.
 */
export function autosave(state: GameState): boolean {
  const ok = saveGame(state);
  if (ok) {
    console.debug(`[save] Autosaved at tick ${state.tick}`);
  }
  return ok;
}
