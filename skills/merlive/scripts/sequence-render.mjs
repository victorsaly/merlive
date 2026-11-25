// Why: one file out, nothing fetched, for a sequence diagram as for a flowchart. The drawing is plain SVG that
// reads on its own; the page around it adds picking and going through the messages one at a time. It takes
// its colours and the look of its boxes and lines from the same rules a flowchart is drawn with (render.mjs),
// so the two kinds of diagram in one document are one family. Pure.

import { looksOf } from './design.mjs';
import { rulesFor, titleOf, variables } from './render.mjs';
import { across, tabOf } from './sequence.mjs';
import { sequenceRuntime } from './sequence-runtime.mjs';

/** @typedef {import('./sequence.mjs').SequenceModel} SequenceModel */
/** @typedef {import('./sequence.mjs').SequenceLayout} SequenceLayout */
/** @typedef {import('./design.mjs').Design} Design */
/** @typedef {{x:number,y:number}} Pt */

const show = {
  head: 9, // an arrowhead's length
  headHalf: 4.5, // and half its width
  cross: 4.5, // how far a cross reaches from its middle
  end: 6, // how far a lifeline's last cross reaches from its middle
  corner: 6, // the round of the turns of a message to itself
  fold: 9, // the folded corner of a note
  tabDrop: 6, // how far the tab that names a frame's kind is cut at its corner
  tabTall: 18, // and how tall it is
  nameBase: 4.5, // from the middle of a 13px line of a name down to its baseline
  wordBase: 4.2, // the same for 12px words
  tint: 0.045, // how much of the text colour a highlight lays over the page; one inside another lays it twice, and shows
  dots: 16, // px between the dots of the ground, as in a flowchart
  leastScale: 0.8, // the smallest a drawing is shown before it scrolls sideways instead
};

