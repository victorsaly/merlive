// Why: one file out, nothing fetched. The drawing is plain SVG that reads on its own (in a wiki, in print,
// with scripts off); the page around it adds picking and steps. Pure: a model, a layout and a design in, a
// string out.

import { kindFill, looksOf } from './design.mjs';
import { runtime } from './runtime.mjs';

/** @typedef {import('./layout.mjs').Pt} Pt */

const draw = {
  corner: 8, // the round of a line's turn
  head: 9, // an arrowhead's length
  headHalf: 4.5, // and half its width
  cut: 0.36, // how much of a decision's height its corners are cut by
  baseline: 4.5, // from the middle of a 13px line of words down to its baseline
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
    const r = Math.min(draw.corner, dist(pts[i - 1], pts[i]) / 2, dist(pts[i], pts[i + 1]) / 2);
    d += `L${at(toward(pts[i], pts[i - 1], r))}Q${at(pts[i])} ${at(toward(pts[i], pts[i + 1], r))}`;
  }
  return `${d}L${at(pts[pts.length - 1])}`;
}

/** The point half way along a line, where its step number sits. */
function middleOf(/** @type {Pt[]} */ pts) {
  const total = pts.slice(1).reduce((sum, p, i) => sum + dist(pts[i], p), 0);
  let left = total / 2;
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i - 1], pts[i]);
    if (left <= d) return toward(pts[i - 1], pts[i], left);
    left -= d;
  }
  return pts[pts.length - 1];
}

export const kindName = (/** @type {string} */ k) => (k === 'terminal' ? 'Start or end' : k.charAt(0).toUpperCase() + k.slice(1));

/** The colours as CSS variables, with each kind's edge and fill worked out here, not by the browser. */
export function variables(/** @type {import('./design.mjs').Palette} */ p, /** @type {string[]} */ kinds) {
  const base = ['bg', 'node', 'stroke', 'text', 'muted', 'edge', 'accent'].map((k) => `--mv-${k}:${/** @type {Record<string,string>} */ (/** @type {unknown} */ (p))[k]}`);
  const each = kinds.flatMap((k) => [`--mv-k-${k}:${p.kinds[k] ?? p.stroke}`, `--mv-kf-${k}:${kindFill(p, k)}`]);
  return [...base, ...each].join(';');
}

/** The drawing's own rules, with no colours in them: those come from the variables of whatever it sits in. */
export function rulesFor(/** @type {import('./design.mjs').Design} */ design, /** @type {string[]} */ kinds) {
  return `.mv-svg{font-family:${design.font}}
.mv-shape{fill:var(--mv-node);stroke:var(--mv-stroke);stroke-width:1.5}
${kinds.map((k) => `[data-kind="${k}"] .mv-shape{fill:var(--mv-kf-${k});stroke:var(--mv-k-${k})}`).join('\n')}
.mv-node text{font-size:13px;font-weight:${design.weight};fill:var(--mv-text);text-anchor:middle}
.mv-line{fill:none;stroke:var(--mv-edge);stroke-width:1.6}
[data-style="dotted"] .mv-line{stroke-dasharray:2 5;stroke-linecap:round}
[data-style="thick"] .mv-line{stroke-width:2.8}
.mv-head{fill:var(--mv-edge)}
.mv-label{font-size:11px;font-weight:600;fill:var(--mv-muted);text-anchor:middle;paint-order:stroke;stroke:var(--mv-bg);stroke-width:4px;stroke-linejoin:round}`;
}

/** The colours of the looks a design is drawn in: one, or light with dark for readers whose system asks for it. */
function styleOf(/** @type {import('./design.mjs').Design} */ design, /** @type {string[]} */ kinds, /** @type {string} */ root) {
  const [[first, one], two] = looksOf(design);
  const scheme = (/** @type {string} */ mode) => (mode === 'dark' ? ';color-scheme:dark' : '');
  const dark = two ? `@media (prefers-color-scheme:dark){${root}{${variables(two[1], kinds)}${scheme(two[0])}}}` : '';
  return `${root}{${variables(one, kinds)}${scheme(first)}}${dark}\n${rulesFor(design, kinds)}`;
}

