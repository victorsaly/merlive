// Why: a kanban board is columns side by side with cards down each, and where a card is says everything: which
// column it is in is the state its work is in, and how far down is its turn. There are no links. So a board is
// read into the model a flowchart gives (a column is a group, a card is a box, and what is set on a card is
// listed under its words), and it is marked to be placed on the grid its author wrote (grid.mjs): a column of
// the grid for each column of the board, and inside each a grid of one column, a row to a card. Placing it by
// rank would lay unjoined boxes in a line and say nothing of what a board says. What Mermaid tells a column
// from a card by is how far in a line is, so that is what this goes by. Pure.

/** @typedef {import('./parse.mjs').Model} Model */
/** @typedef {import('./parse.mjs').Node} Node */
/**
 * @typedef {object} Tools what parse.mjs lends, so a card is made exactly as a flowchart's box is
 * @property {Model} model
 * @property {(id:string) => Node} node the box of this id, made if it is not there, and put in the group that is open
 * @property {(n:Node, words:string) => void} say gives a box its words
 * @property {(id:string, title:string, line:number) => void} frame opens a group
 * @property {() => void} unframe closes the group opened last
 * @property {(line:number, what:string) => void} warn
 * @property {(text:string) => string[]} wordsOf
 * @property {(line:number) => number} indent how far in a line was written, which parse.mjs trims away
 */
/**
 * A board as the grid it is placed on (see `Grid` in block.mjs, which this is a kind of): a cell for each
 * column, each holding a grid of one column with a cell for each card. A column keeps its name here too, since
 * one with no cards is no group in the model and would have nowhere else to keep it. `close` says nothing runs
 * between the cells, so they need no room for a line.
 * @typedef {{is:'block',id:string,span:1,line:number}} CardCell
 * @typedef {{is:'group',id:string,span:1,line:number,title:string,grid:{columns:1,cells:CardCell[]}}} ColumnCell
 * @typedef {{columns:number,cells:ColumnCell[],close:true}} Board
 */

/** How pressing Mermaid lets a card be, as it is listed on the card: the four it draws a mark for. */
export const priorities = ['very high', 'high', 'low', 'very low'];

