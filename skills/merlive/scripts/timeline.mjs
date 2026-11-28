// Why: a timeline says one thing, an order: periods one after another, and under each what happened in it. Its
// author places every box by writing it: the periods side by side in the order they come, each event under its
// period, a section over the periods written after it. Placing that by rank would say something else (a rank
// is "what comes after what along a flow", and an event comes after nothing). So this reader does what the
// block reader does for a grid its author wrote: it reads every line into the model a flowchart gives (a period
// is a box, an event is a box, a section is a group, time running on is a link from one period to the next),
// and writes down the grid those boxes are on, cell by cell, for grid.mjs to place them on. Pure.

/** @typedef {import('./parse.mjs').Model} Model */
/** @typedef {import('./parse.mjs').Node} Node */
/** @typedef {import('./parse.mjs').Edge} Edge */
/** @typedef {import('./block.mjs').Grid} Grid */
/** @typedef {import('./block.mjs').Cell} Cell */
/**
 * @typedef {object} Tools what parse.mjs lends, so a period or an event is made exactly as a flowchart's box is
 * @property {Model} model
 * @property {(id:string) => Node} node the box of this id, made if it is not there, and put in the group that is open
 * @property {(n:Node, words:string) => void} say gives a box its words
 * @property {(a:Node, b:Node, l:Pick<Edge,'label'|'style'|'head'|'tail'>, line:number) => unknown} connect
 * @property {(id:string, title:string, line:number) => void} frame opens a group
 * @property {() => void} unframe closes the group opened last
 * @property {(line:number, what:string) => void} warn
 * @property {(text:string) => string[]} wordsOf
 * @property {{text:string,line:number}} [header] the line the diagram starts with: it says which way a timeline runs
 */
/** @typedef {{node:Node,line:number,events:Node[]}} Period */
/** @typedef {{id:string,title:string,line:number,periods:Period[]}} Section */

const READ = {
  // "timeline", then perhaps which way it runs. Mermaid knows two ways, and reads anything else as a period.
  header: /^timeline\b\s*(.*)$/,
  title: /^title\s+(\S.*)$/,
  section: /^section(?:\s+(.*))?$/,
  // A colon ends a period or an event when a space or the end of the line follows it: "10:30" is one word.
  colon: /:(?=\s|$)/,
  comment: /%%.*$/,
};

// Time runs from one period to the next: an arrow. An event hangs from its period, and each from the one above
// it, as Mermaid's own broken line runs down a period's events: a dotted line that points nowhere.
/** @type {Pick<Edge,'label'|'style'|'head'|'tail'>} */
const onward = { label: '', style: 'solid', head: 'arrow', tail: 'none' };
/** @type {Pick<Edge,'label'|'style'|'head'|'tail'>} */
const under = { label: '', style: 'dotted', head: 'none', tail: 'none' };

/**
 * The reader for one timeline. `read` takes each line parse.mjs does not read itself (every one is the
 * timeline's: whatever is not a title or a section is a period); `done` writes down the grid once every line
 * has been read.
 * @param {Tools} tools
 */
