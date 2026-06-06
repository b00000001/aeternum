/**
 * DEEP VOID — Content Generator Types
 *
 * Shared types for the content generation system.
 * The LLM is a spice rack, not the kitchen — the game must work without it.
 */

export interface ContentGenerator {
  /** Check if this generator is ready to use */
  isAvailable(): boolean;
  /** Generate a unique signal name */
  generateSignalName(type: string): Promise<string>;
  /** Generate a signal description */
  generateSignalDescription(type: string): Promise<string>;
  /** Generate a lore fragment */
  generateLore(tier: string, context: string): Promise<string>;
  /** Generate an atmospheric whisper for the log */
  generateWhisper(): Promise<string>;
  /** Generate an event description */
  generateEventDescription(title: string): Promise<string>;
}
