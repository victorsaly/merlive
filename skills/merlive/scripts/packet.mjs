// Why: a packet is rows of bits, and what it says is which bits each field takes: a field of sixteen bits is
// twice as wide as one of eight, and the row is cut where its author's count of bits a row says. That is a grid
// its author placed, so a packet is read into the boxes a flowchart has (a field is a box, with its bits said
// over its name) and into the cells of a grid (grid.mjs), a field spanning as many columns as it has bits. A
// column is the largest count of bits that every field is a whole number of, so a packet of bytes is drawn in
// columns of a byte and not in thirty-two of a bit. Nothing is placed by rule and nothing is guessed: bits that
// are in no field are left empty and said, and a field Mermaid would not draw is said and not drawn. Pure.

import { measure } from './layout.mjs';

/** @typedef {import('./parse.mjs').Model} Model */
/** @typedef {import('./parse.mjs').Node} Node */
/** @typedef {import('./block.mjs').Cell} Cell */
/**
 * @typedef {object} Tools what parse.mjs lends
 * @property {Model} model
 * @property {(id:string) => Node} node the box of this id, made if it is not there
 * @property {(line:number, what:string) => void} warn
 * @property {string[]} settings what Mermaid was told of itself: the lines of front matter, and of "%%{init: …}%%"
 */

// What is measured, named once.
export const packetMeasure = {
  bitsPerRow: 32, // the bits Mermaid puts in a row when it is told nothing
  row: 512, // px a row is wide at the least: 16px a bit at 32 bits a row, half of what Mermaid gives, so a field of a byte holds a word on one line
  column: 24, // px a column is wide at the least, however many there are: narrower, and a field of one could not be picked
  gap: 16, // px between two fields, and two rows: the least room the rules let two boxes have (P2). Mermaid's fields all but touch; nothing runs between these either
};

