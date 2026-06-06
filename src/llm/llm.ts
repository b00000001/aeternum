/**
 * DEEP VOID — LLM Content Generator
 *
 * Calls a local LLM (LM Studio or Ollama) to generate unique content.
 * Falls back to PoolGenerator if the LLM is unavailable.
 */

import type { ContentGenerator } from "./types.js";

export class LLMGenerator implements ContentGenerator {
  private endpoint: string;
  private modelName: string;
  private type: "lmstudio" | "ollama";

  constructor(endpoint: string, type: "lmstudio" | "ollama", modelName: string = "default") {
    this.endpoint = endpoint;
    this.modelName = modelName;
    this.type = type;
  }

  private _available = true;
  private _consecutiveFailures = 0;
  private static MAX_FAILURES = 5;

  isAvailable(): boolean {
    return this._available;
  }

  private async chat(prompt: string, maxTokens = 200): Promise<string> {
    try {
      let url: string;
      let body: Record<string, unknown>;

      if (this.type === "ollama") {
        url = `${this.endpoint}/api/generate`;
        body = {
          model: this.modelName,
          prompt,
          stream: false,
          options: { num_predict: maxTokens, temperature: 0.8 },
        };
      } else {
        url = `${this.endpoint}/v1/chat/completions`;
        body = {
          model: this.modelName,
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.8,
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) { this._consecutiveFailures++; return ""; }
      this._consecutiveFailures = 0;

      const data = (await res.json()) as Record<string, unknown>;

      if (this.type === "ollama") {
        return ((data as any).response ?? "").trim();
      } else {
        const choices = (data as any).choices;
        return (choices?.[0]?.message?.content ?? "").trim();
      }
    } catch (err) {
      console.warn(`[LLM] ${this.type} request failed:`, err);
      return "";
    }
  }

  async generateSignalName(type: string): Promise<string> {
    const result = await this.chat(
      `Generate a short 2-3 word thematic name for a ${type} signal in a sci-fi void setting. ` +
        `Examples: "Silent breath", "Reflected voice", "Throbbing wave". ` +
        `Return ONLY the name, nothing else.`,
      30,
    );
    return result || `Unknown ${type} signal`;
  }

  async generateSignalDescription(type: string): Promise<string> {
    const result = await this.chat(
      `Write a 1-sentence atmospheric description for a ${type}-type signal in a sci-fi void setting. ` +
        `Keep it under 20 words. Dark, mysterious tone.`,
      50,
    );
    return result || `An unidentified ${type} signal.`;
  }

  async generateLore(tier: string, context: string): Promise<string> {
    const result = await this.chat(
      `You are an AI in a sci-fi game called Deep Void. Write a single sentence of lore for a ${tier}-tier discovery. ` +
        `Context: ${context || "The player is exploring the void."} ` +
        `Tone: mysterious, poetic. Under 25 words. Return ONLY the lore text.`,
      60,
    );
    return result || "...";
  }

  async generateWhisper(): Promise<string> {
    const result = await this.chat(
      `Write a single atmospheric whisper for a sci-fi terminal game set in deep space. ` +
        `Dark, mysterious, poetic. Under 15 words. Examples: ` +
        `"The void hums at a frequency just below thought." ` +
        `"Every signal carries a timestamp from before the silence." ` +
        `Return ONLY the whisper text, nothing else.`,
      40,
    );
    return result || "The void is watching.";
  }

  async generateEventDescription(title: string): Promise<string> {
    const result = await this.chat(
      `Write a 1-2 sentence description for a void event called "${title}" in a sci-fi game. ` +
        `Dark, tense tone. Under 30 words.`,
      60,
    );
    return result || `An event titled "${title}" has occurred.`;
  }
}
