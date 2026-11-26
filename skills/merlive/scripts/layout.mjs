// Why: placement is the product. Mermaid's own layout is why diagrams look odd, so Merlive places every box
// on a grid by rule: the main path is one straight spine, everything else sits to one side, every box is the
// same size, and lines turn at right angles and never share a port. Pure: a model in, coordinates out.

import { inset, roomIn } from './shapes.mjs';
import { placeGrid } from './grid.mjs';

/** @typedef {import('./parse.mjs').Model} Model */
/** @typedef {{x:number,y:number}} Pt */
/** @typedef {'top'|'bottom'|'left'|'right'} Side */
/** @typedef {{id:string,x:number,y:number,w:number,h:number,rank:number,lane:number,spine:boolean,lines:string[]}} Placed */
/** @typedef {{x:number,y:number,w:number,h:number,text:string,lines:string[],align?:'start'|'end'}} Words a link's words: the middle of where they sit, their size, and the lines they are wrapped to; align: beside a line that runs along the flow, the side of them that is next to it, where they are held */
/** @typedef {{id:string,points:Pt[],back:boolean,label:null|Words,near?:Words,far?:Words}} Routed near, far: the few words at the end it comes from and the end it leads to */
/** @typedef {{id:string,title:string,x:number,y:number,w:number,h:number,name:{x:number,y:number,w:number,h:number,plate:boolean,lines?:string[]}}} Frame a group's frame, from its top left corner; name: where its name sits, from its middle, and whether a line has to pass behind it */
/** @typedef {{width:number,height:number,direction:'TD'|'LR',reversed:boolean,box:{w:number,h:number},nodes:Record<string,Placed>,edges:Record<string,Routed>,groups:Frame[],spine:string[],warnings:string[],grids?:import('./grid.mjs').PlacedGrid[]}} Layout grids: set when the boxes are on a grid their author placed, each grid as it came out */

// What is measured, named once. Boxes are sized without a browser, from the average glyph of a 13px UI face.
export const measure = {
  glyph: 7.1, // px per character at 13px
  strong: 1.08, // how much wider a label is reckoned when any of it is bold: bold letters are that much wider
  labelGlyph: 6.6, // px per character of a link's label at 11px
  widths: [128, 160, 192, 224, 256, 288], // the only box widths there are; a diagram uses one of them throughout
  lineHeight: 16,
  boxPad: 28, // px a box is taller than its lines of words, top and bottom together
  pad: 28, // around the whole drawing
  laneGap: { TD: 64, LR: 40 }, // between a box and the one beside it
  rankGap: { TD: 48, LR: 72 }, // between a box and the next one along the flow
  channel: 26, // from the outermost box to the first loop that goes round the outside
  channelStep: 16, // between two such loops
  loop: 16, // how far a link from a box to itself goes out from the side of its box before it comes back
  trackStep: 12, // between two lines that share the room between two ranks
  trackEdge: 12, // the least from such a line to the boxes either side of that room
  mostLines: 4, // of words in a box, and only when its author wrote that many; a plain label is wrapped to two
  labelWrap: 24, // characters a line of a link's words runs to before it wraps
  labelLine: 14, // px between two lines of a link's words
  wordsIn: 16, // px from a box to the words on a line that leaves it, and the air under them
  labelOff: 5, // px between a link's words and its line
  wordsAcross: 12, // px more than its words a run across must be before they are wrapped again to fit it
  framePad: 12, // from a group's boxes to its frame
  frameTitle: 14, // more at the top, for what the group is called
  frameAir: 10, // the least along the flow between two frames, or a frame and a box that is not in it
  nameGlyph: 7.8, // px per character of a group's name: 11px capitals, spaced
  nameLine: 12, // px the name takes from top to bottom
  nameDown: 12, // from the top of a frame to the middle of its name
  nameIn: 10, // from the side of a frame to its name
  nameStep: 8, // how far apart the places tried for a name are, along the top of its frame
  portStep: 20, // between two lines on one side of a box
  portShare: 0.31, // how far from the middle of a side a line may leave, as a share of the side
  rowWidths: [320, 352, 384], // wider boxes, only for a diagram whose boxes list rows: a method's line is longer than a label
  rowGlyph: 6.9, // px per character of a row: rows are set in a face where every character is as wide, at 11.5px
  rowLine: 16, // px from one row to the next
  rowPad: 6, // above the first row of a compartment and below its last
  rowIn: 12, // from the side of a box to where its rows begin
  textGlyph: 6.2, // px per character of a box's sentence: the design's own face at 11.5px
  textLine: 15, // px between two lines of it
  textPad: 12, // px under its last line, before the bottom of the box or what the box lists
  textIn: 12, // from the side of a box to its sentence
  textMost: 4, // lines a sentence runs to in the width looked for first: past that it reads as a paragraph
  cellGlyph: 6.6, // px per character of a table's cell: the design's own face at 12px
  cellPad: 10, // px between a cell's words and the rule each side of it
  cellLine: 24, // px a table's row takes: a line of words and room above and below it, so the rules do not crowd them
  overGlyph: 5.9, // px per character of that line, at 11px
  overIn: 8, // from the side of a box to it
  overLine: 14, // px the short line above a name takes ("«interface»")
  endOff: 7, // from a line to the words at its end
  endAlong: 14, // how far along the line from its box those words sit: beside what is drawn at the end, and far
  // enough from the words at the other end of a line one rank long that both fit on one side of it
  icon: 22, // px an icon takes beside a box's words: its 16px grid and the gap to the first letter
  clear: 4, // how close a line may come to a box it does not belong to
  wide: 1100, // past this a left-to-right flow no longer fits a laptop's reading column
};

/** Words wrapped to at most `max` characters a line. A word longer than that keeps a line of its own. */
export function wrap(/** @type {string} */ label, /** @type {number} */ max) {
  /** @type {string[]} */
  const lines = [];
  for (const word of label.split(/\s+/).filter(Boolean)) {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= max) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines.length ? lines : [''];
}

/** How many characters a line of words may run to in a box of this shape and width: shapes.mjs says how much room each leaves. */
export const roomFor = (/** @type {{shape:import('./shapes.mjs').Shape,icon?:string,emphasis?:{strong?:boolean}[]}} */ n, /** @type {number} */ width) =>
  Math.floor((roomIn(n.shape, width) - (n.icon ? measure.icon : 0)) / (measure.glyph * (n.emphasis?.some((run) => run.strong) ? measure.strong : 1)));

/**
 * The lines of a box's words in a box of some width. Where the author broke the label, each of their lines is
 * kept and only wrapped if it must be; else the label is wrapped as it falls.
 */
export const linesOf = (/** @type {import('./parse.mjs').Node} */ n, /** @type {number} */ width) =>
  n.breaks ? n.breaks.flatMap((b) => wrap(b, roomFor(n, width))) : wrap(n.label, roomFor(n, width));

/** How many characters a row may run to in a box of this width. */
export const rowsRoom = (/** @type {number} */ width) => Math.floor((width - 2 * measure.rowIn) / measure.rowGlyph);

/**
 * The columns of a table: how many characters the widest cell of each runs to. A column nobody wrote in (keys,
 * when no attribute has one) is not a column.
 */
export const columnsOf = (/** @type {{table?:string[][]}} */ n) => {
  const wide = (n.table?.[0] ?? []).map((_, c) => Math.max(...(n.table ?? []).map((row) => (row[c] ?? '').length)));
  while (wide.length && !wide[wide.length - 1]) wide.pop();
  return wide;
};

/** The px a table needs across: every column as wide as its widest cell, with room each side of it. */
export const tableNeeds = (/** @type {{table?:string[][]}} */ n) => columnsOf(n).reduce((sum, chars) => sum + Math.ceil(chars * measure.cellGlyph) + 2 * measure.cellPad, 0);

/**
 * Where each column of a table begins, from the left edge of its box, and where the last one ends. What a box
 * has to spare goes to the names, the one column a reader's eye runs down.
 */