const READ = {
  title: /^title(?:\s+(.*?))?\s*$/,
  // 0-15: "Name", 106: "Name" or +16: "Name". The name is in quotes, double or single, and is taken as written:
  // all but the quote mark it is in, which would end it.
  field: /^(?:(\d+)(?:\s*-\s*(\d+))?|\+\s*(\d+))\s*:\s*(["'])((?:(?!\4).)*)\4\s*(?:%%.*)?$/,
  // The same with its name not in quotes, or in quotes and not read: neither is a field to Mermaid.
  bare: /^(?:\d+(?:\s*-\s*\d+)?|\+\s*\d+)\s*:\s*(["'])?/,
  styling: /^(classDef|class|style|linkStyle)(\s|$)/,
  bitsPerRow: /\bbitsPerRow["']?\s*:\s*["']?(\d+)/,
  showBits: /\bshowBits["']?\s*:\s*["']?(true|false)/,
};

const gcd = (/** @type {number} */ a, /** @type {number} */ b) => {
  while (b) [a, b] = [b, a % b];
  return a;
};
/** The bits of a field as a reader says them: "106", or "0–15". */
const bits = (/** @type {number} */ from, /** @type {number} */ to) => (from === to ? `${from}` : `${from}–${to}`);

/**
 * @param {Tools} tools
 * @returns {{read:(text:string, line:number) => boolean, done:() => void}}
 */
export function packetReader({ model, node, warn, settings }) {
  /**
   * What was written, in the order of its bits: a field, or bits no field has.
   * @type {{from:number,to:number,name:string|null,line:number}[]}
   */
  const written = [];
  // The first bit no field has yet: where the next one starts.
  let next = 0;

  const read = (/** @type {string} */ text, /** @type {number} */ line) => {
    const title = READ.title.exec(text);
    if (title) {
      // As Mermaid has it: the last one written, quotes and all.
      if (title[1]) model.title = model.heading = title[1];
      return true;
    }
    const field = READ.field.exec(text);
    if (!field) {
      const why = READ.styling.test(text)
        ? ': a packet has no classes or styles of its own; its fields are drawn in the design\'s colours'
        : text.includes(';')
          ? ': write each field on a line of its own, with no ";"'
          : READ.bare.test(text)
            ? READ.bare.exec(text)?.[1]
              ? ': a name ends at the first quote mark like the one it starts with; use the other kind inside it, as in \'Say "hi"\''
              : ': put the name of a field in quotes, as in 0-15: "Source port"'
            : '';
      warn(line, `not read: "${text}"${why}`);
      return true;
    }
    const name = field[5], length = field[3] === undefined ? null : Number(field[3]);
    const from = length === null ? Number(field[1]) : next, to = length === null ? Number(field[2] ?? field[1]) : next + length - 1;
    const as = text.replace(/\s*%%.*$/, '');
    if (length === 0) return warn(line, `not read: "${as}": a field takes one bit at the least; write +1, or leave the line out`), true;
    if (to < from) return warn(line, `not read: "${as}": a field ends at or after the bit it starts at; write it as ${to}-${from}`), true;
    if (from < next) {
      const taken = written.find((w) => w.name !== null && w.from <= from && from <= w.to);
      warn(line, `not read: "${as}": bit ${from} is already in ${taken ? `"${taken.name}"` : 'a field'}, and a field starts where the last one ended; start it at bit ${next}`);
      return true;
    }
    if (from > next) {
      // Mermaid draws no packet at all with a gap in it. Here the bits are left empty, where they are.
      warn(line, `${next === from - 1 ? `bit ${next} is` : `bits ${next} to ${from - 1} are`} in no field, and Mermaid draws no packet with bits left out: start "${name}" at bit ${next}, or give the bits before it a field of their own (${bits(next, from - 1).replace('–', '-')}: "Reserved")`);
      written.push({ from: next, to: from - 1, name: null, line });
    }
    written.push({ from, to, name, line });
    next = to + 1;
    return true;
  };

  const done = () => {
    const told = settings.join('\n');
    const perRow = Math.max(1, Number(READ.bitsPerRow.exec(told)?.[1] ?? packetMeasure.bitsPerRow));
    const showBits = READ.showBits.exec(told)?.[1] !== 'false';
    if (!written.some((w) => w.name !== null)) return void warn(1, 'a packet with no fields has nothing to draw; write one, as in 0-15: "Source port"');

    // A column is as many bits as every field, and a row, is a whole number of: the most that still lets each
    // field be as wide as its bits.
    const unit = written.reduce((u, w) => gcd(gcd(u, w.from), w.to + 1), perRow);
    /** @type {Cell[]} */
    const cells = [];
    /** @type {string[]} */
    const said = [];
    for (const w of written) {
      // A field that runs past the end of a row is drawn again on the next, as Mermaid draws it: the same
      // name, each part with the bits it has there.
      /** @type {{from:number,to:number}[]} */
      const parts = [];
      for (let from = w.from; from <= w.to; from = parts[parts.length - 1].to + 1) parts.push({ from, to: Math.min(w.to, (Math.floor(from / perRow) + 1) * perRow - 1) });
      parts.forEach((part, i) => {
        const span = (part.to - part.from + 1) / unit;
        if (w.name === null) return void cells.push({ is: 'space', span, line: w.line });
        const n = node(`bits${part.from}`);
        n.label = w.name;
        if (showBits) {
          n.over = bits(part.from, part.to);
          said.push(n.over);
        }
        // What a picked part says of itself, unless its author has said something of it.
        if (parts.length > 1) model.notes[n.id] ??= `Part ${i + 1} of ${parts.length} of one field, bits ${w.from} to ${w.to}: it runs past the end of a row of ${perRow} bits.`;
        cells.push({ is: 'block', id: n.id, span, line: w.line });
      });
    }

    const columns = perRow / unit;
    // A column is no narrower than gives a row its least width. And, for now, no narrower than the longest line
    // of bits: the check that the line over a name fits (P6) measures a column, not the field the line is over.
    const forRow = Math.ceil((packetMeasure.row - (columns - 1) * packetMeasure.gap) / columns);
    const forBits = Math.ceil(Math.max(0, ...said.map((s) => s.length)) * measure.overGlyph + 2 * measure.overIn);
    model.grid = /** @type {Model['grid']} */ ({ columns, cells, least: Math.max(packetMeasure.column, forRow, forBits), gap: packetMeasure.gap });
    model.placedBy = 'grid';
    model.placedWhy = `a packet is rows of ${perRow} bits, and each field is as wide as the bits it takes`;
  };

  return { read, done };
}
