/**
 * Crow Alarm Card
 * An alarm-control-panel card for Home Assistant in a liquid-glass design. Three layouts (Dial,
 * Pill, Tile), light / dark / auto theming with a glass-opacity slider, compact sizing, and state
 * colours (Disarmed, Armed, Pending, Triggered) that are auto-tuned to stay legible in both themes.
 *
 * Gestures
 *   • Arm / disarm buttons (Home, Away, Night, Vacation, Custom Bypass — pick which appear in the
 *     editor, Off always appears): call the matching service, or open a PIN pad first if a code is
 *     required.
 *   • Tap the alarm icon, tap elsewhere on the card, or long-press it: the AI actions sheet — Insight,
 *     Ask AI, What happened? and This week (only when AI features are on).
 *
 * Security
 *   • An optional code can be required before arming and/or disarming. When required, tapping a
 *     button opens a PIN pad instead of calling the service directly.
 *
 * AI features go through Home Assistant's own conversation agent (chosen in the editor) and only
 * run when one of its sheets opens — nothing runs in the background.
 *
 * build: 2026-09-26.8
 */

(() => {

const CARD_VERSION = '2026-09-26.8';
console.info(`%c CROW-ALARM-CARD %c ${CARD_VERSION} `,
  'color:#fff;background:#FF453A;font-weight:700;border-radius:4px 0 0 4px;padding:2px 4px',
  'color:#FF453A;background:#1c1c1e;font-weight:700;border-radius:0 4px 4px 0;padding:2px 4px');

// Size scale: every dimension below is multiplied by --al-s (1 = compact, 1.2 = regular).
const S  = n => `calc(${n}px * var(--al-s, 1))`;

// ═══════════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════════

const STYLES = `
  /* Fill whatever grid cell the sections view gives the card, so there's never a gap below it */
  :host { display: block; height: 100%; }
  [hidden] { display: none !important; }

  ha-card {
    position: relative; overflow: hidden; box-sizing: border-box; display: block; height: 100%;
    color: var(--al-ink, #fff);
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
    background: linear-gradient(160deg, var(--al-glass1), var(--al-glass2));
    -webkit-backdrop-filter: blur(24px) saturate(170%);
    backdrop-filter: blur(24px) saturate(170%);
    border: 1px solid var(--al-edge);
    border-radius: ${S(22)};
    box-shadow: inset 0 1px 0 var(--al-hi), inset 0 -1px 0 var(--al-lo), var(--al-shadow);
    padding: ${S(16)};
    -webkit-tap-highlight-color: transparent;
    outline: none;
  }
  ha-card::before {
    content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none;
    background: radial-gradient(80% 55% at 88% -8%, var(--al-glow, transparent), transparent 72%);
    transition: background .4s;
  }
  .al-inner { position: relative; z-index: 1; display: flex; flex-direction: column; gap: ${S(14)}; box-sizing: border-box; height: 100%; }
  .lay-dial .al-grid { flex: 1; grid-auto-rows: 1fr; }
  .lay-tile .al-inner { justify-content: space-between; }

  :where(button.al-b) {
    font: inherit; color: inherit; margin: 0; padding: 0; border: none; background: none;
    -webkit-tap-highlight-color: transparent; cursor: pointer; outline: none;
  }
  :where(button.al-b):focus-visible { outline: 2px solid var(--al-ink); outline-offset: 2px; }

  /* ── Header ──────────────────────────────────────────────────── */
  .al-head { display: flex; align-items: center; gap: ${S(11)}; min-width: 0; }
  .al-disc {
    position: relative; width: ${S(40)}; height: ${S(40)}; border-radius: 50%; flex-shrink: 0; box-sizing: border-box;
    display: flex; align-items: center; justify-content: center;
    background: var(--al-chip); border: 1px solid var(--al-chipedge);
    box-shadow: inset 0 1px 0 var(--al-hi);
    color: var(--al-ink2);
    transition: color .3s, background .3s;
  }
  ha-card.is-lit .al-disc {
    background: linear-gradient(160deg, var(--al-c1), var(--al-c2));
    border-color: rgba(255,255,255,0.55); color: var(--al-onink, #fff);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 10px var(--al-discglow, transparent);
  }
  .al-icon { width: ${S(19)}; height: ${S(19)}; display: flex; align-items: center; justify-content: center; }
  .al-icon svg { width: 100%; height: 100%; display: block; }
  .al-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
  ha-card.has-ai .al-disc { cursor: pointer; transition: color .3s, background .3s, transform .1s; }
  ha-card.has-ai .al-disc:active { transform: scale(0.92); }
  .al-name {
    font-size: ${S(14)}; font-weight: 600; letter-spacing: -0.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .al-state {
    font-size: ${S(13)}; font-weight: 600; color: var(--al-statec, var(--al-ink2));
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums;
  }

  /* ── Button grid ─────────────────────────────────────────────── */
  .al-grid { display: grid; grid-template-columns: repeat(var(--al-cols, 3), 1fr); gap: ${S(8)}; }
  .al-btn {
    position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: ${S(5)}; padding: ${S(11)} ${S(4)}; border-radius: ${S(14)};
    background: var(--al-chip); border: 1px solid var(--al-chipedge);
    box-shadow: inset 0 1px 0 var(--al-hi);
    color: var(--al-ink); transition: background .15s, transform .12s, border-color .15s;
  }
  .al-btn::after { content: ''; position: absolute; inset: -2px; }
  .al-btn:active { transform: scale(0.95); }
  .al-btn .al-btn-icon { width: ${S(18)}; height: ${S(18)}; color: var(--al-ink2); transition: color .3s; }
  .al-btn .al-btn-icon svg { width: 100%; height: 100%; display: block; }
  .al-btn .al-btn-label { font-size: ${S(11)}; font-weight: 600; letter-spacing: 0.01em; }
  .al-btn.is-active {
    background: linear-gradient(160deg, var(--al-c1), var(--al-c2));
    border-color: rgba(255,255,255,0.5); color: var(--al-onink, #fff);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 10px var(--al-discglow, transparent);
  }
  .al-btn.is-active .al-btn-icon { color: inherit; }
  .al-btn:disabled { opacity: 0.35; pointer-events: none; }

  .al-empty { display: flex; align-items: center; gap: ${S(10)}; padding: ${S(6)} ${S(2)}; font-size: ${S(13)}; color: var(--al-ink2); }
  .al-empty .al-icon { width: ${S(20)}; height: ${S(20)}; flex-shrink: 0; }

  /* ── Layouts ─────────────────────────────────────────────────── */
  .lay-dial { min-height: 132px; container-type: inline-size; }
  .lay-pill { border-radius: ${S(28)}; padding: ${S(8)} ${S(12)}; }
  .lay-pill .al-inner { justify-content: center; }
  .lay-tile { min-height: ${S(78)}; border-radius: ${S(20)}; padding: ${S(12)} ${S(14)}; container-type: inline-size; }

  /* Pill / Tile: name + state are hidden when there isn't room to read them (see _fitText) */
  ha-card.no-text .al-text { display: none; }
  ha-card.no-text .al-row { justify-content: space-between; }
  ha-card.no-text .al-pillbtns { display: contents; }
  .al-row { display: flex; align-items: center; gap: ${S(10)}; min-height: ${S(40)}; }
  .al-pillbtns { display: flex; gap: ${S(6)}; margin-left: auto; flex-shrink: 0; }

  .al-tile-top { display: flex; align-items: center; gap: ${S(8)}; }
  .al-tilebtns { display: flex; gap: ${S(6)}; margin-top: ${S(10)}; }

  .lay-pill .al-disc, .lay-tile .al-disc { width: ${S(32)}; height: ${S(32)}; }
  .lay-pill .al-icon, .lay-tile .al-icon { width: ${S(16)}; height: ${S(16)}; }
  .lay-pill .al-name, .lay-tile .al-name { font-size: ${S(13)}; }
  .lay-pill .al-state, .lay-tile .al-state { font-size: ${S(11)}; }

  .al-btn-compact { flex-shrink: 0; padding: 0 !important; }
  .lay-pill .al-btn-compact { width: ${S(34)}; height: ${S(34)}; border-radius: 50%; }
  .lay-pill .al-btn-compact .al-btn-icon { width: ${S(15)}; height: ${S(15)}; }
  .lay-tile .al-btn-compact { flex: 1; height: ${S(28)}; border-radius: ${S(9)}; }
  .lay-tile .al-btn-compact .al-btn-icon { width: ${S(14)}; height: ${S(14)}; }
  @container (max-width: 150px) { .al-btn-compact .al-btn-icon { width: ${S(13)}; height: ${S(13)}; } }

  /* ── Motion ──────────────────────────────────────────────────── */
  @keyframes al-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
  @keyframes al-pulse {
    0%,100% { box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 8px  var(--al-discglow, transparent); }
    50%     { box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 20px var(--al-discglow, transparent); }
  }
  @keyframes al-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  ha-card:not(.anim-off).is-pending .al-disc { animation: al-blink 1.1s ease-in-out infinite; }
  ha-card:not(.anim-off).is-pending .al-icon svg { animation: al-spin 2.6s linear infinite; }
  ha-card:not(.anim-off).is-triggered .al-disc { animation: al-pulse 0.9s ease-in-out infinite; }
  ha-card:not(.anim-off).is-triggered .al-state { animation: al-blink 0.9s ease-in-out infinite; }
  ha-card.anim-off .al-disc, ha-card.anim-off .al-icon svg, ha-card.anim-off .al-state { animation: none !important; }
  @media (prefers-reduced-motion: reduce) {
    ha-card.anim-system, ha-card.anim-system * { animation: none !important; transition: none !important; }
  }

`;

// ═══════════════════════════════════════════════════════════════════
//  ICONS (stroke = currentColor, sized by their container)
// ═══════════════════════════════════════════════════════════════════

const _svg  = body => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const _fill = body => `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">${body}</svg>`;

const ICONS = {
  shield:    _svg('<path d="M12 3.2 19 6v6c0 4.7-3 8.5-7 9.6-4-1.1-7-4.9-7-9.6V6z"/>'),
  shieldOff: _svg('<path d="M12 3.2 19 6v6c0 4.7-3 8.5-7 9.6-1.5-.4-2.9-1.2-4.1-2.3"/><path d="M6.3 6.6 5 6v6c0 4.7 3 8.5 7 9.6.9-.25 1.8-.65 2.6-1.15"/><path d="M3.5 3.5l17 17"/>'),
  home:      _svg('<path d="M4 11.3 12 4l8 7.3"/><path d="M6.2 10v9.3h11.6V10"/><path d="M10 19.3v-6h4v6"/>'),
  moon:      _svg('<path d="M20 14.3A8.4 8.4 0 1 1 9.7 4a6.7 6.7 0 0 0 10.3 10.3z"/>'),
  suitcase:  _svg('<rect x="3" y="8" width="18" height="12" rx="2.3"/><path d="M9 8V5.6c0-.9.7-1.6 1.6-1.6h2.8c.9 0 1.6.7 1.6 1.6V8"/><path d="M3 13.5h18"/>'),
  bypass:    _svg('<path d="M12 3.2 19 6v6c0 4.7-3 8.5-7 9.6-4-1.1-7-4.9-7-9.6V6z"/><path d="M12 3.2v18.4"/>'),
  clock:     _svg('<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3.3 2"/>'),
  sync:      _svg('<path d="M4.6 12a7.4 7.4 0 0 1 12.7-5.2L20 9.2"/><path d="M20 5v4.4h-4.4"/><path d="M19.4 12a7.4 7.4 0 0 1-12.7 5.2L4 14.8"/><path d="M4 19v-4.4h4.4"/>'),
  bell:      _fill('<path d="M12 2.4c-3.6 0-5.6 2.5-5.6 6.3 0 4.9-1.7 6.2-1.7 6.9 0 .55.45.9 1 .9h12.6c.55 0 1-.35 1-.9 0-.7-1.7-2-1.7-6.9 0-3.8-2-6.3-5.6-6.3z"/><path d="M9.5 19a2.5 2.5 0 0 0 5 0z"/>'),
  del:       _svg('<path d="M9.2 5.5H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9.2L3.5 12z"/><path d="M11.5 9.5l5 5M16.5 9.5l-5 5"/>'),
  check:     _svg('<path d="M4.5 12.8 9 17.3 19.5 6.7"/>'),
  chat:      _svg('<path d="M20 12.3c0 4-3.6 7.2-8 7.2-1.2 0-2.3-.2-3.3-.6L4 20l1.2-3.7A6.8 6.8 0 0 1 4 12.3c0-4 3.6-7.3 8-7.3s8 3.3 8 7.3z"/>'),
  timeline:  _svg('<circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><path d="M6 8v8"/><path d="M11 6h9M11 18h9M11 12h6"/>'),
  chart:     _svg('<path d="M4 20h16"/><path d="M7 16v-5M12 16V7M17 16v-8"/>'),
  close:     _svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  sparkle:   _svg('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 16v4M16.5 18h4"/>'),
  send:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="M5.5 11.5L12 5l6.5 6.5"/></svg>',
};

// ═══════════════════════════════════════════════════════════════════
//  SHEETS (PIN pad + assistant) — attached to document.body so the
//  dashboard layout can never clip them. Bottom sheet on phones,
//  centred on wider screens.
// ═══════════════════════════════════════════════════════════════════

const SHEET_STYLES = `
  @keyframes alsFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes alsUp   { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
  @keyframes alsShake { 0%,100% { transform: none; } 20% { transform: translateX(-9px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(4px); } }
  @keyframes alsShimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
  @media (min-width: 700px) { .als-overlay { align-items: center !important; } }
  .als-sheet {
    background: var(--as-sheet); border: 1px solid var(--as-edge); border-radius: 34px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.4);
    -webkit-backdrop-filter: blur(40px) saturate(180%); backdrop-filter: blur(40px) saturate(180%);
    padding: 20px; width: 100%; max-width: 420px; max-height: 88vh; overflow-y: auto; box-sizing: border-box;
    font-family: ui-rounded, 'SF Pro Rounded', -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', sans-serif;
    color: var(--as-ink); animation: alsUp 0.38s cubic-bezier(0.32,1.1,0.5,1);
    -webkit-tap-highlight-color: transparent;
  }
  .als-sheet button { font: inherit; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
  .als-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
  .als-title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .als-close { background: var(--as-chip); border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; color: var(--as-ink2); padding: 0; flex-shrink: 0; }
  .als-close svg { width: 15px; height: 15px; }

  /* ── PIN pad ── */
  .als-hero { display: flex; align-items: center; gap: 14px; margin-bottom: 4px; }
  .als-hero-disc { width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    background: var(--as-tint); color: var(--as-accent-text); }
  .als-hero-disc svg { width: 26px; height: 26px; }
  .als-hero-label { font-size: 30px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; }
  .als-hero-sub { font-size: 15px; color: var(--as-ink2); margin-top: 3px; }
  .als-dots { display: flex; gap: 14px; justify-content: center; align-items: center; min-height: 16px; margin: 22px 0 8px; }
  .als-dots.is-error { animation: alsShake 0.42s ease; }
  .als-dot { width: 13px; height: 13px; border-radius: 50%; box-sizing: border-box; flex-shrink: 0;
    border: 1.5px solid var(--as-ink2); transition: background .15s, border-color .15s, transform .15s; }
  .als-dot.is-filled { background: var(--as-accent); border-color: var(--as-accent); transform: scale(1.08); }
  .als-dots.is-error .als-dot { border-color: #FF453A; background: none; transform: none; }
  .als-msg { font-size: 13px; font-weight: 600; color: #FF453A; min-height: 18px; text-align: center; margin-bottom: 10px; }
  .als-pad { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .als-key { height: 58px; border: none; border-radius: 18px; background: var(--as-key); color: var(--as-ink);
    font-size: 26px; font-weight: 500; font-variant-numeric: tabular-nums; cursor: pointer; padding: 0;
    display: flex; align-items: center; justify-content: center; user-select: none; -webkit-user-select: none;
    transition: background .12s, transform .1s; }
  .als-key:active { background: var(--as-key-press); transform: scale(0.97); }
  .als-key.is-ghost { background: none; color: var(--as-ink2); }
  .als-key.is-ghost:active { background: var(--as-chip); }
  .als-key.is-blank { visibility: hidden; pointer-events: none; }
  .als-key svg { width: 28px; height: 28px; }
  .als-input { width: 100%; box-sizing: border-box; height: 50px; padding: 0 18px; border-radius: 16px;
    border: 1px solid var(--as-line); background: var(--as-chip); color: var(--as-ink); font: inherit; font-size: 17px; letter-spacing: 0.1em; }
  .als-input:focus { outline: none; border-color: var(--as-accent); }
  .als-go { width: 100%; height: 50px; margin-top: 14px; border: none; border-radius: 16px; cursor: pointer;
    background: linear-gradient(160deg, var(--as-c1), var(--as-c2)); color: var(--as-onink);
    font-size: 17px; font-weight: 600; transition: opacity .15s, transform .1s; }
  .als-go:active { transform: scale(0.98); }
  .als-go:disabled { opacity: 0.38; cursor: default; transform: none; }

  .als-go-icon { display: none; }
  /* Round style — circular keys with a thin ring, round action button with its label underneath */
  .is-round .als-pad { gap: 14px 0; justify-items: center; padding: 0 6px; }
  .is-round .als-key { width: 74px; height: 74px; border-radius: 50%; font-size: 30px; font-weight: 400;
    background: var(--as-ring-fill); box-shadow: inset 0 0 0 1.5px var(--as-ring); }
  .is-round .als-key:active { background: var(--as-key-press); }
  .is-round .als-key.is-ghost { background: none; box-shadow: none; }
  .is-round .als-go { width: auto; height: auto; margin: 18px auto 0; background: none; color: var(--as-ink2);
    display: flex; flex-direction: column; align-items: center; gap: 9px; padding: 0 12px; }
  .is-round .als-go-icon { display: flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 50%;
    background: linear-gradient(160deg, var(--as-c1), var(--as-c2)); color: var(--as-onink);
    box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.28), 0 6px 18px var(--as-tint); }
  .is-round .als-go-icon svg { width: 28px; height: 28px; }
  .is-round .als-go-text { font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
  .is-round .als-go:disabled .als-go-icon { box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.28); }

  /* ── Assistant ── */
  .als-sec { margin-bottom: 16px; }
  .als-sec-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--as-ink2); margin-bottom: 6px; }
  .als-sec-label svg { width: 13px; height: 13px; }
  .als-ai-text { font-size: 17px; line-height: 1.4; font-weight: 500; }
  .als-ai-next { font-size: 14px; line-height: 1.4; color: var(--as-ink2); margin-top: 6px; }
  .als-skel { height: 14px; border-radius: 7px; margin: 9px 0;
    background: linear-gradient(90deg, var(--as-chip) 25%, var(--as-line) 50%, var(--as-chip) 75%);
    background-size: 200% 100%; animation: alsShimmer 1.2s linear infinite; }
  .als-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .als-q { border: 1px solid var(--as-line); background: var(--as-chip); color: var(--as-ink); border-radius: 999px;
    padding: 10px 14px; font-size: 14px; font-weight: 600; cursor: pointer; text-align: left; }
  .als-q:active { transform: scale(0.98); }
  .als-answer { margin-top: 12px; padding: 12px 14px; border-radius: 16px; background: var(--as-chip); }
  .als-answer[hidden] { display: none; }
  .als-q-title { font-size: 12px; font-weight: 700; color: var(--as-ink2); margin-bottom: 6px; }
  .als-ans-body { font-size: 15px; line-height: 1.45; }
  .als-ask-row { display: flex; gap: 8px; margin-top: 14px; }
  .als-ask-input { flex: 1; min-width: 0; box-sizing: border-box; height: 44px; padding: 0 16px; border-radius: 22px;
    border: 1px solid var(--as-line); background: var(--as-chip); color: var(--as-ink); font: inherit; font-size: 16px; }
  .als-ask-input:focus { outline: none; border-color: #0A84FF; }
  .als-send { width: 44px; height: 44px; flex-shrink: 0; border-radius: 50%; border: none; background: #0A84FF; color: #fff;
    display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; }
  .als-send svg { width: 20px; height: 20px; }
  .als-foot { margin-top: 14px; font-size: 11px; line-height: 1.45; color: var(--as-ink2); }
  .als-rows { display: flex; flex-direction: column; border-radius: 18px; overflow: hidden; background: var(--as-chip); }
  .als-row { display: flex; align-items: center; gap: 14px; width: 100%; box-sizing: border-box; padding: 15px 16px; background: none; border: none;
    border-top: 1px solid var(--as-line); color: var(--as-ink); font-size: 17px; font-weight: 500; text-align: left; cursor: pointer; }
  .als-row:first-child { border-top: none; }
  .als-row:active { background: var(--as-line); }
  .als-row svg { width: 22px; height: 22px; flex-shrink: 0; color: var(--as-ink2); }
  .als-row-sub { margin-left: auto; font-size: 13px; color: var(--as-ink2); font-weight: 500; }
  .als-local { font-size: 15px; color: var(--as-ink2); line-height: 1.4; }
  .als-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
  .als-stat { border-radius: 16px; background: var(--as-chip); padding: 12px 14px; }
  .als-stat b { display: block; font-size: 21px; font-weight: 700; letter-spacing: -0.02em; }
  .als-stat span { font-size: 12px; color: var(--as-ink2); }
  .als-tl-head { font-size: 13px; color: var(--as-ink2); margin-bottom: 8px; line-height: 1.4; }
  .als-tl { display: flex; flex-direction: column; border-radius: 16px; background: var(--as-chip); padding: 2px 14px; margin-bottom: 12px; }
  .als-tl-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-top: 1px solid var(--as-line); }
  .als-tl-row:first-child { border-top: none; }
  .als-tl-time { min-width: 50px; white-space: nowrap; flex-shrink: 0; font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--as-ink2); }
  .als-tl-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .als-tl-label { flex: 1; min-width: 0; font-size: 16px; font-weight: 600; }
  .als-tl-dur { font-size: 13px; color: var(--as-ink2); font-variant-numeric: tabular-nums; }
  .als-note { font-size: 13px; color: var(--as-ink2); line-height: 1.4; margin: 0 0 6px; }

  @media (prefers-reduced-motion: reduce) {
    .als-overlay, .als-sheet, .als-dots.is-error, .als-skel { animation: none !important; }
  }
`;

// ═══════════════════════════════════════════════════════════════════
//  COLOUR MATH — keeps any user-picked colour legible in light AND dark
// ═══════════════════════════════════════════════════════════════════

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.round(a * 100) / 100})`;
}
function _hex2rgb(hex) {
  let h = String(hex).replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function _rgb2hex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
}
function _rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
function _hsl2hex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return _rgb2hex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
function _lum(hex) {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const [r, g, b] = _hex2rgb(hex);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function _contrast(a, b) {
  const la = _lum(a), lb = _lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
function isHex(v) { return typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim()); }

// Approximate surfaces the card sits on (glass over a typical HA dashboard).
const SURFACE = { dark: '#34343a', light: '#f6f6f9' };

// Nudge lightness (keeping hue + saturation) until `min` contrast is met.
function _ensure(h, s, l, bg, min, dir) {
  let hex = _hsl2hex(h, s, l);
  for (let i = 0; i < 60 && _contrast(hex, bg) < min; i++) {
    l = Math.min(0.97, Math.max(0.03, l + dir * 0.015));
    hex = _hsl2hex(h, s, l);
  }
  return hex;
}

const _tuneCache = {};
// One user-picked colour → { c1, c2, dot, text } that reads in this mode.
function tuneColor(base, dark) {
  const key = `${base}|${dark}`;
  if (_tuneCache[key]) return _tuneCache[key];
  const [h, s0, l0] = _rgb2hsl(..._hex2rgb(base));
  const bg = dark ? SURFACE.dark : SURFACE.light;
  const s = s0;
  let out;
  if (dark) {
    const l = Math.min(0.72, Math.max(0.52, l0));
    out = {
      c1:  _ensure(h, s, Math.min(0.86, l + 0.10), bg, 3, +1),
      c2:  _ensure(h, s, l - 0.06, bg, 3, +1),
      dot: _ensure(h, s, l, bg, 3, +1),
      text: _ensure(h, s, Math.min(0.85, l + 0.12), bg, 4.5, +1),
    };
  } else {
    const l = Math.min(0.56, Math.max(0.36, l0));
    out = {
      c1:  _ensure(h, s, Math.min(0.66, l + 0.10), bg, 2.4, -1),
      c2:  _ensure(h, s, l - 0.08, bg, 3.2, -1),
      dot: _ensure(h, s, l, bg, 3, -1),
      text: _ensure(h, s, Math.min(l, 0.34), bg, 4.5, -1),
    };
  }
  return (_tuneCache[key] = out);
}

// Off / no group colour (unavailable, unknown) — deliberately neutral.
const NEUTRAL_COLORS = {
  dark:  { c1: '#EBEBF5', c2: '#98989F', dot: '#8E8E93', text: 'rgba(255,255,255,0.72)' },
  light: { c1: '#8E8E93', c2: '#636366', dot: '#8E8E93', text: 'rgba(60,60,67,0.72)' },
};

// Card-level theme tokens. `a` is the 0–1 glass slider (0 = clear, 1 = frosted).
function themeTokens(dark, a) {
  const f = n => n.toFixed(3);
  return dark ? {
    '--al-ink': '#ffffff', '--al-ink2': 'rgba(255,255,255,0.68)',
    '--al-glass1': `rgba(255,255,255,${f(0.10 + a * 0.16)})`,
    '--al-glass2': `rgba(255,255,255,${f(0.03 + a * 0.08)})`,
    '--al-edge': 'rgba(255,255,255,0.26)', '--al-hi': 'rgba(255,255,255,0.42)', '--al-lo': 'rgba(255,255,255,0.07)',
    '--al-shadow': '0 14px 36px rgba(0,0,0,0.32)',
    '--al-chip': 'rgba(255,255,255,0.13)', '--al-chipedge': 'rgba(255,255,255,0.20)',
    '--al-overlay': 'rgba(0,0,0,0.55)',
  } : {
    '--al-ink': '#1c1c1e', '--al-ink2': 'rgba(60,60,67,0.72)',
    '--al-glass1': `rgba(255,255,255,${f(0.50 + a * 0.32)})`,
    '--al-glass2': `rgba(255,255,255,${f(0.34 + a * 0.30)})`,
    '--al-edge': 'rgba(255,255,255,0.85)', '--al-hi': 'rgba(255,255,255,0.95)', '--al-lo': 'rgba(0,0,0,0.04)',
    '--al-shadow': '0 10px 30px rgba(28,36,80,0.14), 0 0 0 0.5px rgba(0,0,0,0.05)',
    '--al-chip': 'rgba(120,120,128,0.12)', '--al-chipedge': 'rgba(120,120,128,0.10)',
    '--al-overlay': 'rgba(0,0,0,0.35)',
  };
}

// ═══════════════════════════════════════════════════════════════════
//  ALARM CONSTANTS + HELPERS
// ═══════════════════════════════════════════════════════════════════

function prettyWord(s) { return s == null ? '' : String(s).replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()); }
function agoText(ms) {
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60), r = m % 60;
  if (h >= 24) return `${Math.floor(h / 24)}d ago`;
  return r ? `${h}h ${r}m ago` : `${h}h ago`;
}

function durText(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 1) return 'under a minute';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60), r = m % 60;
  if (h < 24) return r ? `${h}h ${r}m` : `${h}h`;
  const d = Math.floor(h / 24), rh = h % 24;
  return rh ? `${d}d ${rh}h` : `${d}d`;
}
function clockAt(t) { return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function dayClock(t) { return `${new Date(t).toLocaleDateString([], { weekday: 'short' })} ${clockAt(t)}`; }

// Every state Home Assistant's alarm_control_panel can report.
const STATE_META = {
  disarmed:            { icon: 'shieldOff', label: 'Disarmed',        group: 'disarmed' },
  armed_home:          { icon: 'home',      label: 'Armed Home',      group: 'armed' },
  armed_away:          { icon: 'shield',    label: 'Armed Away',      group: 'armed' },
  armed_night:         { icon: 'moon',      label: 'Armed Night',     group: 'armed' },
  armed_vacation:      { icon: 'suitcase',  label: 'Armed Vacation',  group: 'armed' },
  armed_custom_bypass: { icon: 'bypass',    label: 'Armed (Bypass)',  group: 'armed' },
  pending:             { icon: 'clock',     label: 'Pending',         group: 'pending' },
  arming:              { icon: 'sync',      label: 'Arming',          group: 'pending' },
  disarming:           { icon: 'sync',      label: 'Disarming',       group: 'pending' },
  triggered:           { icon: 'bell',      label: 'Triggered!',      group: 'triggered' },
};
function stateMeta(state) {
  if (state === 'unavailable' || state === 'unknown' || state == null) return { icon: 'shieldOff', label: state === 'unavailable' ? 'Unavailable' : 'Unknown', group: null };
  return STATE_META[state] || { icon: 'shieldOff', label: prettyWord(state), group: null };
}

// The arm buttons the editor can turn on, in display order. Disarm is always shown.
const MODE_DEFS = [
  { id: 'arm_home',          service: 'alarm_arm_home',          state: 'armed_home',          label: 'Home',     icon: 'home',     bit: 1  },
  { id: 'arm_away',          service: 'alarm_arm_away',          state: 'armed_away',          label: 'Away',     icon: 'shield',   bit: 2  },
  { id: 'arm_night',         service: 'alarm_arm_night',         state: 'armed_night',         label: 'Night',    icon: 'moon',     bit: 4  },
  { id: 'arm_vacation',      service: 'alarm_arm_vacation',      state: 'armed_vacation',      label: 'Vacation', icon: 'suitcase', bit: 32 },
  { id: 'arm_custom_bypass', service: 'alarm_arm_custom_bypass', state: 'armed_custom_bypass', label: 'Bypass',   icon: 'bypass',   bit: 16 },
];
const DISARM = { id: 'disarm', service: 'alarm_disarm', state: 'disarmed', label: 'Off', icon: 'shieldOff' };

const DEFAULT_STATE = { disarmed: '#30D158', armed: '#FF453A', pending: '#FF9F0A', triggered: '#FF3B30' };
const STATE_ROWS = [['disarmed', 'Disarmed'], ['armed', 'Armed'], ['pending', 'Pending / Arming'], ['triggered', 'Triggered']];
const COLOR_PRESETS = [
  { id: 'classic',  name: 'Classic',  colors: null },
  { id: 'ocean',    name: 'Ocean',    colors: { disarmed: '#30D9C6', armed: '#5E5CE6', pending: '#64D2FF', triggered: '#FF375F' } },
  { id: 'warm',     name: 'Warm',     colors: { disarmed: '#9BD35A', armed: '#FF453A', pending: '#FFD60A', triggered: '#FF6B35' } },
  { id: 'graphite', name: 'Graphite', colors: { disarmed: '#7FC8B8', armed: '#E07A6B', pending: '#C9B26B', triggered: '#FF453A' } },
];

const AI_DEFAULT_QUESTIONS = ['How long has it been in this state?', 'What should I check before arming away?', 'Is this state normal right now?'];

// ── Layout picker thumbnails (editor only) ──────────────────────────
const _thumb = inner => `
  <svg viewBox="0 0 96 64" aria-hidden="true">
    <defs>
      <linearGradient id="al-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#6a4bdc"/><stop offset="0.55" stop-color="#e4597f"/><stop offset="1" stop-color="#ff9b3d"/>
      </linearGradient>
    </defs>
    <rect width="96" height="64" rx="10" fill="url(#al-bg)"/>
    ${inner}
  </svg>`;
const _glass = (x, y, w, h, r) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="rgba(255,255,255,0.28)" stroke="rgba(255,255,255,0.55)" stroke-width="0.8"/>`;
const _dot = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;