export const columnsAt = (/** @type {{table?:string[][]}} */ n, /** @type {number} */ width) => {
  const spare = Math.max(0, width - tableNeeds(n));
  /** @type {number[]} */
  const at = [0];
  columnsOf(n).forEach((chars, c) => at.push(at[c] + Math.ceil(chars * measure.cellGlyph) + 2 * measure.cellPad + (c === 1 ? spare : 0)));
  return at;
};

/**
 * The sentence a box says about itself, wrapped to a box of this width: no lines when it says nothing.
 */
export const textOf = (/** @type {{text?:string}} */ n, /** @type {number} */ width) => (n.text ? wrap(n.text, Math.floor((width - 2 * measure.textIn) / measure.textGlyph)) : []);

/** The lines a group's name takes along the top of a frame this wide: wrapped at its spaces, no word broken. */
export const nameLines = (/** @type {string} */ title, /** @type {number} */ frame) => (title ? wrap(title, Math.max(1, Math.floor((frame - 2 * measure.nameIn) / measure.nameGlyph))) : []);

/** The least width of a frame that holds the longest word of this name. */
export const nameNeeds = (/** @type {string} */ title) => Math.ceil(Math.max(0, ...title.split(/\s+/).map((word) => word.length)) * measure.nameGlyph) + 2 * measure.nameIn;

/** The compartments of a box that have something in them: one with nothing is not drawn. */
export const compartmentsOf = (/** @type {{rows?:string[][]}} */ n) => (n.rows ?? []).filter((c) => c.length);

/**
 * How much taller than a plain box one is: for what it lists under its name and the line above it, and, when
 * it is a note, for every line of its words a plain box has no room for. A note is the one box whose words may
 * run on: saying more than a name is what it is there to do.
 */
export const extraHeight = (/** @type {{rows?:string[][],table?:string[][],over?:string,shape?:string,text?:string}} */ n, /** @type {{w:number,h:number}} */ box) =>
  (n.over ? measure.overLine : 0) +
  // A sentence about the box goes under its name, in as many lines as the box's width gives it.
  (n.text ? measure.textLine * textOf(n, box.w).length + measure.textPad : 0) +
  // A table's rows are cells with a rule between them, and need more room than the lines of a list.
  (n.table ? measure.cellLine * n.table.length : compartmentsOf(n).reduce((sum, c) => sum + 2 * measure.rowPad + measure.rowLine * c.length, 0)) +
  (n.shape === 'note' ? Math.max(0, measure.boxPad + measure.lineHeight * linesOf(/** @type {import('./parse.mjs').Node} */ (n), box.w).length - box.h) : 0);

/**
 * One box size for the whole diagram: the narrowest width in which a plain label takes two lines or fewer and
 * a label its author broke keeps the lines it was given.
 */
function boxFor(/** @type {Model} */ model) {
  // A note takes the lines it needs and is as tall as they are. A width in which it keeps the lines its author
  // broke it into, or runs to a few lines and no more, is looked for first; when no width does that, it wraps.
  // A sentence a box says about itself is treated the same way: a width that keeps it to a few lines first.
  const fits = (/** @type {number} */ w, /** @type {boolean} */ anyNote) =>
    model.nodes.every((n) => {
      const lines = linesOf(n, w), note = n.shape === 'note';
      const few = note ? (n.breaks ? lines.length === n.breaks.length : lines.length <= measure.mostLines) || anyNote : lines.length <= Math.max(2, Math.min(measure.mostLines, n.breaks?.length ?? 0));
      return few && (anyNote || textOf(n, w).length <= measure.textMost) && lines.every((l) => l.length <= roomFor(n, w));
    });
  // A diagram whose boxes list rows may need a wider box than any label does: every row keeps its one line.
  const longest = Math.max(0, ...model.nodes.flatMap((n) => (n.table ? [] : compartmentsOf(n).flat().map((row) => row.length))));
  const widest = Math.max(0, ...model.nodes.map(tableNeeds));
  // The short line over a name says what the box is, and is never wrapped: the box is as wide as it needs.
  const over = Math.max(0, ...model.nodes.map((n) => (n.over ? n.over.length * measure.overGlyph + 2 * measure.overIn : 0)));
  // A group's name is wrapped to its frame, and a word is never broken: the narrowest frame there can be, round
  // one box, has to hold the longest word of any name.
  const named = Math.max(0, ...model.groups.filter((g) => g.title && g.members.length).map((g) => nameNeeds(g.title) - 2 * measure.framePad));
  const widths = longest || widest || Math.max(over, named) > measure.widths[measure.widths.length - 1] || model.nodes.some((n) => n.text) ? [...measure.widths, ...measure.rowWidths] : measure.widths;
  const wide = (/** @type {boolean} */ anyNote) => widths.find((width) => fits(width, anyNote) && rowsRoom(width) >= longest && width >= widest && width >= over && width >= named);
  // When no width keeps every note and sentence short, the widest that fits the rest gives them the fewest lines.
  const w = wide(false) ?? (model.nodes.some((n) => n.text) ? [...widths].reverse().find((width) => fits(width, true) && rowsRoom(width) >= longest && width >= widest && width >= over && width >= named) : wide(true)) ?? widths[widths.length - 1];
  const most = Math.max(1, ...model.nodes.filter((n) => n.shape !== 'note').map((n) => linesOf(n, w).length));
  return { w, h: measure.boxPad + measure.lineHeight * most };
}

// ---- geometry, shared with score.mjs ---------------------------------------------------------------------

/** @returns {[Pt,Pt][]} */
export const segmentsOf = (/** @type {Pt[]} */ pts) => pts.slice(1).map((p, i) => /** @type {[Pt,Pt]} */ ([pts[i], p]));

/** Does a straight, axis-aligned run pass through a box (grown by `grow`)? */
export function hitsBox(/** @type {[Pt,Pt]} */ [a, b], /** @type {{x:number,y:number,w:number,h:number}} */ box, grow = measure.clear) {
  const l = box.x - box.w / 2 - grow, r = box.x + box.w / 2 + grow, t = box.y - box.h / 2 - grow, m = box.y + box.h / 2 + grow;
  return Math.max(a.x, b.x) > l && Math.min(a.x, b.x) < r && Math.max(a.y, b.y) > t && Math.min(a.y, b.y) < m;
}

/** How many times two lines cross, and how many times they run along each other. */
export function meet(/** @type {Pt[]} */ one, /** @type {Pt[]} */ other) {
  let crossings = 0;
  let overlaps = 0;
  for (const [a, b] of segmentsOf(one)) {
    for (const [c, d] of segmentsOf(other)) {
      const flatA = a.y === b.y, flatC = c.y === d.y;
      if (flatA !== flatC) {
        const [h1, h2] = flatA ? [a, b] : [c, d];
        const [v1, v2] = flatA ? [c, d] : [a, b];
        const inX = v1.x > Math.min(h1.x, h2.x) + 1 && v1.x < Math.max(h1.x, h2.x) - 1;
        const inY = h1.y > Math.min(v1.y, v2.y) + 1 && h1.y < Math.max(v1.y, v2.y) - 1;
        if (inX && inY) crossings++;
      } else {
        const key = flatA ? /** @type {const} */ ('y') : /** @type {const} */ ('x');
        const along = flatA ? /** @type {const} */ ('x') : /** @type {const} */ ('y');
        const shared = Math.min(Math.max(a[along], b[along]), Math.max(c[along], d[along])) - Math.max(Math.min(a[along], b[along]), Math.min(c[along], d[along]));
        if (Math.abs(a[key] - c[key]) < 3 && shared > 2) overlaps++;
      }
    }
  }
  return { crossings, overlaps };
}

// ---- the layout ------------------------------------------------------------------------------------------

/**
 * @param {Model} model
 * @returns {Layout}
 */
