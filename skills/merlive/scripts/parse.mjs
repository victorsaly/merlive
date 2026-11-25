// Why: Merlive reads a small, honest part of Mermaid's flowchart language and says what it left out, so a
// diagram is never drawn from a guess. Everything here is pure: text in, a model out.

import { iconFor } from './icons.mjs';
import { stateReader } from './state.mjs';
import { isSequence, parseSequence } from './sequence.mjs';

/** @typedef {import('./shapes.mjs').Shape} Shape */
/** @typedef {{id:string,label:string,shape:Shape,kind:string,breaks?:string[],dashed?:boolean,heavy?:boolean,icon?:string}} Node dashed, heavy: what its author's own style says of its outline; icon: the name of Merlive's drawing of the icon its author wrote */
/** @typedef {'none'|'arrow'|'circle'|'cross'} Mark what is drawn at an end of a link */
/** @typedef {{id:string,from:string,to:string,label:string,style:'solid'|'dotted'|'thick',head:Mark,tail:Mark,kind?:string}} Edge head: at the box it leads to; tail: at the box it comes from; kind: the colour its author gave it, by name */
/** @typedef {{title:string,text:string,path:string,seq:string[],loop:boolean}} Step */
/**
 * @typedef {object} Model
 * @property {'flowchart'|'unsupported'} type
 * @property {string} kindOfDiagram the first word of the source: which kind it is, and the message when it is one Merlive does not draw
 * @property {'TD'|'LR'} direction
 * @property {string} title what the author called the picture (accTitle), for a reader who cannot see it
 * @property {string} describes what the author says it shows (accDescr)
 * @property {Node[]} nodes
 * @property {Edge[]} edges
 * @property {Record<string,string>} notes
 * @property {Step[]} steps
 * @property {{main?:string[],side?:'left'|'right',turn?:boolean}} hints turn: false keeps a wide left-to-right flow as it was written
 * @property {Record<string,string>} classes the colour an author gave each class with classDef, to find what it means
 * @property {{id:string,title:string,members:string[],parent?:string}[]} groups the author's subgraphs, outer before inner: what each is called, every box in it, and the group it is inside
 * @property {string[]} warnings
 */

// Longest opener first, so "([" is not read as "(" and then "[". A shape that leans may close either way: it
// closes at whichever comes first, and which it is says which shape. The flag (">words]") opens with no bracket.
// "store" is not a shape: it is a plain box of the kind that holds data.
/** @typedef {Shape|'store'} Read */
/** @type {[string, [string, Read][]][]} */
const OPENERS = [
  ['(((', [[')))', 'double-circle']]],
  ['([', [['])', 'pill']]],
  ['((', [['))', 'pill']]],
  ['[(', [[')]', 'cylinder']]],
  ['[[', [[']]', 'subroutine']]],
  ['[/', [['/]', 'lean-right'], ['\\]', 'trapezoid']]],
  ['[\\', [['\\]', 'lean-left'], ['/]', 'trapezoid-alt']]],
  ['{{', [['}}', 'hexagon']]],
  ['>', [[']', 'flag']]],
  ['[', [[']', 'box']]],
  ['(', [[')', 'box']]],
  ['{', [['}', 'diamond']]],
];

// A link: solid, dotted or thick, drawn at any length, with an arrowhead, a circle, a cross or nothing at
// either end ("-->", "--o", "x--x", "<-->"), and its words after it between bars or written into it
// ("-- words -->", "-. words .->", "== words ==>"). Three tildes are a link that is not drawn.
// Each gives: what is at the near end, the words (quoted or not), the rest of the link, the words between bars.
const LINKS = /** @type {const} */ ([
  [/^\s*([<ox]?)--\s+(?:"([^"]*)"|([^"|]+?))\s*(-{2,}[>ox]|-{3,})/, 'solid'],
  [/^\s*([<ox]?)-\.\s+(?:"([^"]*)"|([^"|]+?))\s*(\.+-[>ox]?)/, 'dotted'],
  [/^\s*([<ox]?)==\s+(?:"([^"]*)"|([^"|]+?))\s*(={2,}[>ox]|={3,})/, 'thick'],
  [/^\s*([<ox]?)()()(-{2,}[>ox]|-{3,})\s*(?:\|([^|]*)\|)?/, 'solid'],
  [/^\s*([<ox]?)()()(-\.+-[>ox]?)\s*(?:\|([^|]*)\|)?/, 'dotted'],
  [/^\s*([<ox]?)()()(={2,}[>ox]|={3,})\s*(?:\|([^|]*)\|)?/, 'thick'],
  [/^\s*()()()(~{3,})/, 'hidden'],
]);
/** @type {Record<string, Mark>} */
const MARKS = { '<': 'arrow', '>': 'arrow', o: 'circle', x: 'cross' };