// The ways Mermaid lets the words of a column or a card be written, as what opens and closes each. The longest
// opener first, so "((" is not read as "(". A board draws every card as a card, so none of them is a shape.
/** @type {[string, string][]} */
const WRITTEN = [['((', '))'], ['))', '(('], ['{{', '}}'], ['[', ']'], ['(', ')'], [')', '(']];
const READ = {
  // An id, then what opens its words. An id is anything but the characters words are opened with.
  opens: /^([^[()]*?)\s*(\(\(|\)\)|\{\{|\[|\(|\))/,
  // One thing set between "@{" and "}": a name, a colon, a space, a value. With no space it is not one, to YAML or to Mermaid.
  set: /^([\w-]+)\s*:(?:\s+([^]*))?$/,
};
/** What a card keeps of what is set on it, in the order it is listed. Its label is its words. */
const KEPT = ['ticket', 'assigned', 'priority'];

/** Where the "@{ … }" that opens at `from` closes: the first } that is not inside quotes, or -1. */
const closeOf = (/** @type {string} */ s, /** @type {number} */ from) => {
  let quote = '';
  for (let i = from; i < s.length; i++) {
    if (quote) quote = s[i] === quote ? '' : quote;
    else if (s[i] === '"' || s[i] === "'") quote = s[i];
    else if (s[i] === '}') return i;
  }
  return -1;
};

/**
 * What is written between "@{" and "}": each "name: value", parted by commas or line ends outside quotes, and
 * each part that is not one, as it was written.
 */
const setIn = (/** @type {string} */ text) => {
  /** @type {[string, string][]} */
  const pairs = [];
  /** @type {string[]} */
  const odd = [];
  let part = '', quote = '';
  const keep = () => {
    const written = part.trim(), m = READ.set.exec(written);
    if (m) pairs.push([m[1], (m[2] ?? '').trim().replace(/^(["'])([^]*)\1$/, '$2')]);
    else if (written) odd.push(written);
    part = '';
  };
  for (const c of text) {
    if (quote) quote = c === quote ? '' : quote;
    else if (c === '"' || c === "'") quote = c;
    if ((c === ',' || c === '\n') && !quote) keep();
    else part += c;
  }
  keep();
  return { pairs, odd };
};

/**
 * The reader for one kanban board. `read` takes each line parse.mjs does not read itself; `done` finishes what
 * can only be known once every line has been read.
 * @param {Tools} tools
 */
export function kanbanReader({ model, node, say, frame, unframe, warn, wordsOf, indent }) {
  /** @type {Board} */
  const grid = { columns: 1, cells: [], close: true };
  /** How far in the first column was written: a line as far in is a column, one further in is a card. */
  let level = -1;
  /** The column whose cards are being read. */
  /** @type {ColumnCell|null} */
  let column = null;
  /** Words in quotes that a line opened and did not close, with the line they opened on: they go on down the lines. */
  /** @type {{text:string,line:number}|null} */
  let open = null;
  /** Every id given so far. Mermaid draws two cards written with one id as two cards, so each is given its own. */
  const taken = new Set();

  /** An id Merlive's own lines can name ("%% note t1: …"), made of what was written, and nobody else's. */
  const idFor = (/** @type {string} */ written) => {
    const plain = written.replace(/[^A-Za-z0-9_]/g, '_') || 'card';
    let id = plain;
    for (let n = 2; taken.has(id); n++) id = `${plain}_${n}`;
    taken.add(id);
    return id;
  };

  /**
   * One line as its parts: the id written, the words, what is set in "@{ … }", and what follows that is neither.
   * A line with no brackets is its own words, and its own id.
   */
  const parts = (/** @type {string} */ text) => {
    const at = text.indexOf('@{'), end = at < 0 ? -1 : closeOf(text, at + 2);
    const head = (end < 0 ? text : text.slice(0, at)).trim(), set = end < 0 ? null : text.slice(at + 2, end);
    let after = end < 0 ? '' : text.slice(end + 1).trim();
    /** @type {{id:string,words:string|null,set:string|null,after:string,as:string}} */
    const bare = { id: head, words: null, set, after, as: head };
    const opens = READ.opens.exec(head);
    if (!opens) return bare;
    const closer = /** @type {[string, string]} */ (WRITTEN.find(([o]) => o === opens[2]))[1], inside = head.slice(opens[0].length);
    // Words in quotes may hold anything, a bracket too: they end where the quotes do.
    const quoted = /^\s*"[^"]*"/.exec(inside)?.[0].length ?? 0, closes = inside.indexOf(closer, quoted);
    if (closes < 0) return bare;
    const rest = inside.slice(closes + closer.length).trim();
    if (rest) after = set === null ? rest : `${rest} @{ … } ${after}`.trim();
    return { id: opens[1].trim(), words: inside.slice(0, closes).trim(), set, after, as: head.slice(0, opens[0].length + closes + closer.length) };
  };

  const one = (/** @type {string} */ text, /** @type {number} */ line) => {
    const p = parts(text), words = p.words === null ? [] : wordsOf(p.words);
    const { pairs, odd } = setIn(p.set ?? ''), label = pairs.find(([k]) => k === 'label')?.[1];
    // Its words are what is in its brackets, or the label set on it; with neither, what was written for its id.
    const told = label ?? (words.length ? /** @type {string} */ (p.words) : p.id);
    const called = wordsOf(told).join(' ') || p.id;
    const far = indent(line);
    if (level < 0) level = far;
    const isColumn = far <= level, what = isColumn ? 'a column is its id and its words in brackets' : 'a card is its id, its words in brackets, and what is set on it in @{ … }';
    // Mermaid drops a comment after the brackets, and refuses anything else there.
    if (p.after && !p.after.startsWith('%%')) warn(line, `not read: "${p.after.replace(/\s*%%.*$/, '')}" after "${p.as}": ${what}`);
    const of = isColumn ? `the column "${called}"` : `"${called}"`;
    if (odd.length) warn(line, `not read: ${odd.map((o) => `"${o}"`).join(', ')} in what is set on ${of}: write each as a name, a colon, a space and its value, as in assigned: knsv`);
    const id = idFor(p.id || called);

    if (isColumn) {
      if (far < level) warn(line, `"${called}" is less far in than the first column, which Mermaid refuses; start every column as far in as the first`);
      const passed = pairs.filter(([k]) => k !== 'label').map(([k]) => `"${k}"`);
      if (passed.length) warn(line, `not read: ${passed.join(', ')} in what is set on ${of}: a column keeps only its label`);
      if (column) unframe();
      column = { is: 'group', id, span: 1, line, title: called, grid: { columns: 1, cells: [] } };
      grid.cells.push(column);
      frame(id, called, line);
      return;
    }

    const n = node(id);
    n.label = p.id || called;
    if (wordsOf(told).length) say(n, told);
    const kept = new Map(pairs.filter(([k, v]) => KEPT.includes(k) && v));
    const passed = pairs.filter(([k]) => k !== 'label' && !KEPT.includes(k)).map(([k]) => `"${k}"`);
    if (passed.length) warn(line, `not read: ${passed.join(', ')} in what is set on ${of}: a card keeps its label, ticket, assigned and priority`);
    const pressing = kept.get('priority');
    if (pressing !== undefined) {
      // Mermaid marks the four it knows with a colour down the card's side. Here it is said in words, which
      // print, need no legend, and are the same in any design.
      if (priorities.includes(pressing.toLowerCase())) kept.set('priority', pressing.toLowerCase());
      else warn(line, `the priority "${pressing}" of ${of} is not one Mermaid draws (Very High, High, Low, Very Low); it is kept as written`);
    }
    const rows = KEPT.filter((k) => kept.has(k)).map((k) => `${k}: ${kept.get(k)}`);
    // A ticket, a person and how pressing it is are said in words, not code: they keep the page's face.
    if (rows.length) Object.assign(n, { rows: [rows], facts: true });
    /** @type {ColumnCell} */ (column).grid.cells.push({ is: 'block', id, span: 1, line });
  };

  const read = (/** @type {string} */ text, /** @type {number} */ line) => {
    // Words in quotes may go on to the next line, which is a line its author broke.
    const whole = open ? { text: `${open.text}<br/>${text}`, line: open.line } : { text, line };
    if ((whole.text.split('"').length - 1) % 2) open = whole;
    else {
      open = null;
      one(whole.text, whole.line);
    }
    return true;
  };

  const done = () => {
    if (open) warn(open.line, `not read: words in quotes that are never closed, and everything after them: "${open.text.split('<br/>')[0]}"; close them with "]`);
    if (column) unframe();
    if (!grid.cells.length) return;
    grid.columns = grid.cells.length;
    model.grid = /** @type {any} */ (grid);
    model.placedBy = 'grid';
    model.placedWhy = 'a kanban board is its columns side by side and the cards of each down it';
  };

  return { read, done };
}
