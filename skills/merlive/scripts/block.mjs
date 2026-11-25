// Why: a block diagram is boxes and links, with one difference from every other kind Merlive reads: its author
// places the boxes. "columns 3" makes a grid, blocks fill it in the order written, "a:2" spans two columns and
// "space" holds a cell open. Merlive places boxes by rule and keeps no grid. So this reader does two things.
// It reads every line into the model a flowchart gives (a block is a box, a block that holds others is a group,
// a link is a link), with the tools parse.mjs lends it. And it says whether the grid meant anything: where
// every block is joined by a link and the grid is no more than the order they come in, the diagram is a flow
// and is placed as one; where a block spans columns, a space places a block, an arrow is drawn as a block, or a
// block is joined to nothing, the placement is the author's own, and the diagram is marked to be placed on its
// grid (grid.mjs), cell by cell as it was written. What was written, cell by cell, is kept either way. Pure.

/** @typedef {import('./parse.mjs').Model} Model */
/** @typedef {import('./parse.mjs').Node} Node */
/** @typedef {import('./parse.mjs').Edge} Edge */
/** @typedef {import('./parse.mjs').Mark} Mark */
/** @typedef {import('./shapes.mjs').Shape} Shape */
/**
 * @typedef {object} Tools what parse.mjs lends, so a block is made exactly as a flowchart's box is
 * @property {Model} model
 * @property {(id:string) => Node} node the box of this id, made if it is not there, and put in the group that is open
 * @property {(n:Node, words:string) => void} say gives a box its words
 * @property {(a:Node, b:Node, l:Pick<Edge,'label'|'style'|'head'|'tail'>, line:number) => unknown} connect
 * @property {(id:string, title:string, line:number) => void} frame opens a group
 * @property {() => void} unframe closes the group opened last
 * @property {(ids:string[], css:string) => void} outline keeps what a style says of these boxes, as parse.mjs does for a flowchart's
 * @property {(line:number, what:string) => void} warn
 * @property {(text:string) => string[]} wordsOf
 */
/**
 * What its author wrote, cell by cell, in the order written: the grid a block diagram is placed on. A cell is a
 * block, a space, a block arrow, or a block that holds a grid of its own; each takes `span` columns.
 * @typedef {{columns:number|'auto',cells:Cell[]}} Grid
 * @typedef {{is:'block',id:string,span:number,line:number}|{is:'space',span:number,line:number}|{is:'arrow',id:string,span:number,line:number,points:string[]}|{is:'group',id:string,span:number,line:number,grid:Grid}} Cell
 */

// The shapes Mermaid gives a block, as what opens and closes each and the shape a flowchart draws for it.
// Longest opener first, so "([" is not read as "(". A side that leans closes either way, and which way says
// which shape it is. A round-cornered block is a box, and a circle is a pill, as they are in a flowchart.
/** @type {[string, string, Shape][]} */
const SHAPES = [
  ['(((', ')))', 'double-circle'],
  ['((', '))', 'pill'],
  ['([', '])', 'pill'],
  ['[(', ')]', 'cylinder'],
  ['[[', ']]', 'subroutine'],
  ['[/', '/]', 'lean-right'],
  ['[/', '\\]', 'trapezoid'],
  ['[\\', '\\]', 'lean-left'],
  ['[\\', '/]', 'trapezoid-alt'],
  ['{{', '}}', 'hexagon'],
  ['{', '}', 'diamond'],
  ['>', ']', 'flag'],
  ['[', ']', 'box'],
  ['(', ')', 'box'],
];
const escaped = (/** @type {string} */ s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
/** Each shape as what reads it: its opener, its words in quotes, its closer. */
const SHAPED = SHAPES.map(([open, close, shape]) => /** @type {[RegExp, Shape]} */ ([new RegExp(`^${escaped(open)}\\s*"([^"]*)"\\s*${escaped(close)}`), shape]));

/** The ways a block arrow can point: x is both ways across, y both ways up and down. */
export const arrowWays = ['right', 'left', 'up', 'down', 'x', 'y'];

const READ = {
  id: /^\w+/,
  // id<["words"]>(right): an arrow drawn as a block, pointing one way or several.
  arrow: /^<\[\s*"([^"]*)"\s*\]>\s*\(([^)]*)\)/,
  span: /^:(\d+)/,
  // Something in brackets that is not a shape with its words in quotes: up to where the brackets close.
  bracketed: /^(?:<\[|[[({>])[^\])}\s]*(?:\s+[^\])}\s]+)*[\])}]+>?(?:\([^)]*\))?/,
  // A link with nothing written into it: two or more of its strokes, and what it ends in.
  link: /^(<)?(-{2,}[-xo>]|={2,}[=xo>]|-\.+-[xo>]?)/,
  // A link with words written into it, which Mermaid wants in quotes.
  worded: /^(<)?(--|==|-\.)\s*"([^"]*)"\s*(-{2,}[-xo>]|={2,}[=xo>]|\.+-[xo>]?)/,
  unworded: /^<?(--|==|-\.)(?=\s)/,
  columns: /^columns(?=\s|$)(?:\s+(\S+))?/,
  space: /^space(?::(\d+))?(?=\s|$)/,
  holds: /^block(?=[:\s]|$)(?::(\w+))?/,
  end: /^end(?=\s|$)/,
  style: /^style\s+(\w+)\s+(\S.*)$/,
  kinds: /^class\s+(\w+(?:\s*,\s*\w+)*)\s+([\w-]+);?$/,
  classDef: /^classDef\s+[\w,]+\s+\S/,
};
/** @type {Record<string, Mark>} */
const ENDS = { '>': 'arrow', o: 'circle', x: 'cross' };
/** @type {Record<string, 'solid'|'thick'|'dotted'>} */
const STROKES = { '-': 'solid', '=': 'thick', '.': 'dotted' };

