// Why: one file out, nothing fetched. The drawing is plain SVG that reads on its own (in a wiki, in print,
// with scripts off); the page around it adds picking and steps. Pure: a model, a layout and a design in, a
// string out.

import { contrast, kindFill, looksOf, mix, rowShade } from './design.mjs';
import { runtime } from './runtime.mjs';
import { outlineOf, wordsAt } from './shapes.mjs';
import { iconMeasure, icons } from './icons.mjs';
import { columnsAt, compartmentsOf, measure, wrap } from './layout.mjs';

/** @typedef {import('./layout.mjs').Pt} Pt */

export const draw = {
  rim: 0.75, // px a table's shading stays in from the edge of its box: half the line the box is drawn with
  titleGlyph: 8.4, // px per character of a picture's title, at 15px and heavy
  titleLine: 20, // px between two lines of a title
  titlePad: 18, // px above a title, and again between it and the picture
  corner: 8, // the round of a line's turn
  head: 9, // an arrowhead's length
  headHalf: 4.5, // and half its width
  mark: 3.5, // the radius of a circle at a line's end, and how far a cross reaches from its middle
  tri: 11, // the length of the hollow triangle that says "is a"
  diamond: 14, // the length of the diamond that says "is made of" or "has"
  foot: 9, // how far back from its box a crow's foot starts to spread
  ring: 3.5, // the radius of the ring that says "none"
  baseline: 4.5, // from the middle of a 13px line of words down to its baseline
  dots: 16, // px between the dots of the ground: an eighth of the narrowest box
  dot: 0.12, // how much of the text colour a dot is, over the page: there, and no more
  frame: 0.035, // how much of the text colour fills a group's frame
  stripe: 4, // px across the stripe that marks a box of a kind
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
  // What is made from the palette, not chosen: the ground's dots, a frame's fill, and a shadow that is the text
  // colour thinned on a light page and plain dark on a dark one, where a tinted shadow would not show.
  const lightPage = contrast('#000000', p.bg) >= contrast('#ffffff', p.bg);
  const made = [`--mv-dot:${mix(p.text, p.bg, draw.dot)}`, `--mv-group:${mix(p.text, p.bg, draw.frame)}`, `--mv-shadow:${lightPage ? `${p.text}29` : '#00000080'}`];
  return [...base, ...each, ...made].join(';');
}

/** The drawing's own rules, with no colours in them: those come from the variables of whatever it sits in. */
export function rulesFor(/** @type {import('./design.mjs').Design} */ design, /** @type {string[]} */ kinds, /** @type {string[]} */ lines = []) {
  return `.mv-svg{font-family:${design.font}}
.mv-shape{fill:var(--mv-node);stroke:var(--mv-stroke);stroke-width:1.5}
${design.depth === 'soft' ? '.mv-node{filter:drop-shadow(0 2px 5px var(--mv-shadow))}\n' : ''}${kinds.map((k) => `[data-kind="${k}"] .mv-shape{fill:var(--mv-kf-${k});stroke:var(--mv-k-${k})}`).join('\n')}
.mv-node .mv-detail{fill:none}
[data-outline~="dashed"] .mv-shape{stroke-dasharray:5 4}
[data-outline~="heavy"] .mv-shape{stroke-width:2.6}
.mv-node .mv-rows{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px;font-weight:400;text-anchor:start;white-space:pre}
.mv-node .mv-cell{font-size:12px;font-weight:400;text-anchor:start}
.mv-band{fill:var(--mv-text);opacity:${rowShade};stroke:none}
.mv-grid{fill:none;stroke:var(--mv-stroke);stroke-width:1}
.mv-node .mv-over{font-size:11px;font-weight:400;fill:var(--mv-muted)}
.mv-hollow{fill:var(--mv-bg);stroke:var(--mv-edge);stroke-width:1.4;stroke-linejoin:round}
.mv-icon{fill:none;stroke:var(--mv-text);stroke-width:${iconMeasure.stroke};stroke-linecap:round;stroke-linejoin:round}
.mv-node text{font-size:13px;font-weight:${design.weight};fill:var(--mv-text);text-anchor:middle}
.mv-line{fill:none;stroke:var(--mv-edge);stroke-width:1.4}
.mv-main .mv-line{stroke-width:2.4}
.mv-stripe{stroke:none}
.mv-title{font-size:15px;font-weight:600;fill:var(--mv-text);text-anchor:middle}
${kinds.map((k) => `[data-kind="${k}"] .mv-stripe{fill:var(--mv-k-${k})}`).join('\n')}
[data-style="dotted"] .mv-line{stroke-dasharray:2 5;stroke-linecap:round}
[data-style="thick"] .mv-line{stroke-width:2.8}
.mv-head{fill:var(--mv-edge)}
.mv-cross{fill:none;stroke:var(--mv-edge);stroke-width:1.8;stroke-linecap:round}
${lines.map((k) => `[data-kind="${k}"] .mv-line,[data-kind="${k}"] .mv-cross{stroke:var(--mv-k-${k})}[data-kind="${k}"] .mv-head{fill:var(--mv-k-${k})}\n`).join('')}.mv-label{font-size:11px;font-weight:600;fill:var(--mv-muted);text-anchor:middle;paint-order:stroke;stroke:var(--mv-bg);stroke-width:4px;stroke-linejoin:round}
.mv-group rect{fill:var(--mv-group);stroke:var(--mv-stroke);stroke-width:1;stroke-dasharray:5 4}
.mv-name{font-size:11px;font-weight:600;fill:var(--mv-muted);letter-spacing:.04em;text-transform:uppercase;text-anchor:middle;paint-order:stroke;stroke:var(--mv-group);stroke-width:4px;stroke-linejoin:round}`;
}