export function layout(model) {
  // A block diagram whose meaning is in its grid is placed on that grid, where its author put each block.
  if (model.placedBy === 'grid' && model.grid) return placeGrid(model);
  // Boxes of different heights are placed top to bottom only, for now: across the flow they would need lanes
  // of different widths.
  const box = boxFor(model);
  if (model.nodes.some((n) => extraHeight(n, box) > 0)) return placed(model, 'TD');
  const first = placed(model, model.direction, model.reversed === true);
  // A flow written left to right that comes out wider than a screen cannot be read without scrolling sideways,
  // and nobody scrolls a diagram sideways. Top to bottom it is the same flow, and scrolls the way a page does.
  if (first.direction !== 'LR' || first.width <= measure.wide || model.hints.turn === false) return first;
  const turned = placed(model, 'TD');
  if (turned.width >= first.width) return first;
  // Turned, it is read from the top, as a page is, whichever side it was written from.
  turned.warnings.unshift(`written ${model.reversed ? 'right to left' : 'left to right'}, drawn top to bottom: left to right it would be ${first.width}px wide, wider than most screens. "%% turn: no" keeps it as written`);
  return turned;
}

/**
 * The placing itself, in the direction asked for.
 * @param {Model} model
 * @param {'TD'|'LR'} dir
 * @param {boolean} [reversed] from the far end: bottom to top, or right to left
 * @returns {Layout}
 */
