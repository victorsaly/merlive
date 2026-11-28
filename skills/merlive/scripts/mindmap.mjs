// Why: a mindmap is boxes and links: a tree. Each line is a box, and how far in from the margin it is written
// says which box it is under. So it is not given a drawing of its own. Its lines are read here into the model a
// flowchart gives: a box for each line, and a link with nothing at either end from each box to the one it is
// under. Mermaid draws the tree round its root; Merlive places it by the rules it has, from the root to the
// right. parse.mjs reads what every kind shares (front matter, comments, Merlive's own lines) and hands the rest
// of each line to this reader, with the tools to make a box and a link. Pure.

import { iconFor } from './icons.mjs';

/** @typedef {import('./parse.mjs').Model} Model */
/** @typedef {import('./parse.mjs').Node} Node */
/** @typedef {import('./parse.mjs').Edge} Edge */
/**
 * @typedef {object} Tools what parse.mjs lends, so a mindmap's box is made exactly as a flowchart's is
 * @property {Model} model
 * @property {(id:string) => Node} node the box of this id, made if it is not there
 * @property {(n:Node, words:string) => void} say gives a box its words
 * @property {(a:Node, b:Node, l:Pick<Edge,'label'|'style'|'head'|'tail'>, line:number) => unknown} connect
 * @property {(line:number, what:string) => void} warn
 * @property {(text:string) => string[]} wordsOf
 * @property {(line:number) => number} indent how far in from the margin a line was written: what a tree is told by
 */

/**
 * What each of Mermaid's shapes for a mindmap is drawn as: the nearest shape Merlive has, with a heavy or a
 * dashed outline where two would otherwise be drawn alike, and what is said, once, of one with no drawing of
 * its own here.
 * @type {Record<string, {shape:Node['shape'], heavy?:true, dashed?:true, said?:string}>}
 */
export const drawnAs = {
  default: { shape: 'box' },
  square: { shape: 'box' },
  rounded: { shape: 'box' },
  circle: { shape: 'pill' },
  hexagon: { shape: 'hexagon' },
  bang: { shape: 'box', heavy: true, said: 'a bang (written "))words((") has no drawing of its own in Merlive: each is drawn as a box with a heavy outline' },
  cloud: { shape: 'pill', dashed: true, said: 'a cloud (written ")words(") has no drawing of its own in Merlive: each is drawn as a round-ended box with a dashed outline' },
};

// How each shape is written round its words: what opens it, what closes it. The longer are tried first, since
// "((" opens a circle and "(" a rounded box.
const WRITTEN = /** @type {const} */ ([
  ['((', '))', 'circle'],
  ['))', '((', 'bang'],
  ['{{', '}}', 'hexagon'],
  ['(', ')', 'rounded'],
  [')', '(', 'cloud'],
  ['[', ']', 'square'],
]);

const READ = {
  // Mermaid ends an id at the first of these, and takes what follows for the shape round the words.
  bracket: /[()[{}]/,
  icon: /^::icon\(\s*([^)]*?)\s*\)$/,
  classes: /^:::\s*(\S.*)$/,
};

/** Words as they were written inside a shape: out of their quotes, and out of a Markdown string's own marks. */
const unwrapped = (/** @type {string} */ written) => written.trim().replace(/^"([^]*)"$/, '$1').replace(/^`([^]*)`$/, '$1').trim();

/**
 * The reader for one mindmap. `read` takes each line parse.mjs does not read itself (every one is the
 * reader's: a mindmap has no line that is not a box, an icon or a class); `done` finishes what can only be
 * known once every line has been read.
 * @param {Tools} tools
 */