/** The colours of the looks a design is drawn in: one, or light with dark for readers whose system asks for it. */
function styleOf(/** @type {import('./design.mjs').Design} */ design, /** @type {string[]} */ kinds, /** @type {string} */ root, /** @type {string[]} */ lines = []) {
  const [[first, one], two] = looksOf(design);
  const scheme = (/** @type {string} */ mode) => (mode === 'dark' ? ';color-scheme:dark' : '');
  const dark = two ? `@media (prefers-color-scheme:dark){${root}{${variables(two[1], kinds)}${scheme(two[0])}}}` : '';
  return `${root}{${variables(one, kinds)}${scheme(first)}}${dark}\n${rulesFor(design, kinds, lines)}`;
}

/**
 * What is drawn at one end of a link, and how far the line stops short of the tip to make room for it. An
 * arrowhead says which way; a circle and a cross are Mermaid's, kept because an author who wrote one meant it.
 * @param {import('./parse.mjs').Mark} mark
 * @param {Pt} tip where the line meets its box
 * @param {Pt} from the point of the line before the tip
 */
function markAt(mark, tip, from) {
  if (mark === 'arrow') {
    const back = toward(tip, from, draw.head), dx = (tip.y - from.y) / (dist(from, tip) || 1), dy = -(tip.x - from.x) / (dist(from, tip) || 1);
    return { inset: draw.head - 2, svg: `<polygon class="mv-head" points="${at(tip)} ${at({ x: back.x + dx * draw.headHalf, y: back.y + dy * draw.headHalf })} ${at({ x: back.x - dx * draw.headHalf, y: back.y - dy * draw.headHalf })}"/>` };
  }
  const m = draw.mark, c = toward(tip, from, m + 1);
  if (mark === 'circle') return { inset: 2 * m, svg: `<circle class="mv-head" cx="${n(c.x)}" cy="${n(c.y)}" r="${m}"/>` };
  if (mark === 'cross') return { inset: m + 1, svg: `<path class="mv-cross" d="M${at({ x: c.x - m, y: c.y - m })}L${at({ x: c.x + m, y: c.y + m })}M${at({ x: c.x - m, y: c.y + m })}L${at({ x: c.x + m, y: c.y - m })}"/>` };
  // Along the line and across it, from the tip: every other mark is set out with these two.
  const ux = (from.x - tip.x) / (dist(tip, from) || 1), uy = (from.y - tip.y) / (dist(tip, from) || 1);
  const off = (/** @type {number} */ back, /** @type {number} */ side) => at({ x: tip.x + ux * back - uy * side, y: tip.y + uy * back + ux * side });
  const polygon = (/** @type {string} */ cls, /** @type {[number,number][]} */ pts) => `<polygon class="${cls}" points="${pts.map(([back, side]) => off(back, side)).join(' ')}"/>`;
  const strokes = (/** @type {[number,number][][]} */ lines) => `<path class="mv-cross" d="${lines.map((l) => `M${l.map(([back, side]) => off(back, side)).join('L')}`).join('')}"/>`;
  const ring = (/** @type {number} */ back) => `<circle class="mv-hollow" cx="${n(tip.x + ux * back)}" cy="${n(tip.y + uy * back)}" r="${draw.ring}"/>`;
  const t = draw.tri, d = draw.diamond, w = draw.headHalf + 1, f = draw.foot;
  // A class diagram's ends: the hollow triangle of "is a", the filled diamond of "is made of", the open one of "has".
  if (mark === 'triangle') return { inset: t, svg: polygon('mv-hollow', [[0, 0], [t, w], [t, -w]]) };
  if (mark === 'diamond' || mark === 'diamond-open') return { inset: d, svg: polygon(mark === 'diamond' ? 'mv-head' : 'mv-hollow', [[0, 0], [d / 2, w - 1], [d, 0], [d / 2, -(w - 1)]]) };
  // An entity diagram's ends say how many: a bar is one, a ring is none, a foot is many. The line runs on to the
  // box beneath them, since they say nothing of which way.
  const bar = (/** @type {number} */ back) => /** @type {[number,number][]} */ ([[back, w], [back, -w]]);
  const foot = /** @type {[number,number][][]} */ ([[[f, 0], [0, w]], [[f, 0], [0, -w]]]);
  if (mark === 'one') return { inset: 0, svg: strokes([bar(f - 4), bar(f)]) };
  if (mark === 'zero-or-one') return { inset: 0, svg: strokes([bar(f - 4)]) + ring(f + draw.ring + 1) };
  if (mark === 'one-or-many') return { inset: 0, svg: strokes([...foot, bar(f + 3)]) };
  if (mark === 'zero-or-many') return { inset: 0, svg: strokes(foot) + ring(f + draw.ring + 1) };
  return { inset: 0, svg: '' };
}