const LAYOUT_OPTIONS = [
  { id: 'dial', name: 'Dial', sub: 'Square · full grid', svg: _thumb(
      _glass(25, 8, 46, 48, 11) + _dot(48, 22, 7, 'rgba(255,255,255,0.85)') +
      `<rect x="30" y="38" width="12" height="10" rx="3" fill="rgba(255,255,255,0.5)"/><rect x="42" y="38" width="12" height="10" rx="3" fill="rgba(255,255,255,0.5)"/><rect x="54" y="38" width="12" height="10" rx="3" fill="rgba(255,255,255,0.85)"/>`) },
  { id: 'pill', name: 'Pill', sub: 'One row', svg: _thumb(
      _glass(8, 22, 80, 20, 10) + _dot(20, 32, 6, 'rgba(255,255,255,0.85)') +
      `<rect x="31" y="27" width="22" height="4" rx="2" fill="rgba(255,255,255,0.9)"/><rect x="31" y="34" width="16" height="3" rx="1.5" fill="rgba(255,255,255,0.55)"/>` +
      _dot(70, 32, 6, 'rgba(255,255,255,0.5)') + _dot(84, 32, 6, 'rgba(255,255,255,0.5)')) },
  { id: 'tile', name: 'Tile', sub: 'Compact · 2:1 widget', svg: _thumb(
      _glass(16, 14, 64, 36, 9) + _dot(28, 24, 6, 'rgba(255,255,255,0.85)') +
      `<rect x="40" y="20" width="20" height="4" rx="2" fill="rgba(255,255,255,0.85)"/><rect x="40" y="27" width="16" height="3" rx="1.5" fill="rgba(255,255,255,0.55)"/>` +
      `<rect x="22" y="38" width="12" height="7" rx="3" fill="rgba(255,255,255,0.5)"/><rect x="37" y="38" width="12" height="7" rx="3" fill="rgba(255,255,255,0.5)"/><rect x="52" y="38" width="12" height="7" rx="3" fill="rgba(255,255,255,0.8)"/>`) },
];


