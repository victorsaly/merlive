// Why: a rule nobody checks is a wish. Every placement rule in docs/PLACEMENT.md is a check here, so a
// diagram that breaks one is not written, and the message says which rule and where. Pure.

import { hitsBox, meet, measure, roomFor, segmentsOf } from './layout.mjs';
import { apart, contrast, kindFill } from './design.mjs';

/** @typedef {{id:string,rule:string,ok:boolean,detail:string}} Check */

// What a drawing is held to. Each is named in docs/PLACEMENT.md with a picture of pass and fail.
export const limits = {
  linksPerCrossing: 8, // one crossing is allowed for every eight links; fewer than eight links, none
  mostLines: 3, // of words in a box
  textContrast: 4.5, // WCAG AA for words
  lineContrast: 3, // WCAG AA for lines and edges of boxes
  boxGap: 16, // the least room between two boxes
  // The least two kinds' colours may differ, in CIELAB. The sets made for colour-blind readers (Okabe-Ito, Paul
  // Tol's bright) keep their closest pair at 16 to 17, so they pass with room; two outlines closer than this
  // read as one colour with a legend beside them.
  tellApart: 12,
};

const overlap = (/** @type {{x:number,y:number,w:number,h:number}} */ a, /** @type {{x:number,y:number,w:number,h:number}} */ b, gap = 0) =>
  Math.abs(a.x - b.x) < (a.w + b.w) / 2 + gap && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + gap;

/**
 * @param {import('./parse.mjs').Model} model
 * @param {import('./layout.mjs').Layout} lay
 * @param {import('./design.mjs').Design} design
 * @returns {{pass:boolean,checks:Check[]}}
 */
