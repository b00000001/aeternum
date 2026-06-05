# Code Review: Post-MVP v1 Features — Node System + Signal Breeding

**Date:** 2026-06-05
**Reviewer:** MiMo (manual review)
**Files reviewed:** src/nodes.ts, src/breeding.ts, src/nodes.test.ts, src/breeding.test.ts, src/types.ts, src/main.ts

---

## Summary

Two new features implemented cleanly with good test coverage (27 new tests). Both follow the existing codebase patterns (pure functions, state mutation, typed interfaces). No critical bugs found.

---

## Node System (src/nodes.ts) — 242 lines

### ✅ Strengths
- Clean data-driven design — all 15 nodes defined as const array
- `canPurchase` checks all 3 failure modes before `purchaseNode` runs
- Prerequisite chain works correctly (tier 1 → tier 2 → tier 3)
- `formatNodes` provides clear visual display with ✓/◇/○ markers
- 17 unit tests cover all paths

### 🟡 Issues Found

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | **Medium** | `purchaseNode` uses `(state as any).nodes` — type-unsafe access to optional field | Add `nodes` to GameState interface (currently optional with `?`) |
| 2 | **Low** | `purchaseNode` doesn't validate that `node.effect.resource` exists in `state.resources` | The `if (res)` guard handles this, but a warning log would help debugging |
| 3 | **Low** | Cooler nodes reduce `heat.rate` (making it more negative), but the tick loop uses `res.rate / 30`. A rate of -0.2 becomes -0.0067/tick — very slow cooling | Consider making cooler effects larger or applying them differently |
| 4 | **Info** | `formatNodes` calls `canPurchase` for every node on every render — 15 calls per tick | Negligible performance cost, but could cache |

### 🔴 Critical: None

---

## Signal Breeding (src/breeding.ts) — 163 lines

### ✅ Strengths
- Clean breeding logic with trait inheritance and mutation
- Parents are consumed (prevents infinite breeding loops)
- Offspring type weighted toward rarer parent (good game design)
- 10 unit tests cover core paths

### 🟡 Issues Found

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 5 | **Medium** | `mutateTrait` uses `Math.random()` — not injectable for deterministic tests | Add optional `rng` parameter (like signals.ts does) |
| 6 | **Medium** | `breedSignals` uses `Math.random()` for unstable chance — same issue | Add optional `rng` parameter |
| 7 | **Low** | Offspring name generation (`name.split(" ")[0] + " " + name.split(" ")[1]`) could produce odd names if parent names have different word counts | Minor — all current names are 2 words |
| 8 | **Low** | No limit on total signals in garden — breeding + scanning could accumulate many signals | Consider a max garden size or auto-removal of old signals |
| 9 | **Info** | `formatBreeding` only shows ready signals — correct, but doesn't show how many total signals exist | Could add "X/Y signals ready" line |

### 🔴 Critical: None

---

## Integration with main.ts

### ✅ Clean
- Commands (`nodes`, `upgrade`, `breed`) added to KNOWN_COMMANDS
- Help text updated
- All commands route through `pushResult`

### 🟡 Issues Found

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 10 | **Low** | `breed` command requires uppercase IDs (`parts[1].toUpperCase()`) but signal IDs are always uppercase — correct | No fix needed |
| 11 | **Info** | `breed` without args shows the breeding lab display — good UX | No fix needed |

---

## Test Coverage Assessment

| Module | Tests | Coverage |
|---|---|---|
| nodes.ts | 17 | ✅ Good — all canPurchase paths, purchaseNode effects, formatNodes |
| breeding.ts | 10 | ✅ Good — canBreed, breedSignals, trait inheritance, unstable chance |
| **Total new** | **27** | |

### Missing tests (low priority):
- Node effect on cooler rate (negative delta)
- Breeding with more than 2 traits per parent
- formatBreeding when garden has 0 signals

---

## Recommendations

### Fix Now (5 min)
1. Add `rng` parameter to `mutateTrait` and `breedSignals` for testability
2. Add a warning log in `purchaseNode` when resource not found

### Fix Later
3. Consider a max garden size to prevent unbounded signal accumulation
4. Add `nodes` to GameState interface as non-optional (currently `nodes?:`)

### No Action Needed
5. All other issues are info/low — the implementation is solid

---

## Verdict

**Ship it.** Both features are well-implemented, well-tested, and integrate cleanly. The 27 new tests provide good coverage. The only medium issues (type safety, RNG injectability) are polish items that don't affect correctness.