/** The drawing alone: the SVG's insides, the same for a page, a picture and the setup page. */
export function inside(/** @type {import('./parse.mjs').Model} */ model, /** @type {import('./layout.mjs').Layout} */ lay, /** @type {import('./design.mjs').Design} */ design, /** @type {boolean} */ live, tag = '') {
  // The main path, link by link: it is drawn heavier, so a reader's eye takes it first.
  // A class diagram and an entity diagram are of things, not of a flow: no path through one is the way a reader
  // goes, so none is drawn heavier.
  const things = /^(classDiagram|erDiagram)/.test(model.kindOfDiagram);
  const main = new Set(things ? [] : lay.spine.slice(1).map((id, i) => `${lay.spine[i]}>${id}`));
  const label = new Map(model.nodes.map((m) => [m.id, m.label]));
  const links = model.edges.map((e) => {
    const r = lay.edges[e.id], pts = r.points;
    const head = markAt(e.head, pts[pts.length - 1], pts[pts.length - 2]), tail = markAt(e.tail, pts[0], pts[1]);
    // The line stops short of each tip, so a thick stroke does not show past what is drawn there.
    const line = [toward(pts[0], pts[1], tail.inset), ...pts.slice(1, -1), toward(pts[pts.length - 1], pts[pts.length - 2], head.inset)];
    const l = r.label;
    const words = l ? `<text class="mv-label">${l.lines.map((line, i) => `<tspan class="mv-label-line" x="${n(l.x)}" y="${n(l.y - ((l.lines.length - 1) * 14) / 2 + 4 + i * 14)}">${esc(line)}</tspan>`).join('')}</text>` : '';
    const ends = [r.near, r.far].map((l) => (l ? `<text class="mv-label mv-end" x="${n(l.x)}" y="${n(l.y + 4)}">${esc(l.text)}</text>` : '')).join('');
    const mid = middleOf(pts);
    const extras = live ? `<path class="mv-hit" d="${pathOf(pts)}"/><g class="mv-seq" transform="translate(${at(mid)})"><circle r="8"/><text y="3.5"></text></g>` : '';
    const said = e.tail === 'arrow' && e.head === 'arrow' ? `Link both ways between ${label.get(e.from)} and ${label.get(e.to)}` : `Link from ${label.get(e.from)} to ${label.get(e.to)}`;
    const role = live ? ` tabindex="0" role="button" aria-label="${esc(`${said}${e.label ? `, ${e.label}` : ''}`)}"` : '';
    return `<g class="mv-edge${main.has(`${e.from}>${e.to}`) ? ' mv-main' : ''}" data-edge="${esc(e.id)}" data-style="${e.style}"${e.kind ? ` data-kind="${esc(e.kind)}"` : ''}${role}><path class="mv-line" d="${pathOf(line)}"/>${tail.svg}${head.svg}${words}${ends}${extras}</g>`;
  });
  const boxes = model.nodes.map((m) => {
    const b = lay.nodes[m.id], l = b.x - b.w / 2, t = b.y - b.h / 2, r = b.x + b.w / 2, u = b.y + b.h / 2;
    const { main, more } = outlineOf(m.shape, l, t, b.w, b.h, design.radius), at = wordsAt(m.shape, b.h);
    const shape = main + more.join('');
    // A box that lists rows keeps its name in a block at the top, the size a plain box is, with any short line
    // above it; under that, each compartment begins with a rule and lists its rows from the left.
    const listed = compartmentsOf(m), over = m.over ? measure.overLine : 0;
    const nameY = listed.length || over ? t + over + lay.box.h / 2 : b.y;
    const above = m.over ? `<text class="mv-over" x="${n(b.x)}" y="${n(t + measure.overLine + 4)}">${esc(m.over)}</text>` : '';
    let down = t + over + lay.box.h;
    // An entity is a table: a rule under its name, a row for each attribute with a rule between rows and
    // between columns, and every second row shaded, so a reader can follow one across.
    const table = () => {
      const at = columnsAt(m, b.w), all = m.table ?? [], top = down, e = draw.rim;
      const curve = Math.max(0, Math.min(design.radius, b.h / 2) - e);
      const parts = [`<path class="mv-shape mv-detail" d="M${n(l)},${n(top)}H${n(r)}"/>`];
      all.forEach((cells, i) => {
        const y = top + i * measure.cellLine, last = i === all.length - 1;
        // The last row ends where the box does, and takes the round of its corners.
        if (i % 2) parts.push(last
          ? `<path class="mv-band" d="M${n(l + e)},${n(y)}H${n(r - e)}V${n(u - e - curve)}a${n(curve)},${n(curve)} 0 0 1 ${n(-curve)},${n(curve)}H${n(l + e + curve)}a${n(curve)},${n(curve)} 0 0 1 ${n(-curve)},${n(-curve)}Z"/>`
          : `<rect class="mv-band" x="${n(l + e)}" y="${n(y)}" width="${n(b.w - 2 * e)}" height="${measure.cellLine}"/>`);
      });
      all.slice(1).forEach((_, i) => parts.push(`<path class="mv-grid" d="M${n(l)},${n(top + (i + 1) * measure.cellLine)}H${n(r)}"/>`));
      at.slice(1, -1).forEach((x) => parts.push(`<path class="mv-grid" d="M${n(l + x)},${n(top)}V${n(u)}"/>`));
      all.forEach((cells, i) => cells.forEach((cell, c) => {
        if (cell && c < at.length - 1) parts.push(`<text class="mv-cell" x="${n(l + at[c] + measure.cellPad)}" y="${n(top + i * measure.cellLine + measure.cellLine / 2 + 4)}">${esc(cell)}</text>`);
      }));
      return parts.join('');
    };
    const rows = m.table ? table() : listed.map((lines) => {
      const rule = `<path class="mv-shape mv-detail" d="M${n(l)},${n(down)}H${n(r)}"/>`;
      const spans = lines.map((line, i) => `<tspan class="mv-row" x="${n(l + measure.rowIn)}" y="${n(down + measure.rowPad + measure.rowLine * i + 12)}">${esc(line)}</tspan>`).join('');
      down += 2 * measure.rowPad + measure.rowLine * lines.length;
      // Spaces are kept as written, so an author's columns (a key, a type, a name) stay in line.
      return `${rule}<text class="mv-rows" xml:space="preserve">${spans}</text>`;
    }).join('');
    // An icon sits left of the words, on the middle of their block; the words move over by half its room, so
    // icon and words together stay in the middle of the box.
    const drawing = m.icon ? icons[m.icon] : '', aside = drawing ? measure.icon / 2 : 0;
    const widest = Math.max(...b.lines.map((line) => line.length)) * measure.glyph;
    const icon = drawing ? `<path class="mv-icon" transform="translate(${n(b.x + at.dx + aside - widest / 2 - measure.icon)},${n(nameY + at.dy - iconMeasure.grid / 2)})" d="${drawing}"/>` : '';
    const first = nameY + at.dy - ((b.lines.length - 1) * 16) / 2 + draw.baseline;
    const words = b.lines.map((line, i) => `<tspan x="${n(b.x + at.dx + aside)}" y="${n(first + i * 16)}">${esc(line)}</tspan>`).join('');
    const role = live ? ` tabindex="0" role="button" aria-label="${esc(`${m.label}, ${kindName(m.kind)}`)}"` : '';
    // A box of a kind that means something carries a stripe of its colour down its near edge. Any other shape
    // already says what it is by its outline, and a plain step has nothing to say.
    const round = Math.min(design.radius, b.h / 2);
    const marked = m.shape === 'box' && m.kind !== 'step' && b.h - 2 * round >= 12;
    const stripe = marked ? `<rect class="mv-stripe" x="${n(l + 1)}" y="${n(t + Math.max(round, 1))}" width="${draw.stripe}" height="${n(b.h - 2 * Math.max(round, 1))}"/>` : '';
    // What its author's own style said of its outline: broken, heavy, or both.
    const said = [m.dashed ? 'dashed' : '', m.heavy ? 'heavy' : ''].filter(Boolean).join(' ');
    const outline = said ? ` data-outline="${said}"` : '';
    return `<g class="mv-node" data-node="${esc(m.id)}" data-kind="${esc(m.kind)}"${outline}${role}>${shape}${stripe}${icon}${above}<text>${words}</text>${rows}</g>`;
  });
  // A group's frame, behind everything, with what the group is called at its top left.
  const frames = lay.groups.map((f) => `<g class="mv-group"><rect x="${n(f.x)}" y="${n(f.y)}" width="${n(f.w)}" height="${n(f.h)}" rx="${Math.min(design.radius, 10)}"/></g>`);
  // A group's name is drawn over the lines, with the frame's own colour round its letters: where a line has to
  // pass, it passes behind the name.
  const names = lay.groups.filter((f) => f.title).map((f) => `<text class="mv-name" x="${n(f.name.x)}" y="${n(f.name.y + 4)}">${esc(f.title)}</text>`);
  // The ground: the grid the boxes are placed on, shown as dots faint enough to sit behind everything.
  // A live page spreads them over its whole stage instead, so they do not stop at the drawing's edge.
  const ground = design.ground === 'dots' && !live
    ? `<defs><pattern id="mv-dots${tag}" width="${draw.dots}" height="${draw.dots}" patternUnits="userSpaceOnUse"><circle cx="${draw.dots / 2}" cy="${draw.dots / 2}" r="1" fill="var(--mv-dot)"/></pattern></defs><rect class="mv-ground" width="${lay.width}" height="${lay.height}" fill="url(#mv-dots${tag})"/>`
    : '';
  return `${ground}<g>${frames.join('')}</g><g>${links.join('')}</g><g>${names.join('')}</g><g>${boxes.join('')}</g>`;
}

