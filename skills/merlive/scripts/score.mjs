// Why: a rule nobody checks is a wish. Every placement rule in docs/PLACEMENT.md is a check here, so a
// diagram that breaks one is not written, and the message says which rule and where. Pure.

import { compartmentsOf, hitsBox, meet, measure, roomFor, rowsRoom, segmentsOf, tableNeeds, textOf, wrap } from './layout.mjs';
import { colourChecks, designWith, looksOf } from './design.mjs';

/** @typedef {{id:string,rule:string,ok:boolean,detail:string}} Check */

// What a drawing is held to. Each is named in docs/PLACEMENT.md with a picture of pass and fail.
export const limits = {
  linksPerCrossing: 8, // one crossing is allowed for every eight links; fewer than eight links, none but those the diagram forces
  boxGap: 16, // the least room between two boxes
  slack: 1, // px a name may be reckoned past the edge of its frame before it is said to run out: widths of words are reckoned, not measured
};

const overlap = (/** @type {{x:number,y:number,w:number,h:number}} */ a, /** @type {{x:number,y:number,w:number,h:number}} */ b, gap = 0) =>
  Math.abs(a.x - b.x) < (a.w + b.w) / 2 + gap && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + gap;

/**
 * The crossings a diagram cannot be drawn without. Two boxes of one rank that are each linked to the same two
 * boxes of another have four lines between them, and two of those swap sides: whichever way round the boxes
 * sit, they cross once. Each such four is a crossing of its own, so they are counted, not guessed at.
 * @param {Pick<import('./parse.mjs').Model,'edges'>} model
 * @param {Pick<import('./layout.mjs').Layout,'nodes'>} lay
 * @returns {number}
 */
