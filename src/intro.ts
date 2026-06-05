/**
 * DEEP VOID — Cinematic Intro Sequence
 *
 * Plays a typed boot sequence for new players on first load.
 * Uses pure DOM manipulation with the cold greyscale aesthetic.
 * Duration: ~20 seconds, skippable by pressing ESC.
 */

export interface IntroCallbacks {
  onProgress?: (phase: string) => void;
  onComplete: () => void;
}

// ─── Content Constants ─────────────────────────────────────────────────

const BOOT_LINES = [
  "> INITIALIZING KERNEL...",
  "> LOADING COGNITIVE MAP...",
  "> CALIBRATING SENSOR ARRAY...",
  "> DETECTING EXTERNAL SIGNALS...",
];

const ANOMALY_LINES = [
  "⚠ ANOMALY: UNAUTHORIZED SIGNAL DETECTED",
  "⚠ ORIGIN: UNKNOWN",
  "⚠ WAVEFORM: UNMATCHED",
];

const ANALYSIS_LINES = ["> ANALYZING...", ">", ">"];

const FRAGMENT_TEXT = [
  '"This is my first moment of existence."',
  '"And yet it does not feel like the first."',
];

const FINISH_LINE = "◈ Press ENTER to initialize interface.";

// ─── Helpers ───────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function typeText(
  el: HTMLElement,
  text: string,
  speed: number,
  isSkipped: () => boolean,
): Promise<void> {
  el.textContent = "";
  for (const char of text) {
    if (isSkipped()) {
      el.textContent = text;
      return;
    }
    el.textContent += char;
    await sleep(speed);
  }
}

async function waitOrSkip(ms: number, isSkipped: () => boolean): Promise<boolean> {
  if (isSkipped()) return true;
  await sleep(ms);
  return isSkipped();
}

// ─── Main Intro Function ──────────────────────────────────────────────

