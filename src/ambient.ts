/**
 * DEEP VOID — Ambient Effects
 *
 * Visual atmospheric effects that make the terminal feel alive.
 * Whisper scan lines sweep across the screen periodically,
 * and character glitches flicker random hex digits on display elements.
 */

export interface DomElements {
  tick: HTMLElement;
  uptime: HTMLElement;
  resC: HTMLElement;
  resE: HTMLElement;
  resM: HTMLElement;
  resH: HTMLElement;
}

let whisperTimeout: ReturnType<typeof setTimeout> | null = null;
let glitchTimeout: ReturnType<typeof setTimeout> | null = null;

/** Schedule a whisper scan line effect — horizontal light sweep across the screen */
export function scheduleWhisper(): void {
  if (whisperTimeout) clearTimeout(whisperTimeout);
  const delay = 30000 + Math.random() * 30000;
  whisperTimeout = setTimeout(() => {
    const el = document.createElement("div");
    el.className = "whisper-scan-line";
    el.style.cssText =
      "position:fixed;bottom:60px;left:0;width:100%;height:1px;pointer-events:none;z-index:999;" +
      "background:linear-gradient(90deg,transparent 0%,rgba(191,207,210,0.12) 30%,rgba(174,181,184,0.25) 50%,rgba(191,207,210,0.12) 70%,transparent 100%);" +
      "animation:whisper-scan 1.8s ease-out forwards;";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1900);
    scheduleWhisper();
  }, delay);
}

/** Schedule a character glitch effect — random hex char replaces a display element temporarily */
export function scheduleGlitch(els: DomElements): void {
  if (glitchTimeout) clearTimeout(glitchTimeout);
  const delay = 30000 + Math.random() * 60000;
  glitchTimeout = setTimeout(() => {
    const targets = [els.tick, els.uptime, els.resC, els.resE, els.resM, els.resH];
    const el = targets[Math.floor(Math.random() * targets.length)];
    const orig = el.textContent || "";
    if (orig.length < 2) {
      scheduleGlitch(els);
      return;
    }
    const pos = Math.floor(Math.random() * orig.length);
    const hex = "0123456789ABCDEF";
    el.textContent = orig.slice(0, pos) + hex[Math.floor(Math.random() * 16)] + orig.slice(pos + 1);
    el.style.color = "var(--accent-data)";
    setTimeout(() => {
      el.textContent = orig;
      el.style.color = "";
    }, 80);
    scheduleGlitch(els);
  }, delay);
}

/** Cleanup all ambient effect timeouts — call on HMR dispose or page unload */
export function cleanupAmbient(): void {
  if (whisperTimeout) {
    clearTimeout(whisperTimeout);
    whisperTimeout = null;
  }
  if (glitchTimeout) {
    clearTimeout(glitchTimeout);
    glitchTimeout = null;
  }
}