export function mindmapReader({ model, node, say, connect, warn, wordsOf, indent }) {
  // A tree reads from its root outwards. Placed top to bottom it would be as wide as all its leaves side by side.
  model.direction = 'LR';
  /** The ids given so far: every line is a box of its own, even one with the words of another. */
  /** @type {Set<string>} */
  const taken = new Set();
  /** The boxes a line may still be under: the root, then each box further in than the one before it. */
  /** @type {{n:Node,inward:number}[]} */
  const above = [];
  /** @type {Node|null} */
  let root = null;
  /** The box the last line made: an icon or a class on the next line is its. */
  /** @type {Node|null} */
  let last = null;
  /** What has been said once and is not said again: a shape with no drawing of its own, an icon with none. */
  /** @type {Set<string>} */
  const told = new Set();
  /** The line each square and each rounded box was first written on: drawn alike, which is said when there are both. */
  /** @type {{square?:number, rounded?:number}} */
  const alike = {};

  const once = (/** @type {string} */ what, /** @type {number} */ line, /** @type {string} */ words) => {
    if (!told.has(what)) warn(line, words);
    told.add(what);
  };

  /** An id for a box: what was written where it can be, "_" for what an id cannot hold, and a number if that is taken. */
  const idFor = (/** @type {string} */ written) => {
    const plain = written.replace(/[^A-Za-z0-9_]/gu, '_');
    let id = plain;
    for (let n = 2; taken.has(id); n++) id = `${plain}_${n}`;
    taken.add(id);
    return id;
  };

  /** One line as the id, the shape and the words it was written with; nothing, said, for one that is not read. */
  const written = (/** @type {string} */ text, /** @type {number} */ line) => {
    const at = text.search(READ.bracket);
    if (at < 0) return { id: '', as: 'default', words: text };
    const id = text.slice(0, at).trim(), rest = text.slice(at), form = WRITTEN.find(([opens]) => rest.startsWith(opens));
    if (!form) return void warn(line, `not read: "${text}": a single "${rest[0]}" opens nothing in a mindmap; a hexagon is written a{{words}}, and words with a bracket in them go in quotes inside a shape: a["words (more)"]`);
    const [opens, closes, as] = form;
    if (!rest.endsWith(closes) || rest.length < opens.length + closes.length) return void warn(line, `not read: "${text}": what "${opens}" opens is closed by "${closes}" at the end of the line`);
    return { id, as, words: unwrapped(rest.slice(opens.length, rest.length - closes.length)) };
  };

  const read = (/** @type {string} */ text, /** @type {number} */ line) => {
    const icon = READ.icon.exec(text);
    if (icon) {
      if (!last) return warn(line, `not read: "${text}": an icon belongs to the box on the line above it, and nothing is above this one`), true;
      const drawing = iconFor(icon[1]);
      if (drawing) last.icon = drawing.name;
      else once(`icon ${icon[1]}`, line, `the icon "${icon[1]}" is not one Merlive has a drawing for; it is left out and its words kept`);
      return true;
    }
    const classes = READ.classes.exec(text);
    if (classes) {
      if (!last) return warn(line, `not read: "${text}": a class belongs to the box on the line above it, and nothing is above this one`), true;
      // A box is of one kind: where several classes are given, the first is the one it is.
      last.kind = classes[1].split(/\s+/)[0];
      return true;
    }

    const box = written(text, line);
    if (!box) return true;
    // Mermaid reads every label as Markdown, in a Markdown string or not. A box with no words takes its id.
    const words = `\`${box.words}\``, label = wordsOf(words).join(' ');
    const n = node(idFor(box.id || label || 'box'));
    if (label) say(n, words);
    const { shape, heavy, dashed, said } = drawnAs[box.as];
    Object.assign(n, { shape }, heavy ? { heavy } : {}, dashed ? { dashed } : {});
    if (said) once(box.as, line, said);
    if (box.as === 'square' || box.as === 'rounded') {
      alike[box.as] ??= line;
      if (alike.square && alike.rounded) once('alike', line, 'a square "[words]" and a rounded "(words)" are both drawn as the design\'s own box, whose corners are the design\'s: they are not told apart');
    }

    // A line is under the nearest line above it that is further left: Mermaid's own rule, however uneven the writing.
    const inward = indent(line);
    while (above.length && above[above.length - 1].inward >= inward) above.pop();
    const under = above[above.length - 1]?.n ?? root;
    if (under && !above.length) warn(line, `"${n.label}" is written as far left as the root "${under.label}", or further: a mindmap has one root, and Mermaid will not draw this one. It is drawn as a branch of the root; write it further in than the root`);
    if (under) connect(under, n, { label: '', style: 'solid', head: 'none', tail: 'none' }, line);
    else {
      root = n;
      // The root is where a reader starts, and is told apart as that unless its author gives it a class.
      n.kind = 'root';
    }
    above.push({ n, inward });
    last = n;
    return true;
  };

  const done = () => {
    // A wide flowchart is turned top to bottom to fit a screen. A tree is not, unless its author asks: turned,
    // every leaf would stand beside the last and it would be wider still.
    model.hints.turn ??= false;
  };

  return { read, done };
}