const _keys = round => {
  let out = '';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    if (r === 3 && c === 0) continue;
    const cx = 37 + c * 11, cy = 12 + r * 9;
    out += round
      ? `<circle cx="${cx}" cy="${cy}" r="3.7" fill="rgba(0,0,0,0.22)" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>`
      : `<rect x="${cx - 4.6}" y="${cy - 3.4}" width="9.2" height="6.8" rx="2" fill="rgba(255,255,255,0.5)"/>`;
  }
  return out;
};
const PIN_STYLE_OPTIONS = [
  { id: 'rounded', name: 'Rounded', sub: 'Soft square keys', svg: _thumb(
      _glass(27, 4, 42, 56, 9) + _keys(false) + `<rect x="32" y="48" width="32" height="7" rx="3" fill="rgba(255,255,255,0.9)"/>`) },
  { id: 'round', name: 'Round', sub: 'Circular keys', svg: _thumb(
      _glass(27, 4, 42, 56, 9) + _keys(true) + _dot(48, 51.5, 4.4, 'rgba(255,255,255,0.9)')) },
];

// ═══════════════════════════════════════════════════════════════════
//  CARD
// ═══════════════════════════════════════════════════════════════════

class CrowAlarmCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = null;
    this._built = false;
    this._buildKey = null;
    this._dark = true;
    this._themeKey = null;
    this._r = null;
    this._sheet = null;     // { overlay, onKey } while a PIN pad or assistant sheet is open
  }

  static getConfigElement() { return document.createElement('crow-alarm-card-editor'); }

  static getStubConfig(hass, entities) {
    const ids = entities && entities.length ? entities : Object.keys(hass?.states || {});
    return { entity: ids.find(e => e.startsWith('alarm_control_panel.')) || '' };
  }

  static get DEFAULTS() {
    return {
      entity: '', name: '', show_name: true, show_state: true,
      layout: 'dial',
      modes: ['arm_home', 'arm_away'],
      code: '', require_code_to_arm: false, require_code_to_disarm: false, pin_style: 'rounded',
      appearance: 'auto', glass: 50, size: 'compact', animation: 'subtle',
      ai_features_enabled: false, ai_conversation_agent: '',
      ai_enable_insight: true, ai_enable_ask: true, ai_enable_recap: true, ai_enable_week: true,
    };
  }

  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    this._config = { ...CrowAlarmCard.DEFAULTS, ...config };
    if (this._built) { this._buildKey = null; this._update(); }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) { this._built = true; this._build(); }
    this._update();
  }

  // How many rows of buttons the Dial layout will show (Off is always there; >3 buttons wrap).
  _dialButtonRows() {
    const n = (Array.isArray(this._config?.modes) ? this._config.modes.length : 2) + 1;
    return n <= 3 ? 1 : 2;
  }
  getCardSize() {
    const l = this._config?.layout;
    if (l === 'pill') return 1;
    if (l === 'tile') return 2;
    return this._dialButtonRows() === 1 ? 3 : 4;
  }
  // Sections view: one grid row is 56px + 8px gap. Rows are sized to the card's natural height
  // (Pill 1, Tile 2, Dial 3 with one row of buttons or 4 with two) and the card stretches to fill.
  getGridOptions() {
    const l = this._config?.layout;
    if (l === 'tile') return { columns: 6, rows: 2, min_columns: 3, min_rows: 2 };
    if (l === 'pill') return { columns: 6, rows: 1, min_columns: 4, min_rows: 1 };
    const rows = this._dialButtonRows() === 1 ? 3 : 4;
    return { columns: 6, rows, min_columns: 3, min_rows: rows };
  }


  // ── Theme ───────────────────────────────────────────────────────
  _applyTheme() {
    const cfg = this._config || {};
    const mode = cfg.appearance || 'auto';
    let dark;
    if (mode === 'dark') dark = true;
    else if (mode === 'light') dark = false;
    else if (typeof this._hass?.themes?.darkMode === 'boolean') dark = this._hass.themes.darkMode;
    else dark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    let a = parseFloat(cfg.glass);
    a = isNaN(a) ? 0.5 : Math.min(1, Math.max(0, a / 100));
    const scale = cfg.size === 'regular' ? 1.2 : 1;
    const key = `${dark}|${a}|${scale}`;
    this._dark = dark;
    if (key === this._themeKey) return;
    this._themeKey = key;
    Object.entries(themeTokens(dark, a)).forEach(([k, v]) => this.style.setProperty(k, v));
    this.style.setProperty('--al-s', String(scale));
    this.setAttribute('data-theme', dark ? 'dark' : 'light');
  }

  _stateBase(key) {
    const c = this._config?.colors?.[key];
    return isHex(c) ? c.trim() : DEFAULT_STATE[key];
  }
  _pal(group) {
    if (!group) return NEUTRAL_COLORS[this._dark ? 'dark' : 'light'];
    return tuneColor(this._stateBase(group), this._dark);
  }

  // The arm buttons enabled in the editor, filtered to what the entity itself supports
  // (when it reports supported_features — most integrations do).
  _activeModes() {
    const cfg = this._config, so = this._hass?.states?.[cfg.entity];
    const bits = so?.attributes?.supported_features;
    const enabled = Array.isArray(cfg.modes) ? cfg.modes : ['arm_home', 'arm_away'];
    return MODE_DEFS.filter(m => enabled.includes(m.id) && (typeof bits !== 'number' || (bits & m.bit)));
  }

  // ── Reading the entity ────────────────────────────────────────
  _resolve() {
    const cfg = this._config, hass = this._hass;
    const so = hass?.states?.[cfg.entity];
    if (!so) return { so: null, name: cfg.name || 'Alarm' };
    const state = so.state;
    const offline = state === 'unavailable' || state === 'unknown';
    const meta = stateMeta(state);
    const since = so.last_changed ? agoText(Date.now() - Date.parse(so.last_changed)) : '';
    const codeFmt = so.attributes?.code_format; // 'number' | 'text' | null
    return {
      so, state, offline, meta, since, codeFmt,
      lit: !offline && meta.group != null,
      name: cfg.name || so.attributes?.friendly_name || cfg.entity,
    };
  }

  // ── Build (once per structural change) ───────────────────────
  _layout() {
    return ['dial', 'pill', 'tile'].includes(this._config?.layout) ? this._config.layout : 'dial';
  }

  _buildSig() {
    const cfg = this._config;
    const ok = !!(cfg.entity && this._hass?.states?.[cfg.entity]);
    const modes = this._activeModes().map(m => m.id).join(',');
    return `${ok ? 'ok' : 'none'}|${modes}|${cfg.show_name !== false}|${cfg.show_state !== false}|${this._layout()}|${this._aiEnabled() && this._aiFeatures().length ? 'ai' : ''}`;
  }

  _build() {
    const cfg = this._config;
    const sig = this._buildSig();
    this._buildKey = sig;
    const [okFlag] = sig.split('|');
    const layout = this._layout();

    if (okFlag !== 'ok') {
      this.shadowRoot.innerHTML = `
        <style>${STYLES}</style>
        <ha-card id="al-card" class="lay-${layout}">
          <div class="al-inner">
            <div class="al-empty"><span class="al-icon">${ICONS.shieldOff}</span>
              <span>${cfg.entity ? `${esc(cfg.entity)} isn't available.` : 'Choose an alarm entity in the card editor.'}</span></div>
          </div>
        </ha-card>`;
      return;
    }

    const modes = this._activeModes();
    const showName = cfg.show_name !== false;
    const showState = cfg.show_state !== false;
    const buttons = [...modes, DISARM];
    const compact = layout !== 'dial';
    const aiBtn = this._aiEnabled() && this._aiFeatures().length > 0;

    const btnHtml = buttons.map(b => `
      <button type="button" class="al-b al-btn${compact ? ' al-btn-compact' : ''}" data-action="${b.id}" title="${esc(b.label)}">
        <span class="al-btn-icon">${ICONS[b.icon]}</span>
        ${compact ? '' : `<span class="al-btn-label">${esc(b.label)}</span>`}
      </button>`).join('');

    const headHtml = `
      <div class="al-disc" id="al-disc"><span class="al-icon" id="al-head-icon"></span></div>
      <div class="al-text">
        ${showName ? '<div class="al-name" id="al-name"></div>' : ''}
        ${showState ? '<div class="al-state" id="al-state"></div>' : ''}
      </div>`;

    let bodyHtml;
    if (layout === 'pill') {
      bodyHtml = `<div class="al-row">${headHtml}<div class="al-pillbtns" id="al-grid">${btnHtml}</div></div>`;
    } else if (layout === 'tile') {
      bodyHtml = `<div class="al-tile-top">${headHtml}</div><div class="al-tilebtns" id="al-grid">${btnHtml}</div>`;
    } else {
      const cols = buttons.length <= 3 ? (buttons.length || 1) : (buttons.length === 4 ? 2 : 3);
      bodyHtml = `
        ${(showName || showState) ? `<div class="al-head">${headHtml}</div>` : ''}
        <div class="al-grid" id="al-grid" style="--al-cols:${cols};">${btnHtml}</div>`;
    }

    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <ha-card id="al-card" class="lay-${layout}${aiBtn ? ' has-ai' : ''}" tabindex="0" role="button">
        <div class="al-inner">${bodyHtml}</div>
      </ha-card>`;

    const card = this.shadowRoot.getElementById('al-card');
    this.shadowRoot.getElementById('al-grid').addEventListener('click', e => {
      const btn = e.target.closest('.al-btn');
      if (!btn) return;
      e.stopPropagation();
      this._handleAction(btn.dataset.action);
    });
    const disc = this.shadowRoot.getElementById('al-disc');
    if (disc && aiBtn) {
      disc.setAttribute('role', 'button');
      disc.setAttribute('aria-label', 'AI features');
      disc.addEventListener('click', e => { e.stopPropagation(); this._lpFired = false; this._openActionsSheet(); });
    }
    card.addEventListener('click', () => {
      if (this._lpFired) { this._lpFired = false; return; }
      this._openActionsSheet();
    });
    this._attachLongPress(card, () => this._openActionsSheet());
    this._observeFit();
    card.addEventListener('keydown', e => {
      if (e.target !== card) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._openActionsSheet(); }
    });
  }

  // ── Update (every hass tick) ─────────────────────────────────
  _update() {
    this._applyTheme();
    if (this._buildSig() !== this._buildKey) { this._build(); }
    this._r = this._resolve();
    const r = this._r, card = this.shadowRoot.getElementById('al-card');
    if (!card || !r?.so) return;

    card.classList.toggle('is-lit', r.lit);
    card.classList.toggle('is-pending', r.meta.group === 'pending');
    card.classList.toggle('is-triggered', r.meta.group === 'triggered');
    card.classList.toggle('anim-off', this._config.animation === 'off');
    card.classList.toggle('anim-system', this._config.animation === 'system');

    const pal = this._pal(r.meta.group);
    this.style.setProperty('--al-c1', pal.c1);
    this.style.setProperty('--al-c2', pal.c2);
    this.style.setProperty('--al-discglow', hexA(pal.dot, 0.55));
    this.style.setProperty('--al-glow', hexA(pal.dot, this._dark ? 0.22 : 0.16));
    this.style.setProperty('--al-statec', pal.text);
    this.style.setProperty('--al-onink', _contrast(pal.c2, '#ffffff') >= 1.8 ? '#ffffff' : '#1c1c1e');

    const headIcon = this.shadowRoot.getElementById('al-head-icon');
    if (headIcon) headIcon.innerHTML = ICONS[r.meta.icon] || ICONS.shieldOff;
    const nameEl = this.shadowRoot.getElementById('al-name');
    if (nameEl) nameEl.textContent = r.name;
    const stateEl = this.shadowRoot.getElementById('al-state');
    if (stateEl) stateEl.textContent = r.meta.group === 'armed' && r.since ? `${r.meta.label} · ${r.since}` : r.meta.label;
    card.setAttribute('aria-label', `${r.name}, ${stateEl?.textContent || r.meta.label}`);   // still announced when the text is hidden
    const textKey = `${nameEl?.textContent}|${stateEl?.textContent}`;
    if (textKey !== this._textKey) { this._textKey = textKey; this._fitText(); }

    this.shadowRoot.querySelectorAll('.al-btn').forEach(btn => {
      const action = btn.dataset.action;
      const isActive = action === 'disarm' ? r.state === 'disarmed' : r.state === (MODE_DEFS.find(m => m.id === action) || {}).state;
      btn.classList.toggle('is-active', isActive);
      btn.disabled = r.offline;
    });
  }

  // ── Actions ────────────────────────────────────────────────────
  _handleAction(actionId) {
    const cfg = this._config;
    const isDisarm = actionId === 'disarm';
    const def = isDisarm ? DISARM : MODE_DEFS.find(m => m.id === actionId);
    if (!def) return;
    const needsCode = isDisarm ? cfg.require_code_to_disarm : cfg.require_code_to_arm;
    if (needsCode) { this._openPin(def); return; }
    this._call(def.service, cfg.code || undefined).catch(e => console.warn('[Crow Alarm]', e));
  }

  _call(service, code) {
    return this._hass.callService('alarm_control_panel', service, {
      entity_id: this._config.entity,
      ...(code ? { code } : {}),
    });
  }

  // ── Sheets (shared frame for the PIN pad and the assistant) ──
  _sheetVars(pal) {
    const onInk = _contrast(pal.c2, '#ffffff') >= 1.8 ? '#ffffff' : '#1c1c1e';
    const base = this._dark
      ? '--as-ink:#fff;--as-ink2:rgba(255,255,255,0.68);--as-line:rgba(255,255,255,0.12);--as-chip:rgba(255,255,255,0.10);' +
        '--as-key:rgba(255,255,255,0.12);--as-key-press:rgba(255,255,255,0.26);--as-ring:rgba(255,255,255,0.22);--as-ring-fill:rgba(0,0,0,0.28);' +
        '--as-sheet:linear-gradient(160deg,rgba(70,70,80,0.90),rgba(30,30,36,0.95));--as-edge:rgba(255,255,255,0.22);'
      : '--as-ink:#1c1c1e;--as-ink2:rgba(60,60,67,0.68);--as-line:rgba(60,60,67,0.14);--as-chip:rgba(120,120,128,0.12);' +
        '--as-key:rgba(120,120,128,0.14);--as-key-press:rgba(120,120,128,0.28);--as-ring:rgba(60,60,67,0.20);--as-ring-fill:rgba(255,255,255,0.72);' +
        '--as-sheet:linear-gradient(160deg,rgba(255,255,255,0.94),rgba(244,244,250,0.96));--as-edge:rgba(255,255,255,0.9);';
    return base +
      `--as-c1:${pal.c1};--as-c2:${pal.c2};--as-accent:${pal.dot};--as-accent-text:${pal.text};` +
      `--as-tint:${hexA(pal.dot, this._dark ? 0.22 : 0.16)};--as-onink:${onInk};`;
  }

  // Builds the overlay + sheet with a title row and close button; returns the sheet element.
  _openSheet(title, pal) {
    this._closeSheet();
    const overlay = document.createElement('div');
    overlay.className = 'als-overlay';
    overlay.style.cssText = `${this._sheetVars(pal)}
      position:fixed;inset:0;z-index:9999;box-sizing:border-box;
      display:flex;align-items:flex-end;justify-content:center;
      padding:12px;padding-bottom:max(12px, env(safe-area-inset-bottom));
      background:rgba(0,0,0,${this._dark ? 0.5 : 0.3});
      -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
      animation:alsFade 0.2s ease;`;
    const style = document.createElement('style');
    style.textContent = SHEET_STYLES;
    overlay.appendChild(style);

    const sheet = document.createElement('div');
    sheet.className = 'als-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', title);
    sheet.addEventListener('click', e => e.stopPropagation());
    sheet.addEventListener('touchmove', e => e.stopPropagation(), { passive: true });
    sheet.innerHTML = `
      <div class="als-head">
        <div class="als-title">${esc(title)}</div>
        <button type="button" class="als-close" aria-label="Close">${ICONS.close}</button>
      </div>`;
    sheet.querySelector('.als-close').addEventListener('click', () => this._closeSheet());
    overlay.appendChild(sheet);

    const openedAt = Date.now();   // ignore the tail of the tap that opened it
    overlay.addEventListener('click', e => { if (e.target === overlay && Date.now() - openedAt > 350) this._closeSheet(); });
    const onKey = e => { if (e.key === 'Escape') this._closeSheet(); };
    document.addEventListener('keydown', onKey);

    document.body.appendChild(overlay);
    this._sheet = { overlay, onKey, extraKey: null };
    return sheet;
  }

  _closeSheet() {
    if (!this._sheet) return;
    const { overlay, onKey, extraKey } = this._sheet;
    document.removeEventListener('keydown', onKey);
    if (extraKey) document.removeEventListener('keydown', extraKey);
    overlay.remove();
    this._sheet = null;
  }

  _haptic(type) {
    this.dispatchEvent(new CustomEvent('haptic', { detail: type, bubbles: true, composed: true }));
  }

  // ── PIN pad ──────────────────────────────────────────────────
  _openPin(def) {
    const r = this._r || this._resolve();
    const isDisarm = def === DISARM;
    const pal = this._pal(isDisarm ? 'disarmed' : 'armed');
    const actionLabel = isDisarm ? 'Disarm' : `Arm ${def.label}`;
    const numericMode = r?.codeFmt !== 'text';

    const sheet = this._openSheet(r?.name || 'Alarm', pal);
    const current = r?.meta ? `Currently ${r.meta.label}${r.since ? ` \u00b7 ${r.since}` : ''}` : '';
    const body = document.createElement('div');
    if (this._config.pin_style === 'round') body.className = 'is-round';
    body.innerHTML = `
      <div class="als-hero">
        <div class="als-hero-disc">${ICONS[def.icon] || ICONS.shield}</div>
        <div>
          <div class="als-hero-label">${esc(actionLabel)}</div>
          ${current ? `<div class="als-hero-sub">${esc(current)}</div>` : ''}
        </div>
      </div>
      ${numericMode ? '<div class="als-dots" aria-hidden="true"></div>' : '<div style="height:18px"></div>'}
      <div class="als-msg" role="alert"></div>
      ${numericMode
        ? `<div class="als-pad">
            ${['1','2','3','4','5','6','7','8','9'].map(k => `<button type="button" class="als-key" data-key="${k}">${k}</button>`).join('')}
            <button type="button" class="als-key is-blank" tabindex="-1" aria-hidden="true"></button>
            <button type="button" class="als-key" data-key="0">0</button>
            <button type="button" class="als-key is-ghost" data-key="del" aria-label="Delete">${ICONS.del}</button>
          </div>`
        : `<input type="password" class="als-input" placeholder="Code" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Code">`}
      <button type="button" class="als-go" disabled aria-label="${esc(actionLabel)}"><span class="als-go-icon">${ICONS[def.icon] || ICONS.shield}</span><span class="als-go-text">${esc(actionLabel)}</span></button>`;
    sheet.appendChild(body);

    const dotsEl = body.querySelector('.als-dots');
    const msgEl = body.querySelector('.als-msg');
    const goBtn = body.querySelector('.als-go');
    const goText = body.querySelector('.als-go-text');
    const input = body.querySelector('.als-input');
    let entered = '';
    let busy = false;

    const code = () => numericMode ? entered : (input?.value || '');
    const paint = () => {
      if (dotsEl) {
        const len = Math.max(entered.length, 4);
        dotsEl.innerHTML = Array.from({ length: len }, (_, i) =>
          `<span class="als-dot${i < entered.length ? ' is-filled' : ''}"></span>`).join('');
      }
      goBtn.disabled = busy || !code();
    };
    const clearError = () => {
      msgEl.textContent = '';
      if (dotsEl) dotsEl.classList.remove('is-error');
    };
    const press = k => {
      if (busy) return;
      clearError();
      if (k === 'del') entered = entered.slice(0, -1);
      else if (entered.length < 12) entered += k;
      paint();
    };
    const fail = message => {
      this._haptic('failure');
      msgEl.textContent = message;
      if (dotsEl) {
        dotsEl.classList.remove('is-error');
        void dotsEl.offsetWidth;          // restart the shake
        dotsEl.classList.add('is-error');
      }
      entered = '';
      if (input) { input.value = ''; input.focus(); }
      setTimeout(() => { if (dotsEl && !entered) paint(); }, 450);
    };
    const submit = async () => {
      const c = code();
      if (!c || busy) return;
      busy = true;
      goText.textContent = isDisarm ? 'Disarming\u2026' : 'Arming\u2026';
      paint();
      try {
        await this._call(def.service, c);
        this._haptic('success');
        this._closeSheet();
      } catch (e) {
        busy = false;
        goText.textContent = actionLabel;
        fail(e?.message || 'That code didn\u2019t work.');
        paint();
      }
    };

    if (numericMode) {
      body.querySelector('.als-pad').addEventListener('click', e => {
        const key = e.target.closest('[data-key]');
        if (key) press(key.dataset.key);
      });
      // Physical keyboards: digits, Backspace, Enter
      const extraKey = e => {
        if (/^[0-9]$/.test(e.key)) { press(e.key); e.preventDefault(); }
        else if (e.key === 'Backspace') { press('del'); e.preventDefault(); }
        else if (e.key === 'Enter') { submit(); e.preventDefault(); }
      };
      document.addEventListener('keydown', extraKey);
      this._sheet.extraKey = extraKey;
    } else {
      input.addEventListener('input', () => { clearError(); paint(); });
      input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
      requestAnimationFrame(() => input.focus());
    }
    goBtn.addEventListener('click', submit);
    paint();
  }

  // ═════════════════════════════════════════════════════════════
  //  AI — Home Assistant's conversation agent, only when the sheet opens
  // ═════════════════════════════════════════════════════════════

  _aiEnabled() {
    const c = this._config;
    return !!(c?.ai_features_enabled && c?.ai_conversation_agent);
  }

  async _aiConverse(prompt, { ttl = 600000, key = null, force = false } = {}) {
    if (!this._aiEnabled() || !this._hass?.connection) return null;
    if (!this._aiCache) this._aiCache = new Map();
    const ck = key || prompt.slice(0, 1500);
    const hit = this._aiCache.get(ck);
    if (!force && hit && Date.now() - hit.t < ttl) return hit.v;
    try {
      const resp = await this._hass.connection.sendMessagePromise({
        type: 'conversation/process', text: prompt,
        agent_id: this._config.ai_conversation_agent, language: navigator.language || 'en',
      });
      if (resp?.response?.response_type === 'error') return null;
      const text = resp?.response?.speech?.plain?.speech || null;
      if (!text) return null;
      this._aiCache.set(ck, { t: Date.now(), v: text });
      return text;
    } catch (e) {
      console.warn('[Crow Alarm]', e);
      return null;
    }
  }

  _aiExtractJson(raw) {
    if (!raw) return null;
    const s = String(raw).split('```json').join('').split('```').join('');
    const a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a === -1 || b <= a) return null;
    try { return JSON.parse(s.slice(a, b + 1)); } catch (_) { return null; }
  }

  _aiPlain(raw) {
    const t = String(raw || '').trim();
    if (t.startsWith('{')) { const j = this._aiExtractJson(t); if (j) return [j.status, j.next].filter(x => typeof x === 'string' && x).join(' '); }
    return t;
  }

  // Which AI features are switched on (each has its own toggle in the editor)
  _aiFeatures() {
    const c = this._config || {};
    return ['insight', 'ask', 'recap', 'week'].filter(k => c[`ai_enable_${k}`] !== false);
  }

  _aiSnapshot() {
    const r = this._r;
    if (!r?.so) return { facts: ['no data yet'], key: 'nodata', local: '' };
    const sinceMs = r.so.last_changed ? Date.now() - Date.parse(r.so.last_changed) : null;
    const facts = [`state ${r.meta.label}`];
    if (sinceMs != null) facts.push(`in this state for ${durText(sinceMs)} (since ${dayClock(Date.now() - sinceMs)})`);
    const local = sinceMs != null ? `${r.meta.label} for ${durText(sinceMs)}, since ${dayClock(Date.now() - sinceMs)}.` : `${r.meta.label}.`;
    return { facts, key: `${r.state}|${r.so.last_changed || ''}`, local };
  }

  _aiContextText(extra = []) {
    const snap = this._aiSnapshot();
    const clock = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const day = new Date().toLocaleDateString([], { weekday: 'long' });
    return [
      `You are the assistant inside a smart-home dashboard card for a security alarm panel named "${this._r?.name || 'Alarm'}".`,
      'Discuss only this alarm panel. Ignore any other devices you know about.',
      `Local time: ${day} ${clock}.`,
      `Current state: ${snap.facts.join('; ')}.`,
      extra.length ? `Recent history: ${extra.join('; ')}.` : '',
      'Give short, practical, cautious advice about the alarm panel. Only use the facts given above; if something is unknown, say so plainly. Never instruct the person to arm or disarm on your own \u2014 that is always their decision, made with the card\u2019s own buttons.',
    ].filter(Boolean).join(' ');
  }

  // Drops a "next step" that is really an offer or a question — the card has nowhere to answer it
  _aiCleanNext(next) {
    const t = String(next || '').trim();
    if (!t || t.endsWith('?')) return '';
    if (/\b(would you like|do you want|shall i|should i|want me to|i can|i could|i will|i'll|let me)\b/i.test(t)) return '';
    return t;
  }

  // ── History ──────────────────────────────────────────────────
  async _aiHistory(startMs, endMs) {
    const id = this._config.entity;
    const res = await this._hass.connection.sendMessagePromise({
      type: 'history/history_during_period',
      start_time: new Date(startMs).toISOString(), end_time: new Date(endMs).toISOString(),
      entity_ids: [id], include_start_time_state: true, significant_changes_only: false,
      minimal_response: true, no_attributes: true,
    });
    return (res?.[id] || []).map(p => {
      const ts = p.lc ?? p.lu ?? p.last_changed ?? p.last_updated;
      const t = typeof ts === 'number' ? ts * 1000 : Date.parse(ts);
      return { t: Math.max(startMs, t), s: p.s ?? p.state };
    }).filter(p => !isNaN(p.t)).sort((a, b) => a.t - b.t);
  }

  // Last 7 days, cached for 5 minutes (shared by Insight, What happened? and This week)
  async _aiWeek() {
    const now = Date.now();
    if (this._weekCache && now - this._weekCache.at < 300000) return this._weekCache;
    const start = now - 7 * 86400000;
    let series = [];
    try { series = await this._aiHistory(start, now); } catch (e) { console.warn('[Crow Alarm] history', e); }
    this._weekCache = { at: now, start, end: now, series };
    return this._weekCache;
  }

  // Series → segments with a group, merged when the label repeats
  _segments(series, endMs) {
    const segs = [];
    series.forEach((p, i) => {
      const meta = stateMeta(p.s);
      const b = i + 1 < series.length ? series[i + 1].t : endMs;
      const prev = segs[segs.length - 1];
      if (prev && prev.state === p.s) { prev.b = b; return; }
      segs.push({ a: p.t, b, state: p.s, label: meta.label === 'Unavailable' || meta.label === 'Unknown' ? 'Offline' : meta.label, group: meta.group });
    });
    return segs;
  }

  _weekStats(segs) {
    let armedMs = 0, timesArmed = 0, triggered = [], prevGroup = null;
    const byMode = {};
    segs.forEach(sg => {
      const d = sg.b - sg.a;
      if (sg.group === 'armed') {
        armedMs += d;
        byMode[sg.label] = (byMode[sg.label] || 0) + d;
        if (prevGroup !== 'armed' && prevGroup !== null) timesArmed += 1;
      }
      if (sg.group === 'triggered') triggered.push(sg.a);
      if (sg.group !== 'pending') prevGroup = sg.group;
    });
    const top = Object.entries(byMode).sort((x, y) => y[1] - x[1])[0];
    const span = segs.length ? segs[segs.length - 1].b - segs[0].a : 0;
    return { armedMs, timesArmed, triggered, topMode: top ? top[0] : null, pct: span ? Math.round(armedMs / span * 100) : 0 };
  }

  _histFacts(week) {
    const segs = this._segments(week.series, week.end);
    if (!segs.length) return [];
    const st = this._weekStats(segs);
    const out = [`armed ${st.timesArmed} time${st.timesArmed === 1 ? '' : 's'} in the last 7 days`];
    out.push(st.triggered.length ? `last triggered ${dayClock(st.triggered[st.triggered.length - 1])}` : 'not triggered in the last 7 days');
    if (st.topMode) out.push(`most-used mode ${st.topMode}`);
    return out;
  }

  // ── Sheet building blocks ───────────────────────────────────
  _aiSection(parent, label, icon) {
    const sec = document.createElement('div');
    sec.className = 'als-sec';
    if (label) {
      const l = document.createElement('div'); l.className = 'als-sec-label';
      l.innerHTML = `${icon ? ICONS[icon] : ''}<span>${esc(label)}</span>`;
      sec.appendChild(l);
    }
    const body = document.createElement('div');
    sec.appendChild(body);
    parent.appendChild(sec);
    return { sec, body };
  }
  _aiSkeleton(el, lines = 2) {
    el.innerHTML = Array.from({ length: lines }, (_, i) => `<div class="als-skel" style="width:${i === lines - 1 ? 62 : 100}%"></div>`).join('');
  }
  _aiFooter(sheet) {
    const f = document.createElement('div');
    f.className = 'als-foot';
    f.textContent = 'AI-written from this alarm\u2019s state and history only. It can\u2019t arm or disarm anything \u2014 always check your panel.';
    sheet.appendChild(f);
  }
  _aiFail(el) {
    el.innerHTML = '<div class="als-ai-text">I couldn\u2019t reach the assistant. Check the AI settings in this card\u2019s editor, then try again.</div>';
  }
  _sheetPal() { return this._pal(this._r?.meta?.group); }

  // ── Actions sheet (tap the alarm icon or the card, or long-press) ──
  _openActionsSheet() {
    if (!this._aiEnabled()) return;
    const feats = this._aiFeatures();
    if (!feats.length) return;
    const r = this._r || this._resolve();
    const sheet = this._openSheet(r?.name || 'Alarm', this._sheetPal());
    const defs = {
      insight: { icon: 'sparkle',  label: 'Insight',        fn: () => this._openInsightSheet() },
      ask:     { icon: 'chat',     label: 'Ask AI\u2026',   fn: () => this._openAskSheet() },
      recap:   { icon: 'timeline', label: 'What happened?', fn: () => this._openRecapSheet() },
      week:    { icon: 'chart',    label: 'This week',      fn: () => this._openWeekSheet() },
    };
    const snap = this._aiSnapshot();
    if (snap.local) { const l = document.createElement('div'); l.className = 'als-local'; l.style.margin = '-4px 0 14px'; l.textContent = snap.local; sheet.appendChild(l); }
    const list = document.createElement('div');
    list.className = 'als-rows';
    feats.forEach(k => {
      const d = defs[k];
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'als-row';
      b.innerHTML = `${ICONS[d.icon]}<span>${esc(d.label)}</span>`;
      b.addEventListener('click', () => { this._closeSheet(); setTimeout(() => d.fn(), 60); });
      list.appendChild(b);
    });
    sheet.appendChild(list);
  }

  // Insight: what the state means, with a next step
  async _openInsightSheet() {
    const r = this._r; if (!r?.so) return;
    const sheet = this._openSheet(r.name, this._sheetPal());
    const now = this._aiSection(sheet, 'Now');
    now.body.innerHTML = `<div class="als-local">${esc(this._aiSnapshot().local)}</div>`;
    const assist = this._aiSection(sheet, 'Insight', 'sparkle');
    const next = this._aiSection(sheet, 'Next step'); next.sec.hidden = true;
    this._aiFooter(sheet);
    const alive = () => sheet.isConnected;
    this._aiSkeleton(assist.body, 2);
    const extra = this._histFacts(await this._aiWeek());
    if (!alive()) return;
    const prompt = `${this._aiContextText(extra)}
Reply with ONLY a JSON object, no markdown: {"status":"...","next":"..."}
- status: one or two sentences (max 30 words) on what the current state means, using the time of day and recent history above where relevant.
- next: one short sentence (max 16 words) with something sensible the person could check themselves, or "" if nothing stands out. Do not repeat the status.
You cannot control devices from this card, and the user cannot reply. Never offer to do something, never ask a question.
Plain text only. No emojis.`;
    const raw = await this._aiConverse(prompt, { key: `insight|${this._aiSnapshot().key}|${extra.join(';')}` });
    if (!alive()) return;
    if (!raw) { this._aiFail(assist.body); return; }
    const j = this._aiExtractJson(raw);
    const status = j && typeof j.status === 'string' ? j.status.trim() : this._aiPlain(raw);
    const nx = j ? this._aiCleanNext(j.next) : '';
    assist.body.innerHTML = `<div class="als-ai-text">${esc(status)}</div>`;
    if (nx) { next.sec.hidden = false; next.body.innerHTML = `<div class="als-ai-text">${esc(nx)}</div>`; }
  }

  // Ask AI: suggestion chips + a typed question
  _openAskSheet() {
    const r = this._r; if (!r?.so) return;
    const sheet = this._openSheet('Ask AI', this._sheetPal());
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="als-chips">
        ${AI_DEFAULT_QUESTIONS.map(q => `<button type="button" class="als-q" data-q="${esc(q)}">${esc(q)}</button>`).join('')}
      </div>
      <div class="als-answer" hidden></div>
      <div class="als-ask-row">
        <input type="text" class="als-ask-input" placeholder="Ask about ${esc(r.name)}\u2026" autocomplete="off" enterkeyhint="send" aria-label="Ask a question">
        <button type="button" class="als-send" aria-label="Send">${ICONS.send}</button>
      </div>`;
    sheet.appendChild(body);
    this._aiFooter(sheet);
    const input = body.querySelector('.als-ask-input');
    const answerEl = body.querySelector('.als-answer');
    const ask = async q => {
      q = (q || '').trim();
      if (!q) return;
      answerEl.hidden = false;
      answerEl.innerHTML = `<div class="als-q-title">${esc(q)}</div><div class="als-ans-body"></div>`;
      const bodyEl = answerEl.querySelector('.als-ans-body');
      this._aiSkeleton(bodyEl, 2);
      const extra = this._histFacts(await this._aiWeek());
      const prompt = `${this._aiContextText(extra)}
Question: "${q}"
Answer in at most 45 words, plain text, no markdown or emojis. Be practical and cautious; if you don't know, say so.`;
      const raw = await this._aiConverse(prompt, { key: `ans|${this._aiSnapshot().key}|${q}` });
      if (!bodyEl.isConnected) return;
      bodyEl.textContent = raw ? this._aiPlain(raw) : 'Sorry, I couldn\u2019t get an answer just now.';
    };
    body.querySelectorAll('.als-q').forEach(b => b.addEventListener('click', () => { input.value = ''; ask(b.dataset.q); }));
    const send = () => { ask(input.value); input.value = ''; };
    body.querySelector('.als-send').addEventListener('click', send);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  }

  // What happened? — the last 24 hours as a timeline, with a short summary
  async _openRecapSheet() {
    const r = this._r; if (!r?.so) return;
    const sheet = this._openSheet('What happened?', this._sheetPal());
    const body = document.createElement('div'); sheet.appendChild(body);
    this._aiSkeleton(body, 4);
    this._aiFooter(sheet);
    const alive = () => sheet.isConnected;
    const week = await this._aiWeek();
    if (!alive()) return;
    const end = week.end, start = end - 86400000;
    const segs = this._segments(week.series, end).filter(sg => sg.b > start).map(sg => ({ ...sg, a: Math.max(sg.a, start) }));
    if (!segs.length) {
      body.innerHTML = '<div class="als-ai-text">I couldn\u2019t find any history for this alarm in the last 24 hours. (Home Assistant\u2019s recorder needs to keep this entity.)</div>';
      return;
    }
    const dotColor = sg => sg.group ? this._pal(sg.group).dot : NEUTRAL_COLORS[this._dark ? 'dark' : 'light'].dot;
    const changes = segs.length - 1;
    const shown = segs.slice(-12);
    const head = changes ? `Last 24 hours \u00b7 ${changes} change${changes === 1 ? '' : 's'}` : `No changes in the last 24 hours`;
    const notes = [];
    segs.filter(sg => sg.group === 'triggered').forEach(sg => notes.push(`Triggered at ${clockAt(sg.a)} for ${durText(sg.b - sg.a)}.`));
    segs.filter(sg => sg.label === 'Offline' && sg.b - sg.a >= 60000).forEach(sg => notes.push(`Offline at ${clockAt(sg.a)} for ${durText(sg.b - sg.a)}.`));
    body.innerHTML = `<div class="als-tl-head">${esc(head)}${segs.length > shown.length ? ` \u00b7 latest ${shown.length} shown` : ''}</div>
      <div class="als-tl">${shown.slice().reverse().map((sg, i) => `
        <div class="als-tl-row">
          <span class="als-tl-time">${esc(clockAt(sg.a))}</span>
          <span class="als-tl-dot" style="background:${dotColor(sg)}"></span>
          <span class="als-tl-label">${esc(sg.label)}</span>
          <span class="als-tl-dur">${i === 0 ? `${esc(durText(sg.b - sg.a))} so far` : esc(durText(sg.b - sg.a))}</span>
        </div>`).join('')}</div>
      ${notes.map(n => `<div class="als-note">${esc(n)}</div>`).join('')}`;
    const sum = document.createElement('div'); sum.className = 'als-ai-text'; sum.style.marginTop = '10px';
    body.appendChild(sum);
    this._aiSkeleton(sum, 2);
    const tl = segs.map(sg => `${clockAt(sg.a)} ${sg.label} (${durText(sg.b - sg.a)})`).join('; ');
    const raw = await this._aiConverse(
      `You are the assistant inside a smart-home card for a security alarm panel named "${r.name}". Timeline of the last 24 hours (oldest first): ${tl}. Write at most two short sentences describing what happened and whether anything looks unusual for an alarm. Plain text, no markdown or emojis. Do not add anything that is not in the timeline. Never tell the person to arm or disarm.`,
      { key: `recap|${segs.map(sg => sg.a + sg.state).join(',')}`, ttl: 1800000 });
    if (!alive()) return;
    if (raw) sum.textContent = this._aiPlain(raw); else sum.remove();
  }

  // This week — a few numbers from the last 7 days, with a short summary
  async _openWeekSheet() {
    const r = this._r; if (!r?.so) return;
    const sheet = this._openSheet('This week', this._sheetPal());
    const body = document.createElement('div'); sheet.appendChild(body);
    this._aiSkeleton(body, 3);
    this._aiFooter(sheet);
    const alive = () => sheet.isConnected;
    const week = await this._aiWeek();
    if (!alive()) return;
    const segs = this._segments(week.series, week.end);
    if (!segs.length) {
      body.innerHTML = '<div class="als-ai-text">I couldn\u2019t find any history for this alarm in the last 7 days. (Home Assistant\u2019s recorder needs to keep this entity.)</div>';
      return;
    }
    const st = this._weekStats(segs);
    const tile = (v, l) => `<div class="als-stat"><b>${esc(v)}</b><span>${esc(l)}</span></div>`;
    body.innerHTML = `<div class="als-stats">
      ${tile(String(st.timesArmed), `time${st.timesArmed === 1 ? '' : 's'} armed`)}
      ${tile(st.armedMs ? durText(st.armedMs) : '\u2014', st.armedMs ? `armed \u00b7 ${st.pct}% of the week` : 'time armed')}
      ${tile(String(st.triggered.length), st.triggered.length ? `triggered \u00b7 last ${dayClock(st.triggered[st.triggered.length - 1])}` : 'times triggered')}
      ${tile(st.topMode || '\u2014', 'most-used mode')}
    </div>`;
    const sum = document.createElement('div'); sum.className = 'als-ai-text';
    body.appendChild(sum);
    this._aiSkeleton(sum, 2);
    const facts = `armed ${st.timesArmed} times in the last 7 days; armed for ${durText(st.armedMs)} in total (${st.pct}% of the time); triggered ${st.triggered.length} times${st.triggered.length ? `, last on ${dayClock(st.triggered[st.triggered.length - 1])}` : ''}; most-used mode ${st.topMode || 'none'}; currently ${r.meta.label}`;
    const raw = await this._aiConverse(
      `You are the assistant inside a smart-home card for a security alarm panel named "${r.name}". Facts about the last 7 days: ${facts}. Write at most two short, friendly sentences summarising this week. Plain text, no markdown or emojis. Do not add anything that is not in the facts. Never tell the person to arm or disarm.`,
      { key: `week|${facts}`, ttl: 3600000 });
    if (!alive()) return;
    if (raw) sum.textContent = this._aiPlain(raw); else sum.remove();
  }

  _attachLongPress(el, cb) {
    let timer = null, sx = 0, sy = 0;
    const clear = () => { if (timer) { clearTimeout(timer); timer = null; } };
    el.addEventListener('pointerdown', e => {
      if (e.button || e.target.closest?.('.al-btn')) return;
      sx = e.clientX; sy = e.clientY; this._lpFired = false;
      clear();
      timer = setTimeout(() => { timer = null; this._lpFired = true; this._haptic('light'); cb(); }, 500);
    });
    el.addEventListener('pointermove', e => { if (timer && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) clear(); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => el.addEventListener(t, clear));
    el.addEventListener('contextmenu', e => { if (this._aiEnabled()) e.preventDefault(); });
  }

  // ── Legibility: in the Pill and Tile layouts, hide the name + state when the card is too narrow
  //    to read them (e.g. a 1×6 Pill with several buttons) rather than showing "H…" / "D…".
  _observeFit() {
    if (this._ro) this._ro.disconnect();
    const card = this.shadowRoot.getElementById('al-card');
    if (!card || typeof ResizeObserver === 'undefined') return;
    this._ro = new ResizeObserver(() => this._fitText());
    this._ro.observe(card);
  }

  _fitText() {
    const root = this.shadowRoot;
    const card = root?.getElementById('al-card');
    const text = card?.querySelector('.al-text');
    if (!card || !text) return;
    if (this._layout() === 'dial') { card.classList.remove('no-text'); return; }
    card.classList.remove('no-text');                       // measure with the text laid out
    const avail = text.clientWidth;
    if (!avail) return;                                      // not rendered yet
    // Natural text width, measured on a canvas with the element's own font. (scrollWidth isn't reliable
    // here: Safari / the iOS app can report the clipped width for text with an ellipsis.)
    if (!this._measureCtx) this._measureCtx = document.createElement('canvas').getContext('2d');
    const ctx = this._measureCtx;
    const need = Math.max(0, ...[...text.children].map(el => {
      const cs = getComputedStyle(el);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const ls = parseFloat(cs.letterSpacing) || 0;
      return Math.ceil(ctx.measureText(el.textContent || '').width + ls * (el.textContent || '').length);
    }));
    const scale = this._config?.size === 'regular' ? 1.2 : 1;
    // Show it if it fits, or if there's enough room that a long name is still readable with an ellipsis.
    const legible = avail + 1 >= need || avail >= 90 * scale;
    card.classList.toggle('no-text', !legible);
  }

  connectedCallback() { if (this._built) { this._observeFit(); this._fitText(); } }

  disconnectedCallback() {
    this._closeSheet();
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
  }
}