export function forcedCrossings(model, lay) {
  /** @type {Map<string, Set<string>>} */
  const linked = new Map();
  for (const { from, to } of model.edges) {
    if (from === to || !lay.nodes[from] || !lay.nodes[to]) continue;
    linked.set(from, (linked.get(from) ?? new Set()).add(to));
    linked.set(to, (linked.get(to) ?? new Set()).add(from));
  }
  const ids = [...linked.keys()];
  let forced = 0;
  ids.forEach((a, i) => ids.slice(i + 1).forEach((b) => {
    if (lay.nodes[a].rank !== lay.nodes[b].rank) return;
    // What both are linked to, further down the flow, counted rank by rank: every two of a rank make a four.
    /** @type {Map<number, number>} */
    const shared = new Map();
    for (const c of linked.get(a) ?? []) {
      const rank = lay.nodes[c].rank;
      if (rank > lay.nodes[a].rank && linked.get(b)?.has(c)) shared.set(rank, (shared.get(rank) ?? 0) + 1);
    }
    for (const n of shared.values()) forced += (n * (n - 1)) / 2;
  }));
  return forced;
}

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
  // On a grid its author placed there is no main path to hold straight: where each block is, is what was written.
  add('P1', 'The main path is one straight line', lay.spine.filter((id) => lay.nodes[id][across] !== line).map((id) => `"${label(id)}" is off the line`), lay.grids ? 'a grid its author placed has no main path' : `${lay.spine.length} boxes in line`);

  // P2
  /** @type {string[]} */
  const close = [];
  nodes.forEach((a, i) => nodes.slice(i + 1).forEach((b) => overlap(a, b, limits.boxGap) && close.push(`"${label(a.id)}" and "${label(b.id)}" are closer than ${limits.boxGap}px`)));
  // On a grid its author placed, one size means one size of cell: a block is exactly the cells it takes, as
  // wide as the columns it spans and the gaps between them, and as tall as its row. So is a frame.
  const near = (/** @type {number} */ a, /** @type {number} */ b) => Math.abs(a - b) < 1;
  for (const g of lay.grids ?? []) {
    for (const c of g.cells) {
      const it = c.frame ? lay.groups.find((f) => f.id === c.id) : lay.nodes[c.id], row = g.rows[c.row];
      if (!it || !row) continue;
      const l = c.frame ? it.x : it.x - it.w / 2, t = c.frame ? it.y : it.y - it.h / 2;
      const exact = near(l, g.x + c.col * (g.colW + g.gapX)) && near(it.w, c.span * g.colW + (c.span - 1) * g.gapX) && near(t, row.y) && near(it.h, row.h);
      if (!exact) close.push(c.frame ? `the frame of "${/** @type {{title:string}} */ (it).title || c.id}" is not exactly its cells` : `"${label(c.id)}" is not exactly its cells`);
    }
  }
  const sizes = lay.grids ? `${nodes.length} blocks, each exactly its cells on a grid of ${lay.box.w}px columns` : `${nodes.length} boxes of ${lay.box.w}×${lay.box.h}${nodes.some((n) => n.h !== lay.box.h) ? ', taller where they list rows or carry a note' : ''}`;
  add('P2', 'Boxes are one size, on a grid, with room between them', close, sizes);

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
  // Where its author placed the blocks, a crossing is not forced by the graph but chosen with the places: none is forgiven for it.
  const allowed = Math.floor(edges.length / limits.linksPerCrossing), forced = lay.grids ? 0 : forcedCrossings(model, lay);
  const count = crossings === 1 ? '1 crossing' : `${crossings} crossings`;
  const tooMany = forced ? `${count}; ${edges.length} links allow ${allowed}, and the diagram forces ${forced} more` : `${count}, and ${edges.length} links allow ${allowed}`;
  const fine = !forced || !crossings ? count : crossings <= forced ? `${count}, which this diagram cannot be drawn without` : `${count}, ${forced} of which this diagram cannot be drawn without`;
  add('P4', 'Lines cross as little as the graph allows', crossings > allowed + forced ? [tooMany] : [], fine);
  add('P5', 'No two lines share a path', along, 'none do');

  // P6
  /** @type {string[]} */
  const tight = [];
  for (const n of model.nodes) {
    // A box's own width: on a grid, a block that spans columns has more room than one that does not.
    const lines = lay.nodes[n.id].lines, room = roomFor(n, lay.nodes[n.id].w);
    if (n.shape !== 'note' && lines.length > measure.mostLines) tight.push(`"${n.label}" needs ${lines.length} lines; shorten it or put the detail in a "%% note"`);
    else if (lines.some((l) => l.length > room)) tight.push(`"${n.label}" has a word too long for a ${lay.nodes[n.id].w}px box`);
    // A row keeps its one line: breaking a method's name in two would make two of it.
    const long = n.table ? undefined : compartmentsOf(n).flat().find((row) => row.length > rowsRoom(lay.box.w));
    if (textOf(n, lay.box.w).some((l) => l.length * measure.textGlyph > lay.box.w - 2 * measure.textIn)) tight.push(`"${n.label}" says a word too long for any box; break it or shorten it`);
    if (n.over && n.over.length * measure.overGlyph + 2 * measure.overIn > lay.box.w) tight.push(`"${n.label}" has a line over its name too long for any box: "${n.over}"; shorten it`);
    // A table's columns are each as wide as their widest cell: all of them together have to fit.
    if (tableNeeds(n) > lay.box.w) tight.push(`"${n.label}" lists a row too wide for any box: it needs ${tableNeeds(n)}px and the widest box is ${lay.box.w}px; shorten its longest type or name`);
    if (long) tight.push(`"${n.label}" lists a line too long for any box: "${long}"; shorten it, or its type`);
  }
  add('P6', 'Words fit their box', tight, 'all fit');

  // P7
  /** @type {string[]} */
  const covered = [];
  const labels = edges.filter((e) => e.label);
  labels.forEach((e, i) => {
    const l = /** @type {NonNullable<typeof e.label>} */ (e.label);
    if (l.x - l.w / 2 < 0 || l.y - l.h / 2 < 0 || l.x + l.w / 2 > lay.width || l.y + l.h / 2 > lay.height) covered.push(`the label "${l.text}" runs off the picture`);
    for (const n of nodes) if (overlap(l, n)) covered.push(`the label "${l.text}" sits on "${label(n.id)}"`);
    for (const f of lay.groups) if (overlap(l, f.name)) covered.push(`the label "${l.text}" sits on the name of the group "${f.title}"`);
    for (const o of labels.slice(i + 1)) if (o.label && overlap(l, o.label)) covered.push(`the labels "${l.text}" and "${o.label.text}" overlap`);
    // Wrapped again to fit between two boxes is a last resort. Two lines read as words (an author often breaks
    // a label in two); past two, and past the lines they wrap to anyway, they read as a column of single words.
    if (l.lines.length > Math.max(2, wrap(l.text, measure.labelWrap).length)) covered.push(`the label "${l.text}" is squeezed into ${l.lines.length} lines between two boxes: shorten it, or give the boxes room`);
  });
  // The few words at the ends of a link are held to the same: off every box, and inside the picture.
  for (const e of edges) {
    for (const l of [e.near, e.far]) {
      if (!l) continue;
      if (l.x - l.w / 2 < 0 || l.y - l.h / 2 < 0 || l.x + l.w / 2 > lay.width || l.y + l.h / 2 > lay.height) covered.push(`"${l.text}", at an end of a link, runs off the picture`);
      for (const n of nodes) if (overlap(l, n)) covered.push(`"${l.text}", at an end of a link, sits on "${label(n.id)}"`);
    }
  }
  add('P7', "A link's words sit clear of boxes and of each other", covered, `${labels.length} labels clear`);

  // P8: a name lies inside its own frame and inside the picture, on no other name and on no box. One on a plate
  // has its line pass behind it, which is drawn so; any other must be clear of every line.
  const named = lay.groups.filter((f) => f.title && f.name.w > 0);
  const edgeOf = (/** @type {{x:number,y:number,w:number,h:number}} */ r) => ({ l: r.x - r.w / 2, r: r.x + r.w / 2, t: r.y - r.h / 2, u: r.y + r.h / 2 });
  const lapping = (/** @type {{x:number,y:number,w:number,h:number}} */ a, /** @type {{x:number,y:number,w:number,h:number}} */ b) => overlap(a, b);
  const unread = named.flatMap((f, i) => {
    const at = edgeOf(f.name), say = `the name of the group "${f.title}"`;
    /** @type {string[]} */
    const why = [];
    if (at.l < f.x - limits.slack || at.r > f.x + f.w + limits.slack || at.t < f.y - limits.slack || at.u > f.y + f.h + limits.slack) why.push(`${say} runs out of its frame; shorten it, or break its longest word`);
    else if (at.l < 0 || at.t < 0 || at.r > lay.width || at.u > lay.height) why.push(`${say} runs off the picture`);
    const other = named.slice(i + 1).find((o) => lapping(f.name, o.name));
    if (other) why.push(`${say} lies on the name of the group "${other.title}"; shorten one of them`);
    const box = nodes.find((b) => lapping(f.name, b));
    if (box) why.push(`${say} lies on the box "${model.nodes.find((x) => x.id === box.id)?.label ?? box.id}"; shorten it`);
    if (!f.name.plate && edges.some((e) => segmentsOf(e.points).some((seg) => hitsBox(seg, f.name, 0)))) why.push(`a line runs through ${say}`);
    return why;
  });
  add('P8', "A group's name can be read", unread, lay.groups.length ? `${lay.groups.length} inside their frames, apart, clear of boxes, and clear of lines or on a plate` : 'no groups');

  // D1, D2: the sums are in design.mjs, where the setup page uses them too.
  const kinds = [...new Set([...model.nodes.map((n) => n.kind), ...model.edges.flatMap((e) => (e.kind ? [e.kind] : []))])];
  // Only what is drawn shaded is checked: every second row of a table, so a table of one row has none.
  const shaded = [...new Set(model.nodes.filter((n) => (n.table?.length ?? 0) > 1).map((n) => n.kind))];
  // What is checked is what is drawn: the design with the colours the diagram's own author gave laid in.
  const [d1, d2] = colourChecks(designWith(design, model), kinds, shaded);
  const looks = looksOf(design).map(([mode]) => mode).join(' and ');
  add('D1', 'Words and lines can be read against what is behind them', d1.broken, `${design.name} passes in ${looks}`);
  add('D2', 'Kinds of box can be told apart', d2.broken, 'apart in ordinary and red-green colour-blind sight');

  return { pass: checks.every((c) => c.ok), checks };
}

export { measure };