function placed(model, dir, reversed = false) {
  /** @type {string[]} */
  const warnings = [];
  const box = boxFor(model);
  // Everything is placed as if the flow ran downwards. A left-to-right diagram is the same drawing turned on
  // its side at the end, so along the flow a box is as "tall" as it is really wide.
  const bw = dir === 'LR' ? box.h : box.w;
  const bh = dir === 'LR' ? box.w : box.h;
  const laneGap = measure.laneGap[dir], rankGap = measure.rankGap[dir];

  const ids = model.nodes.map((n) => n.id);
  const order = new Map(ids.map((id, i) => [id, i]));
  /** @type {Map<string, import('./parse.mjs').Edge[]>} */
  const out = new Map(ids.map((id) => [id, []]));
  for (const e of model.edges) out.get(e.from)?.push(e);

  // 1. Links that close a loop are set aside: without them the graph has a first box and a last one.
  const back = new Set();
  const seen = new Map();
  const visit = (/** @type {string} */ id) => {
    seen.set(id, 'open');
    for (const e of out.get(id) ?? []) {
      if (seen.get(e.to) === 'open') back.add(e.id);
      else if (!seen.has(e.to)) visit(e.to);
    }
    seen.set(id, 'done');
  };
  // A link from a box to itself says nothing of where the flow starts: a box with only that leading to it is a first box.
  const entered = new Set(model.edges.filter((e) => e.from !== e.to).map((e) => e.to));
  for (const id of ids) if (!entered.has(id) && !seen.has(id)) visit(id);
  for (const id of ids) if (!seen.has(id)) visit(id);
  const forward = model.edges.filter((e) => !back.has(e.id));

  // 2. Rank: how far along the flow a box sits, which is the longest way to reach it.
  const waiting = new Map(ids.map((id) => [id, 0]));
  for (const e of forward) waiting.set(e.to, (waiting.get(e.to) ?? 0) + 1);
  const rank = new Map(ids.map((id) => [id, 0]));
  const queue = ids.filter((id) => waiting.get(id) === 0);
  /** @type {string[]} */
  const sorted = [];
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    sorted.push(id);
    for (const e of forward.filter((f) => f.from === id)) {
      rank.set(e.to, Math.max(rank.get(e.to) ?? 0, (rank.get(id) ?? 0) + 1));
      waiting.set(e.to, (waiting.get(e.to) ?? 1) - 1);
      if (waiting.get(e.to) === 0) queue.push(e.to);
    }
  }

  // 3. The spine: the path the author named, or else the longest one. It gets the straight line.
  const forwardIds = new Set(forward.map((e) => `${e.from}>${e.to}`));
  /** @type {string[]} */
  let spine = [];
  const named = model.hints.main;
  if (named && named.length > 1) {
    if (named.every((id, i) => i === 0 || forwardIds.has(`${named[i - 1]}>${id}`))) spine = named;
    else warnings.push('the "%% main:" path does not follow the links, so the longest path was used instead');
  }
  if (!spine.length && ids.length) {
    const longest = new Map();
    for (const id of [...sorted].reverse()) longest.set(id, 1 + Math.max(0, ...forward.filter((e) => e.from === id).map((e) => longest.get(e.to) ?? 0)));
    const pick = (/** @type {string[]} */ from) => from.reduce((a, b) => ((longest.get(b) ?? 0) > (longest.get(a) ?? 0) ? b : a));
    let at = pick(ids.filter((id) => (rank.get(id) ?? 0) === 0));
    spine = [at];
    for (let next = forward.filter((e) => e.from === at).map((e) => e.to); next.length; next = forward.filter((e) => e.from === at).map((e) => e.to)) {
      at = pick(next);
      spine.push(at);
    }
  }
  const onSpine = new Set(spine);

  // 4. A box nothing leads to, off the main path, feeds something further on. It sits one step before what it
  //    feeds, not back at the start with a long line to draw.
  for (const id of ids) {
    if (onSpine.has(id) || forward.some((e) => e.to === id)) continue;
    const fed = forward.filter((e) => e.from === id).map((e) => rank.get(e.to) ?? 0);
    if (fed.length) rank.set(id, Math.max(0, Math.min(...fed) - 1));
  }

  // 5. Lanes: the spine is lane 0. What leaves it goes to one side, what feeds it comes in from the other, each
  //    to the nearest free place, so the two never have to cross.
  const lane = new Map(spine.map((id) => [id, 0]));
  const taken = new Set(spine.map((id) => `${rank.get(id)}:0`));
  /** @type {Map<string, 1|-1>} */
  const sideOf = new Map();
  // A tree (every box led to by one box at most, and nothing leading back) is placed as a tree: what a box leads
  // to keeps together, in lanes of its own, and the box is in line with the first of them. Its lines then never
  // cross, however many branches it has, and the main path is still the straight one.
  const ledTo = new Map(ids.map((id) => [id, forward.filter((e) => e.to === id).length]));
  const tree = ids.length > 1 && forward.length === model.edges.length && forward.length === ids.length - 1 && ids.every((id) => (ledTo.get(id) ?? 0) <= 1) && forward.every((e) => e.from !== e.to);
  if (tree) {
    let next = 0;
    const leadsTo = (/** @type {string} */ id) => forward.filter((e) => e.from === id).map((e) => e.to)
      .sort((a, b) => Number(onSpine.has(b)) - Number(onSpine.has(a)) || (order.get(a) ?? 0) - (order.get(b) ?? 0));
    const walk = (/** @type {string} */ id) => {
      const under = leadsTo(id);
      for (const child of under) walk(child);
      lane.set(id, under.length ? lane.get(under[0]) ?? 0 : next++);
      if (!onSpine.has(id)) sideOf.set(id, 1);
      taken.add(`${rank.get(id)}:${lane.get(id)}`);
    };
    walk(ids.find((id) => !ledTo.get(id)) ?? ids[0]);
  }
  const rest = tree ? [] : ids.filter((id) => !onSpine.has(id)).sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0) || (order.get(a) ?? 0) - (order.get(b) ?? 0));
  for (const id of rest) {
    const before = forward.filter((e) => e.to === id).map((e) => e.from);
    // It goes where the box that led to it went; with only the spine behind it, it leaves; with nothing, it feeds.
    const led = before.find((p) => sideOf.has(p));
    const side = led ? /** @type {1|-1} */ (sideOf.get(led)) : before.length ? 1 : -1;
    sideOf.set(id, side);
    let l = Math.max(1, ...before.filter((p) => sideOf.has(p) && lane.has(p)).map((p) => Math.abs(lane.get(p) ?? 1)));
    while (taken.has(`${rank.get(id)}:${side * l}`)) l++;
    lane.set(id, side * l);
    taken.add(`${rank.get(id)}:${side * l}`);
  }
  // A frame takes room along the flow: its pad at each end, and at its top its name. One frame fits in the room
  // between two ranks. Frames inside one another that begin or end at the same rank need more, so that rank
  // sits further on: the grid stays, with one wider gap where the frames are.
  const parentOf = new Map(model.groups.map((g) => [g.id, g.parent]));
  const reach = (/** @type {(...v:number[]) => number} */ pick) => new Map(model.groups.map((g) => [g.id, pick(...g.members.filter((id) => rank.has(id)).map((id) => rank.get(id) ?? 0))]));
  const starts = reach(Math.min), ends = reach(Math.max);
  /** How many frames, one inside the next, share this group's first or last rank, counting itself. */
  const stacked = (/** @type {string} */ id, /** @type {Map<string,number>} */ at) => {
    let n = 1;
    for (let up = parentOf.get(id); up !== undefined && at.get(up) === at.get(id); up = parentOf.get(up)) n++;
    return n;
  };
  const most = (/** @type {Map<string,number>} */ at, /** @type {number} */ r) => Math.max(0, ...model.groups.filter((g) => g.members.length && at.get(g.id) === r).map((g) => stacked(g.id, at)));
  // A name longer than its frame is wide is wrapped, and each line more needs its room. Before the boxes have
  // their places a frame's width is reckoned from where they are to go: the lanes its boxes are in, top to
  // bottom; the ranks, left to right. (It is worked out again, exactly, when the frame is drawn.)
  const reckoned = (/** @type {{members:string[]}} */ g) => {
    const mine = g.members.filter((id) => rank.has(id));
    const span = (/** @type {Map<string,number>} */ of) => (mine.length ? Math.max(...mine.map((id) => of.get(id) ?? 0)) - Math.min(...mine.map((id) => of.get(id) ?? 0)) + 1 : 1);
    const boxes = dir === 'LR' ? span(rank) : span(lane);
    return boxes * box.w + (boxes - 1) * (dir === 'LR' ? rankGap : laneGap) + 2 * measure.framePad;
  };
  const more = new Map(model.groups.map((g) => [g.id, Math.max(0, nameLines(g.title, reckoned(g)).length - 1)]));
  // Left to right, a frame's name is along its top, which is across the flow, so along it only the pads count:
  // there the lines of a name take room between lanes, the same for every lane, so the boxes stay on a grid.
  const acrossMore = dir === 'LR' ? measure.nameLine * Math.max(0, ...model.groups.filter((g) => g.members.length).map((g) => more.get(g.id) ?? 0)) : 0;
  const atStart = measure.framePad + (dir === 'LR' ? 0 : measure.frameTitle);
  /** What the frames that begin, or end, at rank r take along the flow past their boxes: each one's pad, and, where their tops are, the lines of its name. */
  const band = (/** @type {Map<string,number>} */ at, /** @type {number} */ r, /** @type {boolean} */ tops) => Math.max(0, ...model.groups.filter((g) => g.members.length && at.get(g.id) === r).map((g) => {
    let sum = 0;
    for (let up = /** @type {string|undefined} */ (g.id); up !== undefined && at.get(up) === at.get(g.id); up = parentOf.get(up)) sum += (tops ? atStart : measure.framePad) + (tops && dir !== 'LR' ? measure.nameLine * (more.get(up) ?? 0) : 0);
    return sum;
  }));
  const ranks = Math.max(0, ...rank.values()) + 1;
  /** @type {number[]} */
  const wider = Array.from({ length: ranks + 1 }, (_, r) => {
    const frames = most(ends, r - 1) + most(starts, r);
    // From the far end, a frame's top (and its name) is where the frame ends along the flow, not where it starts.
    const taken = band(ends, r - 1, reversed) + band(starts, r, !reversed);
    const forFrames = frames ? Math.max(0, taken + measure.frameAir - rankGap) : 0;
    // Words on a link that runs into a group from outside would land on the group's name, which is along the top
    // of its frame, in this same room. The room is made taller by the words, so they have a row above the name.
    // Left to right, a link from one rank straight on to the next runs across this room, and its words sit
    // above or below it: the room is made as wide as the words, so they keep the lines they wrap to anyway
    // instead of being wrapped again into a column.
    if (dir === 'LR') {
      const across = model.edges.filter((e) => e.label && Math.min(rank.get(e.from) ?? 0, rank.get(e.to) ?? 0) === r - 1 && Math.max(rank.get(e.from) ?? 0, rank.get(e.to) ?? 0) === r && lane.get(e.from) === lane.get(e.to));
      const forWords = across.length ? Math.max(...across.map((e) => Math.max(...wrap(e.label, measure.labelWrap).map((l) => l.length)) * measure.labelGlyph + 10)) + measure.wordsAcross - rankGap : 0;
      return Math.max(forFrames, forWords, 0);
    }
    const topsHere = model.groups.filter((g) => g.title && g.members.length && (reversed ? ends.get(g.id) === r - 1 : starts.get(g.id) === r));
    const through = model.edges.filter((e) => {
      const a = rank.get(e.from) ?? 0, b = rank.get(e.to) ?? 0;
      return e.label && Math.min(a, b) < r && r <= Math.max(a, b) && topsHere.some((g) => g.members.includes(e.from) !== g.members.includes(e.to));
    });
    const forNames = through.length ? taken + measure.wordsIn + 4 + measure.labelLine * Math.max(...through.map((e) => wrap(e.label, measure.labelWrap).length)) - rankGap : 0;
    // A link between boxes that are not in line turns in this room, half way down it. Words of two lines or more
    // go above or below the turn, and need all of their height on one side of it.
    const turning = model.edges.filter((e) => {
      const a = rank.get(e.from) ?? 0, b = rank.get(e.to) ?? 0;
      return e.label && Math.min(a, b) === r - 1 && Math.max(a, b) === r && lane.get(e.from) !== lane.get(e.to) && wrap(e.label, measure.labelWrap).length > 1;
    });
    const forTurns = turning.length ? 2 * (4 + measure.labelLine * Math.max(...turning.map((e) => wrap(e.label, measure.labelWrap).length)) + measure.labelOff + 4) - rankGap : 0;
    return Math.max(forFrames, forNames, forTurns);
  });
  // A box that lists rows is taller than one that does not. A rank is as tall as its tallest box, every box of
  // it sits on the rank's middle line, and the room to the next rank is the same whatever the heights.
  const byId = new Map(model.nodes.map((n) => [n.id, n]));
  const high = (/** @type {string} */ id) => bh + (dir === 'LR' ? 0 : extraHeight(byId.get(id) ?? {}, box));
  const tall = Array.from({ length: ranks + 1 }, (_, r) => Math.max(bh, ...ids.filter((id) => rank.get(id) === r).map(high)));
  /** Where rank r begins along the flow: after every rank before it and its gap, and every wider gap. */
  const along = (/** @type {number} */ r) => measure.pad + tall.slice(0, r).reduce((a, b) => a + b + rankGap, 0) + wider.slice(0, r + 1).reduce((a, b) => a + b, 0);

  /**
   * Everything that follows from where the boxes are: their coordinates, each link's route, its port and its
   * track, and what the result costs in lines through boxes, crossings and shared paths. Thorough also tries
   * every order of the lines on each side of a box; without it, it is quick enough to try many placements.
   */
  const settle = (/** @type {boolean} */ thorough) => {
    const firstLane = Math.min(0, ...lane.values());

    /** @type {Record<string, Placed>} */
    const nodes = {};
    for (const n of model.nodes) {
      const l = (lane.get(n.id) ?? 0) - firstLane, r = rank.get(n.id) ?? 0;
      nodes[n.id] = {
        id: n.id, w: bw, h: high(n.id), rank: r, lane: l, spine: onSpine.has(n.id), lines: linesOf(n, box.w),
        x: measure.pad + l * (bw + laneGap + acrossMore) + bw / 2,
        y: along(r) + tall[r] / 2,
      };
    }
    const all = Object.values(nodes);

    // 6. Routes. Each link takes one of a few shapes, tried in an order that keeps the spine's top and bottom for
    //    the spine: straight; across then along (HV); along then across (VH); along, across in the room between
    //    two ranks, along again (VHV), which is how a branch fans out; and round the outside.
    /** @typedef {{e:import('./parse.mjs').Edge,s:Placed,t:Placed,shape:'straight'|'HV'|'VH'|'VHV'|'outer',sSide:Side,tSide:Side,cx:number,out:1|-1,gap:number,ty:number,points:Pt[]}} Route */
    const mid = (/** @type {Placed} */ n, /** @type {Side} */ side, off = 0) =>
      side === 'top' ? { x: n.x + off, y: n.y - n.h / 2 } : side === 'bottom' ? { x: n.x + off, y: n.y + n.h / 2 } : side === 'left' ? { x: n.x - n.w / 2, y: n.y + off } : { x: n.x + n.w / 2, y: n.y + off };
    const others = (/** @type {Placed} */ s, /** @type {Placed} */ t) => all.filter((n) => n !== s && n !== t);
    const hits = (/** @type {Pt[]} */ pts, /** @type {Placed} */ s, /** @type {Placed} */ t) => segmentsOf(pts).reduce((sum, seg) => sum + others(s, t).filter((n) => hitsBox(seg, n)).length, 0);
    /** The middle of the room after rank g, where a line may run across. */
    const roomAfter = (/** @type {number} */ g) => along(g) + (tall[g] ?? bh) + (rankGap + (wider[g + 1] ?? 0)) / 2;
    const shapeOf = (/** @type {Route} */ r, /** @type {Pt} */ a, /** @type {Pt} */ b) =>
      r.shape === 'straight' ? [a, b]
        : r.shape === 'HV' ? [a, { x: b.x, y: a.y }, b]
          : r.shape === 'VH' ? [a, { x: a.x, y: b.y }, b]
            : r.shape === 'VHV' ? [a, { x: a.x, y: r.ty }, { x: b.x, y: r.ty }, b]
              : [a, { x: r.cx, y: a.y }, { x: r.cx, y: b.y }, b];
    /** Where the outside is for a link between two ranks: past every box in between, on one side or the other. */
    const outside = (/** @type {Placed} */ s, /** @type {Placed} */ t, /** @type {1|-1} */ out) => {
      const lo = Math.min(s.rank, t.rank), hi = Math.max(s.rank, t.rank);
      const between = all.filter((n) => n.rank >= lo && n.rank <= hi);
      return out > 0 ? Math.max(...between.map((n) => n.x + n.w / 2)) + measure.channel : Math.min(...between.map((n) => n.x - n.w / 2)) - measure.channel;
    };

    /** @type {Route[]} */
    const routes = model.edges.map((e) => {
      const s = nodes[e.from], t = nodes[e.to];
      const down = t.rank > s.rank, right = t.lane > s.lane;
      /** @type {Route} */
      const r = { e, s, t, shape: 'outer', sSide: 'right', tSide: 'right', cx: outside(s, t, 1), out: 1, gap: 0, ty: 0, points: [] };
      const hv = { shape: 'HV', sSide: right ? 'right' : 'left', tSide: down ? 'top' : 'bottom' };
      const vh = { shape: 'VH', sSide: down ? 'bottom' : 'top', tSide: right ? 'left' : 'right' };
      // Across in the room next to where it starts, or next to where it ends.
      const near = { shape: 'VHV', sSide: down ? 'bottom' : 'top', tSide: down ? 'top' : 'bottom', gap: down ? s.rank : s.rank - 1 };
      const far = { ...near, gap: down ? t.rank - 1 : t.rank };
      const outer = { shape: 'outer', sSide: 'right', tSide: 'right' };
      if (s.lane === t.lane) {
        const between = all.some((n) => n.lane === s.lane && n.rank > Math.min(s.rank, t.rank) && n.rank < Math.max(s.rank, t.rank));
        if (down && !between) Object.assign(r, { shape: 'straight', sSide: 'bottom', tSide: 'top' });
        return r;
      }
      if (s.rank === t.rank) return Object.assign(r, { shape: 'straight', sSide: right ? 'right' : 'left', tSide: right ? 'left' : 'right' });
      // Leaving the spine a line goes across first; coming back to it, along first; between two boxes off it, it
      // turns in the room between ranks. Back up the flow it keeps to the sides, and to the outside if it must.
      const order = !down ? [vh, hv, near, far, outer] : s.spine && !t.spine ? [hv, near, far, vh] : t.spine && !s.spine ? [vh, far, near, hv] : [near, far, hv, vh];
      let best = Infinity;
      for (const choice of order) {
        const tried = /** @type {Route} */ ({ ...r, ...choice });
        tried.ty = roomAfter(tried.gap);
        const n = hits(shapeOf(tried, mid(s, tried.sSide), mid(t, tried.tSide)), s, t);
        if (n < best) [best] = [n, Object.assign(r, choice)];
        if (n === 0) break;
      }
      return r;
    });

    // Lines that go round the outside: the shortest innermost, each in a channel of its own, on its own side.
    const setChannels = () => {
      /** @type {{lo:number,hi:number,out:number}[]} */
      const used = [];
      for (const r of routes.filter((x) => x.shape === 'outer').sort((a, b) => Math.abs(a.s.rank - a.t.rank) - Math.abs(b.s.rank - b.t.rank))) {
        const lo = Math.min(r.s.rank, r.t.rank), hi = Math.max(r.s.rank, r.t.rank);
        r.sSide = r.tSide = r.out > 0 ? 'right' : 'left';
        // A link from a box to itself is the smallest loop there is: out from its own side and straight back, in
        // the room beside it, taking no channel from the lines that go round the whole flow.
        if (r.s === r.t) {
          r.cx = r.s.x + r.out * (r.s.w / 2 + measure.loop);
          continue;
        }
        r.cx = outside(r.s, r.t, r.out) + r.out * measure.channelStep * used.filter((u) => u.out === r.out && u.lo <= hi && u.hi >= lo).length;
        used.push({ lo, hi, out: r.out });
      }
    };
    setChannels();

    // Lines that cross in the same room between two ranks each get a track there, so none lies on another.
    /** @type {Map<number, Route[][]>} */
    const rooms = new Map();
    const span = (/** @type {Route} */ r) => [Math.min(r.s.x, r.t.x) - bw / 2, Math.max(r.s.x, r.t.x) + bw / 2];
    for (const r of routes.filter((x) => x.shape === 'VHV').sort((a, b) => span(b)[1] - span(b)[0] - (span(a)[1] - span(a)[0]))) {
      const tracks = rooms.get(r.gap) ?? [];
      const free = tracks.find((track) => track.every((o) => span(o)[1] <= span(r)[0] || span(o)[0] >= span(r)[1]));
      if (free) free.push(r);
      else tracks.push([r]);
      rooms.set(r.gap, tracks);
    }
    const setTracks = () => {
      for (const [gap, tracks] of rooms) {
        const step = Math.min(measure.trackStep, (rankGap - 2 * measure.trackEdge) / Math.max(1, tracks.length - 1));
        tracks.forEach((track, i) => track.forEach((r) => (r.ty = roomAfter(gap) + (i - (tracks.length - 1) / 2) * step)));
      }
    };

    // Ports. A straight line keeps the middle of its side. The others share the rest, in an order chosen to
    // cross as little as possible.
    /** @typedef {{r:Route,end:'s'|'t',off:number,step:number}} End */
    /** @type {Map<string, End[]>} */
    const groups = new Map();
    /** @type {Map<Route, {s:End,t:End}>} */
    const endsOf = new Map();
    const far = (/** @type {End} */ en, /** @type {Side} */ side) => {
      const o = en.end === 's' ? en.r.t : en.r.s;
      return side === 'top' || side === 'bottom' ? o.x : o.y;
    };
    // On the left or right of a box a line goes out, turns once, and runs along the flow. Two such lines cross
    // unless they nest: the one that goes further out before it turns keeps further from the way they turn. So
    // the lines that turn back up the flow come first, the nearest first, and then those that turn down it, the
    // furthest first. This is a rule, not a search: a box may lead to any number of others and its own lines
    // never cross each other.
    const turn = (/** @type {End} */ en) => {
      const n = en.end === 's' ? en.r.s : en.r.t, o = en.end === 's' ? en.r.t : en.r.s;
      return { way: Math.sign(o.y - n.y), out: Math.abs((en.r.shape === 'outer' ? en.r.cx : o.x) - n.x) };
    };
    const nested = (/** @type {End} */ a, /** @type {End} */ b) => {
      const ta = turn(a), tb = turn(b);
      return ta.way - tb.way || (ta.way < 0 ? ta.out - tb.out : tb.out - ta.out);
    };
    /** Which lines share which side of which box, each side's lines in the order of where they come from. */
    const regroup = () => {
      groups.clear();
      endsOf.clear();
      for (const r of routes) {
        const s = /** @type {End} */ ({ r, end: 's', off: 0, step: 0 }), t = /** @type {End} */ ({ r, end: 't', off: 0, step: 0 });
        endsOf.set(r, { s, t });
        if (r.shape === 'straight') continue;
        for (const [en, n, side] of /** @type {[End,Placed,Side][]} */ ([[s, r.s, r.sSide], [t, r.t, r.tSide]])) {
          const here = side === 'top' || side === 'bottom' ? n.x : n.y;
          const centred = routes.some((q) => q.shape === 'straight' && ((q.s === n && q.sSide === side) || (q.t === n && q.tSide === side)));
          // With a straight line in the middle, the rest split to the side their other end is on.
          const half = centred ? (far(en, side) < here ? 'low' : 'high') : 'all';
          const key = `${n.id}|${side}|${half}`;
          groups.set(key, [...(groups.get(key) ?? []), en]);
        }
      }
      for (const [key, list] of groups) {
        const side = /** @type {Side} */ (key.split('|')[1]);
        list.sort((a, b) => (side === 'left' || side === 'right' ? nested(a, b) : 0) || far(a, side) - far(b, side));
      }
    };
    const setOffsets = () => {
      for (const [key, list] of groups) {
        const [id, side, half] = key.split('|');
        const n = nodes[id];
        const length = side === 'top' || side === 'bottom' ? n.w : n.h;
        const reach = length * measure.portShare;
        if (half === 'all') {
          const step = list.length > 1 ? Math.min(measure.portStep, (2 * reach) / (list.length - 1)) : 0;
          list.forEach((en, i) => Object.assign(en, { step, off: (i - (list.length - 1) / 2) * step }));
        } else {
          const step = Math.min(measure.portStep, reach / list.length);
          list.forEach((en, i) => Object.assign(en, { step, off: half === 'low' ? -step * (list.length - i) : step * (i + 1) }));
        }
      }
    };
    const draw = (/** @type {Route} */ r) => {
      const en = endsOf.get(r);
      r.points = shapeOf(r, mid(r.s, r.sSide, en?.s.off), mid(r.t, r.tSide, en?.t.off));
    };
    /** The stretch of a line that touches a box: its first if it leaves there, its last if it arrives. */
    const stub = (/** @type {End} */ en) => (en.end === 's' ? en.r.points.slice(0, 2) : en.r.points.slice(-2));
    // A port is a line's own on its box, but the box below has ports at the same places. Where a line leaving a
    // box and a line entering the one under it would lie on each other in the room between them, the one
    // entering steps aside, half a port further from the middle. Two lines that swap sides always meet so:
    // whichever turns first, one of the two columns is shared.
    const stepAside = () => {
      /** @type {Map<string, End[]>} */
      const leaving = new Map();
      /** @type {[End, Placed][]} */
      const entering = [];
      for (const { s, t } of endsOf.values()) {
        for (const [en, n, side] of /** @type {[End,Placed,Side][]} */ ([[s, s.r.s, s.r.sSide], [t, t.r.t, t.r.tSide]])) {
          if (side === 'bottom') leaving.set(`${n.lane}:${n.rank}`, [...(leaving.get(`${n.lane}:${n.rank}`) ?? []), en]);
          if (side === 'top') entering.push([en, n]);
        }
      }
      for (const [en, n] of entering) {
        const shared = (leaving.get(`${n.lane}:${n.rank - 1}`) ?? []).some((o) => o.r !== en.r && meet(stub(o), stub(en)).overlaps > 0);
        if (!shared) continue;
        en.off += (Math.sign(en.off) || (far(en, 'top') < n.x ? -1 : 1)) * (en.step || measure.portStep) / 2;
        draw(en.r);
      }
    };
    const build = () => {
      setChannels();
      setOffsets();
      setTracks();
      routes.forEach(draw);
      stepAside();
    };
    const cost = () => {
      let c = 0;
      for (let i = 0; i < routes.length; i++) {
        c += 50 * hits(routes[i].points, routes[i].s, routes[i].t);
        for (let j = i + 1; j < routes.length; j++) {
          const m = meet(routes[i].points, routes[j].points);
          c += 10 * m.crossings + 8 * m.overlaps;
        }
      }
      return c;
    };
    /** Every order of a short list. */
    const orders = (/** @type {any[]} */ list) => {
      /** @type {any[][]} */
      const out = [];
      const go = (/** @type {any[]} */ done, /** @type {any[]} */ left) => (left.length ? left.forEach((x, i) => go([...done, x], [...left.slice(0, i), ...left.slice(i + 1)])) : out.push(done));
      go([], list);
      return out;
    };
    regroup();
    build();
    // A line round the outside goes round the other side when that costs less, so two of them need not cross;
    // and when it costs the same, round the side that saves it a lane or more: past one box fewer, not merely
    // into a nearer channel, or two loops up one side would part for no reason.
    const long = (/** @type {Route} */ r) => segmentsOf(r.points).reduce((sum, [a, b]) => sum + Math.abs(a.x - b.x) + Math.abs(a.y - b.y), 0);
    for (const r of routes.filter((x) => x.shape === 'outer')) {
      const before = cost(), was = long(r);
      r.out = /** @type {1|-1} */ (-r.out);
      build();
      regroup();
      build();
      if (cost() > before || (cost() === before && was - long(r) < bw + laneGap)) {
        r.out = /** @type {1|-1} */ (-r.out);
        build();
        regroup();
        build();
      }
    }
    if (!thorough) return { nodes, all, routes, cost: cost() };
    // Trying every order is only affordable for a few lines on a side, or a few tracks in a room; four makes
    // twenty-four orders. What can be reordered: the lines on one side of a box, and the tracks of one room.
    const few = 4, passes = 3;
    /** @type {[Map<any, any[]>, any][]} */
    const reorderable = [...[...groups.keys()].map((k) => /** @type {[Map<any, any[]>, any]} */ ([groups, k])), ...[...rooms.keys()].map((k) => /** @type {[Map<any, any[]>, any]} */ ([rooms, k]))];
    for (let pass = 0, better = true; pass < passes && better; pass++) {
      better = false;
      for (const [map, key] of reorderable) {
        const list = map.get(key) ?? [];
        if (list.length < 2 || list.length > few) continue;
        let best = cost(), keep = [...list];
        for (const o of orders(list)) {
          map.set(key, o);
          build();
          const c = cost();
          if (c < best) [best, keep, better] = [c, o, true];
        }
        map.set(key, keep);
        build();
      }
    }
    return { nodes, all, routes, cost: cost() };
  };

  // A box moves to another free lane of its rank when that costs less: fewer lines through boxes, fewer
  // crossings. Being far from the spine and being on the other side from where its kind goes both cost a
  // little, so a box only leaves its place for a reason.
  const weights = { far: 1, otherSide: 3, tries: 3 };
  const weigh = (/** @type {string} */ id, /** @type {number} */ l) => Math.abs(l) * weights.far + (Math.sign(l) === sideOf.get(id) ? 0 : weights.otherSide);
  let quick = settle(true).cost;
  // Placed as they first fall, most diagrams cost nothing and are left alone.
  const worthTrying = quick > 0;
  for (let pass = 0, moved = true; pass < weights.tries && moved && worthTrying; pass++) {
    moved = false;
    for (const id of rest) {
      const r = rank.get(id);
      const furthest = Math.max(1, ...[...lane.values()].map(Math.abs)) + 1;
      for (let l = -furthest; l <= furthest; l++) {
        const now = lane.get(id) ?? 0;
        if (l === 0 || l === now || taken.has(`${r}:${l}`)) continue;
        lane.set(id, l);
        const tried = settle(true).cost;
        if (tried + weigh(id, l) < quick + weigh(id, now)) {
          taken.delete(`${r}:${now}`);
          taken.add(`${r}:${l}`);
          [quick, moved] = [tried, true];
        } else lane.set(id, now);
      }
    }
  }
  // A lane left empty by the moves is closed up, each side of the spine in turn.
  for (const side of [1, -1]) {
    const usedLanes = [...new Set([...lane.values()].filter((l) => Math.sign(l) === side).map(Math.abs))].sort((a, b) => a - b);
    for (const [id, l] of lane) if (Math.sign(l) === side) lane.set(id, side * (usedLanes.indexOf(Math.abs(l)) + 1));
  }
  const { nodes, all, routes } = settle(true);

  // 7. Turn it to the side it was asked for, then on its side for a left-to-right flow.
  // A line round the far side may have gone past the edge; everything moves over to give it its margin.
  const over = Math.max(0, measure.pad - Math.min(...routes.flatMap((r) => r.points.map((p) => p.x)), measure.pad));
  const farRight = Math.max(...all.map((n) => n.x + n.w / 2), ...routes.flatMap((r) => r.points.map((p) => p.x)), 0) + over;
  const flip = (/** @type {Pt} */ p) => (model.hints.side === 'left' ? { x: farRight + measure.pad - (p.x + over), y: p.y } : { x: p.x + over, y: p.y });
  const turn = (/** @type {Pt} */ p) => (dir === 'LR' ? { x: p.y, y: p.x } : p);
  // A flow written bottom to top or right to left is the same flow, begun at the far end: everything is turned
  // over along the flow before anything that depends on which way is up (a shape's outline, a frame's name, a
  // link's words) is worked out, so all of that is done for the picture as it will be seen.
  const alongs = [...all.flatMap((n) => [n.y - n.h / 2, n.y + n.h / 2]), ...routes.flatMap((r) => r.points.map((p) => p.y))];
  const bothEnds = Math.min(...alongs) + Math.max(...alongs);
  const upturn = (/** @type {Pt} */ p) => (reversed ? { x: p.x, y: bothEnds - p.y } : p);
  const place = (/** @type {Pt} */ p) => turn(flip(upturn(p)));
  // Turned on its side, a box is as wide and as tall as it really is; top to bottom, it keeps its own height.
  for (const n of all) Object.assign(n, place(n), dir === 'LR' ? { w: box.w, h: box.h } : { w: box.w });

  /** @type {Record<string, Routed>} */
  const edges = {};
  for (const r of routes) edges[r.e.id] = { id: r.e.id, points: tidy(r.points.map(place)), back: back.has(r.e.id), label: null };
  // A route ends at the edge of its box. A rhombus, a pill or a side that leans is further in than that, so each
  // line runs on until it meets the outline: it only ever gets longer, along the way it was already going.
  const shapeOfBox = new Map(model.nodes.map((n) => [n.id, n.shape]));
  const meetOutline = (/** @type {Pt} */ p, /** @type {string} */ id) => {
    const n = nodes[id], shape = shapeOfBox.get(id) ?? 'box', near = (/** @type {number} */ a, /** @type {number} */ b) => Math.abs(a - b) < 0.5;
    if (near(p.y, n.y - n.h / 2)) p.y += inset(shape, 'top', p.x - n.x, n.w, n.h);
    else if (near(p.y, n.y + n.h / 2)) p.y -= inset(shape, 'bottom', p.x - n.x, n.w, n.h);
    else if (near(p.x, n.x - n.w / 2)) p.x += inset(shape, 'left', p.y - n.y, n.w, n.h);
    else if (near(p.x, n.x + n.w / 2)) p.x -= inset(shape, 'right', p.y - n.y, n.w, n.h);
  };
  for (const e of model.edges) {
    const points = edges[e.id].points;
    meetOutline(points[0], e.from);
    meetOutline(points[points.length - 1], e.to);
  }
  // A group's frame goes round its boxes, with room at the top for what it is called. One that would take in a
  // box that is not its own, or run into another frame, would say something untrue, so it is left out and said.
  /** @type {Frame[]} */
  const groups = [];
  const label = (/** @type {string} */ id) => model.nodes.find((n) => n.id === id)?.label ?? id;
  const meets = (/** @type {Frame} */ f, /** @type {{x:number,y:number,w:number,h:number}} */ r) => r.x + r.w / 2 > f.x && r.x - r.w / 2 < f.x + f.w && r.y + r.h / 2 > f.y && r.y - r.h / 2 < f.y + f.h;
  // The innermost first: an outer frame goes round its own boxes and round the frames inside it.
  const depth = (/** @type {string|undefined} */ id) => {
    let n = 0;
    for (let up = id === undefined ? undefined : parentOf.get(id); up !== undefined; up = parentOf.get(up)) n++;
    return n;
  };
  const within = (/** @type {string} */ inner, /** @type {string} */ outer) => {
    for (let up = parentOf.get(inner); up !== undefined; up = parentOf.get(up)) if (up === outer) return true;
    return false;
  };
  /** @type {Frame[]} */
  const made = [];
  for (const g of [...model.groups].sort((p, q) => depth(q.id) - depth(p.id))) {
    const own = g.members.map((id) => nodes[id]).filter(Boolean);
    const inner = made.filter((f) => parentOf.get(f.id) === g.id);
    const l = Math.min(...own.map((n) => n.x - n.w / 2), ...inner.map((f) => f.x)) - measure.framePad;
    // A frame with no name (a region of a composite state) keeps no room for one.
    const r = Math.max(...own.map((n) => n.x + n.w / 2), ...inner.map((f) => f.x + f.w)) + measure.framePad;
    // Its name is wrapped to its width, and it keeps room along its top for every line of it.
    const lines = nameLines(g.title, r - l);
    const t = Math.min(...own.map((n) => n.y - n.h / 2), ...inner.map((f) => f.y)) - measure.framePad - (g.title ? measure.frameTitle + measure.nameLine * (lines.length - 1) : 0);
    const u = Math.max(...own.map((n) => n.y + n.h / 2), ...inner.map((f) => f.y + f.h)) + measure.framePad;
    const frame = { name: { x: l, y: t, w: 0, h: 0, plate: false, lines }, id: g.id, title: g.title, x: l, y: t, w: r - l, h: u - t };
    const stranger = all.find((n) => !g.members.includes(n.id) && meets(frame, n));
    // A frame inside this one, or round it, is where it should be; any other it meets is one it has run into.
    const other = made.find((f) => !within(f.id, g.id) && !within(g.id, f.id) && meets(frame, { x: f.x + f.w / 2, y: f.y + f.h / 2, w: f.w, h: f.h }));
    if (stranger) warnings.push(`the frame of "${g.title}" is left out: "${label(stranger.id)}" is not in it and would fall inside`);
    else if (other) warnings.push(`the frame of "${g.title}" is left out: it would run into the frame of "${other.title}"`);
    else made.push(frame);
  }
  // Drawn outer before inner, the order they were written in, so an inner frame lies on the one it is in.
  groups.push(...model.groups.flatMap((g) => made.filter((f) => f.id === g.id)));

  // A group's name goes along the top of its frame, in the first stretch no line runs through: at the left,
  // then at the right, then anywhere between. Where every stretch has a line in it, the name stays at the left
  // on a plate of the frame's own colour: the line passes behind it, and the name can still be read.
  const drawn = Object.values(edges).map((e) => e.points);
  for (const f of groups) {
    if (!f.title) continue;
    const lines = f.name.lines ?? [f.title];
    const w = Math.round(Math.max(...lines.map((line) => line.length)) * measure.nameGlyph), h = measure.nameLine * lines.length, y = f.y + measure.nameDown + (h - measure.nameLine) / 2;
    const struck = (/** @type {number} */ x) => drawn.some((line) => segmentsOf(line).some((seg) => hitsBox(seg, { x, y, w, h }, measure.clear)));
    const first = f.x + measure.nameIn + w / 2, last = f.x + f.w - measure.nameIn - w / 2;
    /** @type {number[]} */
    const between = [];
    for (let x = first + measure.nameStep; x < last; x += measure.nameStep) between.push(x);
    const clear = [first, ...(last > first ? [last, ...between] : [])].find((x) => !struck(x));
    f.name = { x: clear ?? first, y, w, h, plate: clear === undefined, lines };
  }

  // The few words at an end of a link ("1", "0..*") sit beside the line, just out from its box and past what
  // is drawn at that end, on whichever side is clear of boxes and of other words.
  /** @type {Words[]} */
  const ended = [];
  const on = (/** @type {{x:number,y:number,w:number,h:number}} */ a, /** @type {{x:number,y:number,w:number,h:number}} */ b) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 + 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + 2;
  const atEnd = (/** @type {string} */ text, /** @type {Pt} */ p, /** @type {Pt} */ q) => {
    const w = Math.round(text.length * measure.labelGlyph + 6), h = measure.labelLine;
    const dx = Math.sign(q.x - p.x), dy = Math.sign(q.y - p.y);
    const places = [1, -1].map((side) => (dy !== 0
      ? { x: p.x + side * (measure.endOff + w / 2), y: p.y + dy * measure.endAlong }
      : { x: p.x + dx * (measure.endAlong + w / 2 - 6), y: p.y + side * (measure.endOff + h / 2) }));
    const clear = places.find((c) => !all.some((n) => on({ ...c, w, h }, n)) && !ended.some((o) => on({ ...c, w, h }, o))) ?? places[0];
    const words = { ...clear, w, h, text, lines: [text] };
    ended.push(words);
    return words;
  };
  for (const e of model.edges) {
    const points = edges[e.id].points, last = points.length - 1;
    if (e.near) edges[e.id].near = atEnd(e.near, points[0], points[1]);
    if (e.far) edges[e.id].far = atEnd(e.far, points[last], points[last - 1]);
  }

  // Each link's words, one link at a time, each where it sits on no box, no other words and, if it can, no line.
  /** @type {Words[]} */
  const worded = [];
  for (const e of model.edges) {
    if (!e.label) continue;
    const here = wordsFor(edges[e.id].points, e.label, all, [...worded, ...ended, ...groups.map((f) => f.name)], Object.values(edges).map((x) => x.points));
    worded.push(here);
    edges[e.id].label = here;
  }

  // Words beside a line that goes round the near outside, or a frame's title, can reach past the top or the
  // left of what the boxes and lines take up. Everything then moves over, so they keep the margin all else has.
  const least = (/** @type {'x'|'y'} */ a) => Math.min(
    ...Object.values(edges).flatMap((e) => [e.label, e.near, e.far].flatMap((l) => (l ? [l[a] - (a === 'x' ? l.w : l.h) / 2] : []))),
    ...groups.map((f) => Math.min(f[a], f.name[a] - (a === 'x' ? f.name.w : f.name.h) / 2)),
    measure.pad / 2,
  );
  const by = { x: measure.pad / 2 - least('x'), y: measure.pad / 2 - least('y') };
  if (by.x > 0 || by.y > 0) {
    const move = (/** @type {{x:number,y:number}} */ p) => {
      p.x += by.x;
      p.y += by.y;
    };
    all.forEach(move);
    groups.forEach((f) => {
      move(f);
      move(f.name);
    });
    for (const e of Object.values(edges)) {
      e.points.forEach(move);
      for (const l of [e.label, e.near, e.far]) if (l) move(l);
    }
  }

  const xs = [...all.map((n) => n.x + n.w / 2), ...groups.map((f) => f.x + f.w), ...Object.values(edges).flatMap((e) => [...e.points.map((p) => p.x), ...[e.label, e.near, e.far].flatMap((l) => (l ? [l.x + l.w / 2] : []))])];
  const ys = [...all.map((n) => n.y + n.h / 2), ...groups.map((f) => f.y + f.h), ...Object.values(edges).flatMap((e) => [...e.points.map((p) => p.y), ...[e.label, e.near, e.far].flatMap((l) => (l ? [l.y + l.h / 2] : []))])];
  const width = Math.ceil(Math.max(0, ...xs) + measure.pad), height = Math.ceil(Math.max(0, ...ys) + measure.pad);
  if (dir === 'LR' && width > measure.wide && model.hints.turn === false) warnings.push(`left to right, this ${/^(flowchart|graph)/.test(model.kindOfDiagram) ? 'flow' : 'diagram'} is ${width}px wide and will scroll on most screens${/^(flowchart|graph)/.test(model.kindOfDiagram) ? '; "flowchart TD" would read better' : ''}`);
  return { width, height, direction: dir, reversed, box, nodes, edges, groups, spine, warnings };
}