// The characters Mermaid's entity codes stand for ("#quot;", "#9829;"). A browser knows two thousand names;
// these are the ones a diagram's words use. A code not here is left as it was typed.
const NAMED = { quot: '"', amp: '&', lt: '<', gt: '>', apos: "'", nbsp: ' ', hearts: '♥', copy: '©', reg: '®', trade: '™', hellip: '…', mdash: '—', ndash: '–', larr: '←', rarr: '→', uarr: '↑', darr: '↓', harr: '↔', deg: '°', times: '×', divide: '÷', plusmn: '±', euro: '€', pound: '£', yen: '¥', cent: '¢', check: '✓', cross: '✗', bull: '•', middot: '·', laquo: '«', raquo: '»', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', micro: 'µ', para: '¶', sect: '§', infin: '∞', ne: '≠', le: '≤', ge: '≥' };

/**
 * The words of a label as a reader should see them, in the author's own lines. Quotes come off; a Markdown
 * string keeps its words and its line breaks and loses its stars; an icon's name comes out of the words (a box
 * draws it beside them, see iconsIn); an entity code becomes its character.
 * @param {string} text
 * @returns {string[]}
 */
export function wordsOf(text) {
  let words = text.trim().replace(/^"([^]*)"$/, '$1').trim();
  const markdown = /^`[^]*`$/.test(words);
  if (markdown) words = words.slice(1, -1).replace(/(\*\*|__)(?=\S)([^]*?\S)\1/g, '$2').replace(/(^|[^\w*])([*_])(?=\S)([^*_]*?\S)\2(?!\w)/g, '$1$3');
  return words
    .split(markdown ? /<br\s*\/?>|\n/i : /<br\s*\/?>/i)
    .map((line) => line
      .replace(ICON, ' ')
      .replace(/#(\d+|[a-z]+);/gi, (code, /** @type {string} */ name) => {
        if (!/^\d+$/.test(name)) return NAMED[/** @type {keyof typeof NAMED} */ (name)] ?? code;
        const point = Number(name);
        // Not a character a reader can see: a control code, half of a pair, or past the end of Unicode.
        return point < 32 || (point > 126 && point < 160) || (point > 0xd7ff && point < 0xe000) || point > 0x10ffff ? code : String.fromCodePoint(point);
      })
      .replace(/\s+/g, ' ')
      .trim())
    .filter(Boolean);
}

// The newer shapes ("A@{ shape: diam }") that Merlive has a drawing for, by every name Mermaid gives them.
// Any other is a box: a shape is never the only thing that says what a box is, its words are.
/** @type {Record<Read, string[]>} */
const SHAPES = {
  box: [],
  pill: ['stadium', 'pill', 'terminal', 'circle', 'circ', 'sm-circ', 'small-circle', 'start', 'f-circ', 'filled-circle', 'junction', 'fr-circ', 'framed-circle', 'stop', 'cross-circ', 'crossed-circle', 'summary'],
  'double-circle': ['dbl-circ', 'double-circle'],
  diamond: ['diam', 'decision', 'diamond', 'question'],
  hexagon: ['hex', 'hexagon', 'prepare'],
  cylinder: ['cyl', 'cylinder', 'database', 'db', 'h-cyl', 'das', 'horizontal-cylinder', 'lin-cyl', 'disk', 'lined-cylinder'],
  store: ['datastore', 'data-store', 'bow-rect', 'bow-tie-rectangle', 'stored-data'],
  subroutine: ['fr-rect', 'framed-rectangle', 'subproc', 'subprocess', 'subroutine'],
  'lean-right': ['lean-r', 'lean-right', 'in-out'],
  'lean-left': ['lean-l', 'lean-left', 'out-in'],
  trapezoid: ['trap-b', 'priority', 'trapezoid', 'trapezoid-bottom'],
  'trapezoid-alt': ['trap-t', 'inv-trapezoid', 'manual', 'trapezoid-top'],
  flag: ['odd'],
};

// What "@{ … }" can say of a box. One that says none of these is about a link or a group, and makes no box.
const OF_A_BOX = ['shape', 'label', 'icon', 'img', 'form', 'pos', 'w', 'h', 'constraint', 'row', 'column'];

// An icon written into a label, the way Mermaid has it: "fa:fa-truck", "fab:fa-github".
const ICON = /\bfa[a-z]?:fa-[\w-]+/g;

/** The icons an author wrote into some words, as written. */
export const iconsIn = (/** @type {string} */ text) => text.match(ICON) ?? [];

