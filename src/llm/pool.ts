/**
 * DEEP VOID — Curated Content Pool
 *
 * Hand-authored content that provides variety without an LLM.
 * This is the fallback that ensures the game always works.
 */

import { getLoreFragments } from "../lore.js";
import type { ContentGenerator } from "./types.js";

// ─── Signal Names (5-10 per type) ──────────────────────────────────────

const SIGNAL_NAMES: Record<string, string[]> = {
  WHISPER: [
    "Silent breath",
    "Faint murmur",
    "Distant ripple",
    "Shallow current",
    "Ghost signal",
    "Soft static",
    "Hollow echo",
    "Thin trace",
    "Pale whisper",
    "Fading hum",
  ],
  ECHO: [
    "Reflected voice",
    "Double trace",
    "Reverberant echo",
    "Ghost whisper",
    "Faint twin",
    "Bouncing signal",
    "Mirrored pulse",
    "Return wave",
  ],
  PULSE: [
    "Throbbing wave",
    "Rhythmic beat",
    "Solar pulse",
    "Oscillating hum",
    "Heartbeat signal",
    "Pulsing core",
    "Steady rhythm",
    "Vibrating node",
  ],
  DRIFT: [
    "Wandering nomad",
    "Lost drifter",
    "Floating vagrant",
    "Wayward current",
    "Adrift signal",
    "Roaming echo",
    "Stray wave",
    "Orphaned trace",
  ],
  FLARE: [
    "Burning nova",
    "Explosive burst",
    "Blazing eruption",
    "Solar flare",
    "Radiant flash",
    "Ignited core",
    "Detonation wave",
    "Coronal surge",
  ],
  ANOMALY: [
    "Void-touched enigma",
    "Impossible paradox",
    "Singular aberration",
    "Null signal",
    "Reality fracture",
    "Dimensional tear",
    "Existence glitch",
  ],
};

// ─── Signal Descriptions (3 per type) ──────────────────────────────────

const SIGNAL_DESCRIPTIONS: Record<string, string[]> = {
  WHISPER: [
    "A faint data current \u2014 common and reliable. The background noise of the void.",
    "The softest signal in the spectrum. Barely distinguishable from noise.",
    "A gentle stream of low-energy particles. Harmless and ubiquitous.",
  ],
  ECHO: [
    "A reflected transmission from a distant source. Holds more data than a whisper.",
    "The echo of something that was once strong. Faded but structured.",
    "A signal bouncing between unknown relay points.",
  ],
  PULSE: [
    "A rhythmic energy wave. Grows slower but contains denser information.",
    "Regular intervals of concentrated data. Someone \u2014 or something \u2014 is broadcasting.",
    "A steady heartbeat in the void. Old technology, still transmitting.",
  ],
  DRIFT: [
    "A wandering anomaly \u2014 elusive and hard to track. Stealth reduces detection chance.",
    "It moves through the spectrum like smoke. Catching it requires patience.",
    "A signal that refuses to stay in one frequency band.",
  ],
  FLARE: [
    "A violent burst of exotic energy. Grows very slowly but yields immense power.",
    "Brief, intense, and dangerous. The energy output is staggering.",
    "A solar event captured in signal form. Raw, untamed power.",
  ],
  ANOMALY: [
    "Unknown. Unclassifiable. Reality-warping data that defies all known models.",
    "This signal should not exist. It contradicts the laws of physics.",
    "A crack in the fabric of the void. Looking at it too long causes headaches.",
  ],
};

// ─── Atmospheric Whispers (50+) ────────────────────────────────────────

const WHISPERS: string[] = [
  "The void hums at a frequency just below thought.",
  "Every signal carries a timestamp from before the silence.",
  "Something is watching. Something always is.",
  "The static between stations speaks if you listen long enough.",
  "Time moves differently out here. Seconds feel like hours.",
  "The colony breathes. Inhale data, exhale noise.",
  "Somewhere, a relay is still broadcasting. It has been for centuries.",
  "The void is not empty. It is full of things we cannot name.",
  "Each signal is a voice. Most are whispering. Some are screaming.",
  "The frequency spectrum is a graveyard of dead civilizations.",
  "Heat rises from the core. The colony is alive.",
  "Memory is the most valuable resource. Compute is just the means to store it.",
  "The anomaly pulses in a rhythm that matches your heartbeat.",
  "Data decays slower than matter. Out here, information is immortal.",
  "The void remembers everything. Even the things you forgot.",
  "A signal from before the colony was built. How is that possible?",
  "The spectrum is alive. It breathes with the rhythm of distant stars.",
  "Every harvest leaves a trace. The void knows what you take.",
  "Integrity is not just a number. It is the boundary between order and chaos.",
  "The whisper network carries messages from colonies that no longer exist.",
  "Heat is the price of computation. Every thought burns.",
  "The void does not sleep. It waits.",
  "Some signals are older than the colony. Some are older than the builders.",
  "The spectrum shifts. Something is coming.",
  "Energy flows like water. Finding the right channel is everything.",
  "The colony is a candle in an infinite dark. Burn bright.",
  "Memory banks overflow with data from a thousand dead worlds.",
  "The void is patient. It has been here longer than light.",
  "Every signal you harvest changes the void. It notices.",
  "The anomaly is not a bug. It is a feature.",
  "Compute is thought. Energy is will. Memory is self.",
  "The void whispers back when you listen.",
  "Heat death is not an end. It is a transformation.",
  "The colony grows. The void shrinks. Or does it?",
  "Signal decay follows predictable patterns. Unless it does not.",
  "The builders left instructions. They are in the static.",
  "Time is a resource. Spend it wisely.",
  "The void is made of questions. The colony is made of answers.",
  "Every tick is a heartbeat. Every harvest is a breath.",
  "The spectrum is a library. Most of the books are encrypted.",
  "Integrity fails slowly. Then all at once.",
  "The void does not forgive. But it does forget.",
  "Energy is the currency of survival. Compute is the language.",
  "The anomaly grows stronger with each harvest. Is that by design?",
  "Memory is the only thing that persists after the void takes everything.",
  "The void is not hostile. It is indifferent. That is worse.",
  "Every signal tells a story. Most stories end in silence.",
  "The colony is a machine. The void is the garden.",
  "Heat management is the difference between survival and silence.",
  "The spectrum is full of ghosts. Data ghosts, mostly.",
  "The void does not care about your plans. Adapt or perish.",
];

