/**
 * DEEP VOID — Node System
 *
 * Incremental upgrades that boost resource capacities and rates.
 * Players spend Compute to upgrade nodes, improving their colony.
 */

import type { GameState } from "./types.js";

// ─── Types ──────────────────────────────────────────────────────────────

export interface NodeDefinition {
  id: string;
  category: string;
  tier: number;
  name: string;
  description: string;
  cost: number;
  prerequisite: string | null;
  effect: {
    resource: string;
    stat: "capacity" | "rate";
    delta: number;
  };
}

export interface NodeState {
  purchased: string[];
}

// ─── Node Registry ──────────────────────────────────────────────────────

const NODES: NodeDefinition[] = [
  // Power — Energy capacity
  {
    id: "power-1",
    category: "Power",
    tier: 1,
    name: "Capacitor Bank",
    description: "+200 energy capacity",
    cost: 15,
    prerequisite: null,
    effect: { resource: "energy", stat: "capacity", delta: 200 },
  },
  {
    id: "power-2",
    category: "Power",
    tier: 2,
    name: "Power Relay",
    description: "+500 energy capacity",
    cost: 75,
    prerequisite: "power-1",
    effect: { resource: "energy", stat: "capacity", delta: 500 },
  },
  {
    id: "power-3",
    category: "Power",
    tier: 3,
    name: "Fusion Core",
    description: "+1500 energy capacity",
    cost: 375,
    prerequisite: "power-2",
    effect: { resource: "energy", stat: "capacity", delta: 1500 },
  },
  // Processor — Compute rate
  {
    id: "proc-1",
    category: "Processor",
    tier: 1,
    name: "Overclock",
    description: "+5 compute/tick",
    cost: 20,
    prerequisite: null,
    effect: { resource: "compute", stat: "rate", delta: 5 },
  },
  {
    id: "proc-2",
    category: "Processor",
    tier: 2,
    name: "Dual Core",
    description: "+15 compute/tick",
    cost: 100,
    prerequisite: "proc-1",
    effect: { resource: "compute", stat: "rate", delta: 15 },
  },
  {
    id: "proc-3",
    category: "Processor",
    tier: 3,
    name: "Quantum Array",
    description: "+40 compute/tick",
    cost: 500,
    prerequisite: "proc-2",
    effect: { resource: "compute", stat: "rate", delta: 40 },
  },
  // Memory — Memory capacity
  {
    id: "mem-1",
    category: "Memory",
    tier: 1,
    name: "Cache Expansion",
    description: "+500 memory capacity",
    cost: 20,
    prerequisite: null,
    effect: { resource: "memory", stat: "capacity", delta: 500 },
  },
  {
    id: "mem-2",
    category: "Memory",
    tier: 2,
    name: "RAM Stack",
    description: "+1500 memory capacity",
    cost: 100,
    prerequisite: "mem-1",
    effect: { resource: "memory", stat: "capacity", delta: 1500 },
  },
  {
    id: "mem-3",
    category: "Memory",
    tier: 3,
    name: "Neural Storage",
    description: "+4000 memory capacity",
    cost: 500,
    prerequisite: "mem-2",
    effect: { resource: "memory", stat: "capacity", delta: 4000 },
  },
  // Shield — Integrity capacity
  {
    id: "shield-1",
    category: "Shield",
    tier: 1,
    name: "Hull Plating",
    description: "+10 integrity capacity",
    cost: 25,
    prerequisite: null,
    effect: { resource: "integrity", stat: "capacity", delta: 10 },
  },
  {
    id: "shield-2",
    category: "Shield",
    tier: 2,
    name: "Deflector Grid",
    description: "+25 integrity capacity",
    cost: 125,
    prerequisite: "shield-1",
    effect: { resource: "integrity", stat: "capacity", delta: 25 },
  },
  {
    id: "shield-3",
    category: "Shield",
    tier: 3,
    name: "Ablative Armor",
    description: "+65 integrity capacity",
    cost: 625,
    prerequisite: "shield-2",
    effect: { resource: "integrity", stat: "capacity", delta: 65 },
  },
  // Cooler — Reduce heat rate
  {
    id: "cool-1",
    category: "Cooler",
    tier: 1,
    name: "Heat Sink",
    description: "-0.2 heat/tick",
    cost: 15,
    prerequisite: null,
    effect: { resource: "heat", stat: "rate", delta: -0.2 },
  },
  {
    id: "cool-2",
    category: "Cooler",
    tier: 2,
    name: "Cryo Pump",
    description: "-0.5 heat/tick",
    cost: 75,
    prerequisite: "cool-1",
    effect: { resource: "heat", stat: "rate", delta: -0.5 },
  },
  {
    id: "cool-3",
    category: "Cooler",
    tier: 3,
    name: "Phase Cooler",
    description: "-1.0 heat/tick",
    cost: 375,
    prerequisite: "cool-2",
    effect: { resource: "heat", stat: "rate", delta: -1.0 },
  },
];