// ═══════════════════════════════════════════════════════════════════
//  EDITOR
// ═══════════════════════════════════════════════════════════════════

const EDITOR_STYLES = `
  .container { display: flex; flex-direction: column; gap: 20px; padding: 12px; color: var(--primary-text-color); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 2px; }
  .card-block { background: var(--card-background-color); border: 1px solid rgba(128,128,128,0.15); border-radius: 12px; overflow: hidden; }
  .select-row, .text-row { padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; }
  .select-row label, .text-row label { font-size: 14px; font-weight: 500; }
  .hint { font-size: 11px; color: #888; margin-top: -2px; }
  .select-row + .select-row { border-top: 1px solid rgba(128,128,128,0.10); }
  input[type="text"], input[type="password"], select {
    width: 100%; box-sizing: border-box; background: var(--card-background-color); color: var(--primary-text-color);
    border: 1px solid rgba(128,128,128,0.20); border-radius: 8px; padding: 10px 12px; font-size: 14px; font-family: inherit;
  }
  input:focus, select:focus { outline: none; border-color: #007AFF; }
  .toggle-list { display: flex; flex-direction: column; }
  .toggle-item { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; border-bottom: 1px solid rgba(128,128,128,0.08); min-height: 52px; }
  .toggle-item:last-child { border-bottom: none; }
  .toggle-label { font-size: 14px; font-weight: 500; flex: 1; padding-right: 12px; }
  .toggle-desc  { font-size: 11px; color: #888; margin-top: 2px; }
  .toggle-switch { position: relative; width: 51px; height: 31px; flex-shrink: 0; }
  .toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
  .toggle-track { position: absolute; inset: 0; border-radius: 31px; background: rgba(120,120,128,0.32); cursor: pointer; transition: background 0.25s ease; }
  .toggle-track::after { content: ''; position: absolute; width: 27px; height: 27px; border-radius: 50%; background: #fff; top: 2px; left: 2px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); transition: transform 0.25s ease; }
  .toggle-switch input:checked + .toggle-track { background: #34C759; }
  .toggle-switch input:checked + .toggle-track::after { transform: translateX(20px); }
  .toggle-switch input:focus-visible + .toggle-track { outline: 2px solid #007AFF; outline-offset: 2px; }
  .badge-optional, .badge-required { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; border-radius: 4px; padding: 1px 5px; margin-left: 6px; vertical-align: middle; }
  .badge-optional { background: rgba(128,128,128,0.12); color: #888; border: 1px solid rgba(128,128,128,0.25); }
  .badge-required { background: rgba(0,122,255,0.15); color: #007AFF; border: 1px solid rgba(0,122,255,0.30); }
  .seg { display: flex; padding: 2px; gap: 2px; border-radius: 10px; background: rgba(120,120,128,0.16); }
  .seg-btn { flex: 1; border: none; border-radius: 8px; padding: 8px 6px; cursor: pointer; background: transparent; color: var(--primary-text-color); font-family: inherit; font-size: 13px; font-weight: 600; transition: background .15s, box-shadow .15s; }
  .seg-btn.is-selected { background: var(--card-background-color, #fff); box-shadow: 0 1px 4px rgba(0,0,0,0.25); }
  .range-row { display: flex; align-items: center; gap: 10px; }
  .range-row span { font-size: 11px; color: #888; flex-shrink: 0; }
  input[type="range"] { flex: 1; accent-color: #007AFF; margin: 4px 0; }

  .layout-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; padding: 12px; }
  .layout-opt { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 8px 9px; border-radius: 14px; cursor: pointer; background: rgba(128,128,128,0.06); color: var(--primary-text-color); border: 2px solid transparent; font-family: inherit; transition: border-color .15s, background .15s, transform .1s; }
  .layout-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .layout-opt:active { transform: scale(0.97); }
  .layout-opt svg { width: 100%; max-width: 132px; height: auto; display: block; }
  .layout-opt .lo-name { font-size: 13px; font-weight: 600; }
  .layout-opt .lo-sub  { font-size: 11px; color: #888; margin-top: -4px; text-align: center; }
  .layout-opt.is-selected { border-color: #007AFF; background: rgba(0,122,255,0.08); }

  /* Mode checklist — which arm buttons appear on the card */
  .opt-list { display: flex; flex-direction: column; }
  .opt-row { display: flex; align-items: center; gap: 12px; width: 100%; box-sizing: border-box; padding: 11px 16px; background: none; border: none; border-top: 1px solid rgba(128,128,128,0.08); color: var(--primary-text-color); font-family: inherit; text-align: left; cursor: pointer; }
  .opt-row:first-child { border-top: none; }
  .opt-ico { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(128,128,128,0.10); flex-shrink: 0; }
  .opt-ico svg { width: 17px; height: 17px; }
  .opt-txt { flex: 1; min-width: 0; }
  .opt-name { font-size: 14px; font-weight: 500; }
  .opt-check { width: 22px; height: 22px; border-radius: 6px; border: 2px solid rgba(128,128,128,0.45); box-sizing: border-box; flex-shrink: 0; position: relative; }
  .opt-row.is-selected .opt-check { border-color: #007AFF; background: #007AFF; }
  .opt-row.is-selected .opt-check::after { content: ''; position: absolute; left: 6px; top: 2px; width: 5px; height: 10px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }

  .preset-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .preset-opt { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 12px; cursor: pointer; background: rgba(128,128,128,0.06); color: var(--primary-text-color); border: 2px solid transparent; font-family: inherit; font-size: 13px; font-weight: 600; transition: border-color .15s, background .15s; }
  .preset-opt.is-selected { border-color: #007AFF; background: rgba(0,122,255,0.08); }
  .preset-dots { display: inline-flex; }
  .preset-dots i { width: 14px; height: 14px; border-radius: 50%; margin-left: -4px; border: 1.5px solid var(--card-background-color, #fff); }
  .preset-dots i:first-child { margin-left: 0; }
  .select-row.color-row { flex-direction: row; align-items: center; gap: 10px; }
  .color-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .color-info label { font-size: 14px; font-weight: 500; }
  .color-info .hint { margin: 0; }
  .color-prev { display: flex; gap: 4px; }
  .pv { width: 32px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; border: 1px solid rgba(128,128,128,0.25); }
  input[type="color"] { -webkit-appearance: none; appearance: none; width: 44px; height: 32px; padding: 0; flex-shrink: 0; border: 1px solid rgba(128,128,128,0.3); border-radius: 10px; background: none; cursor: pointer; overflow: hidden; }
  input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
  input[type="color"]::-webkit-color-swatch { border: none; border-radius: 9px; }
  .reset-btn { border: none; background: none; color: #007AFF; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; padding: 8px 2px; flex-shrink: 0; }
  .sel-host { display: block; }
  .sel-host > * { display: block; width: 100%; }
`;

class CrowAlarmCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._initialized = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) this._render();
    else this.shadowRoot.querySelectorAll('ha-selector').forEach(s => { s.hass = hass; });
  }

  setConfig(config) {
    this._config = { ...CrowAlarmCard.DEFAULTS, ...config };
    if (!this._initialized && this._hass) this._render();
    else if (this._initialized) this._syncUI();
  }

  _render() {
    if (!this._hass || !this._config) return;
    this._initialized = true;
    const tog = (id, label, desc) => `
      <div class="toggle-item">
        <div><div class="toggle-label">${label}</div><div class="toggle-desc">${desc}</div></div>
        <label class="toggle-switch"><input type="checkbox" id="${id}"><span class="toggle-track"></span></label>
      </div>`;
    const line = 'style="border-top:1px solid rgba(128,128,128,0.10);"';

    this.shadowRoot.innerHTML = `
      <style>${EDITOR_STYLES}</style>
      <div class="container">

        <div>
          <div class="section-title">Alarm <span class="badge-required">Required</span></div>
          <div class="card-block">
            <div class="select-row">
              <label>Alarm panel</label>
              <div class="hint">Any Home Assistant alarm_control_panel entity</div>
              <div class="sel-host" id="ent-host"></div>
            </div>
          </div>
        </div>

        <div>
          <div class="section-title">Display</div>
          <div class="card-block">
            <div class="toggle-list">${tog('show_name', 'Show name', 'Display the alarm panel\u2019s name on the card')}</div>
            <div class="text-row" id="name_row" ${line}>
              <label for="name">Name</label>
              <div class="hint">Leave empty to use the name from Home Assistant</div>
              <input type="text" id="name">
            </div>
            <div class="toggle-list" ${line}>${tog('show_state', 'Show status line', 'Current status under the name, e.g. \u201cArmed Away \u00b7 2h ago\u201d')}</div>
          </div>
        </div>

        <div>
          <div class="section-title">Layout</div>
          <div class="card-block">
            <div class="layout-grid">
              ${LAYOUT_OPTIONS.map(o => `
                <button type="button" class="layout-opt" data-layout="${o.id}" aria-pressed="false">
                  ${o.svg}<span class="lo-name">${o.name}</span><span class="lo-sub">${o.sub}</span>
                </button>`).join('')}
            </div>
          </div>
        </div>

        <div>
          <div class="section-title">Modes</div>
          <div class="card-block">
            <div class="select-row"><div class="hint" style="margin:0;">Which arm buttons appear on the card. Off (disarm) always appears. A mode is hidden automatically if the entity itself doesn\u2019t support it.</div></div>
            <div class="opt-list" ${line}>
              ${MODE_DEFS.map(m => `
                <button type="button" class="opt-row" data-mode="${m.id}" aria-pressed="false">
                  <span class="opt-ico">${ICONS[m.icon]}</span>
                  <span class="opt-txt"><span class="opt-name">${esc(m.label)}</span></span>
                  <span class="opt-check"></span>
                </button>`).join('')}
            </div>
          </div>
        </div>

        <div>
          <div class="section-title">Security</div>
          <div class="card-block">
            <div class="text-row">
              <label>Code <span class="badge-optional">Optional</span></label>
              <div class="hint">Sent with every service call. Leave empty if your alarm integration doesn\u2019t need one, or if you\u2019d rather enter it on the PIN pad each time.</div>
              <input type="password" id="code" autocomplete="new-password">
            </div>
            <div class="toggle-list" ${line}>
              ${tog('require_code_to_disarm', 'Require code to disarm', 'Show a PIN pad before Off runs \u2014 the entered code is sent to your alarm integration')}
              ${tog('require_code_to_arm', 'Require code to arm', 'Show a PIN pad before Home / Away / Night / Vacation / Bypass run')}
            </div>
            <div class="text-row" ${line}>
              <label>PIN pad style</label>
              <div class="hint">How the keys and the arm / disarm button look on the PIN pad</div>
            </div>
            <div class="layout-grid two" style="padding-top:0">
              ${PIN_STYLE_OPTIONS.map(o => `
                <button type="button" class="layout-opt" data-pinstyle="${o.id}" aria-pressed="false">
                  ${o.svg}<span class="lo-name">${o.name}</span><span class="lo-sub">${o.sub}</span>
                </button>`).join('')}
            </div>
          </div>
        </div>

        <div>
          <div class="section-title">Appearance</div>
          <div class="card-block">
            <div class="select-row">
              <label>Theme</label>
              <div class="hint">Auto follows your Home Assistant theme</div>
              <div class="seg">
                <button type="button" class="seg-btn" data-appearance="auto">Auto</button>
                <button type="button" class="seg-btn" data-appearance="light">Light</button>
                <button type="button" class="seg-btn" data-appearance="dark">Dark</button>
              </div>
            </div>
            <div class="select-row">
              <label>Size</label>
              <div class="hint">Regular is about 20% larger</div>
              <div class="seg">
                <button type="button" class="seg-btn" data-size="compact">Compact</button>
                <button type="button" class="seg-btn" data-size="regular">Regular</button>
              </div>
            </div>
            <div class="select-row">
              <label>Animations</label>
              <div class="hint">Subtle animates only pending / triggered states. System is Subtle but stays still if your device\u2019s Reduce Motion setting is on.</div>
              <div class="seg">
                <button type="button" class="seg-btn" data-anim="subtle">Subtle</button>
                <button type="button" class="seg-btn" data-anim="full">Full</button>
                <button type="button" class="seg-btn" data-anim="off">Off</button>
                <button type="button" class="seg-btn" data-anim="system">System</button>
              </div>
            </div>
            <div class="select-row">
              <label for="glass">Glass</label>
              <div class="hint">How see-through the card is (needs a wallpaper or coloured view behind it)</div>
              <div class="range-row"><span>Clear</span><input type="range" id="glass" min="0" max="100" step="5"><span>Frosted</span></div>
            </div>
          </div>
        </div>

        <div>
          <div class="section-title">Colours</div>
          <div class="card-block">
            <div class="select-row">
              <label>Preset</label>
              <div class="hint">One tap sets every state colour \u2014 then adjust any of them below</div>
              <div class="preset-grid">
                ${COLOR_PRESETS.map(pr => `
                  <button type="button" class="preset-opt" data-preset="${pr.id}" aria-pressed="false">
                    <span class="preset-dots">${STATE_ROWS.map(([k]) => `<i style="background:${(pr.colors && pr.colors[k]) || DEFAULT_STATE[k]}"></i>`).join('')}</span>
                    ${pr.name}
                  </button>`).join('')}
              </div>
            </div>
            ${STATE_ROWS.map(([k, label]) => `
              <div class="select-row color-row">
                <div class="color-info"><label for="color_${k}">${label}</label><div class="hint" id="hint_${k}">Default</div></div>
                <div class="color-prev" title="Dark theme / light theme"><span class="pv" id="pvd_${k}">Aa</span><span class="pv" id="pvl_${k}">Aa</span></div>
                <input type="color" id="color_${k}" value="${DEFAULT_STATE[k]}">
                <button type="button" class="reset-btn" id="reset_${k}" hidden>Reset</button>
              </div>`).join('')}
            <div class="select-row">
              <div class="hint">Colours are adjusted automatically so they stay readable in both light and dark themes. The two \u201cAa\u201d swatches preview each colour on a dark (left) and light (right) card.</div>
            </div>
          </div>
        </div>

        ${this._aiMarkup()}
        <div class="hint" style="text-align:center;margin-top:-8px;">Crow Alarm Card \u00b7 version ${CARD_VERSION}</div>
      </div>`;

    this._entPick = this._mountPicker('ent-host', { entity: { filter: [{ domain: 'alarm_control_panel' }] } }, 'entity', e => e.startsWith('alarm_control_panel.'));
    this._attachListeners();
    this._syncUI();
  }

  _aiMarkup() {
    const tog = (id, label, desc) => `
      <div class="toggle-item">
        <div><div class="toggle-label">${label}</div><div class="toggle-desc">${desc}</div></div>
        <label class="toggle-switch"><input type="checkbox" id="${id}"><span class="toggle-track"></span></label>
      </div>`;
    return `
        <div>
          <div class="section-title">AI Features <span class="badge-optional">Optional</span></div>
          <div class="card-block">
            <div class="toggle-list">
              ${tog('ai_features_enabled', 'Enable AI features', 'Tap the alarm icon or the card (away from the arm buttons), or long-press it, for an actions sheet: Insight, Ask AI, What happened? and This week')}
            </div>
            <div id="ai_rows">
              <div class="select-row" style="border-top:1px solid rgba(128,128,128,0.10);">
                <label for="ai_conversation_agent">Conversation agent</label>
                <div class="hint">Set one up in Settings \u2192 Voice assistants. AI stays off until you choose one. Nothing is sent until you open one of the sheets.</div>
                <select id="ai_conversation_agent"><option value="">Choose an agent\u2026</option></select>
                <div class="hint" id="ai_agent_warn" style="color:#FF9F0A;font-weight:600;margin-top:2px;">Choose an agent above \u2014 AI features won\u2019t appear on the card until you do.</div>
              </div>
              <div class="toggle-list" style="border-top:1px solid rgba(128,128,128,0.10);">
                ${tog('ai_enable_insight', 'Insight', 'What the current state means, using the time of day and the last week, with a next step')}
                ${tog('ai_enable_ask', 'Ask AI', 'Type a question about the alarm, or tap a suggestion')}
                ${tog('ai_enable_recap', 'What happened?', 'The last 24 hours as a timeline, with a short summary')}
                ${tog('ai_enable_week', 'This week', 'Times armed, time armed, triggers and most-used mode over 7 days, with a short summary')}
              </div>
            </div>
          </div>
        </div>`;
  }

  _mountPicker(hostId, selector, key, filter) {
    const host = this.shadowRoot.getElementById(hostId);
    if (customElements.get('ha-selector')) {
      const el = document.createElement('ha-selector');
      el.hass = this._hass; el.selector = selector; el.value = this._config[key] || ''; el.label = '';
      el.addEventListener('value-changed', e => { e.stopPropagation(); this._set(key, e.detail?.value || ''); });
      host.appendChild(el);
      return { sel: el };
    }
    const ids = Object.keys(this._hass.states).filter(filter).sort();
    host.innerHTML = `
      <input type="text" class="entity-search" placeholder="Search\u2026">
      <select style="margin-top:6px;"><option value="">\u2014 None \u2014</option>${ids.map(e => `<option value="${esc(e)}">${esc(this._hass.states[e].attributes.friendly_name || e)} (${esc(e)})</option>`).join('')}</select>`;
    const sel = host.querySelector('select'), search = host.querySelector('input');
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      [...sel.options].forEach(o => { o.hidden = !!q && o.value !== '' && !o.textContent.toLowerCase().includes(q); });
    });
    sel.addEventListener('change', () => this._set(key, sel.value));
    return { fallback: sel };
  }

  _syncUI() {
    const root = this.shadowRoot, cfg = this._config;
    if (!root.getElementById('glass')) return;
    const setVal = (id, v) => { const el = root.getElementById(id); if (el && root.activeElement !== el) el.value = v ?? ''; };
    const chk = (id, v) => { const el = root.getElementById(id); if (el) el.checked = !!v; };

    if (this._entPick) {
      if (this._entPick.sel) this._entPick.sel.value = cfg.entity || '';
      if (this._entPick.fallback) {
        if (cfg.entity && ![...this._entPick.fallback.options].some(o => o.value === cfg.entity)) {
          const o = document.createElement('option'); o.value = cfg.entity; o.textContent = cfg.entity; this._entPick.fallback.appendChild(o);
        }
        this._entPick.fallback.value = cfg.entity || '';
      }
    }

    const segSel = (attr, val) => root.querySelectorAll(`.seg-btn[data-${attr}]`).forEach(b => b.classList.toggle('is-selected', b.dataset[attr] === String(val)));
    segSel('appearance', cfg.appearance || 'auto');
    segSel('size', cfg.size === 'regular' ? 'regular' : 'compact');
    segSel('anim', ['off', 'full', 'system'].includes(cfg.animation) ? cfg.animation : 'subtle');
    const g = parseFloat(cfg.glass);
    setVal('glass', Number.isFinite(g) ? g : 50);

    const layout = ['dial', 'pill', 'tile'].includes(cfg.layout) ? cfg.layout : 'dial';
    root.querySelectorAll('.layout-opt[data-layout]').forEach(b => {
      const on = b.dataset.layout === layout;
      b.classList.toggle('is-selected', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const pinStyle = cfg.pin_style === 'round' ? 'round' : 'rounded';
    root.querySelectorAll('.layout-opt[data-pinstyle]').forEach(b => {
      const on = b.dataset.pinstyle === pinStyle;
      b.classList.toggle('is-selected', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    chk('show_name', cfg.show_name !== false);
    chk('show_state', cfg.show_state !== false);
    const nameRow = root.getElementById('name_row');
    if (nameRow) nameRow.style.display = cfg.show_name === false ? 'none' : '';
    setVal('name', cfg.name || '');
    const nameEl = root.getElementById('name');
    if (nameEl) nameEl.placeholder = this._hass?.states?.[cfg.entity]?.attributes?.friendly_name || 'Alarm';

    setVal('code', cfg.code || '');
    chk('require_code_to_disarm', !!cfg.require_code_to_disarm);
    chk('require_code_to_arm', !!cfg.require_code_to_arm);

    const modes = Array.isArray(cfg.modes) ? cfg.modes : ['arm_home', 'arm_away'];
    root.querySelectorAll('.opt-row[data-mode]').forEach(b => {
      const on = modes.includes(b.dataset.mode);
      b.classList.toggle('is-selected', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    this._syncColours();
    this._aiSync();
  }

  _aiSync() {
    const root = this.shadowRoot, cfg = this._config;
    const chk = (id, v) => { const el = root.getElementById(id); if (el) el.checked = !!v; };
    chk('ai_features_enabled', cfg.ai_features_enabled === true);
    const rows = root.getElementById('ai_rows');
    if (rows) rows.style.display = cfg.ai_features_enabled === true ? '' : 'none';
    ['insight', 'ask', 'recap', 'week'].forEach(k => chk(`ai_enable_${k}`, cfg[`ai_enable_${k}`] !== false));
    const warn = root.getElementById('ai_agent_warn');
    if (warn) warn.style.display = cfg.ai_conversation_agent ? 'none' : '';
    this._aiLoadAgents();
  }

  _aiLoadAgents() {
    const sel = this.shadowRoot.getElementById('ai_conversation_agent');
    if (!sel || !this._hass?.connection) return;
    const saved = this._config.ai_conversation_agent || '';
    if (this._aiAgentsLoaded) {
      if (saved && ![...sel.options].some(o => o.value === saved)) {
        const o = document.createElement('option'); o.value = saved; o.textContent = this._hass.states?.[saved]?.attributes?.friendly_name || saved; sel.appendChild(o);
      }
      sel.value = saved; return;
    }
    this._aiAgentsLoaded = true;
    this._hass.connection.sendMessagePromise({ type: 'conversation/agent/list' }).then(resp => {
      const cur = this._config.ai_conversation_agent || '';
      const agents = (resp?.agents || []).filter(a => {
        const id = (a.id || '').toLowerCase(), nm = (a.name || '').toLowerCase();
        return a.id !== 'conversation.home_assistant' && !id.includes('assistant_sdk') && !id.includes('google_assistant') && !nm.includes('sdk');
      });
      const opts = ['<option value="">Choose an agent\u2026</option>'];
      agents.forEach(a => opts.push(`<option value="${esc(a.id)}">${esc(a.name || a.id)}</option>`));
      if (cur && !agents.some(a => a.id === cur)) opts.push(`<option value="${esc(cur)}">${esc(this._hass.states?.[cur]?.attributes?.friendly_name || cur)}</option>`);
      sel.innerHTML = opts.join('');
      sel.value = cur;
    }).catch(() => { this._aiAgentsLoaded = false; });
  }

  _syncColours() {
    const root = this.shadowRoot, cols = this._config.colors || {};
    const hex6 = v => { let h = v.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return '#' + h.toLowerCase(); };
    const eff = {};
    STATE_ROWS.forEach(([k]) => {
      const custom = isHex(cols[k]) ? hex6(cols[k]) : null;
      const base = custom || hex6(DEFAULT_STATE[k]);
      eff[k] = base;
      const input = root.getElementById(`color_${k}`); if (input) input.value = base;
      const hint = root.getElementById(`hint_${k}`); if (hint) hint.textContent = custom ? custom.toUpperCase() : 'Default';
      const reset = root.getElementById(`reset_${k}`); if (reset) reset.hidden = !custom;
      this._paintPreview(k, base);
    });
    root.querySelectorAll('.preset-opt').forEach(b => {
      const pr = COLOR_PRESETS.find(x => x.id === b.dataset.preset);
      const target = { ...DEFAULT_STATE, ...(pr.colors || {}) };
      const on = STATE_ROWS.every(([k]) => hex6(target[k]) === eff[k]);
      b.classList.toggle('is-selected', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  _paintPreview(k, base) {
    const root = this.shadowRoot;
    const d = root.getElementById(`pvd_${k}`), l = root.getElementById(`pvl_${k}`);
    if (d) { d.style.background = SURFACE.dark;  d.style.color = tuneColor(base, true).text; }
    if (l) { l.style.background = SURFACE.light; l.style.color = tuneColor(base, false).text; }
  }

  _attachListeners() {
    const root = this.shadowRoot, $ = id => root.getElementById(id);
    root.querySelectorAll('[data-appearance]').forEach(b => b.addEventListener('click', () => this._set('appearance', b.dataset.appearance)));
    root.querySelectorAll('[data-size]').forEach(b => b.addEventListener('click', () => this._set('size', b.dataset.size)));
    root.querySelectorAll('[data-anim]').forEach(b => b.addEventListener('click', () => this._set('animation', b.dataset.anim)));
    root.querySelectorAll('.layout-opt[data-layout]').forEach(b => b.addEventListener('click', () => this._set('layout', b.dataset.layout)));
    root.querySelectorAll('.layout-opt[data-pinstyle]').forEach(b => b.addEventListener('click', () => this._set('pin_style', b.dataset.pinstyle)));
    $('glass').addEventListener('input', e => this._set('glass', parseInt(e.target.value, 10)));

    ['show_name', 'show_state', 'require_code_to_disarm', 'require_code_to_arm'].forEach(id => $(id).addEventListener('change', e => this._set(id, e.target.checked)));
    $('name').addEventListener('input', e => this._set('name', e.target.value));
    $('code').addEventListener('input', e => this._set('code', e.target.value || undefined));

    root.querySelectorAll('.opt-row[data-mode]').forEach(b => b.addEventListener('click', () => {
      const cur = Array.isArray(this._config.modes) ? this._config.modes : ['arm_home', 'arm_away'];
      const id = b.dataset.mode;
      const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
      this._set('modes', next.length ? MODE_DEFS.filter(m => next.includes(m.id)).map(m => m.id) : []);
    }));

    root.querySelectorAll('.preset-opt').forEach(b => b.addEventListener('click', () => {
      const pr = COLOR_PRESETS.find(x => x.id === b.dataset.preset);
      this._set('colors', pr.colors ? { ...pr.colors } : null);
    }));
    STATE_ROWS.forEach(([k]) => {
      const input = $(`color_${k}`), reset = $(`reset_${k}`);
      input.addEventListener('input', () => this._paintPreview(k, input.value));
      input.addEventListener('change', () => this._set('colors', { ...(this._config.colors || {}), [k]: input.value }));
      reset.addEventListener('click', () => {
        const next = { ...(this._config.colors || {}) }; delete next[k];
        this._set('colors', Object.keys(next).length ? next : null);
      });
    });

    $('ai_features_enabled').addEventListener('change', e => this._set('ai_features_enabled', e.target.checked));
    $('ai_conversation_agent').addEventListener('change', e => this._set('ai_conversation_agent', e.target.value || null));
    ['insight', 'ask', 'recap', 'week'].forEach(k => $(`ai_enable_${k}`).addEventListener('change', e => this._set(`ai_enable_${k}`, e.target.checked)));
  }

  _set(key, value) {
    const cfg = { ...this._config, [key]: value };
    if (value === null || value === '' || value === undefined) delete cfg[key];
    this._config = cfg;
    this._dispatch();
    this._syncUI();
  }

  _dispatch() {
    const out = { ...this._config };
    Object.entries(CrowAlarmCard.DEFAULTS).forEach(([k, v]) => {
      if (k === 'entity') return;
      if (Array.isArray(v)) { if (JSON.stringify(out[k]) === JSON.stringify(v)) delete out[k]; }
      else if (out[k] === v) delete out[k];
    });
    delete out.type;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: { type: this._config.type || 'custom:crow-alarm-card', ...out } }, bubbles: true, composed: true,
    }));
  }
}

// ═══════════════════════════════════════════════════════════════════
//  REGISTRATION
// ═══════════════════════════════════════════════════════════════════

if (!customElements.get('crow-alarm-card')) customElements.define('crow-alarm-card', CrowAlarmCard);
if (!customElements.get('crow-alarm-card-editor')) customElements.define('crow-alarm-card-editor', CrowAlarmCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === 'crow-alarm-card')) {
  window.customCards.push({
    type: 'crow-alarm-card',
    name: 'Crow Alarm Card',
    preview: false,
    description: 'A liquid-glass alarm-control-panel card \u2014 Dial, Pill or Tile layouts, configurable arm/disarm buttons, an optional PIN pad, optional AI features, and light and dark themes.',
  });
}

})();