export function score(model, lay, design) {
  /** @type {Check[]} */
  const checks = [];
  const add = (/** @type {string} */ id, /** @type {string} */ rule, /** @type {string[]} */ broken, /** @type {string} */ fine) =>
    checks.push({ id, rule, ok: broken.length === 0, detail: broken.length ? broken.join('; ') : fine });
  const nodes = Object.values(lay.nodes), edges = Object.values(lay.edges);
  const label = (/** @type {string} */ id) => model.nodes.find((n) => n.id === id)?.label ?? id;

  // P1
  const across = lay.direction === 'LR' ? 'y' : 'x';
  const line = lay.spine.length ? lay.nodes[lay.spine[0]][across] : 0;
  add('P1', 'The main path is one straight line', lay.spine.filter((id) => lay.nodes[id][across] !== line).map((id) => `"${label(id)}" is off the line`), `${lay.spine.length} boxes in line`);

  // P2
  /** @type {string[]} */
  const close = [];
  nodes.forEach((a, i) => nodes.slice(i + 1).forEach((b) => overlap(a, b, limits.boxGap) && close.push(`"${label(a.id)}" and "${label(b.id)}" are closer than ${limits.boxGap}px`)));
  add('P2', 'Boxes are one size, on a grid, with room between them', close, `${nodes.length} boxes of ${lay.box.w}×${lay.box.h}`);

  // P3
  /** @type {string[]} */
  const through = [];
  for (const e of model.edges) {
    for (const n of nodes) {
      if (n.id === e.from || n.id === e.to) continue;
      if (segmentsOf(lay.edges[e.id].points).some((s) => hitsBox(s, n, 0))) through.push(`the link ${e.from} to ${e.to} passes through "${label(n.id)}"`);
    }
  }
  add('P3', 'No line passes through a box', through, 'none do');

  // P4, P5
  let crossings = 0;
  /** @type {string[]} */
  const along = [];
  edges.forEach((a, i) => edges.slice(i + 1).forEach((b) => {
    const m = meet(a.points, b.points);
    crossings += m.crossings;
    if (m.overlaps) along.push(`${a.id} and ${b.id} run along each other`);
  }));
  const allowed = Math.floor(edges.length / limits.linksPerCrossing);
  add('P4', 'Lines cross as little as the graph allows', crossings > allowed ? [`${crossings} crossings, and ${edges.length} links allow ${allowed}`] : [], `${crossings} crossings`);
  add('P5', 'No two lines share a path', along, 'none do');

  // P6
  /** @type {string[]} */
  const tight = [];
  for (const n of model.nodes) {
    const lines = lay.nodes[n.id].lines, room = roomFor(n, lay.box.w);
    if (lines.length > limits.mostLines) tight.push(`"${n.label}" needs ${lines.length} lines; shorten it or put the detail in a "%% note"`);
    else if (lines.some((l) => l.length > room)) tight.push(`"${n.label}" has a word too long for a ${lay.box.w}px box`);
  }
  add('P6', 'Words fit their box', tight, 'all fit');

  // P7
  /** @type {string[]} */
  const covered = [];
  const labels = edges.filter((e) => e.label);
  labels.forEach((e, i) => {
    const l = /** @type {NonNullable<typeof e.label>} */ (e.label);
    for (const n of nodes) if (overlap(l, n)) covered.push(`the label "${l.text}" sits on "${label(n.id)}"`);
    for (const o of labels.slice(i + 1)) if (o.label && overlap(l, o.label)) covered.push(`the labels "${l.text}" and "${o.label.text}" overlap`);
  });
  add('P7', "A link's words sit clear of boxes and of each other", covered, `${labels.length} labels clear`);

  // D1
  /** @type {string[]} */
  const faint = [];
  const kinds = [...new Set(model.nodes.map((n) => n.kind))];
  for (const [mode, p] of /** @type {[string, import('./design.mjs').Palette|undefined][]} */ ([['light', design.light], ['dark', design.dark]])) {
    if (!p) continue;
    const need = (/** @type {string} */ what, /** @type {string} */ a, /** @type {string} */ b, /** @type {number} */ least) => {
      const c = contrast(a, b);
      if (c < least) faint.push(`${mode}: ${what} is ${c.toFixed(1)} to 1, and needs ${least}`);
    };
    for (const k of kinds) need(`text on a ${k} box`, p.text, kindFill(p, k), limits.textContrast);
    need('quiet text on the page', p.muted, p.bg, limits.textContrast);
    need('a line on the page', p.edge, p.bg, limits.lineContrast);
    need('the accent on the page', p.accent, p.bg, limits.lineContrast);
    for (const k of kinds) if (p.kinds[k]) need(`the edge of a ${k} box`, p.kinds[k], p.bg, limits.lineContrast);
  }
  add('D1', 'Words and lines can be read against what is behind them', faint, `${design.name} passes in ${design.dark ? 'light and dark' : 'its one look'}`);

  // D2
  /** @type {string[]} */
  const alike = [];
  let told = 0;
  for (const [mode, p] of /** @type {[string, import('./design.mjs').Palette|undefined][]} */ ([['light', design.light], ['dark', design.dark]])) {
    if (!p) continue;
    // Only kinds the design gives a colour: the rest share the plain box on purpose.
    const coloured = kinds.filter((k) => p.kinds[k]);
    told = coloured.length;
    coloured.forEach((a, i) => coloured.slice(i + 1).forEach((b) => {
      const plain = apart(p.kinds[a], p.kinds[b]);
      const redGreen = Math.min(apart(p.kinds[a], p.kinds[b], 'protan'), apart(p.kinds[a], p.kinds[b], 'deutan'));
      // Said once for a pair: as everyone sees it if that is already too close, else as red-green sight does.
      if (plain < limits.tellApart) alike.push(`${mode}: ${a} and ${b} boxes look alike (${Math.round(plain)} apart, and need ${limits.tellApart})`);
      else if (redGreen < limits.tellApart) alike.push(`${mode}: ${a} and ${b} boxes look alike to someone who does not see red and green apart (${Math.round(redGreen)} apart, and need ${limits.tellApart})`);
    }));
  }
  add('D2', 'Kinds of box can be told apart', alike, `${told} coloured kinds, apart in ordinary and red-green colour-blind sight`);

  return { pass: checks.every((c) => c.ok), checks };
}

export { measure };