/** Where the "@{ … }" that opens just before `from` closes: the first } that is not inside quotes, or -1. */
function closeOf(/** @type {string} */ s, /** @type {number} */ from) {
  let quoted = false;
  for (let i = from; i < s.length; i++) {
    if (s[i] === '"') quoted = !quoted;
    else if (s[i] === '}' && !quoted) return i;
  }
  return -1;
}

/** What is written between "@{" and "}": "key: value" pairs, parted by commas or line ends outside quotes. */
function dataIn(/** @type {string} */ text) {
  /** @type {Record<string,string>} */
  const out = {};
  let part = '', quoted = false;
  const keep = () => {
    const m = /^\s*([\w-]+)\s*:\s*([^]*?)\s*$/.exec(part);
    if (m) out[m[1]] = m[2].replace(/^"|"$/g, '');
    part = '';
  };
  for (const c of text) {
    if (c === '"') quoted = !quoted;
    if ((c === ',' || c === '\n') && !quoted) keep();
    else part += c;
  }
  keep();
  return out;
}

/** What a line opens and does not close, so the lines after it belong to it: an "@{", or a Markdown string. */
function leftOpen(/** @type {string} */ text) {
  for (let at = text.indexOf('@{'); at >= 0; at = text.indexOf('@{', at + 2)) if (closeOf(text, at + 2) < 0) return 'an @{';
  return (text.split('`').length - 1) % 2 ? 'a Markdown string' : '';
}

// Lines that are read past without a warning: a page of Merlive runs no code of an author's, and a group's own
// direction is not followed yet.
const PASSED = /^(click|direction)\b/;

/**
 * What an author's own styling says, kept as what it means and not as its numbers: a colour, a broken outline, a
 * heavy one. The colour of its edge says most; else its fill; else its words.
 * @param {string} css "fill:#fde,stroke:#c00,stroke-width:3px,stroke-dasharray: 5 5"
 */
function lookOf(css) {
  const hex = ['stroke', 'fill', 'color'].map((k) => new RegExp(`(?:^|,)\\s*${k}\\s*:\\s*#([0-9a-f]{6}|[0-9a-f]{3})\\b`, 'i').exec(css)?.[1]).find(Boolean);
  const width = Number(/(?:^|,)\s*stroke-width\s*:\s*([\d.]+)/i.exec(css)?.[1] ?? 0);
  return {
    colour: hex ? `#${(hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex).toLowerCase()}` : '',
    dashed: /(?:^|,)\s*stroke-dasharray\s*:\s*(?!0\b|none\b)\S/i.test(css),
    heavy: width >= looks.heavy,
  };
}

// What is measured in an author's styling, named once.
const looks = {
  heavy: 3, // px of stroke-width from which an outline or a line is drawn heavy: Mermaid's own thick link is 3.5
  grey: 0.15, // a colour less saturated than this has no hue to speak of
};

/**
 * The plain name of a colour's hue. A box its author coloured without saying why ("style B stroke:#c00") is
 * of the kind "red": the design then draws it in its own nearest colour, and a reader is told the same word.
 * @param {string} colour "#cc0000"
 */
export function hueOf(colour) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(colour.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2;
  if (d === 0 || d / (1 - Math.abs(2 * l - 1)) < looks.grey) return 'grey';
  const h = 60 * (max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4);
  return h < 15 ? 'red' : h < 45 ? 'orange' : h < 70 ? 'yellow' : h < 165 ? 'green' : h < 200 ? 'teal' : h < 260 ? 'blue' : h < 300 ? 'purple' : h < 345 ? 'pink' : 'red';
}


/**
 * @param {string} src one Mermaid block
 * @returns {Model}
 */