/** The drawing alone: the SVG's insides, the same for a page, a picture and the setup page. */
export function inside(/** @type {import('./parse.mjs').Model} */ model, /** @type {import('./layout.mjs').Layout} */ lay, /** @type {import('./design.mjs').Design} */ design, /** @type {boolean} */ live) {
  const label = new Map(model.nodes.map((m) => [m.id, m.label]));
  const links = model.edges.map((e) => {
    const r = lay.edges[e.id], pts = r.points, end = pts[pts.length - 1], before = pts[pts.length - 2];
    // The line stops short of the tip so a thick stroke does not show past the arrowhead.
    const line = e.arrow ? [...pts.slice(0, -1), toward(end, before, draw.head - 2)] : pts;
    const back = toward(end, before, draw.head), dx = (end.y - before.y) / (dist(before, end) || 1), dy = -(end.x - before.x) / (dist(before, end) || 1);
    const head = e.arrow ? `<polygon class="mv-head" points="${at(end)} ${at({ x: back.x + dx * draw.headHalf, y: back.y + dy * draw.headHalf })} ${at({ x: back.x - dx * draw.headHalf, y: back.y - dy * draw.headHalf })}"/>` : '';
    const words = r.label ? `<text class="mv-label" x="${n(r.label.x)}" y="${n(r.label.y + 4)}">${esc(r.label.text)}</text>` : '';
    const mid = middleOf(pts);
    const extras = live ? `<path class="mv-hit" d="${pathOf(pts)}"/><g class="mv-seq" transform="translate(${at(mid)})"><circle r="8"/><text y="3.5"></text></g>` : '';
    const role = live ? ` tabindex="0" role="button" aria-label="${esc(`Link from ${label.get(e.from)} to ${label.get(e.to)}${e.label ? `, ${e.label}` : ''}`)}"` : '';
    return `<g class="mv-edge" data-edge="${esc(e.id)}" data-style="${e.style}"${role}><path class="mv-line" d="${pathOf(line)}"/>${head}${words}${extras}</g>`;
  });
  const boxes = model.nodes.map((m) => {
    const b = lay.nodes[m.id], l = b.x - b.w / 2, t = b.y - b.h / 2, r = b.x + b.w / 2, u = b.y + b.h / 2;
    const c = Math.round(b.h * draw.cut);
    const shape = m.shape === 'decision'
      ? `<polygon class="mv-shape" points="${n(l + c)},${n(t)} ${n(r - c)},${n(t)} ${n(r)},${n(b.y)} ${n(r - c)},${n(u)} ${n(l + c)},${n(u)} ${n(l)},${n(b.y)}"/>`
      : `<rect class="mv-shape${m.shape === 'pill' ? ' mv-pill' : ''}" x="${n(l)}" y="${n(t)}" width="${b.w}" height="${b.h}" rx="${m.shape === 'pill' ? b.h / 2 : Math.min(design.radius, b.h / 2)}"/>`;
    const first = b.y - ((b.lines.length - 1) * 16) / 2 + draw.baseline;
    const words = b.lines.map((line, i) => `<tspan x="${n(b.x)}" y="${n(first + i * 16)}">${esc(line)}</tspan>`).join('');
    const role = live ? ` tabindex="0" role="button" aria-label="${esc(`${m.label}, ${kindName(m.kind)}`)}"` : '';
    return `<g class="mv-node" data-node="${esc(m.id)}" data-kind="${esc(m.kind)}"${role}>${shape}<text>${words}</text></g>`;
  });
  return `<g>${links.join('')}</g><g>${boxes.join('')}</g>`;
}

export const kindsIn = (/** @type {import('./parse.mjs').Model} */ model) => [...new Set(model.nodes.map((m) => m.kind))];

/**
 * A still picture: one SVG file, for wikis and anywhere a page cannot go.
 * @param {import('./parse.mjs').Model} model
 * @param {import('./layout.mjs').Layout} lay
 * @param {import('./design.mjs').Design} design
 * @param {{title:string}} about
 */