/** Drops points that repeat or sit on a straight run between their neighbours. */
function tidy(/** @type {Pt[]} */ pts) {
  const out = pts.filter((p, i) => i === 0 || p.x !== pts[i - 1].x || p.y !== pts[i - 1].y);
  return out.filter((p, i) => i === 0 || i === out.length - 1 || !((out[i - 1].x === p.x && p.x === out[i + 1].x) || (out[i - 1].y === p.y && p.y === out[i + 1].y)));
}

/**
 * Where a link's words go. They are tried beside each run of its line, near where it leaves first, above a run
 * that goes across and to the right of one that goes along; the first place that sits on no box and no other
 * words wins, and of those, one no line passes through.
 * @param {Pt[]} pts the link's own line
 * @param {string} text
 * @param {{x:number,y:number,w:number,h:number}[]} boxes
 * @param {Words[]} placed the words already set down
 * @param {Pt[][]} lines every link's line
 * @returns {Words}
 */
export function wordsFor(pts, text, boxes, placed, lines) {
  const sized = (/** @type {string[]} */ wrapped) => ({ lines: wrapped, w: Math.round(Math.max(...wrapped.map((l) => l.length)) * measure.labelGlyph + 10), h: 4 + measure.labelLine * wrapped.length });
  const usual = sized(wrap(text, measure.labelWrap));
  /** @type {{x:number,y:number,w:number,h:number,lines:string[],align?:'start'|'end'}[]} */
  const places = [];
  for (const [a, b] of segmentsOf(pts)) {
    const flat = a.y === b.y, length = flat ? Math.abs(b.x - a.x) : Math.abs(b.y - a.y), way = Math.sign(flat ? b.x - a.x : b.y - a.y);
    if (length < 16) continue;
    // Words wider than a short run across are wrapped again to fit it, so they do not hang over the boxes at
    // either end.
    const fit = flat && usual.w > length - measure.wordsAcross ? sized(wrap(text, Math.max(4, Math.floor((length - 18) / measure.labelGlyph)))) : usual;
    const need = flat ? fit.w : fit.h;
    // Near where the run starts, at its middle, near where it ends; a run too short for that, at its middle only.
    const along = length >= need + 24 ? [12 + need / 2, length / 2, length - 12 - need / 2] : [length / 2];
    for (const d of along) {
      for (const side of [-1, 1]) {
        // Beside a line that runs along the flow, the words are held at the side next to it: their width is
        // reckoned from an average glyph, and in a narrower face words centred on that reckoning drift away.
        places.push(flat ? { ...fit, x: a.x + way * d, y: a.y + side * (fit.h / 2 + measure.labelOff) } : { ...fit, x: a.x - side * (fit.w / 2 + measure.labelOff + 2), y: a.y + way * d, align: side > 0 ? 'end' : 'start' });
      }
    }
  }
  if (!places.length) places.push({ ...usual, x: pts[0].x + usual.w / 2 + measure.labelOff, y: pts[0].y + usual.h / 2 + measure.labelOff });
  const on = (/** @type {{x:number,y:number,w:number,h:number}} */ p, /** @type {{x:number,y:number,w:number,h:number}} */ r, grow = 2) => Math.abs(p.x - r.x) < (p.w + r.w) / 2 + grow && Math.abs(p.y - r.y) < (p.h + r.h) / 2 + grow;
  const cost = (/** @type {typeof places[0]} */ p, /** @type {number} */ i) =>
    100 * boxes.filter((r) => on(p, r)).length + 100 * placed.filter((r) => on(p, r)).length
    + 10 * lines.reduce((sum, line) => sum + segmentsOf(line).filter((seg) => hitsBox(seg, p, 0)).length, 0) + i;
  const best = places.map((p, i) => ({ p, c: cost(p, i) })).sort((a, b) => a.c - b.c)[0].p;
  return { x: best.x, y: best.y, w: best.w, h: best.h, text, lines: best.lines, ...(best.align ? { align: best.align } : {}) };
}

