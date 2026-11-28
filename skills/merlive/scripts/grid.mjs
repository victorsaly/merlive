// Why: a block diagram is the one kind whose author places the boxes. Where what it says is where each block
// is (a block joined to nothing, a block that spans columns, a space that holds a cell open, an arrow drawn as
// a block), placing it by rank would say something its author did not. So it is placed on the grid it was
// written on: cells filled row by row, every column of a grid as wide as every other, every row as tall as its
// tallest cell, a block exactly its cells. Links are drawn over that, at right angles, in the gaps between
// rows and columns. What comes out is what layout.mjs gives, so it is drawn and checked as any diagram is.
// Pure: a model in, coordinates out.

import { compartmentsOf, extraHeight, frameEdge, hitsBox, linesOf, measure, meet, overNeeds, roomFor, rowsRoom, segmentsOf, wordsFor, wrap } from './layout.mjs';
import { inset } from './shapes.mjs';

/** @typedef {import('./parse.mjs').Model} Model */
/** @typedef {import('./parse.mjs').Node} Node */
/** @typedef {import('./block.mjs').Grid} Grid */
/** @typedef {import('./block.mjs').Cell} Cell */
/** @typedef {import('./layout.mjs').Layout} Layout */
/** @typedef {import('./layout.mjs').Placed} Placed */
/** @typedef {import('./layout.mjs').Pt} Pt */
/** @typedef {import('./layout.mjs').Side} Side */
/**
 * A grid may say two things of its own, for when what is in it is not blocks of a flow's size with lines
 * between them (the bits of a packet, say): `least`, the narrowest a column may be in px, from which a column is
 * as wide as its words need and not the next of a flow's six widths; and `gap`, the room between two cells,
 * when nothing but a link's words would ask for more. The gap is the whole diagram's, so the outermost grid
 * says it.
 * @typedef {Grid & {least?:number,gap?:number}} Sized
 */
/**
 * One grid as it was placed, for the check that a block is exactly its cells: where it starts, how wide its
 * columns are and how tall each row, and which cells each block or frame takes.
 * @typedef {{x:number,y:number,colW:number,gapX:number,gapY:number,rows:{y:number,h:number}[],cells:{id:string,col:number,row:number,span:number,frame:boolean}[]}} PlacedGrid
 */

// What is measured, named once. Whatever is the same thing as in a flow (the widths a box may have, the room
// round a frame, the step between two ports) is taken from `measure` in layout.mjs, not said again here.
export const gridMeasure = {
  fine: 2, // px between two widths a column may take in a grid that says its own least: as wide as its words need, to the nearest even px
  close: 16, // px between two cells when their author says nothing runs between them (a board of cards): the least the rules let two boxes come
  gap: 48, // px between two columns, and between two rows, as between two ranks of a flow: room for three lines a track step apart, each with a stub both ends
  wordsAir: 16, // px a gap is wider (or taller) than the words of a link, so words in a gap touch neither block
  clear: 6, // px a line keeps from a block it passes
  stub: 12, // the least a line runs straight out of a block or into one: an arrowhead and a little more
  portEdge: 8, // the least from a line's port to the corner of its block
  arrowTall: 16, // px a block arrow that points up or down is taller than a block, for its head; twice for one that points both ways
  crossing: 1000, // what a crossing costs when a route is chosen: more than any number of turns
  turn: 10, // what a turn costs
  step: 3, // what each step off the middle of a side or of a gap costs
  nameLines: 3, // the most lines a frame's name wraps to before its columns are widened for it: a timeline's section may be named in a sentence
};

/**
 * A frame's name in lines, in a frame whose contents are `room` px wide: wrapped as a box's words are, to as many
 * lines as `gridMeasure.nameLines` at most, and only as much wider than the room as its longest word, or three
 * lines, need. One sentence of a name would otherwise make every column of the grid as wide as itself. The width
 * is found by halving, not a letter at a time: the lines a name wraps to never grow as it is given more room, and
 * a long name is wrapped a few times, not once for every letter it widens by.
 * @param {string} name
 * @param {number} room
 * @returns {string[]}
 */