export function picture(model, lay, design, about) {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="mv-svg" viewBox="0 0 ${lay.width} ${lay.height}" width="${lay.width}" height="${lay.height}" role="img" aria-label="${esc(about.title)}">
<title>${esc(about.title)}</title>
<style>${styleOf(design, kindsIn(model), '.mv-svg')}</style>
<rect width="100%" height="100%" fill="var(--mv-bg)"/>
${inside(model, lay, design, false)}
</svg>
`;
}

/**
 * The live page: the same drawing, with picking and steps around it.
 * @param {import('./parse.mjs').Model} model
 * @param {import('./layout.mjs').Layout} lay
 * @param {import('./design.mjs').Design} design
 * @param {{title:string,source:string,version:string}} about
 */
export function page(model, lay, design, about) {
  const kinds = kindsIn(model);
  const data = {
    nodes: model.nodes.map((m) => ({ id: m.id, label: m.label, kind: m.kind, kindName: kindName(m.kind), note: model.notes[m.id] ?? '' })),
    edges: model.edges.map((e) => ({ id: e.id, from: e.from, to: e.to, label: e.label })),
    steps: design.output.steps ? model.steps.map((s) => ({ title: s.title, text: s.text, seq: s.seq, loop: s.loop })) : [],
    motion: design.motion,
  };
  // "</" inside the script would end it early, wherever it came from.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const legend = kinds.map((k) => `<span><i style="border-color:var(--mv-k-${k});background:var(--mv-kf-${k})"></i>${esc(kindName(k))}</span>`).join('');
  const noted = model.nodes.filter((m) => model.notes[m.id]);
  const steps = data.steps.length
    ? `<section class="mv-card" aria-live="polite">
<p class="mv-small" id="mv-count"></p>
<h2 id="mv-step-title"></h2>
<p id="mv-step-text"></p>
<p class="mv-chip" id="mv-loop" hidden>This path is a loop: it repeats</p>
<div class="mv-row"><button type="button" id="mv-prev">Previous</button><button type="button" id="mv-play">Play this path</button><button type="button" id="mv-next" class="mv-main">Next</button></div>
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
@media (min-width:880px){.mv-layout{grid-template-columns:minmax(0,1fr) 340px;align-items:start}}
.mv-stage{margin:0;overflow-x:auto}
/* The drawing may shrink to fit, but only so far: below that the words stop being readable, so it scrolls. */
.mv-svg{display:block;width:clamp(${Math.round(lay.width * draw.leastScale)}px,100%,${lay.width}px);height:auto;margin:0 auto}
#mv-picked:not([hidden]){display:grid;gap:8px}
.mv-side{display:grid;gap:12px}
.mv-card{background:var(--mv-node);border:1px solid var(--mv-stroke);border-radius:${Math.min(design.radius, 14)}px;padding:14px;display:grid;gap:8px}
.mv-small,.mv-legend{font-size:12px;color:var(--mv-muted)}
.mv-chip{font-size:12px;color:var(--mv-accent);border:1px solid var(--mv-accent);border-radius:99px;padding:2px 10px;justify-self:start}
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
.mv-notes{display:none}
.mv-node,.mv-edge{cursor:pointer;transition:opacity .2s}
.mv-node:focus,.mv-edge:focus{outline:none}
.mv-hit{fill:none;stroke:transparent;stroke-width:22;pointer-events:stroke}
.mv-dim{opacity:.16}
.mv-lit .mv-shape{stroke-width:2.4}
.mv-on .mv-line,.mv-sel .mv-line,.mv-edge:focus-visible .mv-line{stroke:var(--mv-accent);stroke-width:2.6}
.mv-on .mv-head,.mv-sel .mv-head{fill:var(--mv-accent)}
.mv-sel .mv-shape,.mv-node:focus-visible .mv-shape{stroke:var(--mv-accent);stroke-width:3}
.mv-seq{display:none;pointer-events:none}
.mv-on .mv-seq{display:block}
.mv-seq circle{fill:var(--mv-accent)}
.mv-seq text{font-size:10px;font-weight:700;fill:var(--mv-bg);text-anchor:middle}
#mv-dot circle{fill:var(--mv-accent);stroke:var(--mv-bg);stroke-width:2}
#mv-dot{pointer-events:none}
@keyframes mv-flow{to{stroke-dashoffset:-13}}
body[data-motion="lively"].mv-playing .mv-on .mv-line{stroke-dasharray:7 6;animation:mv-flow .9s linear infinite}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
@media print{button,.mv-source{display:none}.mv-notes{display:block}.mv-layout{grid-template-columns:1fr}}
</style>
</head>
<body data-motion="${design.motion}">
<main>
<h1>${esc(about.title)}</h1>
<div class="mv-layout">
<figure class="mv-stage">
<svg class="mv-svg" viewBox="0 0 ${lay.width} ${lay.height}" role="group" aria-label="${esc(about.title)}">
${inside(model, lay, design, true)}
<g id="mv-dot" style="display:none"><circle r="6"/></g>
</svg>
${design.output.legend ? `<figcaption class="mv-legend">${legend}</figcaption>` : ''}
</figure>
<div class="mv-side">
${steps}
<section class="mv-card" aria-live="polite">
<p class="mv-small" id="mv-none">Pick a box or a line to see only what it connects to.</p>
<div id="mv-picked" hidden>
<h2 id="mv-title"></h2>
<p id="mv-note"></p>
<dl id="mv-facts"></dl>
<div class="mv-row"><button type="button" id="mv-clear">Show everything</button></div>
</div>
</section>
</div>
</div>
<section class="mv-notes">${noted.length ? `<h2>Notes</h2><dl>${noted.map((m) => `<dt>${esc(m.label)}</dt><dd>${esc(model.notes[m.id])}</dd>`).join('')}</dl>` : ''}</section>
${design.output.source ? `<details class="mv-source"><summary>Mermaid source</summary><pre id="mermaid-source">${esc(about.source)}</pre></details>` : ''}
</main>
<script>(${runtime.toString()})(${json});</script>
</body>
</html>
`;
}