// What is measured, named once.
const limits = {
  reasons: 3, // how many reasons a diagram is left as Mermaid are spelt out: enough to act on, in one sentence
  named: 3, // how many blocks joined to nothing are named before the rest are counted
};

/**
 * The reader for one block diagram. `read` takes each line parse.mjs does not read itself and says whether it
 * was the reader's; `done` finishes what can only be known once every line has been read.
 * @param {Tools} tools
 */
export function blockReader({ model, node, say, connect, frame, unframe, outline, warn, wordsOf }) {
  /** @type {Grid} */
  const grid = { columns: 'auto', cells: [] };
  /** The blocks that hold others and are open at this line, the innermost last, each with the grid being filled. */
  /** @type {{id:string,line:number,grid:Grid}[]} */
  const open = [];
  const filling = () => open[open.length - 1]?.grid ?? grid;
  /** Every cell that is a block or a block arrow, by its id: one is made the first time a block is named. */
  /** @type {Map<string, Extract<Cell, {id:string}>>} */
  const cellOf = new Map();
  /** The ids of the blocks that hold others. */
  /** @type {Set<string>} */
  const holding = new Set();
  /** Each link as it was written, from one id to another: what says which blocks are joined. */
  /** @type {[string, string][]} */
  const written = [];
  /** Why the placement is the author's own, each with the line it was read on, in the order they were read. */
  /** @type {{line:number,why:string}[]} */
  const placed = [];
  /** Classes given by a "class" line, kept until every block is known: one may be named before it is declared. */
  /** @type {[string[], string][]} */
  const classed = [];
  let unnamed = 0;

  const called = (/** @type {string} */ id) => model.nodes.find((n) => n.id === id)?.label || id;

  /**
   * One block as it is written at the start of `s`: its id, then perhaps its shape with its words, then perhaps
   * how many columns it spans. Null when no block is written there.
   */
  const blockAt = (/** @type {string} */ s, /** @type {number} */ line) => {
    const id = READ.id.exec(s)?.[0];
    if (!id) return null;
    let at = id.length;
    /** @type {{id:string,length:number,words?:string,shape?:Shape,points?:string[],span:number}} */
    const b = { id, length: 0, span: 1 };
    // Words may stand a space apart from their block: a ["Label"].
    const gap = /^\s*/.exec(s.slice(at))?.[0].length ?? 0, after = s.slice(at + gap);
    const arrow = READ.arrow.exec(after), shaped = SHAPED.map(([reads, shape]) => /** @type {const} */ ([reads.exec(after), shape])).find(([m]) => m);
    if (arrow) {
      const ways = arrow[2].split(',').map((w) => w.trim()).filter(Boolean);
      if (!ways.length || ways.some((w) => !arrowWays.includes(w))) warn(line, `not read: "(${arrow[2]})": a block arrow points right, left, up, down, x (both ways across) or y (both ways up and down)`);
      Object.assign(b, { words: arrow[1], points: ways.filter((w) => arrowWays.includes(w)) });
      at += gap + arrow[0].length;
    } else if (shaped?.[0]) {
      Object.assign(b, { words: shaped[0][1], shape: shaped[1] });
      at += gap + shaped[0][0].length;
    } else {
      // Brackets that touch the id and hold no words in quotes are words Mermaid does not draw.
      const odd = READ.bracketed.exec(s.slice(at));
      if (odd) {
        warn(line, `not read: "${odd[0]}": the words of a block go in quotes, as in ${id}["${odd[0].replace(/^[^\w]+|[^\w]+$/g, '')}"]`);
        at += odd[0].length;
      }
    }
    const span = READ.span.exec(s.slice(at));
    if (span) {
      b.span = Math.max(1, Number(span[1]));
      at += span[0].length;
    }
    b.length = at;
    return b;
  };

  /**
   * The shape of a block arrow, from the ways it points. Merlive draws an arrow along one line: across (right,
   * left, or both) or up and down. One that points along both is drawn along the first, and said.
   */
  const arrowShape = (/** @type {string[]} */ ways, /** @type {string} */ name, /** @type {number} */ line) => {
    const flat = ways.filter((w) => w === 'right' || w === 'left' || w === 'x'), upright = ways.filter((w) => w === 'up' || w === 'down' || w === 'y');
    const along = flat.length ? flat : upright, [first, last, both] = flat.length ? ['left', 'right', 'x'] : ['up', 'down', 'y'];
    const two = along.includes(both) || (along.includes(first) && along.includes(last));
    const shape = /** @type {Shape} */ (`arrow-${two ? both : along[0]}`);
    if (flat.length && upright.length) warn(line, `the block arrow "${name}" points ${ways.join(' and ')}, and is drawn pointing ${two ? 'both ways across' : along[0]}: Merlive draws an arrow along one line`);
    return shape;
  };

  /** Makes the box of a block that was read, gives it what was written of it, and keeps its cell. */
  const declare = (/** @type {NonNullable<ReturnType<typeof blockAt>>} */ b, /** @type {number} */ line) => {
    const n = node(b.id);
    // A link may go to a block that holds others: that is a group, and takes no cell of its own.
    if (holding.has(b.id)) return n;
    let cell = cellOf.get(b.id);
    if (!cell) {
      cell = b.points ? { is: 'arrow', id: b.id, span: b.span, line, points: b.points } : { is: 'block', id: b.id, span: b.span, line };
      cellOf.set(b.id, cell);
      filling().cells.push(cell);
    }
    // Mermaid draws a block's words as a page would, so a space may be written "&nbsp;": read as its own "#nbsp;" is.
    const words = b.words?.replace(/&#?(\w+);/g, '#$1;');
    if (words !== undefined && wordsOf(words).length) say(n, words);
    // An arrow with no words is an arrow and nothing else: it does not take its id for a name, as a box would.
    else if (b.points && words !== undefined) n.label = '';
    if (b.points?.length) n.shape = arrowShape(b.points, n.label || b.id, line);
    if (b.shape) {
      n.shape = b.shape;
      // A cylinder is a store of data, as it is in a flowchart.
      if (b.shape === 'cylinder' && !n.kind) n.kind = 'data';
    }
    if (b.span > 1) {
      cell.span = b.span;
      placed.push({ line, why: `"${n.label || n.id}" spans ${b.span} columns (line ${line})` });
    }
    if (b.points) placed.push({ line, why: `"${n.label || n.id}" is a block arrow (line ${line})` });
    return n;
  };

  /** A link as it is written at the start of `s`, or what is wrong with it. Null when no link is written there. */
  const linkAt = (/** @type {string} */ s) => {
    const worded = READ.worded.exec(s), plain = worded ? null : READ.link.exec(s);
    const m = worded ?? plain;
    if (!m) return READ.unworded.test(s) ? { unquoted: true } : null;
    const stroke = worded ? worded[4] : m[2], last = stroke[stroke.length - 1];
    return {
      length: m[0].length,
      text: m[0].trim(),
      link: { label: worded ? wordsOf(worded[3]).join(' ') : '', style: STROKES[m[2].includes('.') ? '.' : m[2][0]], head: ENDS[last] ?? /** @type {Mark} */ ('none'), tail: /** @type {Mark} */ (m[1] ? 'arrow' : 'none') },
    };
  };

  /** Reads the blocks, spaces and links of one line, which may hold several. */
  const statements = (/** @type {string} */ text, /** @type {number} */ line) => {
    let p = 0;
    const skip = () => void (p += /^\s*/.exec(text.slice(p))?.[0].length ?? 0);
    for (skip(); p < text.length; skip()) {
      const s = text.slice(p);
      if (s.startsWith('%%')) return warn(line, `not read: "${s}": Mermaid draws a comment after blocks as more blocks; put it on a line of its own`);

      const columns = READ.columns.exec(s);
      if (columns) {
        if (columns[1] === 'auto' || /^\d+$/.test(columns[1] ?? '')) filling().columns = columns[1] === 'auto' ? 'auto' : Math.max(1, Number(columns[1]));
        else warn(line, `not read: "${columns[0]}": write how many columns as a number, or "columns auto"`);
        p += columns[0].length;
        continue;
      }
      const space = READ.space.exec(s);
      if (space) {
        filling().cells.push({ is: 'space', span: Math.max(1, Number(space[1] ?? 1)), line });
        p += space[0].length;
        continue;
      }
      if (READ.end.test(s)) {
        if (open.pop()) unframe();
        else warn(line, 'not read: an "end" with no block open');
        p += 3;
        continue;
      }
      const holds = READ.holds.exec(s);
      if (holds) {
        // "block", "block:id", "block:id["Its name"]", each perhaps with ":2" for the columns it spans.
        const as = holds[1] ? blockAt(`${holds[1]}${s.slice(holds[0].length)}`, line) : null;
        // One with no id is given one nobody could have written, so it is never taken for a block.
        const id = holds[1] ?? `block/${++unnamed}`, title = wordsOf(as?.words ?? '').join(' '), span = as?.span ?? 1;
        // A block named in a link before it was known to hold others was given a cell; it is a group, and has none.
        const early = cellOf.get(id);
        if (early) {
          cellOf.delete(id);
          for (const g of [grid, ...open.map((o) => o.grid)]) g.cells = g.cells.filter((c) => c !== early);
        }
        holding.add(id);
        /** @type {Grid} */
        const inner = { columns: 'auto', cells: [] };
        filling().cells.push({ is: 'group', id, span, line, grid: inner });
        if (span > 1) placed.push({ line, why: `"${title || id}" spans ${span} columns (line ${line})` });
        frame(id, title, line);
        open.push({ id, line, grid: inner });
        p += holds[0].length + (as ? as.length - as.id.length : 0);
        continue;
      }

      const first = blockAt(s, line);
      if (!first) {
        // Not a block, a space or a link's start after a block: said, and the rest of the line is still read.
        const link = linkAt(s), odd = link && 'length' in link ? link.text : /^\S+/.exec(s)?.[0] ?? s;
        warn(line, `not read: "${odd}"${/^\|.*\|$/.test(odd) ? ': the words of a link are written into it in quotes, as in a -- "words" --> b' : ''}`);
        p += link && 'length' in link ? link.length : odd.length;
        continue;
      }
      const from = p, a = declare(first, line);
      p += first.length;
      // A link may follow, to one more block. Mermaid reads no further than that: a chain is not a link.
      /** @type {[NonNullable<ReturnType<typeof linkAt>>['link'], Node][]} */
      const hops = [];
      for (;;) {
        skip();
        const link = linkAt(text.slice(p));
        if (!link) break;
        if (!('length' in link)) return warn(line, `not read: "${text.slice(p)}": the words of a link go in quotes, as in ${first.id} -- "words" --> b`);
        p += link.length;
        skip();
        const to = blockAt(text.slice(p), line);
        if (!to) {
          // Words between bars are said for what they are, where they are met; anything else leaves the link with nowhere to go.
          if (!text.slice(p).startsWith('|')) warn(line, `not read: "${link.text}": a link goes from one block to another, and none follows it`);
          break;
        }
        hops.push([link.link, declare(to, line)]);
        written.push([hops.length > 1 ? hops[hops.length - 2][1].id : first.id, to.id]);
        p += to.length;
      }
      if (hops.length === 1) connect(a, hops[0][1], hops[0][0], line);
      else if (hops.length > 1) {
        // Mermaid draws no link of a chain at all, so none is drawn here, and none of it counts as joining.
        written.splice(written.length - hops.length, hops.length);
        warn(line, `not read: "${text.slice(from, p).trim()}": a link joins two blocks; write each link on a line of its own`);
      }
    }
  };

  const read = (/** @type {string} */ text, /** @type {number} */ line) => {
    // What a class looks like is read by parse.mjs, as it is for every kind of diagram.
    if (/^classDef\b/.test(text)) return READ.classDef.test(text) ? false : (warn(line, `not read: "${text}"`), true);
    if (/^style(\s|$)/.test(text)) {
      const style = READ.style.exec(text);
      if (style) outline([style[1]], style[2]);
      else warn(line, `not read: "${text}"${/^style\s+\w+,/.test(text) ? ': a style is for one block; write a line for each' : ''}`);
      return true;
    }
    if (/^class(\s|$)/.test(text)) {
      const kinds = READ.kinds.exec(text);
      if (kinds) classed.push([kinds[1].split(',').map((x) => x.trim()), kinds[2]]);
      else warn(line, `not read: "${text}": write the blocks, then the class, as in class a,b urgent`);
      return true;
    }
    statements(text, line);
    return true;
  };

  /** Every id a cell stands for: its own, and for a block that holds others every block inside it. */
  const within = (/** @type {Cell} */ c) => (c.is === 'space' ? [] : c.is === 'group' ? [c.id, ...(model.groups.find((g) => g.id === c.id)?.members ?? [])] : [c.id]);
  const joined = (/** @type {Cell} */ a, /** @type {Cell} */ b) => {
    const one = within(a), other = within(b);
    return written.some(([from, to]) => (one.includes(from) && other.includes(to)) || (one.includes(to) && other.includes(from)));
  };
  /**
   * The spaces of a grid that place a block. A space between two blocks that a link joins only makes room for
   * the link, which is how Mermaid's own guide says to draw one; any other holds a cell open so that a block
   * comes where its author wanted it.
   */
  const placing = (/** @type {Grid} */ g) => {
    g.cells.forEach((c, i) => {
      if (c.is === 'group') placing(c.grid);
      if (c.is !== 'space') return;
      const before = g.cells.slice(0, i).reverse().find((x) => x.is !== 'space'), after = g.cells.slice(i + 1).find((x) => x.is !== 'space');
      if (!before || !after || !joined(before, after)) placed.push({ line: c.line, why: `the space on line ${c.line} places a block, and does not make room for a link` });
    });
  };

  const done = () => {
    for (const left of open) warn(left.line, `the block ${left.id} is never closed; end it with a line of "end"`);
    for (const [ids, kind] of classed) for (const id of ids) if (cellOf.has(id)) node(id).kind = kind;
    model.grid = grid;
    // Along one row, the blocks were written left to right; over more than one, the rows run down the page.
    const across = grid.cells.reduce((sum, c) => sum + c.span, 0);
    if (grid.columns === 'auto' || across <= grid.columns) model.direction = 'LR';

    placing(grid);
    const ends = new Set(written.flat());
    const alone = [...cellOf.values()].filter((c) => c.is === 'block' && !ends.has(c.id));
    if (alone.length) {
      const names = alone.slice(0, limits.named).map((c) => `"${called(c.id)}"`).join(', '), more = alone.length - limits.named;
      placed.push({ line: alone[0].line, why: `${names}${more > 0 ? ` and ${more} more` : ''} ${alone.length === 1 ? 'is' : 'are'} joined to nothing by a link` });
    }
    if (!placed.length) return;
    // Two spaces on one line are one thing to put right.
    const reasons = placed.filter((r, i) => placed.findIndex((x) => x.why === r.why) === i);
    const said = reasons.slice(0, limits.reasons).map((r) => r.why), more = reasons.length - said.length;
    // Its meaning is in its grid, so it is placed on its grid (grid.mjs) and not by rule. Nothing is wrong with
    // it, so nothing is said against it: why is kept for whoever asks.
    model.placedBy = 'grid';
    model.placedWhy = [...said, ...(more > 0 ? [`and ${more} more`] : [])].join('; ');
  };

  return { read, done };
}