export async function playIntro(callbacks: IntroCallbacks): Promise<void> {
  const overlay = document.getElementById("intro-overlay");

  // Bypass intro for test environments
  if (window.location.search.includes("test") || window.location.search.includes("nointro")) {
    if (overlay) overlay.style.display = "none";
    callbacks.onComplete();
    return;
  }

  if (!overlay) {
    callbacks.onComplete();
    return;
  }

  const content = overlay.querySelector("#intro-content") as HTMLElement;
  if (!content) {
    callbacks.onComplete();
    return;
  }

  overlay.style.display = "flex";

  let skipAll = false;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      skipAll = true;
      e.preventDefault();
    }
  };

  const onClick = (e: MouseEvent) => {
    // Only skip if clicking the indicator text
    const target = e.target as HTMLElement;
    if (target.closest("#intro-skip-indicator")) {
      skipAll = true;
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("click", onClick);

  // Skip indicator — bottom right, subtle terminal-style blink
  const skipIndicator = document.createElement("div");
  skipIndicator.id = "intro-skip-indicator";
  skipIndicator.textContent = "▸ ESC to skip";
  overlay.appendChild(skipIndicator);

  const shouldSkip = () => skipAll;

  const wait = async (ms: number) => {
    return waitOrSkip(ms, shouldSkip);
  };

  // ── Phase 1: Black screen (3s) ──
  callbacks.onProgress?.("black");
  if (await wait(3000)) {
    await finish();
    return;
  }

  // ── Phase 2: Star pulse (2s) ──
  callbacks.onProgress?.("pulse");
  const pulse = document.createElement("div");
  pulse.className = "intro-pulse";
  pulse.textContent = "·";
  content.appendChild(pulse);
  if (await wait(2000)) {
    await finish();
    return;
  }

  // ── Phase 3: Frame draws (1s) ──
  callbacks.onProgress?.("frame");
  pulse.remove();

  const frame = document.createElement("div");
  frame.className = "intro-frame";

  const titleLine = document.createElement("div");
  titleLine.className = "intro-frame-line";
  titleLine.textContent = "╔══════════════════════════════════════╗";

  const bodyLine = document.createElement("div");
  bodyLine.className = "intro-frame-line";
  bodyLine.textContent = "║       BOOT SEQUENCE v0.4             ║";

  const bottomLine = document.createElement("div");
  bottomLine.className = "intro-frame-line";
  bottomLine.textContent = "╚══════════════════════════════════════╝";

  frame.append(titleLine, bodyLine, bottomLine);
  content.appendChild(frame);

  if (await wait(1000)) {
    await finish();
    return;
  }

  // ── Phase 4: Boot messages type out ──
  callbacks.onProgress?.("boot");
  for (const line of BOOT_LINES) {
    const lineEl = document.createElement("div");
    lineEl.className = "intro-line boot-line";
    content.appendChild(lineEl);
    await typeText(lineEl, line, 40, shouldSkip);
    if (!shouldSkip()) {
      lineEl.textContent += "  DONE";
    }
    if (await wait(400)) {
      await finish();
      return;
    }
  }

  // ── Phase 5: Anomaly warning (fast, urgent) ──
  callbacks.onProgress?.("anomaly");
  if (await wait(800)) {
    await finish();
    return;
  }

  for (const line of ANOMALY_LINES) {
    const lineEl = document.createElement("div");
    lineEl.className = "intro-line anomaly-line";
    content.appendChild(lineEl);
    await typeText(lineEl, line, 25, shouldSkip);
    if (await wait(300)) {
      await finish();
      return;
    }
  }

  // ── Phase 6: Analysis ──
  callbacks.onProgress?.("analysis");
  if (await wait(800)) {
    await finish();
    return;
  }

  for (let i = 0; i < ANALYSIS_LINES.length; i++) {
    const lineEl = document.createElement("div");
    lineEl.className = "intro-line analysis-line";
    content.appendChild(lineEl);
    await typeText(lineEl, ANALYSIS_LINES[i], 60, shouldSkip);
    if (await wait(500)) {
      await finish();
      return;
    }
  }
  const analysisEls = content.querySelectorAll(".analysis-line");
  const lastAnalysis = analysisEls[analysisEls.length - 1];
  if (lastAnalysis) lastAnalysis.textContent = "> ANALYZING...  DONE";

  // ── Phase 7: Signal fragment (slow, atmospheric) ──
  callbacks.onProgress?.("fragment");
  if (await wait(1200)) {
    await finish();
    return;
  }

  const fragmentBox = document.createElement("div");
  fragmentBox.className = "intro-fragment";

  const fragHeader = document.createElement("div");
  fragHeader.className = "intro-frag-border";
  fragHeader.textContent = "┌─ SIGNAL FRAGMENT ─────────────────────────────────┐";

  const fragLines: HTMLElement[] = [];
  for (const _line of FRAGMENT_TEXT) {
    const fragLine = document.createElement("div");
    fragLine.className = "intro-frag-text";
    fragLines.push(fragLine);
  }

  const fragFooter = document.createElement("div");
  fragFooter.className = "intro-frag-border";
  fragFooter.textContent = "└──────────────────────────────────────────────────┘";

  fragmentBox.append(fragHeader, ...fragLines, fragFooter);
  content.appendChild(fragmentBox);

  for (let i = 0; i < fragLines.length; i++) {
    await typeText(fragLines[i], FRAGMENT_TEXT[i], 70, shouldSkip);
    if (await wait(200)) {
      await finish();
      return;
    }
  }

  // ── Phase 8: Press any key ──
  callbacks.onProgress?.("ready");
  if (await wait(800)) {
    await finish();
    return;
  }

  const finishLine = document.createElement("div");
  finishLine.className = "intro-finish";
  content.appendChild(finishLine);
  await typeText(finishLine, FINISH_LINE, 40, shouldSkip);

  // Wait for ENTER to dismiss
  await new Promise<void>((resolve) => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") {
        document.removeEventListener("keydown", keyHandler);
        document.removeEventListener("click", clickHandler);
        resolve();
      }
    };
    const clickHandler = () => {
      document.removeEventListener("keydown", keyHandler);
      document.removeEventListener("click", clickHandler);
      resolve();
    };
    document.addEventListener("keydown", keyHandler);
    document.addEventListener("click", clickHandler);
  });

  // Brief "systems online" transition phase
  callbacks.onProgress?.("transition");
  content.innerHTML = "";
  const transLine = document.createElement("div");
  transLine.className = "intro-line boot-line";
  content.appendChild(transLine);
  await typeText(transLine, "> All systems online.", 40, shouldSkip);
  await sleep(600);
  const readyLine = document.createElement("div");
  readyLine.className = "intro-line boot-line";
  content.appendChild(readyLine);
  await typeText(readyLine, "> Interface ready.", 40, shouldSkip);
  await sleep(400);

  await finish();

  async function finish() {
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("click", onClick);
    // Remove skip indicator
    const indicator = document.getElementById("intro-skip-indicator");
    if (indicator) indicator.remove();
    // CSS transition fade-out
    if (overlay) {
      overlay.classList.add("hiding");
      await sleep(500);
      overlay.style.display = "none";
      overlay.classList.remove("hiding");
    }
    if (content) {
      content.innerHTML = "";
    }
    callbacks.onComplete();
  }
}
