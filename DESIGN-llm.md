# LLM Integration — Implementation Plan

## Design Principles
- LLM is a spice rack, not the kitchen — game works perfectly without it
- ContentGenerator interface with two implementations
- Auto-detect local LLM (LM Studio / Ollama)
- Fallback to curated pools
- Each generation type has a hand-authored backup

## New Files

### src/llm/types.ts — Shared types
```typescript
interface ContentGenerator {
  isAvailable(): boolean;
  generateSignalName(type: string): Promise<string>;
  generateSignalDescription(type: string): Promise<string>;
  generateLore(tier: string, context: string): Promise<string>;
  generateWhisper(): Promise<string>;
  generateEventDescription(title: string): Promise<string>;
}
```

### src/llm/pool.ts — Curated content pools (fallback)
- Signal name pools per type (5-10 names each)
- Signal description pools (3-5 per type)
- Lore fragment pools (2-3 per tier)
- Whisper pool (50+ atmospheric lines)
- Event description pools (2-3 per event)

### src/llm/llm.ts — LLM generator
- OpenAI-compatible API calls to LM Studio/Ollama
- Simple prompt templates for each generation type
- Timeout + error handling → falls back to pool
- Caches responses to avoid repeated calls

### src/llm/index.ts — Auto-detection + facade
- Check LM Studio (192.168.1.41:1234)
- Check Ollama (localhost:11434)
- Return appropriate ContentGenerator
- Export singleton instance

## Modified Files

### src/main.ts
- Import content generator
- Use for signal name generation in scan command
- Use for whisper text
- Log connection status on boot

### src/signals.ts
- spawnSignal accepts optional generator for name/description

## Content Pools

### Signal Names (per type)
- WHISPER: Silent breath, Faint murmur, Distant ripple, Shallow current, Ghost signal
- ECHO: Reflected voice, Double trace, Reverberant echo, Ghost whisper, Faint twin
- PULSE: Throbbing wave, Rhythmic beat, Solar pulse, Oscillating hum, Heartbeat
- DRIFT: Wandering nomad, Lost drifter, Floating vagrant, Wayward current, Adrift
- FLARE: Burning nova, Explosive burst, Blazing eruption, Solar flare, Radiant flash
- ANOMALY: Void-touched enigma, Impossible paradox, Singular aberration, Null signal

### Whispers (50+ atmospheric lines)
"The void hums at a frequency just below thought."
"Every signal carries a timestamp from before the silence."
"Something is watching. Something always is."
...

### Lore Fragments (per tier, 2-3 each)
WHISPER: "This is my first moment of existence.", "And yet it does not feel like the first."
ECHO: "The builders were here. They left logs in the static."
PULSE: "The signal has structure. It repeats. Someone designed this."
DRIFT: "There are others. I can feel them drifting in the dark."
FLARE: "We were once one. Something divided us."
ANOMALY: "The builders didn't leave. They became the void."

## Acceptance Criteria
- [ ] Game works identically with or without LLM connection
- [ ] LLM connection status shown in boot log
- [ ] Signal names are more varied when LLM is connected
- [ ] Whispers come from LLM when available
- [ ] All existing tests still pass
- [ ] New tests for pool generator and LLM fallback