export function nameAt(name, room) {
  if (!name) return [];
  const longest = Math.max(...name.split(/\s+/).map((w) => w.length));
  let low = Math.max(1, Math.floor(room / measure.nameGlyph), longest), lines = wrap(name, low);
  if (lines.length <= gridMeasure.nameLines) return lines;
  // Too many lines at `low`; one line at the whole name's length. The fewest letters that give few enough lies between.
  let high = name.length, best = [name];
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2), tried = wrap(name, mid);
    if (tried.length <= gridMeasure.nameLines) [high, best] = [mid, tried];
    else low = mid;
  }
  return best;
}

/** The places a line may leave a side by, in port steps from its middle, and the lines of a gap it may take, in track steps: nearest first. */
const PORTS = [0, 1, -1, 2, -2], TRACKS = [0, 1, -1];
/** Whether each end's gap is outside the frames round it, as [a, b]: beside both blocks first, as before frames were thought of. */
const SIDES = /** @type {const} */ ([[false, false], [false, true], [true, false], [true, true]]);

const vertical = (/** @type {Side} */ side) => side === 'top' || side === 'bottom';

/** A route with every point that changes nothing left out. */
const tidy = (/** @type {Pt[]} */ pts) => {
  const out = pts.filter((p, i) => i === 0 || p.x !== pts[i - 1].x || p.y !== pts[i - 1].y);
  return out.filter((p, i) => i === 0 || i === out.length - 1 || !((out[i - 1].x === p.x && p.x === out[i + 1].x) || (out[i - 1].y === p.y && p.y === out[i + 1].y)));
};

/**
 * @param {Model} model a block diagram whose blocks its author placed (`model.grid`)
 * @returns {Layout}
 */