export function timelineReader({ model, node, say, connect, frame, unframe, warn, wordsOf, header }) {
  /** Every period in the order written, and the one events on the lines that follow belong to. */
  /** @type {Period[]} */
  const periods = [];
  /** Every section in the order written, each with its periods, and the periods written before the first. */
  /** @type {Section[]} */
  const sections = [];
  /** @type {Period[]} */
  const before = [];
  let down = false;

  const called = (/** @type {Period} */ p) => p.node.label;
  // A colon ends a period or an event, so Mermaid has a code for one that is only a colon: "#colon;". It is
  // handed on as the code for the character, which any label reads.
  const worded = (/** @type {string} */ words) => words.replace(/#colon;/g, '#58;');

  /** One event of a period: a box under it, hung from the period or from the event above. */
  const happened = (/** @type {Period} */ p, /** @type {string} */ words, /** @type {number} */ line) => {
    if (!wordsOf(worded(words)).join('')) return warn(line, `an event of "${called(p)}" has no words and is not drawn; take out the colon with nothing after it`);
    const n = node(`event${periods.indexOf(p) + 1}_${p.events.length + 1}`);
    say(n, worded(words));
    connect(p.events[p.events.length - 1] ?? p.node, n, under, line);
    p.events.push(n);
  };

  /** A line of a period and its events, or of more events for the period above. */
  const written = (/** @type {string} */ text, /** @type {number} */ line) => {
    const [first, ...rest] = text.split(READ.colon).map((part) => part.trim());
    // Mermaid has no comment after words: it draws one as more words. So is it drawn here, and said.
    const comment = READ.comment.exec(text);
    if (comment) warn(line, `"${comment[0].trim()}" is drawn as words, as Mermaid draws it: a comment goes on a line of its own`);
    let period = periods[periods.length - 1];
    if (first) {
      const n = node(`period${periods.length + 1}`);
      say(n, worded(first));
      // A period is told from an event by a heavier outline and its kind's mark at its side: an event is a
      // plain box. A colour of its own would be one the design does not have.
      Object.assign(n, { kind: 'period', heavy: true });
      if (period) connect(period.node, n, onward, line);
      period = { node: n, line, events: [] };
      periods.push(period);
      (sections[sections.length - 1]?.periods ?? before).push(period);
    } else if (!period) {
      return warn(line, `not read: "${text}": an event belongs to the period before it, and none has been written yet; write the period first, as in Monday : Raised`);
    }
    for (const words of rest) happened(period, words, line);
  };

  const read = (/** @type {string} */ text, /** @type {number} */ line) => {
    const title = READ.title.exec(text);
    if (title) {
      model.title = model.heading = wordsOf(title[1]).join(' ');
      return true;
    }
    const section = READ.section.exec(text);
    if (section) {
      if (sections.length) unframe();
      const made = { id: `section${sections.length + 1}`, title: wordsOf(section[1] ?? '').join(' '), line, periods: [] };
      sections.push(made);
      frame(made.id, made.title, line);
      return true;
    }
    written(text, line);
    return true;
  };

  // What follows "timeline" on its own line: which way it runs, or, as Mermaid reads it, a first period.
  const way = READ.header.exec(header?.text ?? '')?.[1].trim() ?? '';
  if (way === 'TD') down = true;
  else if (way && way !== 'LR') {
    const line = header?.line ?? 1;
    warn(line, `"${way}" after "timeline" is drawn as a period, as Mermaid draws it: a timeline runs LR (left to right) or TD (top to bottom), and anything else goes on a line of its own`);
    written(way, line);
  }

  /** @returns {Cell} */
  const block = (/** @type {Node} */ n, /** @type {number} */ line) => ({ is: 'block', id: n.id, span: 1, line });
  /** @returns {Cell} */
  const space = (/** @type {number} */ line) => ({ is: 'space', span: 1, line });

  /**
   * The grid a run of periods is on. Left to right: a column for each period, the periods along the top, and
   * under them a row for every first event, a row for every second, and so on, a cell left empty where a period
   * has no more. Top to bottom: two columns, each period at the left of a row with its first event beside it,
   * and its other events in the rows under that.
   * @returns {Grid}
   */
  const gridOf = (/** @type {Period[]} */ run) => {
    if (down) return { columns: 2, cells: run.flatMap((p) => [block(p.node, p.line), p.events[0] ? block(p.events[0], p.line) : space(p.line), ...p.events.slice(1).flatMap((e) => [space(p.line), block(e, p.line)])]) };
    const deepest = Math.max(0, ...run.map((p) => p.events.length));
    const rows = Array.from({ length: deepest }, (_, r) => run.map((p) => (p.events[r] ? block(p.events[r], p.line) : space(p.line))));
    return { columns: run.length, cells: [...run.map((p) => block(p.node, p.line)), ...rows.flat()] };
  };

  const done = () => {
    if (sections.length) unframe();
    for (const s of sections) if (!s.periods.length) warn(s.line, `the section "${s.title}" has no periods, so there is nothing to draw it round; write a period under it, or take it out`);
    model.direction = down ? 'TD' : 'LR';
    if (!periods.length) return;

    // With no sections, the periods are one grid. With sections, each is a block that holds a grid of its own,
    // as wide as its periods (or, top to bottom, one under another); periods written before the first section
    // are held the same way, by a block with no frame, so that they line up with the rest.
    const held = sections.filter((s) => s.periods.length);
    /** @type {{id:string,line:number,periods:Period[]}[]} */
    const runs = [...(before.length ? [{ id: 'before/sections', line: before[0].line, periods: before }] : []), ...held];
    model.grid = held.length
      ? { columns: down ? 1 : 'auto', cells: runs.map((run) => ({ is: 'group', id: run.id, span: down ? 1 : run.periods.length, line: run.line, grid: gridOf(run.periods) })) }
      : gridOf(periods);
    // Nothing is wrong with it, so nothing is said against it: why is kept for whoever asks.
    model.placedBy = 'grid';
    model.placedWhy = `a timeline is the order its periods were written in, ${down ? 'one under another, each with its events beside it' : 'side by side, each with its events under it'}`;
  };

  return { read, done };
}