// ─── Public API ─────────────────────────────────────────────────────────

export function getAllNodes(): NodeDefinition[] {
  return NODES;
}

export function getNode(id: string): NodeDefinition | undefined {
  return NODES.find((n) => n.id === id);
}

export function canPurchase(state: GameState, nodeId: string): { ok: boolean; reason?: string } {
  const node = getNode(nodeId);
  if (!node) return { ok: false, reason: `Unknown node: ${nodeId}` };

  const purchased = state.nodes?.purchased ?? [];

  if (purchased.includes(nodeId)) {
    return { ok: false, reason: `${node.name} already purchased` };
  }

  if (node.prerequisite && !purchased.includes(node.prerequisite)) {
    const prereq = getNode(node.prerequisite);
    return { ok: false, reason: `Requires ${prereq?.name ?? node.prerequisite}` };
  }

  const compute = state.resources.compute.current;
  if (compute < node.cost) {
    return { ok: false, reason: `Need ${node.cost}C, have ${Math.round(compute)}C` };
  }

  return { ok: true };
}

export function purchaseNode(
  state: GameState,
  nodeId: string,
): { success: boolean; message: string } {
  const check = canPurchase(state, nodeId);
  if (!check.ok) return { success: false, message: check.reason! };

  const node = getNode(nodeId)!;

  // Ensure nodes state exists
  if (!state.nodes) {
    state.nodes = { purchased: [] };
  }

  // Deduct cost
  state.resources.compute.current -= node.cost;

  // Apply effect
  const resourceMap: Record<string, any> = state.resources;
  const res = resourceMap[node.effect.resource];
  if (res) {
    res[node.effect.stat] += node.effect.delta;
    // Clamp capacity to reasonable minimum
    if (node.effect.stat === "capacity") {
      res.capacity = Math.max(res.capacity, res.current);
    }
  }

  // Record purchase
  state.nodes!.purchased.push(nodeId);

  return {
    success: true,
    message: `Upgraded ${node.name} — ${node.description}. (-${node.cost}C)`,
  };
}

export function formatNodes(state: GameState): string {
  const purchased = state.nodes?.purchased ?? [];

  const lines: string[] = ["═══ UPGRADE NODES ═══", ""];

  const categories = ["Power", "Processor", "Memory", "Shield", "Cooler"];
  for (const cat of categories) {
    const catNodes = NODES.filter((n) => n.category === cat);
    lines.push(`[${cat}]`);
    for (const node of catNodes) {
      const owned = purchased.includes(node.id);
      const canBuy = canPurchase(state, node.id);
      const marker = owned ? "✓" : canBuy.ok ? "◇" : "○";
      const status = owned ? "INSTALLED" : `${node.cost}C`;
      lines.push(`  ${marker} Tier ${node.tier} ${node.name} — ${node.description} [${status}]`);
    }
    lines.push("");
  }

  lines.push("▸ Type upgrade <node-id> to install (e.g. upgrade power-1)");
  return lines.join("\n");
}