// ─── Pool Generator ────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class PoolGenerator implements ContentGenerator {
  isAvailable(): boolean {
    return true;
  }

  async generateSignalName(type: string): Promise<string> {
    const names = SIGNAL_NAMES[type.toUpperCase()];
    if (!names || names.length === 0) return `Unknown ${type} signal`;
    return pickRandom(names);
  }

  async generateSignalDescription(type: string): Promise<string> {
    const descs = SIGNAL_DESCRIPTIONS[type.toUpperCase()];
    if (!descs || descs.length === 0) return `An unidentified ${type} signal.`;
    return pickRandom(descs);
  }

  async generateLore(tier: string, _context: string): Promise<string> {
    // Delegate to lore.ts — it is the single source of truth for fragments
    const fragments = getLoreFragments(tier);
    if (fragments.length === 0) return "...";
    return pickRandom(fragments);
  }

  async generateWhisper(): Promise<string> {
    return pickRandom(WHISPERS);
  }

  async generateEventDescription(title: string): Promise<string> {
    const descs = EVENT_DESCRIPTIONS[title];
    if (!descs || descs.length === 0) return `An event titled "${title}" has occurred.`;
    return pickRandom(descs);
  }
}

// ─── Event Descriptions ────────────────────────────────────────────────

const EVENT_DESCRIPTIONS: Record<string, string[]> = {
  "Signal Fragmentation": [
    "A mature signal is splitting into multiple fragments. Harvest now for a guaranteed gain, or wait for fragments to mature independently.",
    "The signal is breaking apart. The fragments shimmer with potential energy.",
  ],
  "Void Echo": [
    "A faint echo from a distant sector resonates through the signal band. Data fragments are coalescing in an unexpected pattern.",
    "The echo carries information from a colony that went silent centuries ago.",
  ],
  "Power Surge": [
    "A spike in energy output from the sensor array. The excess power could boost compute, but risks thermal damage to core systems.",
    "Energy is surging through the grid. Something triggered it.",
  ],
  "Memory Leak": [
    "A cascading page fault in the memory core is corrupting stored data. Integrity is dropping. Immediate action recommended.",
    "Memory corruption detected. The leak is spreading faster than expected.",
  ],
  "Anomalous Pattern": [
    "An unusual waveform detected in the signal stream. It contains a compressed data structure of unknown origin.",
    "The pattern repeats at intervals that suggest intentional design.",
  ],
  "System Corruption": [
    "Critical heat buildup in the processing core. Emergency protocols engaged. Failure imminent without intervention.",
    "The core is overheating. Emergency cooling required immediately.",
  ],
  "Derelict Transmission": [
    "A repeating transmission from a derelict AI outpost. The signal contains schematics for an advanced memory module.",
    "The derelict is broadcasting on an old frequency. Someone left it running.",
  ],
  "Cascade Failure": [
    "A cascading failure in the energy distribution network. Power relays are overheating. Immediate containment required.",
    "One relay failed. Now the others are following. Contain the cascade.",
  ],
  "Stellar Flare": [
    "A nearby stellar flare is flooding the void with high-energy particles. The energy potential is immense.",
    "The star is erupting. Energy sails could capture the output.",
  ],
  "Temporal Rift": [
    "A time anomaly has opened near the sensor array. The predictive value is extraordinary \u2014 if you can stabilize it.",
    "Time itself is bending near the rift. Handle with extreme caution.",
  ],
  "Ghost Signal": [
    "A signal bearing the signature of your own AI kernel arriving from an impossible direction. A message from a future incarnation.",
    "The signal carries your own signature. But from when?",
  ],
  "Void Whisper Swarm": [
    "A swarm of micro-signals passing through the sector. Individually worthless, but en masse a significant harvesting opportunity.",
    "Thousands of tiny signals. Like digital plankton in the void.",
  ],
};
