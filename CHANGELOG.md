# Changelog

All notable changes to Deep Void will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **Build tooling** (`package.json`, `vite.config.ts`, `tsconfig.json`) — Added Vite as build/dev server, Vitest for unit testing, Playwright for E2E testing, Biome for linting/formatting. Added npm scripts: `dev`, `build`, `preview`, `test`, `test:e2e`, `lint`, `format`.
- **Biome linting** (`biome.json`) — Recommended rules with `noNonNullAssertion` and `noExplicitAny` downgraded to warnings (intentional in DOM-heavy game code). Auto-fixed formatting and `import type` across 11 files.
- **Save on tab close** (`src/main.ts`) — Added `visibilitychange` and `beforeunload` event handlers to persist game state when the player leaves the page. Prevents up to 8 seconds of tick progress loss.
- **Cinematic intro sequence** (`src/intro.ts`, `index.html`, `src/style.css`) — 20-second typed boot sequence with 8 phases: black screen → star pulse → frame draws → boot messages → anomaly warning → analysis → signal fragment → press ENTER to initialize. ESC to skip with subtle bottom-right indicator. Responsive centering with `min(600px, 85vw)`. CSS transition fade-out. "Systems online" bridge phase after intro. Bypassed in tests via `?test` query param.
- **Void events system** (`src/events.ts`) — 12 hand-crafted events across 4 tiers (signal, resource, danger, rare). Weighted random selection based on signal count. Risk/reward mechanics (3-35% failure chance). Events spawn at 3% chance per tick. Commands: `events` (view active), `1`/`2`/`3` (choose response).
- **Inline command result area** (`index.html`, `src/main.ts`, `src/style.css`) — Command responses now appear in a dedicated zone between the action pads and input, with dimmed command echo (`› scan`) and result text. Old results archive to the system log as transcripts. System log is now purely ambient events.
- **`pushResult()` function** (`src/main.ts`) — Separate routing for command output vs ambient log events. All 7 commands (signals, status, scan, harvest, save, load, help) route through `pushResult`.
- **`getCommandResult()` / `getCommandEcho()` helpers** (`e2e/helpers.ts`) — Test utilities for asserting on the inline result area.

### Fixed
- **Resource tick ignored rate fields** (`src/main.ts`) — The game loop used hardcoded deltas (`+1`, `-0.5`, `+0.3`) instead of reading `state.resources.*.rate`. Display showed `▲ +12` for compute but actual gain was only +1 per tick. Memory and integrity never ticked at all. Now applies stored rates via `res.rate / 30` for all 5 resources.
- **`emergencySave` could reset the game** (`src/save.ts`) — If `loadGame()` returned null (corrupt save), `emergencySave` fell back to `createInitialState()`, silently destroying the player's real progress. Now delegates directly to `saveGame()`.
- **Risk failure inverted heat outcomes backwards** (`src/events.ts`) — Heat uses opposite convention (negative = cooling = good). A failed "emergency cooldown" (`heat: -40`) became `-80` (more cooling = better). Now special-cases heat: positive heat doubles, negative heat inverts. Other resources: gains negated, costs kept (not doubled).
- **Signal ID regex broke at 1000 signals** (`src/signals.ts`) — Regex `/^S-(\d{3})$/` required exactly 3 digits. Once IDs reached `S-1000`, the regex stopped matching and caused ID collisions. Changed to `/^S-(\d+)$/`.
- **`load` command leaked ephemeral state** (`src/main.ts`) — Loading a save didn't reset `currentEvent`, `cmdHistory`, `historyIdx`, or `tickSinceSave`. Stale events persisted across incarnations.
- **`.new` log animation re-applied every tick** (`src/main.ts`) — The last log entry got the `.new` slide-in animation class every 2 seconds, causing flicker. Now tracks `lastRenderedLogTick` to only animate truly new entries.
- **Intro ESC stuck at Phase 8** (`src/intro.ts`) — ESC set `skipAll = true` but the Phase 8 Enter-wait only resolved on Enter/click. ESC now also dismisses the intro.
- **Event text newlines invisible** (`src/style.css`) — `formatEvent()` joined lines with `\n` but `textContent` doesn't render newlines. Added `white-space: pre-line` to `.result-msg`.

### Changed
- **Dead code removed** (`src/main.ts`, `src/migration.ts`) — Deleted `_showWelcome` (78 lines, never called), `_TIPS` (7 entries, never referenced), `autosave()` wrapper (inlined to `saveGame()`), `CURRENT_VERSION` alias (unused export).
- **Version field added to GameState** (`src/types.ts`) — `version: number` field for forward-compatible save format tracking.
- **Signal spawning system** (`src/signals.ts`) — 6-tier weighted random generation (WHISPER→ANOMALY), unique IDs, trait selection, maturity rates, rarity labels.
- **Save migration system** (`src/migration.ts`) — Versioned format with sequential v0→v1 migration pipeline.
- **Save/load persistence** (`src/save.ts`) — localStorage with autosave every 5 ticks, manual save/load commands, emergency save, corrupt data handling.
- **`scan` command** (`src/main.ts`) — Spawns 1-3 new random signals with weighted rarity.
- **Startup save detection** (`src/main.ts`) — Checks for existing save on page load, shows returning-player welcome.
- **Tab completion updated** (`src/main.ts`) — Now includes scan, save, load in completion list.

### Tests
- **18 unit tests** (`src/save.test.ts`) — Save/load/delete/emergency/corrupt JSON/legacy migration/metadata.
- **21 E2E tests** (`e2e/save-and-signals.spec.ts`, `e2e/keyboard-and-ui.spec.ts`) — Full Playwright suite covering save/load, autosave, scan, signal variety, maturity, harvest yields, legacy migration, corrupt data, tab completion, command history, pad buttons, ambient effects, unknown commands, help, empty garden, save metadata.

## [0.3.0] — 2026-06-04

### Added
- Initial Deep Void prototype
- Pure DOM terminal HUD with cold greyscale aesthetic
- Resource bars (compute, energy, memory, integrity, heat) with rate arrows
- Signal garden table with maturity bars
- System log with scrolling entries
- Command input with history (↑/↓) and tab completion
- Action pads with char-by-char typing animation
- Ambient effects: whisper scan line, character glitch
- Boot splash sequence