/** The kinds a diagram uses: of its boxes, then any that only a link has, from the colour its author gave it. */
export const kindsIn = (/** @type {import('./parse.mjs').Model} */ model) => [...new Set([...model.nodes.map((m) => m.kind), ...lineKindsIn(model)])];
export const lineKindsIn = (/** @type {import('./parse.mjs').Model} */ model) => [...new Set(model.edges.flatMap((e) => (e.kind ? [e.kind] : [])))];

/**
 * The title its author gave a picture, above it. A page has a heading of its own; a still picture has only
 * itself, and a title left off it is lost. Wrapped so that no line is wider than the picture.
 * @param {string} heading
 * @param {number} width of the picture
 * @returns {{band:number,svg:string}} the room it takes above the picture, and its words
 */
export function titleOf(heading, width) {
  if (!heading) return { band: 0, svg: '' };
  const lines = wrap(heading, Math.max(8, Math.floor((width - 2 * draw.titlePad) / draw.titleGlyph)));
  const spans = lines.map((line, i) => `<tspan class="mv-title-line" x="${n(width / 2)}" y="${n(draw.titlePad + 15 + i * draw.titleLine)}">${esc(line)}</tspan>`).join('');
  return { band: draw.titlePad + lines.length * draw.titleLine, svg: `<text class="mv-title">${spans}</text>` };
}

