/**
 * DEEP VOID — Content Generator System
 *
 * Auto-detects a local LLM and uses it for content generation.
 * Falls back to curated pools if no LLM is available.
 * The game must work perfectly without an LLM.
 */

import { LLMGenerator } from "./llm.js";
import { PoolGenerator } from "./pool.js";
import type { ContentGenerator } from "./types.js";

// ─── LLM Endpoints to Try ─────────────────────────────────────────────

const LLM_ENDPOINTS = [
  {
    url: "http://192.168.1.41:1234",
    name: "Sirius (LM Studio)",
    type: "lmstudio" as const,
  },
  {
    url: "http://localhost:11434",
    name: "Local Ollama",
    type: "ollama" as const,
  },
  {
    url: "http://localhost:1234",
    name: "Local LM Studio",
    type: "lmstudio" as const,
  },
];

// ─── Auto-Detection ────────────────────────────────────────────────────

async function detectLLM(): Promise<{
  generator: ContentGenerator;
  name: string;
} | null> {
  for (const endpoint of LLM_ENDPOINTS) {
    try {
      const testUrl =
        endpoint.type === "ollama" ? `${endpoint.url}/api/tags` : `${endpoint.url}/v1/models`;

      const res = await fetch(testUrl, {
        signal: AbortSignal.timeout(2000),
      });

      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        let modelName = "default";

        if (endpoint.type === "ollama" && Array.isArray((data as any).models)) {
          modelName = (data as any).models[0].name ?? "unknown";
        } else if (Array.isArray((data as any).data)) {
          modelName = (data as any).data[0].id ?? "unknown";
        }

        return {
          generator: new LLMGenerator(endpoint.url, endpoint.type, modelName),
          name: `${endpoint.name} (${modelName})`,
        };
      }
    } catch {
      // Try next endpoint
    }
  }
  return null;
}

// ─── Public API ────────────────────────────────────────────────────────

let _generator: ContentGenerator | null = null;
let _llmName: string | null = null;
let _initialized = false;

/** Initialize the content generator system. Detects LLM or falls back to pools. */
export async function initContentGenerator(): Promise<void> {
  if (_initialized) return;
  _initialized = true;

  const detected = await detectLLM();
  if (detected) {
    _generator = detected.generator;
    _llmName = detected.name;
    console.log(`\u25c8 LLM content generator ONLINE (${_llmName})`);
  } else {
    _generator = new PoolGenerator();
    _llmName = null;
    console.log("\u25c8 No LLM detected \u2014 using curated content pools");
  }
}

/** Get the active content generator */
export function getContentGenerator(): ContentGenerator {
  if (!_generator) {
    _generator = new PoolGenerator();
  }
  return _generator;
}

/** Check if LLM is connected */
export function isLLMConnected(): boolean {
  return _llmName !== null;
}

/** Get LLM connection info */
export function getLLMInfo(): string | null {
  return _llmName;
}