export function placeGrid(model) {
  /** @type {string[]} */
  const warnings = [];
  const byId = new Map(model.nodes.map((n) => [n.id, n]));
  const groupOf = new Map(model.groups.map((g) => [g.id, g]));
  const base = measure.boxPad + measure.lineHeight;

  // A gap has to hold the words of a link that crosses it: across, as wide as the widest words; down, as tall
  // as the tallest. One pair of gaps for the whole diagram, so a grid inside another lines up with it.
  const worded = model.edges.filter((e) => e.label && e.from !== e.to).map((e) => wrap(e.label, measure.labelWrap));
  // Cells nothing runs between need no room for a line: they sit as close as two boxes may. A grid says so
  // itself (`close`), and it only holds while the diagram has no link at all. Otherwise a grid may say its own
  // gap, and one that says nothing has the usual.
  const asked = /** @type {Sized & {close?:boolean}} */ (model.grid);
  const gap = asked.close && !model.edges.length ? gridMeasure.close : asked.gap ?? gridMeasure.gap;
  const gapX = Math.max(gap, ...worded.map((lines) => Math.round(Math.max(...lines.map((l) => l.length)) * measure.labelGlyph + 10) + gridMeasure.wordsAir));
  const gapY = Math.max(gap, ...worded.map((lines) => 4 + measure.labelLine * lines.length + gridMeasure.wordsAir));

  // 1. Cells, row by row. A cell takes the columns it spans; one that does not fit what is left of a row
  // starts the next. "columns auto" is one row, as long as what was written.
  const rowsOf = (/** @type {Grid} */ grid) => {
    const cells = grid.cells.filter((c) => c.is === 'space' || c.is === 'group' || byId.has(c.id));
    const cols = grid.columns === 'auto' ? Math.max(1, cells.reduce((sum, c) => sum + c.span, 0)) : grid.columns;
    /** @type {{cell:Cell,col:number,span:number}[][]} */
    const rows = [];
    let col = cols;
    for (const cell of cells) {
      const span = Math.min(cell.span, cols);
      if (col + span > cols) {
        rows.push([]);
        col = 0;
      }
      rows[rows.length - 1].push({ cell, col, span });
      col += span;
    }
    return { cols, rows };
  };

  // 2. One column width for a grid: the narrowest of the widths a box may have in which every block's words
  // fit as they must in any box, a block that spans columns having the gaps between them too. A block that
  // holds others needs its own grid's width and the room round it, shared over the columns it spans.
  // What a block lists under its name (a card's ticket, who has it) keeps its one line each, so the block is
  // wide enough for the longest, in the wider boxes a diagram that lists rows may have.
  const listed = (/** @type {Node} */ n) => compartmentsOf(n).flat();
  const fitsAt = (/** @type {Node} */ n, /** @type {number} */ w) => {
    const lines = linesOf(n, w);
    // The short line over a name is never wrapped: a block is as wide as it needs, as a box of a flow is.
    const over = overNeeds(n);
    return over <= w && lines.length <= Math.max(2, Math.min(measure.mostLines, n.breaks?.length ?? 0)) && lines.every((l) => l.length <= roomFor(n, w)) && listed(n).every((row) => row.length <= rowsRoom(w));
  };
  /** The name a block that holds others goes by: its group's, or, when it holds nothing and so is no group, the one its cell keeps. */
  const nameOf = (/** @type {Cell} */ cell) => groupOf.get(/** @type {{id:string}} */ (cell).id)?.title ?? /** @type {{title?:string}} */ (cell).title ?? '';
  /** @returns {{cols:number,rows:{cell:Cell,col:number,span:number}[][],colW:number,w:number}} */
  const need = (/** @type {Grid} */ grid) => {
    const { cols, rows } = rowsOf(grid), all = rows.flat();
    const blocks = all.flatMap((p) => (p.cell.is === 'block' || p.cell.is === 'arrow' ? [{ n: /** @type {Node} */ (byId.get(p.cell.id)), span: p.span }] : []));
    const wide = (/** @type {number} */ w, /** @type {number} */ span) => span * w + (span - 1) * gapX;
    // A grid that says its own least column tries every width from there up to a flow's narrowest, then a flow's,
    // and the wider ones a box that lists rows may have.
    const least = /** @type {Sized} */ (grid).least ?? measure.widths[0];
    const flows = blocks.some((b) => listed(b.n).length) ? [...measure.widths, ...measure.rowWidths] : measure.widths;
    const widths = [...Array.from({ length: Math.max(0, Math.ceil((measure.widths[0] - least) / gridMeasure.fine)) }, (_, i) => least + i * gridMeasure.fine), ...flows.filter((w) => w >= least)];
    let colW = widths.find((w) => blocks.every((b) => fitsAt(b.n, wide(w, b.span)))) ?? Math.max(least, flows[flows.length - 1]);
    for (const p of all) {
      if (p.cell.is !== 'group') continue;
      const held = need(p.cell.grid).w, name = Math.round(Math.max(0, ...nameAt(nameOf(p.cell), held).map((l) => l.length)) * measure.nameGlyph), inner = Math.max(held, name) + 2 * measure.framePad;
      colW = Math.max(colW, Math.ceil((inner - (p.span - 1) * gapX) / p.span));
    }
    return { cols, rows, colW, w: cols * colW + (cols - 1) * gapX };
  };

  // 3. A grid as it comes out in a given width, from its own top left corner: its column width, each row's
  // height, and each cell. A grid inside a frame is given the frame's width, and its columns share it.
  /**
   * @typedef {{cell:Cell,col:number,span:number,x:number,w:number,h:number,lines:string[],inner:Shaped|null,titled:boolean,band:number,named:string[]}} Item band: the room at the top of a frame for its name; named: its name in lines
   * @typedef {{colW:number,off:number,w:number,h:number,rows:{y:number,h:number,items:Item[]}[]}} Shaped
   */
  // A block that lists something under its name has its name in a band at its top, the same for every such
  // block (the drawing is told one), tall enough for the longest of their names; what it lists comes under it.
  const lists = (/** @type {Node} */ n) => Boolean(n.over || n.text || n.table || listed(n).length);
  let band = base, named = 1;
  /** @returns {Shaped} */
  const shape = (/** @type {Grid} */ grid, /** @type {number|undefined} */ width) => {
    const n = need(grid);
    const colW = width === undefined ? n.colW : Math.max(n.colW, Math.floor((width - (n.cols - 1) * gapX) / n.cols));
    const total = n.cols * colW + (n.cols - 1) * gapX, off = width === undefined ? 0 : Math.max(0, Math.floor((width - total) / 2));
    let y = 0;
    const rows = n.rows.map((row) => {
      // Where one frame of a row has a name, every frame of that row keeps room for one, so that what they hold
      // starts on one line: a named block beside one with no name, or a timeline's sections.
      // A name that wraps takes more lines than one, and every frame of the row keeps room for the most.
      const widthOf = (/** @type {{span:number}} */ p) => p.span * colW + (p.span - 1) * gapX;
      const names = new Map(row.filter((p) => p.cell.is === 'group').map((p) => [p, nameAt(nameOf(p.cell), widthOf(p) - 2 * measure.framePad)]));
      const rowNamed = [...names.values()].some((l) => l.length), nameBand = measure.frameTitle + (Math.max(1, ...[...names.values()].map((l) => l.length)) - 1) * measure.nameLine;
      const items = row.map((p) => {
        const w = widthOf(p), x = off + p.col * (colW + gapX);
        /** @type {Item} */
        const item = { ...p, x, w, h: base, lines: [], inner: null, titled: false, band: 0, named: names.get(p) ?? [] };
        if (p.cell.is === 'group') {
          item.titled = rowNamed;
          item.band = rowNamed ? nameBand : 0;
          item.inner = shape(p.cell.grid, w - 2 * measure.framePad);
          item.h = Math.max(base, item.inner.h) + 2 * measure.framePad + item.band;
        } else if (p.cell.is !== 'space') {
          const node = /** @type {Node} */ (byId.get(p.cell.id));
          item.lines = linesOf(node, w);
          // An arrow that points up or down has its head above or below its words, and is taller by it.
          const heads = node.shape === 'arrow-y' ? 2 : node.shape === 'arrow-up' || node.shape === 'arrow-down' ? 1 : 0;
          item.h = measure.boxPad + measure.lineHeight * item.lines.length + heads * gridMeasure.arrowTall;
          if (lists(node)) {
            named = Math.max(named, item.lines.length);
            item.h = band + extraHeight(node, { w, h: band });
          }
        }
        return item;
      });
      const row1 = { y, h: Math.max(...items.map((i) => i.h)), items };
      y += row1.h + gapY;
      return row1;
    });
    return { colW, off, w: width ?? total, h: Math.max(0, y - gapY), rows };
  };

  // 4. Every cell where it is on the page. A block is exactly its cells: as wide as the columns it spans and the
  // gaps between them, and as tall as its row. A frame is too, and the grid inside it starts under its name.
  /** @type {Record<string, Placed>} */
  const nodes = {};
  /** @type {import('./layout.mjs').Frame[]} */
  const frames = [];
  /** @type {PlacedGrid[]} */
  const grids = [];
  const commit = (/** @type {Shaped} */ tree, /** @type {number} */ x, /** @type {number} */ y) => {
    /** @type {PlacedGrid} */
    const placed = { x: x + tree.off, y, colW: tree.colW, gapX, gapY, rows: tree.rows.map((r) => ({ y: y + r.y, h: r.h })), cells: [] };
    grids.push(placed);
    tree.rows.forEach((row, r) => {
      for (const item of row.items) {
        const cell = item.cell, l = x + item.x, t = y + row.y;
        if (cell.is === 'space') continue;
        placed.cells.push({ id: cell.id, col: item.col, row: r, span: item.span, frame: cell.is === 'group' });
        if (cell.is === 'group') {
          // A block that holds nothing is an empty cell: there is no group to draw a frame for. One that
          // keeps a name of its own (a column of a board with no cards yet) is still drawn, round nothing.
          if (groupOf.has(cell.id) || nameOf(cell)) frames.push({ id: cell.id, title: nameOf(cell), lines: item.named, x: l, y: t, w: item.w, h: row.h, name: { x: l, y: t, w: 0, h: 0, plate: false } });
          else placed.cells.pop();
          commit(/** @type {Shaped} */ (item.inner), l + measure.framePad, t + measure.framePad + item.band);
        } else nodes[cell.id] = { id: cell.id, x: l + item.w / 2, y: t + row.h / 2, w: item.w, h: row.h, rank: r, lane: item.col, spine: false, lines: item.lines };
      }
    });
  };
  // Shaped once to find the longest name among the blocks that list something, then again with room for it.
  shape(/** @type {Grid} */ (model.grid), undefined);
  band = measure.boxPad + measure.lineHeight * named;
  const whole = shape(/** @type {Grid} */ (model.grid), undefined);
  commit(whole, measure.pad, measure.pad);

  // A box that is in no cell has nowhere its author put it. It is drawn under the grid, and said.
  const stray = model.nodes.filter((n) => !nodes[n.id]);
  stray.forEach((n, i) => {
    const w = whole.colW, lines = linesOf(n, w), h = measure.boxPad + measure.lineHeight * lines.length;
    nodes[n.id] = { id: n.id, x: measure.pad + i * (w + gapX) + w / 2, y: measure.pad + whole.h + gapY + h / 2, w, h, rank: whole.rows.length, lane: i, spine: false, lines };
    warnings.push(`"${n.label}" is in no cell of the grid: it is drawn under it`);
  });

  // 5. Links, one at a time, each by the simplest way that is clear: straight across a gap; round one corner;
  // out into the gap beside one block, along it, and in; or out, along a gap, down another and in. A way is
  // clear when it passes through no block and runs along no line already drawn. Of the clear ways, the one
  // with the fewest crossings wins, then the fewest turns, then the one nearest the middle of its sides.
  const all = Object.values(nodes);
  const edge = (/** @type {Placed} */ n, /** @type {Side} */ side) => (side === 'top' ? n.y - n.h / 2 : side === 'bottom' ? n.y + n.h / 2 : side === 'left' ? n.x - n.w / 2 : n.x + n.w / 2);
  const downOr = (/** @type {number} */ s) => /** @type {Side} */ (s > 0 ? 'bottom' : 'top'), rightOr = (/** @type {number} */ s) => /** @type {Side} */ (s > 0 ? 'right' : 'left');
  const outer = { l: Math.min(...all.map((n) => n.x - n.w / 2)), r: Math.max(...all.map((n) => n.x + n.w / 2)) };
  // Where a line runs along a gap beside a block, the gap is outside the frames round that block that do not
  // also hold the other end: inside them, half a gap from the block is the frame's own margin, on its edge.
  const holds = (/** @type {{x:number,y:number,w:number,h:number}} */ f, /** @type {Placed} */ n) => n.x > f.x && n.x < f.x + f.w && n.y > f.y && n.y < f.y + f.h;
  const rim = (/** @type {Placed} */ n, /** @type {Placed} */ other, /** @type {Side} */ side) => {
    const round = frames.filter((f) => holds(f, n) && !holds(f, other));
    const ends = round.map((f) => (side === 'top' ? f.y : side === 'bottom' ? f.y + f.h : side === 'left' ? f.x : f.x + f.w));
    return side === 'top' || side === 'left' ? Math.min(edge(n, side), ...ends) : Math.max(edge(n, side), ...ends);
  };
  const rims = frames.map(frameEdge);

  /**
   * Every way from a to b, each as what makes its points from where it leaves a (oa px off the middle of the
   * side), where it enters b (ob), and which line of each gap it takes (ta, tb px off the middle of the gap).
   * @returns {((oa:number, ob:number, ta:number, tb:number) => {pts:Pt[],from:Side,to:Side})[]}
   */
  const waysFor = (/** @type {Placed} */ a, /** @type {Placed} */ b) => {
    /** @type {ReturnType<typeof waysFor>} */
    const ways = [];
    const sx = Math.sign(b.x - a.x), sy = Math.sign(b.y - a.y);
    const acrossFrom = Math.max(a.x - a.w / 2, b.x - b.w / 2), acrossTo = Math.min(a.x + a.w / 2, b.x + b.w / 2);
    const downFrom = Math.max(a.y - a.h / 2, b.y - b.h / 2), downTo = Math.min(a.y + a.h / 2, b.y + b.h / 2);
    // Side by side, with part of a side facing: straight across. One above the other: straight down.
    if (downTo > downFrom && acrossTo <= acrossFrom) {
      ways.push((oa) => {
        const y = (downFrom + downTo) / 2 + oa;
        return { pts: [{ x: edge(a, rightOr(sx)), y }, { x: edge(b, rightOr(-sx)), y }], from: rightOr(sx), to: rightOr(-sx) };
      });
    }
    if (acrossTo > acrossFrom && downTo <= downFrom) {
      ways.push((oa) => {
        const x = (acrossFrom + acrossTo) / 2 + oa;
        return { pts: [{ x, y: edge(a, downOr(sy)) }, { x, y: edge(b, downOr(-sy)) }], from: downOr(sy), to: downOr(-sy) };
      });
    }
    // Round one corner: out of a's side, into b's top or bottom; or out of a's top or bottom, into b's side.
    if (sx && sy) {
      ways.push((oa, ob) => ({ pts: [{ x: edge(a, rightOr(sx)), y: a.y + oa }, { x: b.x + ob, y: a.y + oa }, { x: b.x + ob, y: edge(b, downOr(-sy)) }], from: rightOr(sx), to: downOr(-sy) }));
      ways.push((oa, ob) => ({ pts: [{ x: a.x + oa, y: edge(a, downOr(sy)) }, { x: a.x + oa, y: b.y + ob }, { x: edge(b, rightOr(-sx)), y: b.y + ob }], from: downOr(sy), to: rightOr(-sx) }));
    }
    // Up or down out of a. With b in the same row there is no way "towards" it, so below is tried, then above,
    // and the line comes back into the same side of b it left a by.
    // Each end's gap is tried beside its block, then outside the frames round it (see `rim`): leaving a period
    // with its events under it, the line has to keep beside it; coming into the next section, outside its frame.
    for (const [atA, atB] of SIDES) for (const dy of sy ? [sy] : [1, -1]) {
      const near = (/** @type {Placed} */ n, /** @type {Placed} */ other, /** @type {Side} */ side, /** @type {boolean} */ out) => (out ? rim(n, other, side) : edge(n, side));
      const into = sy ? -dy : dy, from = downOr(dy), to = downOr(into);
      const out = (/** @type {number} */ oa) => ({ x: a.x + oa, y: edge(a, from) }), in_ = (/** @type {number} */ ob) => ({ x: b.x + ob, y: edge(b, to) });
      const beyond = dy > 0 ? Math.max(near(a, b, from, atA), sy ? -Infinity : near(b, a, to, atB)) : Math.min(near(a, b, from, atA), sy ? Infinity : near(b, a, to, atB));
      const byA = (/** @type {number} */ t) => beyond + (dy * gapY) / 2 + t, byB = (/** @type {number} */ t) => (sy ? near(b, a, to, atB) + (into * gapY) / 2 : byA(0)) + t;
      // Along the gap beside a, or the gap beside b.
      ways.push((oa, ob, ta) => ({ pts: [out(oa), { x: a.x + oa, y: byA(ta) }, { x: b.x + ob, y: byA(ta) }, in_(ob)], from, to }));
      if (sy) ways.push((oa, ob, _ta, tb) => ({ pts: [out(oa), { x: a.x + oa, y: byB(tb) }, { x: b.x + ob, y: byB(tb) }, in_(ob)], from, to }));
      // Along the gap beside a, down a gap between columns (or past the outside of them all), along the gap beside b.
      if (sy) {
        for (const x of [a.x + a.w / 2 + gapX / 2, a.x - a.w / 2 - gapX / 2, b.x + b.w / 2 + gapX / 2, b.x - b.w / 2 - gapX / 2, outer.l - gapX / 2, outer.r + gapX / 2]) {
          ways.push((oa, ob, ta, tb) => ({ pts: [out(oa), { x: a.x + oa, y: byA(ta) }, { x, y: byA(ta) }, { x, y: byB(tb) }, { x: b.x + ob, y: byB(tb) }, in_(ob)], from, to }));
        }
      }
    }
    // Left or right out of a, the same way turned a quarter: for a block straight above another with one between.
    for (const [atA, atB] of SIDES) for (const dx of sx ? [sx] : [1, -1]) {
      const near = (/** @type {Placed} */ n, /** @type {Placed} */ other, /** @type {Side} */ side, /** @type {boolean} */ out) => (out ? rim(n, other, side) : edge(n, side));
      const into = sx ? -dx : dx, from = rightOr(dx), to = rightOr(into);
      const beyond = dx > 0 ? Math.max(near(a, b, from, atA), sx ? -Infinity : near(b, a, to, atB)) : Math.min(near(a, b, from, atA), sx ? Infinity : near(b, a, to, atB));
      const byA = (/** @type {number} */ t) => beyond + (dx * gapX) / 2 + t, byB = (/** @type {number} */ t) => (sx ? near(b, a, to, atB) + (into * gapX) / 2 : byA(0)) + t;
      ways.push((oa, ob, ta) => ({ pts: [{ x: edge(a, from), y: a.y + oa }, { x: byA(ta), y: a.y + oa }, { x: byA(ta), y: b.y + ob }, { x: edge(b, to), y: b.y + ob }], from, to }));
      if (sx) ways.push((oa, ob, _ta, tb) => ({ pts: [{ x: edge(a, from), y: a.y + oa }, { x: byB(tb), y: a.y + oa }, { x: byB(tb), y: b.y + ob }, { x: edge(b, to), y: b.y + ob }], from, to }));
    }
    return ways;
  };

  /** The steps off the middle that are tried, the nearest to it first. */
  const tries = PORTS.flatMap((oa, i) => PORTS.flatMap((ob, j) => TRACKS.flatMap((ta, k) => TRACKS.map((tb, l) => ({ oa: oa * measure.portStep, ob: ob * measure.portStep, ta: ta * measure.trackStep, tb: tb * measure.trackStep, far: i + j + k + l }))))).sort((p, q) => p.far - q.far);

  /** How many blocks a route passes through or too near, itself and where it is going aside. */
  const through = (/** @type {Pt[]} */ pts, /** @type {Placed} */ a, /** @type {Placed} */ b) => {
    const segs = segmentsOf(pts);
    return all.filter((n) => (n === a ? segs.slice(1).some((s) => hitsBox(s, n, 0)) : n === b ? segs.slice(0, -1).some((s) => hitsBox(s, n, 0)) : segs.some((s) => hitsBox(s, n, gridMeasure.clear)))).length;
  };
  const inside = (/** @type {Pt} */ p, /** @type {Placed} */ n, /** @type {Side} */ side) => Math.abs(vertical(side) ? p.x - n.x : p.y - n.y) <= (vertical(side) ? n.w : n.h) / 2 - gridMeasure.portEdge;
  const long = (/** @type {[Pt, Pt]} */ [p, q]) => Math.abs(p.x - q.x) + Math.abs(p.y - q.y);

  /** @type {{id:string,pts:Pt[],from:Side,to:Side}[]} */
  const routed = [];
  for (const e of model.edges) {
    const a = nodes[e.from], b = nodes[e.to];
    if (e.from === e.to) {
      // A link from a block to itself: a small loop out of its right side.
      const x = a.x + a.w / 2, out = measure.loop, half = measure.portStep / 2;
      routed.push({ id: e.id, pts: [{ x, y: a.y - half }, { x: x + out, y: a.y - half }, { x: x + out, y: a.y + half }, { x, y: a.y + half }], from: 'right', to: 'right' });
      continue;
    }
    const ways = waysFor(a, b);
    /** @type {{cost:number,pts:Pt[],from:Side,to:Side}|null} */
    let best = null;
    /** @type {{blocked:number,pts:Pt[],from:Side,to:Side}|null} */
    let least = null;
    const seen = new Set();
    for (const t of tries) {
      ways.forEach((way, i) => {
        const made = way(t.oa, t.ob, t.ta, t.tb), pts = tidy(made.pts), key = pts.map((p) => `${p.x},${p.y}`).join(' ');
        if (seen.has(key)) return;
        seen.add(key);
        const segs = segmentsOf(pts);
        if (!inside(made.pts[0], a, made.from) || !inside(made.pts[made.pts.length - 1], b, made.to) || long(segs[0]) < gridMeasure.stub || long(segs[segs.length - 1]) < gridMeasure.stub) return;
        const blocked = through(pts, a, b);
        if (blocked) {
          if (!least || blocked < least.blocked) least = { blocked, pts, from: made.from, to: made.to };
          return;
        }
        if (rims.some((f) => meet(pts, f).overlaps)) return;
        let crossings = 0;
        for (const other of routed) {
          const met = meet(pts, other.pts);
          if (met.overlaps) return;
          crossings += met.crossings;
        }
        const cost = crossings * gridMeasure.crossing + (pts.length - 2) * gridMeasure.turn + t.far * gridMeasure.step + i / 100;
        if (!best || cost < best.cost) best = { cost, pts, from: made.from, to: made.to };
      });
      // Nothing further from the middle can be simpler than a straight line with no crossing.
      if (best && /** @type {{cost:number}} */ (best).cost < gridMeasure.turn) break;
    }
    /** @type {{pts:Pt[],from:Side,to:Side}} */
    const chosen = best ?? least ?? { pts: [{ x: a.x, y: a.y }, { x: b.x, y: a.y }, { x: b.x, y: b.y }], from: 'right', to: 'top' };
    if (!best) warnings.push(`the link from "${byId.get(e.from)?.label ?? e.from}" to "${byId.get(e.to)?.label ?? e.to}" has no way round the blocks between them on this grid; give it room with a space, or move a block`);
    routed.push({ id: e.id, pts: chosen.pts.map((p) => ({ ...p })), from: chosen.from, to: chosen.to });
  }

  // A route ends at the edge of its block. A rhombus, a pill or an arrow is further in than that, so each line
  // runs on until it meets the outline, along the way it was already going.
  const meetOutline = (/** @type {Pt} */ p, /** @type {Placed} */ n, /** @type {Side} */ side) => {
    const d = inset(byId.get(n.id)?.shape ?? 'box', side, vertical(side) ? p.x - n.x : p.y - n.y, n.w, n.h);
    if (side === 'top') p.y += d;
    else if (side === 'bottom') p.y -= d;
    else if (side === 'left') p.x += d;
    else p.x -= d;
  };
  /** @type {Layout['edges']} */
  const edges = {};
  for (const e of model.edges) {
    const r = /** @type {typeof routed[0]} */ (routed.find((x) => x.id === e.id));
    meetOutline(r.pts[0], nodes[e.from], r.from);
    meetOutline(r.pts[r.pts.length - 1], nodes[e.to], r.to);
    edges[e.id] = { id: e.id, points: r.pts, back: false, label: null };
  }

  // 6. A frame's name is along its top, at the left. Where a line has to pass through it, it is on a plate of
  // the frame's own colour and the line passes behind, as in any diagram.
  const lines = Object.values(edges).map((e) => e.points);
  for (const f of frames) {
    if (!f.title) continue;
    const called = f.lines ?? [f.title], w = Math.round(Math.max(...called.map((l) => l.length)) * measure.nameGlyph), h = measure.nameLine * called.length;
    const name = { x: f.x + measure.nameIn + w / 2, y: f.y + measure.nameDown + ((called.length - 1) * measure.nameLine) / 2, w, h };
    f.name = { ...name, plate: lines.some((line) => segmentsOf(line).some((seg) => hitsBox(seg, name, measure.clear))) };
  }

  // 7. Each link's words, where they sit on no block, no other words and, if they can, no line.
  /** @type {import('./layout.mjs').Words[]} */
  const said = [];
  for (const e of model.edges) {
    if (!e.label) continue;
    const here = wordsFor(edges[e.id].points, e.label, all, [...said, ...frames.map((f) => f.name)], lines);
    said.push(here);
    edges[e.id].label = here;
  }

  // A line round the outside, or words beside one, may reach past the top or the left. Everything moves over,
  // so they keep the margin all else has.
  const least = (/** @type {'x'|'y'} */ k) => Math.min(...lines.flat().map((p) => p[k]), ...said.map((l) => l[k] - (k === 'x' ? l.w : l.h) / 2), measure.pad / 2);
  const by = { x: measure.pad / 2 - least('x'), y: measure.pad / 2 - least('y') };
  if (by.x > 0 || by.y > 0) {
    const move = (/** @type {{x:number,y:number}} */ p) => {
      p.x += by.x;
      p.y += by.y;
    };
    all.forEach(move);
    lines.flat().forEach(move);
    said.forEach(move);
    for (const f of frames) {
      move(f);
      move(f.name);
    }
    for (const g of grids) {
      move(g);
      for (const r of g.rows) r.y += by.y;
    }
  }

  const width = Math.ceil(Math.max(0, ...all.map((n) => n.x + n.w / 2), ...frames.map((f) => f.x + f.w), ...lines.flat().map((p) => p.x), ...said.map((l) => l.x + l.w / 2)) + measure.pad);
  const height = Math.ceil(Math.max(0, ...all.map((n) => n.y + n.h / 2), ...frames.map((f) => f.y + f.h), ...lines.flat().map((p) => p.y), ...said.map((l) => l.y + l.h / 2)) + measure.pad);
  return { width, height, direction: 'TD', reversed: false, box: { w: whole.colW, h: band }, nodes, edges, groups: frames, spine: [], warnings, grids };
}