const esc = (/** @type {unknown} */ s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = (/** @type {number} */ v) => String(Math.round(v * 10) / 10);
const at = (/** @type {Pt} */ p) => `${n(p.x)},${n(p.y)}`;
const dist = (/** @type {Pt} */ a, /** @type {Pt} */ b) => Math.hypot(b.x - a.x, b.y - a.y);
const toward = (/** @type {Pt} */ from, /** @type {Pt} */ to, /** @type {number} */ by) => {
  const d = dist(from, to) || 1;
  return { x: from.x + ((to.x - from.x) / d) * by, y: from.y + ((to.y - from.y) / d) * by };
};

/** A line through the points, its turns rounded. */
function pathOf(/** @type {Pt[]} */ pts) {
  let d = `M${at(pts[0])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const r = Math.min(show.corner, dist(pts[i - 1], pts[i]) / 2, dist(pts[i], pts[i + 1]) / 2);
    d += `L${at(toward(pts[i], pts[i - 1], r))}Q${at(pts[i])} ${at(toward(pts[i], pts[i + 1], r))}`;
  }
  return `${d}L${at(pts[pts.length - 1])}`;
}

/** What is drawn at one end of a message, and how far the line stops short of the tip to make room for it. */
function endAt(/** @type {import('./sequence.mjs').End} */ end, /** @type {Pt} */ tip, /** @type {Pt} */ from) {
  const back = toward(tip, from, show.head), dx = (tip.y - from.y) / (dist(from, tip) || 1), dy = -(tip.x - from.x) / (dist(from, tip) || 1);
  const wings = `${at({ x: back.x + dx * show.headHalf, y: back.y + dy * show.headHalf })} ${at(tip)} ${at({ x: back.x - dx * show.headHalf, y: back.y - dy * show.headHalf })}`;
  // A filled head is a message that waits for its answer; an open one does not wait. The line runs to an open tip.
  if (end === 'arrow') return { inset: show.head - 2, svg: `<polygon class="mv-head" points="${wings}"/>` };
  if (end === 'open') return { inset: 0, svg: `<polyline class="mv-open" points="${wings}"/>` };
  if (end === 'cross') {
    const c = toward(tip, from, show.cross + 2), m = show.cross;
    return { inset: show.cross + 2, svg: `<path class="mv-cross" d="M${at({ x: c.x - m, y: c.y - m })}L${at({ x: c.x + m, y: c.y + m })}M${at({ x: c.x - m, y: c.y + m })}L${at({ x: c.x + m, y: c.y - m })}"/>` };
  }
  return { inset: 0, svg: '' };
}

const kindsOf = (/** @type {SequenceModel} */ model) => [...new Set(model.participants.map((p) => p.kind))];
// What a participant is, in words, for a reader who picks it and for the legend.
const roleName = (/** @type {string} */ role) => ({ participant: 'A participant', actor: 'A person', database: 'A database', boundary: 'A boundary', control: 'A control', entity: 'An entity', collections: 'A collection', queue: 'A queue' })[role] ?? 'A participant';
const kindName = (/** @type {string} */ kind) => (kind === 'external' ? 'Person' : kind === 'data' ? 'Database' : 'Participant');

/** The rules for what only a sequence has, over a flowchart's: lifelines, bars, notes, frames, numbers. */
function sequenceRules(/** @type {Design} */ design, /** @type {string[]} */ kinds) {
  return `${rulesFor(design, kinds)}
.mv-life{stroke:var(--mv-stroke);stroke-width:1.2;stroke-dasharray:4 4}
.mv-bar{fill:var(--mv-node);stroke:var(--mv-edge);stroke-width:1.2}
.mv-open{fill:none;stroke:var(--mv-edge);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.mv-words{font-size:12px;font-weight:600;fill:var(--mv-text);text-anchor:middle;paint-order:stroke;stroke:var(--mv-bg);stroke-width:4px;stroke-linejoin:round}
.mv-num circle{fill:var(--mv-text)}
.mv-num text{font-size:10px;font-weight:700;fill:var(--mv-bg);text-anchor:middle}
.mv-note-box{fill:var(--mv-node);stroke:var(--mv-stroke);stroke-width:1.2}
.mv-note-fold{fill:none;stroke:var(--mv-stroke);stroke-width:1.2}
.mv-note text{font-size:12px;fill:var(--mv-text);text-anchor:middle}
.mv-frame-box{fill:none;stroke:var(--mv-stroke);stroke-width:1.2}
[data-kind="rect"] .mv-frame-box{fill:var(--mv-text);fill-opacity:${show.tint};stroke:none}
.mv-frame-tab{fill:var(--mv-group);stroke:var(--mv-stroke);stroke-width:1.2}
.mv-frame-kind{font-size:10.5px;font-weight:700;fill:var(--mv-muted);letter-spacing:.04em;text-transform:uppercase}
.mv-frame-label{font-size:12px;font-weight:600;fill:var(--mv-muted);paint-order:stroke;stroke:var(--mv-bg);stroke-width:4px;stroke-linejoin:round}
.mv-frame-divide{stroke:var(--mv-stroke);stroke-width:1.2;stroke-dasharray:5 4}`;
}

function styleOf(/** @type {Design} */ design, /** @type {string[]} */ kinds, /** @type {string} */ root) {
  const [[first, one], two] = looksOf(design);
  const scheme = (/** @type {string} */ mode) => (mode === 'dark' ? ';color-scheme:dark' : '');
  const dark = two ? `@media (prefers-color-scheme:dark){${root}{${variables(two[1], kinds)}${scheme(two[0])}}}` : '';
  return `${root}{${variables(one, kinds)}${scheme(first)}}${dark}\n${sequenceRules(design, kinds)}`;
}

/** The drawing alone: the SVG's insides, the same for a page and a picture. */
export function sequenceInside(/** @type {SequenceModel} */ model, /** @type {SequenceLayout} */ lay, /** @type {Design} */ design, /** @type {boolean} */ live) {
  const label = new Map(model.participants.map((p) => [p.id, p.label]));
  const sent = /** @type {import('./sequence.mjs').Message[]} */ (model.items.filter((i) => i.type === 'message'));
  // How many messages come before each item: a note, a frame and a bar are shown once a reader has got that far.
  /** @type {number[]} */
  const saidBy = [];
  let said = 0;
  for (const item of model.items) {
    if (item.type === 'message') said++;
    saidBy.push(said);
  }

  const groups = lay.groups.map((g) => `<g class="mv-group"><rect x="${n(g.x)}" y="${n(g.y)}" width="${n(g.w)}" height="${n(g.h)}" rx="${Math.min(design.radius, 12)}"/>${g.title ? `<text x="${n(g.x + across.groupPad)}" y="${n(g.y + 15)}">${esc(g.title)}</text>` : ''}</g>`);

  // A frame is drawn in two layers: its outline under the lifelines, and its name over them, so that a lifeline
  // that passes behind the name does not strike it through.
  const firstOf = (/** @type {import('./sequence.mjs').Frame} */ f) => {
    const index = model.blocks.findIndex((b) => b.id === f.id);
    return ` data-first="${(saidBy[model.items.findIndex((i) => i.type === 'open' && i.block === index)] ?? 0) + 1}"`;
  };
  const frames = lay.frames.map((f) => `<g class="mv-frame" data-kind="${esc(f.kind)}"${firstOf(f)}><rect class="mv-frame-box" x="${n(f.x)}" y="${n(f.y)}" width="${n(f.w)}" height="${n(f.h)}" rx="4"/>`
    + `${f.dividers.map((d) => `<line class="mv-frame-divide" x1="${n(f.x)}" y1="${n(d.y)}" x2="${n(f.x + f.w)}" y2="${n(d.y)}"/>`).join('')}</g>`);
  const frameNames = lay.frames.filter((f) => f.kind !== 'rect').map((f) => {
    const tab = tabOf(f.kind);
    return `<g class="mv-frame" data-kind="${esc(f.kind)}"${firstOf(f)}><path class="mv-frame-tab" d="M${n(f.x)},${n(f.y)}H${n(f.x + tab)}V${n(f.y + show.tabTall - show.tabDrop)}L${n(f.x + tab - show.tabDrop)},${n(f.y + show.tabTall)}H${n(f.x)}Z"/>`
      + `<text class="mv-frame-kind" x="${n(f.x + 8)}" y="${n(f.y + 13)}">${esc(f.kind)}</text>${f.label ? `<text class="mv-frame-label" x="${n(f.nameAt)}" y="${n(f.y + 14)}">${esc(f.label)}</text>` : ''}`
      + `${f.dividers.map((d) => (d.label ? `<text class="mv-frame-label" x="${n(f.nameAt)}" y="${n(d.y + 16)}">${esc(d.label)}</text>` : '')).join('')}</g>`;
  });

  const lives = model.participants.map((p) => {
    const s = lay.participants[p.id];
    const cross = s.ends ? `<path class="mv-cross" d="M${n(s.x - show.end)},${n(s.to - show.end)}L${n(s.x + show.end)},${n(s.to + show.end)}M${n(s.x - show.end)},${n(s.to + show.end)}L${n(s.x + show.end)},${n(s.to - show.end)}"/>` : '';
    return `<line class="mv-life" x1="${n(s.x)}" y1="${n(s.from)}" x2="${n(s.x)}" y2="${n(s.to)}"/>${cross}`;
  });

  const bars = lay.bars.map((b, i) => `<rect class="mv-bar" data-of="${esc(b.of)}" data-first="${(saidBy[model.activations[i]?.from ?? 0] ?? 1)}" x="${n(b.x - b.w / 2)}" y="${n(b.y)}" width="${b.w}" height="${n(b.h)}" rx="2"/>`);

  const lines = sent.map((m, i) => {
    const s = lay.messages[m.id], pts = s.points;
    // A message that ends its receiver stops at the cross on that lifeline: a cross of its own beside it would say it twice.
    const ends = model.participants.find((p) => p.id === m.to)?.destroyed === model.items.indexOf(m) && m.head === 'cross';
    const head = endAt(ends ? 'none' : m.head, pts[pts.length - 1], pts[pts.length - 2]), tail = endAt(m.tail, pts[0], pts[1]);
    const line = [toward(pts[0], pts[1], tail.inset), ...pts.slice(1, -1), toward(pts[pts.length - 1], pts[pts.length - 2], head.inset)];
    const w = s.words;
    const first = w ? w.y - ((w.lines.length - 1) * across.wordLine) / 2 + show.wordBase : 0;
    const words = w ? `<text class="mv-words">${w.lines.map((text, k) => `<tspan x="${n(w.x)}" y="${n(first + k * across.wordLine)}">${esc(text)}</tspan>`).join('')}</text>` : '';
    const number = s.number ? `<g class="mv-num" transform="translate(${at(s.number)})"><circle r="${across.number}"/><text y="3.5">${m.number}</text></g>` : '';
    const role = live ? ` tabindex="0" role="button" aria-label="${esc(`Message ${i + 1}, ${label.get(m.from)} to ${label.get(m.to)}${m.label ? `: ${m.label}` : ''}`)}"` : '';
    return `<g class="mv-edge" data-edge="${esc(m.id)}" data-style="${m.style}"${role}><path class="mv-line" d="${pathOf(line)}"/>${tail.svg}${head.svg}${words}${number}${live ? `<path class="mv-hit" d="${pathOf(pts)}"/>` : ''}</g>`;
  });

  const notes = /** @type {import('./sequence.mjs').Note[]} */ (model.items.filter((i) => i.type === 'note')).map((note) => {
    const b = lay.notes[note.id], l = b.x - b.w / 2, t = b.y - b.h / 2, r = b.x + b.w / 2, u = b.y + b.h / 2, f = show.fold;
    const first = b.y - ((b.lines.length - 1) * across.noteLine) / 2 + show.wordBase;
    return `<g class="mv-note" data-note="${esc(note.id)}" data-over="${esc(note.over.join(' '))}" data-after="${saidBy[model.items.indexOf(note)]}"><path class="mv-note-box" d="M${n(l)},${n(t)}H${n(r - f)}L${n(r)},${n(t + f)}V${n(u)}H${n(l)}Z"/><path class="mv-note-fold" d="M${n(r - f)},${n(t)}V${n(t + f)}H${n(r)}"/>`
      + `<text>${b.lines.map((text, k) => `<tspan x="${n(b.x)}" y="${n(first + k * across.noteLine)}">${esc(text)}</tspan>`).join('')}</text></g>`;
  });

  const box = (/** @type {import('./sequence.mjs').Participant} */ p, /** @type {number} */ y, /** @type {boolean} */ foot) => {
    const s = lay.participants[p.id];
    const first = y - ((s.lines.length - 1) * across.headLine) / 2 + show.nameBase;
    const role = live && !foot ? ` tabindex="0" role="button" aria-label="${esc(`${p.label}, ${roleName(p.role).toLowerCase()}`)}"` : '';
    return `<g class="mv-node" data-node="${esc(p.id)}" data-kind="${esc(p.kind)}"${role}><rect class="mv-shape${p.shape === 'pill' ? ' mv-pill' : ''}" x="${n(s.x - s.w / 2)}" y="${n(y - s.h / 2)}" width="${s.w}" height="${s.h}" rx="${p.shape === 'pill' ? s.h / 2 : Math.min(design.radius, s.h / 2)}"/>`
      + `<text>${s.lines.map((text, k) => `<tspan x="${n(s.x)}" y="${n(first + k * across.headLine)}">${esc(text)}</tspan>`).join('')}</text></g>`;
  };
  const heads = model.participants.map((p) => box(p, lay.participants[p.id].y, false));
  const feet = model.participants.filter((p) => lay.participants[p.id].foot !== null).map((p) => box(p, /** @type {number} */ (lay.participants[p.id].foot), true));

  // On a still picture the dots are drawn. A live page spreads them over its whole stage instead.
  const ground = design.ground === 'dots' && !live
    ? `<defs><pattern id="mv-dots" width="${show.dots}" height="${show.dots}" patternUnits="userSpaceOnUse"><circle cx="${show.dots / 2}" cy="${show.dots / 2}" r="1" fill="var(--mv-dot)"/></pattern></defs><rect class="mv-ground" width="${lay.width}" height="${lay.height}" fill="url(#mv-dots)"/>`
    : '';
  return `${ground}<g>${groups.join('')}</g><g>${frames.join('')}</g><g>${lives.join('')}</g><g>${bars.join('')}</g><g>${frameNames.join('')}</g><g>${lines.join('')}</g><g>${notes.join('')}</g><g>${heads.join('')}${feet.join('')}</g>`;
}

/**
 * A still picture: one SVG file, for wikis and anywhere a page cannot go.
 * @param {SequenceModel} model
 * @param {SequenceLayout} lay
 * @param {Design} design
 * @param {{title:string}} about
 */
export function sequencePicture(model, lay, design, about) {
  const title = titleOf(model.heading, lay.width);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="mv-svg" viewBox="0 0 ${lay.width} ${lay.height + title.band}" width="${lay.width}" height="${lay.height + title.band}" role="img" aria-label="${esc(about.title)}">
<title>${esc(about.title)}</title>${model.describes ? `\n<desc>${esc(model.describes)}</desc>` : ''}
<style>${styleOf(design, kindsOf(model), '.mv-svg')}</style>
<rect width="100%" height="100%" fill="var(--mv-bg)"/>
${title.band ? `${title.svg}\n<g transform="translate(0,${title.band})">\n${sequenceInside(model, lay, design, false)}\n</g>` : sequenceInside(model, lay, design, false)}
</svg>
`;
}

/**
 * The live page: the same drawing, with picking and going through the messages around it.
 * @param {SequenceModel} model
 * @param {SequenceLayout} lay
 * @param {Design} design
 * @param {{title:string,source:string,version:string}} about
 */
export function sequencePage(model, lay, design, about) {
  const kinds = kindsOf(model);
  const sent = /** @type {import('./sequence.mjs').Message[]} */ (model.items.filter((i) => i.type === 'message'));
  const data = {
    participants: model.participants.map((p) => ({ id: p.id, label: p.label, role: roleName(p.role) })),
    messages: sent.map((m) => ({ id: m.id, from: m.from, to: m.to, label: m.label })),
    motion: design.motion,
  };
  // "</" inside the script would end it early, wherever it came from.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const legend = kinds.map((k) => `<span><i style="border-color:var(--mv-k-${k});background:var(--mv-kf-${k})"></i>${esc(kindName(k))}</span>`).join('');
  const steps = design.output.steps && sent.length
    ? `<section class="mv-card mv-steps" aria-live="polite">
<p class="mv-small" id="mv-count"></p>
<h2 id="mv-step-title"></h2>
<p id="mv-step-text"></p>
<div class="mv-row"><button type="button" id="mv-prev">Back</button><button type="button" id="mv-next" class="mv-main">Next</button></div>
</section>`
    : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="Merlive ${esc(about.version)}">
<title>${esc(about.title)}</title>
<style>
${styleOf(design, kinds, ':root')}
*{box-sizing:border-box}
body{margin:0;background:var(--mv-bg);color:var(--mv-text);font:15px/1.5 ${design.font}}
main{max-width:1080px;margin:0 auto;padding:20px 16px 40px;display:grid;gap:16px}
h1{font-size:20px;font-weight:650;margin:0;text-wrap:balance}
h2{font-size:16px;font-weight:650;margin:0}
p{margin:0}
.mv-layout{display:grid;gap:16px;grid-template-columns:minmax(0,1fr)}
@media (min-width:880px){.mv-layout{grid-template-columns:minmax(0,1fr) 340px;align-items:start}.mv-side{position:sticky;top:16px}}
.mv-stage{margin:0;overflow-x:auto}
/* The drawing may shrink to fit, but only so far: below that the words stop being readable, so it scrolls. */
.mv-svg{display:block;width:clamp(${Math.round(lay.width * show.leastScale)}px,100%,${lay.width}px);height:auto;margin:0 auto}
#mv-picked:not([hidden]){display:grid;gap:8px}
.mv-side{display:grid;gap:12px}
/* On a phone a sequence is taller than the screen, so the card that goes through it stays at the foot of the
   screen. It can only stay within what holds it, so there the drawing and the cards are one plain column. */
@media (max-width:879px){.mv-layout{display:block}.mv-side{display:contents}.mv-stage,.mv-card{margin-bottom:12px}.mv-steps{position:sticky;bottom:8px;z-index:1;box-shadow:0 2px 14px var(--mv-shadow)}}
.mv-card{background:var(--mv-node);border:1px solid var(--mv-stroke);border-radius:${Math.min(design.radius, 14)}px;padding:14px;display:grid;gap:8px}
.mv-small,.mv-legend{font-size:12px;color:var(--mv-muted)}
.mv-row{display:flex;gap:8px;flex-wrap:wrap}
.mv-row .mv-main{margin-left:auto}
button{font:inherit;font-size:14px;color:var(--mv-text);background:var(--mv-node);border:1px solid var(--mv-stroke);border-radius:8px;padding:7px 12px;min-height:38px;cursor:pointer}
button.mv-main{background:var(--mv-accent);border-color:var(--mv-accent);color:var(--mv-bg)}
button:disabled{opacity:.4;cursor:default}
button:focus-visible,summary:focus-visible{outline:3px solid var(--mv-accent);outline-offset:2px}
.mv-legend{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:8px}
.mv-legend span{display:inline-flex;align-items:center;gap:6px}
.mv-legend i{width:14px;height:10px;border:2px solid;border-radius:3px}
dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:14px}
dt{color:var(--mv-muted)}
dd{margin:0}
pre{margin:8px 0 0;font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-x:auto;border:1px solid var(--mv-stroke);border-radius:8px;padding:10px}
summary{cursor:pointer;color:var(--mv-muted);font-size:13px}
.mv-node[role],.mv-edge{cursor:pointer}
.mv-node,.mv-edge,.mv-note,.mv-frame,.mv-bar{transition:opacity .2s}
.mv-node:focus,.mv-edge:focus{outline:none}
.mv-hit{fill:none;stroke:transparent;stroke-width:22;pointer-events:stroke}
.mv-dim{opacity:.16}
.mv-lit .mv-shape{stroke-width:2.4}
.mv-on .mv-line,.mv-sel .mv-line,.mv-edge:focus-visible .mv-line{stroke:var(--mv-accent);stroke-width:2.6}
.mv-on .mv-head,.mv-sel .mv-head{fill:var(--mv-accent)}
.mv-on .mv-cross,.mv-sel .mv-cross,.mv-on .mv-open,.mv-sel .mv-open{stroke:var(--mv-accent)}
.mv-on .mv-num circle,.mv-sel .mv-num circle{fill:var(--mv-accent)}
.mv-sel .mv-shape,.mv-node:focus-visible .mv-shape{stroke:var(--mv-accent);stroke-width:3}
.mv-stage{border-radius:${Math.min(design.radius, 14)}px;padding:8px 0${design.ground === 'dots' ? `;background-image:radial-gradient(var(--mv-dot) 1px,transparent 1.3px);background-size:${show.dots}px ${show.dots}px` : ''}}
#mv-dot circle{fill:var(--mv-accent);stroke:var(--mv-bg);stroke-width:2}
#mv-dot{pointer-events:none}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
@media print{button,.mv-source{display:none}.mv-layout{grid-template-columns:1fr}.mv-dim{opacity:1}}
</style>
</head>
<body data-motion="${design.motion}">
<main>
<h1>${esc(about.title)}</h1>
<div class="mv-layout">
<figure class="mv-stage">
<svg class="mv-svg" viewBox="0 0 ${lay.width} ${lay.height}" role="group" aria-label="${esc(about.title)}">${model.describes ? `\n<desc>${esc(model.describes)}</desc>` : ''}
${sequenceInside(model, lay, design, true)}
<g id="mv-dot" style="display:none"><circle r="6"/></g>
</svg>
${design.output.legend ? `<figcaption class="mv-legend">${legend}</figcaption>` : ''}
</figure>
<div class="mv-side">
${steps}
<section class="mv-card" aria-live="polite">
<p class="mv-small" id="mv-none">Pick a participant or a message to see only what it touches.</p>
<div id="mv-picked" hidden>
<h2 id="mv-title"></h2>
<p id="mv-note"></p>
<dl id="mv-facts"></dl>
<div class="mv-row"><button type="button" id="mv-clear">Show everything</button></div>
</div>
</section>
</div>
</div>
${design.output.source ? `<details class="mv-source"><summary>Mermaid source</summary><pre id="mermaid-source">${esc(about.source)}</pre></details>` : ''}
</main>
<script>(${sequenceRuntime.toString()})(${json});</script>
</body>
</html>
`;
}