export function parse(src) {
  // A sequence diagram has a reader, rules and a drawing of its own: sequence.mjs.
  if (isSequence(src)) return /** @type {any} */ (parseSequence(src));
  /** @type {Model} */
  const model = { type: 'flowchart', kindOfDiagram: '', direction: 'TD', title: '', describes: '', nodes: [], edges: [], notes: {}, steps: [], hints: {}, classes: {}, groups: [], warnings: [] };
  /** @type {Map<string, Node>} */
  const byId = new Map();
  const seenEdge = new Map();
  let header = false;
  // The groups that are open at this line, outermost first. A box used inside a group that is inside another
  // is in both: the inner one is its own, and the outer one holds everything the inner one does.
  /** @type {string[]} */
  const open = [];
  /** @type {Map<string,string>} */
  const groupOf = new Map();
  const shaped = new Set();
  // The line being read, for what is said from deep inside it.
  let reading = 0;
  // Every link in the order Mermaid numbers them; one that is not drawn keeps its number and has nothing.
  /** @type {(Edge|null)[]} */
  const numbered = [];
  // What an author's styling says of a class, of single boxes, and of links by their number, kept until the
  // whole block is read: a style may come before the box it is about.
  /** @type {Map<string, ReturnType<typeof lookOf>>} */
  const ofClass = new Map();
  /** @type {[string[], ReturnType<typeof lookOf>][]} */
  const ofBoxes = [];
  /** @type {[number[], ReturnType<typeof lookOf>][]} */
  const ofLinks = [];
  // A state diagram's lines are read by state.mjs, into this same model.
  /** @type {ReturnType<typeof stateReader>|null} */
  let state = null;

  const warn = (/** @type {number} */ line, /** @type {string} */ what) => model.warnings.push(`line ${line}: ${what}`);

  const node = (/** @type {string} */ id) => {
    let n = byId.get(id);
    if (!n) {
      n = { id, label: id, shape: 'box', kind: '' };
      byId.set(id, n);
      model.nodes.push(n);
    }
    // A box is in the group where it is used, wherever it was first named.
    if (open.length && !groupOf.has(id)) {
      groupOf.set(id, open[open.length - 1]);
      for (const g of model.groups) if (open.includes(g.id)) g.members.push(id);
    }
    return n;
  };

  /** Gives a box its words. Where an author broke a label, the lines are kept as written; the label itself is the words in one line. */
  /** Gives a box the icon its author wrote, if Merlive has a drawing of it; one it has not is said, once. */
  const mark = (/** @type {Node} */ n, /** @type {string[]} */ written) => {
    delete n.icon;
    for (const icon of written) {
      const found = iconFor(icon);
      if (found) n.icon ??= found.name;
      else warn(reading, `the icon "${icon}" is not one Merlive has a drawing for; it is left out and its words kept`);
    }
  };

  const say = (/** @type {Node} */ n, /** @type {string} */ words) => {
    const lines = wordsOf(words);
    mark(n, iconsIn(words));
    // A box that held only an icon has no words left, and takes its id like any box with none.
    n.label = lines.join(' ') || n.id;
    if (lines.length > 1) n.breaks = lines;
    else delete n.breaks;
  };

  /** Gives a box its shape. A cylinder is a store of data, and so is of the kind that holds data, like one only named as a store. */
  const shape = (/** @type {Node} */ n, /** @type {Read} */ as) => {
    n.shape = as === 'store' ? 'box' : as;
    if ((as === 'store' || as === 'cylinder') && !n.kind) n.kind = 'data';
  };

  /** Reads `A`, `A[Label]`, `A{Label}:::kind`, `A@{ shape: diam, label: "Label" }` at pos. */
  const readNode = (/** @type {string} */ s, /** @type {number} */ pos) => {
    const m = /^\s*([A-Za-z_]\w*)/.exec(s.slice(pos));
    if (!m) return null;
    let p = pos + m[0].length;
    const n = node(m[1]);
    for (const [open, closers] of OPENERS) {
      if (!s.startsWith(open, p)) continue;
      const start = p + open.length;
      // A quoted label may hold the closing bracket itself, so the closer is looked for after the quote ends.
      const quoted = s[start] === '"' ? s.indexOf('"', start + 1) : -1;
      const [end, close, as] = closers.map(([c, shaped]) => /** @type {[number,string,Read]} */ ([s.indexOf(c, quoted > 0 ? quoted + 1 : start), c, shaped])).filter(([at]) => at >= 0).sort((a, b) => a[0] - b[0])[0] ?? [-1, '', 'box'];
      // Not closed this way: "[/api/orders]" is a plain box whose words begin with a slash.
      if (end < 0) continue;
      say(n, s.slice(start, end));
      shape(n, as);
      shaped.add(n.id);
      p = end + close.length;
      break;
    }
    if (s.startsWith('@{', p)) {
      const end = closeOf(s, p + 2);
      if (end < 0) return null;
      const data = dataIn(s.slice(p + 2, end));
      // An icon or an image is a box with its label: a page of Merlive fetches nothing, so neither is drawn.
      // Rows and columns are read past: where a box goes is Merlive's to say.
      if (data.label !== undefined) say(n, data.label);
      if (data.icon) mark(n, [data.icon]);
      if (data.shape) shape(n, /** @type {Read|undefined} */ (Object.keys(SHAPES).find((k) => SHAPES[/** @type {Read} */ (k)].includes(data.shape))) ?? 'box');
      if (OF_A_BOX.some((k) => k in data)) shaped.add(n.id);
      p = end + 1;
    }
    const cls = /^:::(\w+)/.exec(s.slice(p));
    if (cls) {
      n.kind = cls[1];
      p += cls[0].length;
    }
    return { node: n, pos: p };
  };

  /** Reads `-->`, `-->|Yes|`, `-- Yes -->` and the dotted and thick forms at pos. */
  const readLink = (/** @type {string} */ s, /** @type {number} */ pos) => {
    // A link may carry an id ("A e1@--> B"), there for Mermaid to set things on it. Merlive names links itself.
    pos += /^\s*[A-Za-z_]\w*@(?!\{)/.exec(s.slice(pos))?.[0].length ?? 0;
    for (const [like, style] of LINKS) {
      const m = like.exec(s.slice(pos));
      if (!m) continue;
      return { style, tail: MARKS[m[1]] ?? 'none', head: MARKS[m[4].slice(-1)] ?? 'none', label: wordsOf(m[2] || m[3] || m[5] || '').join(' '), pos: pos + m[0].length };
    }
    return null;
  };

  /** A link between two boxes, named apart from any other between the same two. */
  const connect = (/** @type {Node} */ a, /** @type {Node} */ b, /** @type {Pick<Edge,'label'|'style'|'head'|'tail'>} */ l, /** @type {number} */ line) => {
    const base = `${a.id}-${b.id}`;
    const count = (seenEdge.get(base) ?? 0) + 1;
    seenEdge.set(base, count);
    /** @type {Edge} */
    const made = { id: count === 1 ? base : `${base}#${count}`, from: a.id, to: b.id, label: l.label, style: l.style, head: l.head, tail: l.tail };
    model.edges.push(made);
    return made;
  };

  /** Opens a group. One opened inside another is drawn as part of the outer one, and said once. */
  const frame = (/** @type {string} */ id, /** @type {string} */ title, /** @type {number} */ line) => {
    model.groups.push({ id, title, members: [], ...(open.length ? { parent: open[open.length - 1] } : {}) });
    open.push(id);
  };

  /** Reads one box, or several joined by "&" (`A & B`), at pos. */
  const readBoxes = (/** @type {string} */ s, /** @type {number} */ pos) => {
    const first = readNode(s, pos);
    if (!first) return null;
    const nodes = [first.node];
    let p = first.pos;
    for (let and = /^\s*&/.exec(s.slice(p)); and; and = /^\s*&/.exec(s.slice(p))) {
      const next = readNode(s, p + and[0].length);
      if (!next) return null;
      nodes.push(next.node);
      p = next.pos;
    }
    return { nodes, pos: p };
  };

  const statement = (/** @type {string} */ s, /** @type {number} */ line) => {
    const had = { nodes: model.nodes.length, edges: model.edges.length, numbered: numbered.length };
    // A line that could not be read leaves nothing behind: no box from its first word, no half of a chain.
    const notRead = (/** @type {string} */ what = `not read: "${s}"`) => {
      for (const n of model.nodes.splice(had.nodes)) {
        byId.delete(n.id);
        shaped.delete(n.id);
        for (const g of model.groups) g.members = g.members.filter((id) => id !== n.id);
        groupOf.delete(n.id);
      }
      for (const e of model.edges.splice(had.edges)) seenEdge.set(`${e.from}-${e.to}`, (seenEdge.get(`${e.from}-${e.to}`) ?? 1) - 1);
      numbered.length = had.numbered;
      warn(line, what);
    };
    // What is set on a link or a group ("e1@{ animate: true }", "g@{ view: collapsed }") is read past and makes
    // no box: movement is the design's, and a picture is drawn open.
    const set = /^[A-Za-z_]\w*@\{/.exec(s);
    if (set) {
      const end = closeOf(s, set[0].length);
      if (end === s.length - 1 && !OF_A_BOX.some((k) => k in dataIn(s.slice(set[0].length, end)))) return;
    }
    let prev = readBoxes(s, 0);
    if (!prev) return notRead();
    while (s.slice(prev.pos).trim() !== '') {
      const link = readLink(s, prev.pos);
      const next = link && readBoxes(s, link.pos);
      if (!link || !next) return notRead();
      // An invisible link is there to push Mermaid's boxes about. Its boxes are read; where they go is Merlive's.
      // With "&", every box before the link is linked to every box after it. Mermaid numbers every link it
      // meets, drawn or not, and "linkStyle 2" means the third of those.
      for (const a of prev.nodes) {
        for (const b of next.nodes) numbered.push(link.style === 'hidden' ? null : connect(a, b, /** @type {Pick<Edge,'label'|'style'|'head'|'tail'>} */ (link), line));
      }
      prev = next;
    }
  };

  /** A line cut at each ; that is not inside quotes and does not end an entity code ("#gt;"). */
  const statementsIn = (/** @type {string} */ text) => {
    /** @type {string[]} */
    const out = [''];
    let quoted = false;
    for (const c of text) {
      if (c === '"') quoted = !quoted;
      if (c === ';' && !quoted && !/#\w+$/.test(out[out.length - 1])) out.push('');
      else out[out.length - 1] += c;
    }
    return out.map((x) => x.trim()).filter(Boolean);
  };
  /** @type {string[]|null} */
  let describing = null;

  const read = (/** @type {string} */ text, /** @type {number} */ line) => {
    reading = line;
    // What the picture is called and what it shows, in Mermaid's own words for it.
    if (describing) {
      if (text === '}') {
        model.describes = describing.join(' ');
        describing = null;
      } else describing.push(text);
      return;
    }
    const acc = /^acc(Title|Descr)\s*(?::\s*(.*)|\{\s*)$/.exec(text);
    if (acc && acc[2] === undefined) return void (describing = []);
    if (acc) return void (acc[1] === 'Title' ? (model.title = acc[2].trim()) : (model.describes = acc[2].trim()));

    // Merlive's own lines live in Mermaid comments, so every other Mermaid renderer still reads the block.
    const note = /^%%\s*note\s+(\w+)\s*:\s*(.+)$/.exec(text);
    if (note) return void (model.notes[note[1]] = note[2].trim());
    const step = /^%%\s*step\s*:\s*(.+)$/.exec(text);
    if (step) {
      const [title = '', path = '-', words = ''] = step[1].split('|').map((x) => x.trim());
      return void model.steps.push({ title, text: words, path, seq: [], loop: false });
    }
    const main = /^%%\s*main\s*:\s*(.+)$/.exec(text);
    if (main) return void (model.hints.main = main[1].split('>').map((x) => x.trim()).filter(Boolean));
    const side = /^%%\s*side\s*:\s*(left|right)\s*$/.exec(text);
    if (side) return void (model.hints.side = /** @type {'left'|'right'} */ (side[1]));
    const turn = /^%%\s*turn\s*:\s*(yes|no)\s*$/.exec(text);
    if (turn) return void (model.hints.turn = turn[1] === 'yes');
    if (text.startsWith('%%')) return;

    if (!header) {
      header = true;
      const h = /^(flowchart|graph)\b\s*(TD|TB|BT|LR|RL)?/.exec(text);
      model.kindOfDiagram = text.split(/\s+/)[0];
      if (/^stateDiagram(-v2)?;?$/.test(text)) return void (state = stateReader({ model, node, say, connect, frame, unframe: () => open.pop(), join, warn, wordsOf }));
      if (!h) {
        model.type = 'unsupported';
        return;
      }
      if (h[2] === 'LR' || h[2] === 'RL') model.direction = 'LR';
      if (h[2] === 'BT' || h[2] === 'RL') warn(line, `${h[2]} is drawn as ${model.direction}`);
      return;
    }
    if (model.type === 'unsupported') return;
    if (state?.read(text, line)) return;

    const group = /^subgraph\s+(.+)$/.exec(text);
    if (group) {
      // "subgraph id[Title]", or a title alone, which is then its name too.
      const named = /^([A-Za-z_][\w-]*)\s*\[\s*"?(.*?)"?\s*\]$/.exec(group[1]);
      const id = named ? named[1] : group[1].replace(/^"|"$/g, '').trim();
      return frame(id, named ? wordsOf(named[2]).join(' ') || id : id, line);
    }
    if (text === 'end') return void open.pop();
    const classDef = /^classDef\s+([\w,]+)\s+(.*)$/.exec(text);
    if (classDef) {
      const look = lookOf(classDef[2]);
      for (const name of classDef[1].split(',')) {
        if (look.colour) model.classes[name] = look.colour;
        // A default for every box is a look for the whole diagram, and that is the design's to give.
        if (name !== 'default') ofClass.set(name, look);
      }
      return;
    }
    const styled = /^style\s+([A-Za-z_][\w,]*)\s+(\S.*)$/.exec(text);
    if (styled) return void ofBoxes.push([styled[1].split(',').filter(Boolean), lookOf(styled[2])]);
    const linkStyled = /^linkStyle\s+(default|\d+(?:\s*,\s*\d+)*)\s+(\S.*)$/.exec(text);
    if (linkStyled) return void (linkStyled[1] === 'default' || ofLinks.push([linkStyled[1].split(',').map(Number), lookOf(linkStyled[2])]));
    if (PASSED.test(text) || /^(style|linkStyle)\b/.test(text)) return;
    const cls = /^class\s+([\w,\s]+?)\s+(\w+)\s*;?$/.exec(text);
    if (cls) {
      for (const id of cls[1].split(',').map((x) => x.trim())) if (byId.has(id)) node(id).kind = cls[2];
      return;
    }
    for (const part of statementsIn(text)) statement(part, line);
  };

  // Front matter is Mermaid's own settings and a title. It is only front matter when the block opens with it;
  // anywhere else, --- is a link.
  /** @type {'before'|'in'|'after'} */
  let front = 'before';
  /** @type {{text:string,line:number}|null} */
  let held = null;
  src.split(/\r?\n/).forEach((raw, i) => {
    const text = raw.trim();
    if (!text) return;
    if (front === 'before') {
      front = text === '---' ? 'in' : 'after';
      if (front === 'in') return;
    }
    if (front === 'in') {
      // Only a title at the left edge is the picture's: one further in belongs to something else.
      const title = /^title\s*:\s*(.*?)\s*$/.exec(raw);
      if (title) model.title = title[1].replace(/^(["'])(.*)\1$/, '$2');
      if (text === '---') front = 'after';
      return;
    }
    // An "@{" left open carries on down the lines to its "}", and is read as one line from where it began.
    if (held) held.text += `\n${text}`;
    else if (!text.startsWith('%%') && leftOpen(text)) held = { text, line: i + 1 };
    else return read(text, i + 1);
    if (!leftOpen(held.text)) {
      read(held.text, held.line);
      held = null;
    }
  });
  if (front === 'in') warn(1, 'the front matter is never closed; end it with a line of ---');
  if (held) warn(held.line, `not read: ${leftOpen(held.text)} that is never closed, and everything after it: "${held.text.split('\n')[0]}"`);

  // A link to a group ("g1 --> g2") is a link from the end of one to the start of the next: the last box of the
  // first that leads to no other box in it, and the first box of the second that none of its own leads to.
  state?.done();
  // The innermost first, so that by the time a link to an outer group is joined, what is inside it is boxes.
  for (const g of [...model.groups].reverse()) join(g);
  function join(/** @type {{id:string,title:string,members:string[]}} */ g) {
    if (!byId.has(g.id) || shaped.has(g.id) || g.members.includes(g.id)) return;
    // A link from a box to itself leads nowhere, so it says nothing about where a group ends or starts.
    const within = model.edges.filter((e) => e.from !== e.to && g.members.includes(e.from) && g.members.includes(e.to));
    const exit = [...g.members].reverse().find((id) => !within.some((e) => e.from === id));
    const entry = g.members.find((id) => !within.some((e) => e.to === id));
    // A link between a group and itself would come out as one box linked to itself, which nobody wrote.
    const joined = new Set();
    for (const e of model.edges) {
      if (e.from === g.id || e.to === g.id) joined.add(e);
      if (e.from === g.id && exit) e.from = exit;
      if (e.to === g.id && entry) e.to = entry;
    }
    if (!g.members.length) model.warnings.push(`the group "${g.title}" has no boxes, so links to it are left out`);
    model.edges = model.edges.filter((e) => e.from !== g.id && e.to !== g.id && !(joined.has(e) && e.from === e.to));
    model.nodes = model.nodes.filter((n) => n.id !== g.id);
    byId.delete(g.id);
    for (const other of model.groups) other.members = other.members.filter((id) => id !== g.id);
    const counts = new Map();
    for (const e of model.edges) {
      const base = `${e.from}-${e.to}`, count = (counts.get(base) ?? 0) + 1;
      counts.set(base, count);
      e.id = count === 1 ? base : `${base}#${count}`;
    }
  }
  model.groups = model.groups.filter((g) => g.members.length);

  // An author's own styling, as what it means. A colour makes a box or a link of the kind named for its hue,
  // unless a class already said what kind it is; a broken or a heavy outline is kept as that.
  const hued = (/** @type {string} */ colour) => {
    const name = hueOf(colour);
    model.classes[name] ??= colour;
    return name;
  };
  for (const [ids, look] of ofBoxes) {
    for (const n of ids.map((id) => byId.get(id)).filter((x) => x !== undefined)) {
      if (look.colour && !n.kind) n.kind = hued(look.colour);
      if (look.dashed) n.dashed = true;
      if (look.heavy) n.heavy = true;
    }
  }
  for (const n of model.nodes) {
    const look = ofClass.get(n.kind);
    if (look?.dashed) n.dashed = true;
    if (look?.heavy) n.heavy = true;
  }
  for (const [numbers, look] of ofLinks) {
    for (const e of numbers.map((i) => numbered[i]).filter((x) => x !== null && x !== undefined)) {
      if (look.colour) e.kind = hued(look.colour);
      if (look.heavy) e.style = 'thick';
      else if (look.dashed) e.style = 'dotted';
    }
  }
  for (const n of model.nodes) if (!n.kind) n.kind = n.shape === 'diamond' || n.shape === 'hexagon' ? 'decision' : n.shape === 'pill' || n.shape === 'double-circle' ? 'terminal' : 'step';
  for (const id of Object.keys(model.notes)) if (!byId.has(id)) model.warnings.push(`note for ${id}: no such node`);
  resolveSteps(model);
  return model;
}

/**
 * Every loop in the graph, shortest first, each starting at its earliest node in source order.
 * @param {Pick<Model,'nodes'|'edges'>} model
 * @returns {string[][]}
 */
export function findLoops(model) {
  const index = new Map(model.nodes.map((n, i) => [n.id, i]));
  /** @type {Map<string,string[]>} */
  const next = new Map(model.nodes.map((n) => [n.id, []]));
  // A link from a box to itself is not a loop of the flow: "loop 1" means the shortest way round, through others.
  for (const e of model.edges) if (e.from !== e.to && !next.get(e.from)?.includes(e.to)) next.get(e.from)?.push(e.to);
  /** @type {string[][]} */
  const loops = [];
  const at = (/** @type {string} */ id) => index.get(id) ?? -1;
  for (const start of model.nodes.map((n) => n.id)) {
    const walk = (/** @type {string} */ v, /** @type {string[]} */ path) => {
      for (const w of next.get(v) ?? []) {
        if (w === start) loops.push([...path]);
        // Only later nodes are walked, so each loop is found once, from its earliest node.
        else if (at(w) > at(start) && !path.includes(w)) walk(w, [...path, w]);
      }
    };
    walk(start, [start]);
  }
  return loops.sort((a, b) => a.length - b.length);
}

/** Turns each step's path ("A>B>C", "loop 1" or "-") into the links it runs along. */
function resolveSteps(/** @type {Model} */ model) {
  const has = new Set(model.edges.map((e) => e.id));
  const loops = model.steps.some((s) => /^loop\s+\d+$/.test(s.path)) ? findLoops(model) : [];
  for (const s of model.steps) {
    /** @type {string[]} */
    let ids = [];
    const loop = /^loop\s+(\d+)$/.exec(s.path);
    if (loop) {
      const found = loops[Number(loop[1]) - 1];
      if (!found) model.warnings.push(`step "${s.title}": there is no loop ${loop[1]}`);
      else ids = [...found, found[0]];
      s.loop = Boolean(found);
    } else if (s.path !== '-' && s.path !== '') {
      ids = s.path.split('>').map((x) => x.trim());
    }
    for (let i = 0; i < ids.length - 1; i++) {
      const id = `${ids[i]}-${ids[i + 1]}`;
      if (has.has(id)) s.seq.push(id);
      else model.warnings.push(`step "${s.title}": no link from ${ids[i]} to ${ids[i + 1]}`);
    }
  }
}

/**
 * The Mermaid in a file, each block with the heading it sits under and the line it starts on.
 * @param {string} text
 * @param {'md'|'mmd'|'code'} [kind] md: fenced blocks in Markdown. mmd: the whole file is one block. code: a page
 *   or a script that keeps a flowchart in a string between backticks.
 * @returns {{source:string,title:string,line:number}[]}
 */
export function blocksOf(text, kind = 'md') {
  if (kind === 'mmd') return [{ source: text, title: '', line: 1 }];
  if (kind === 'code') {
    // A string that starts as a flowchart does. One with ${...} in it is put together when the page runs, and
    // cannot be read here.
    return [...text.matchAll(/`\s*((?:flowchart|graph)[ \t]+(?:TD|TB|BT|LR|RL)\b[^`]*)`/g)]
      .filter((m) => !m[1].includes('${'))
      .map((m) => ({ source: m[1].trimEnd(), title: '', line: text.slice(0, m.index).split('\n').length }));
  }
  const out = [];
  let heading = '';
  /** @type {string[]|null} */
  let open = null;
  let openedAt = 0;
  text.split(/\r?\n/).forEach((line, i) => {
    if (open) {
      if (/^\s*(```|~~~)\s*$/.test(line)) {
        out.push({ source: open.join('\n'), title: heading, line: openedAt });
        open = null;
      } else open.push(line);
      return;
    }
    const h = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) heading = h[1];
    if (/^\s*(```|~~~)\s*mermaid\s*$/.test(line)) {
      open = [];
      openedAt = i + 1;
    }
  });
  return out;
}