/**
 * A still picture: one SVG file, for wikis and anywhere a page cannot go.
 * @param {import('./parse.mjs').Model} model
 * @param {import('./layout.mjs').Layout} lay
 * @param {import('./design.mjs').Design} design
 * @param {{title:string}} about
 */
export function picture(model, lay, design, about) {
  const title = titleOf(model.heading, lay.width);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="mv-svg" viewBox="0 0 ${lay.width} ${lay.height + title.band}" width="${lay.width}" height="${lay.height + title.band}" role="img" aria-label="${esc(about.title)}">
<title>${esc(about.title)}</title>${model.describes ? `\n<desc>${esc(model.describes)}</desc>` : ''}
<style>${styleOf(design, kindsIn(model), '.mv-svg', lineKindsIn(model))}</style>
<rect width="100%" height="100%" fill="var(--mv-bg)"/>
${title.band ? `${title.svg}\n<g transform="translate(0,${title.band})">\n${inside(model, lay, design, false)}\n</g>` : inside(model, lay, design, false)}
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
  // The legend is of boxes: a line's colour is its author's, and nobody said what it means.
  const legend = [...new Set(model.nodes.map((m) => m.kind))].map((k) => `<span><i style="border-color:var(--mv-k-${k});background:var(--mv-kf-${k})"></i>${esc(kindName(k))}</span>`).join('');
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
${styleOf(design, kinds, ':root', lineKindsIn(model))}
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
.mv-stage{border-radius:${Math.min(design.radius, 14)}px;padding:8px 0${design.ground === 'dots' ? `;background-image:radial-gradient(var(--mv-dot) 1px,transparent 1.3px);background-size:${draw.dots}px ${draw.dots}px` : ''}}
.mv-on .mv-head,.mv-sel .mv-head{fill:var(--mv-accent)}
.mv-edge.mv-on .mv-line,.mv-edge.mv-sel .mv-line,.mv-edge.mv-on .mv-cross,.mv-edge.mv-sel .mv-cross{stroke:var(--mv-accent)}
.mv-edge.mv-on .mv-head,.mv-edge.mv-sel .mv-head{fill:var(--mv-accent)}
.mv-edge.mv-on .mv-hollow,.mv-edge.mv-sel .mv-hollow{stroke:var(--mv-accent)}
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
<svg class="mv-svg" viewBox="0 0 ${lay.width} ${lay.height}" role="group" aria-label="${esc(about.title)}">${model.describes ? `\n<desc>${esc(model.describes)}</desc>` : ''}
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
