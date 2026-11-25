// Why: Merlive reads a small, honest part of Mermaid's flowchart language and says what it left out, so a
// diagram is never drawn from a guess. Everything here is pure: text in, a model out.

/** @typedef {{id:string,label:string,shape:'box'|'pill'|'decision',kind:string,breaks?:string[]}} Node */
/** @typedef {'none'|'arrow'|'circle'|'cross'} Mark what is drawn at an end of a link */
/** @typedef {{id:string,from:string,to:string,label:string,style:'solid'|'dotted'|'thick',head:Mark,tail:Mark}} Edge head: at the box it leads to; tail: at the box it comes from */
/** @typedef {{title:string,text:string,path:string,seq:string[],loop:boolean}} Step */
/**
 * @typedef {object} Model
 * @property {'flowchart'|'unsupported'} type
 * @property {string} kindOfDiagram the first word of the source, for the message when it is not a flowchart
 * @property {'TD'|'LR'} direction
 * @property {string} title what the author called the picture (accTitle), for a reader who cannot see it
 * @property {string} describes what the author says it shows (accDescr)
 * @property {Node[]} nodes
 * @property {Edge[]} edges
 * @property {Record<string,string>} notes
 * @property {Step[]} steps
 * @property {{main?:string[],side?:'left'|'right'}} hints
 * @property {Record<string,string>} classes the colour an author gave each class with classDef, to find what it means
 * @property {{id:string,title:string,members:string[]}[]} groups the author's subgraphs: what each is called and the boxes in it
 * @property {string[]} warnings
 */

// Longest opener first, so "([" is not read as "(" and then "[". A shape that leans may close either way, and
// closes at whichever comes first. The flag (">words]") opens with no bracket at all.
const OPENERS = /** @type {const} */ ([
  ['(((', [')))'], 'pill'],
  ['([', ['])'], 'pill'],
  ['((', ['))'], 'pill'],
  ['[(', [')]'], 'store'],
  ['[[', [']]'], 'box'],
  ['[/', ['/]', '\\]'], 'box'],
  ['[\\', ['\\]', '/]'], 'box'],
  ['{{', ['}}'], 'decision'],
  ['>', [']'], 'box'],
  ['[', [']'], 'box'],
  ['(', [')'], 'box'],
  ['{', ['}'], 'decision'],
]);

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
 * string keeps its words and its line breaks and loses its stars; a Font Awesome icon is left out, since a page
 * of Merlive fetches no font; an entity code becomes its character.
 * @param {string} text
 * @returns {string[]}
 */
function wordsOf(text) {
  let words = text.trim().replace(/^"([^]*)"$/, '$1').trim();
  const markdown = /^`[^]*`$/.test(words);
  if (markdown) words = words.slice(1, -1).replace(/(\*\*|__)(?=\S)([^]*?\S)\1/g, '$2').replace(/(^|[^\w*])([*_])(?=\S)([^*_]*?\S)\2(?!\w)/g, '$1$3');
  return words
    .split(markdown ? /<br\s*\/?>|\n/i : /<br\s*\/?>/i)
    .map((line) => line
      .replace(/\bfa[a-z]?:fa-[\w-]+/g, ' ')
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
const SHAPES = /** @type {const} */ ({
  pill: ['stadium', 'pill', 'terminal', 'circle', 'circ', 'sm-circ', 'small-circle', 'start', 'f-circ', 'filled-circle', 'junction', 'fr-circ', 'framed-circle', 'stop', 'dbl-circ', 'double-circle', 'cross-circ', 'crossed-circle', 'summary'],
  decision: ['diam', 'decision', 'diamond', 'question', 'hex', 'hexagon', 'prepare'],
  store: ['cyl', 'cylinder', 'database', 'db', 'h-cyl', 'das', 'horizontal-cylinder', 'lin-cyl', 'disk', 'lined-cylinder', 'datastore', 'data-store', 'bow-rect', 'bow-tie-rectangle', 'stored-data'],
});

// What "@{ … }" can say of a box. One that says none of these is about a link or a group, and makes no box.
const OF_A_BOX = ['shape', 'label', 'icon', 'img', 'form', 'pos', 'w', 'h', 'constraint', 'row', 'column'];

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

// Mermaid styling lines. Merlive's look comes from the design file, so these are read past without a warning.
const STYLING = /^(style|linkStyle|click|direction)\b/;


/**
 * @param {string} src one Mermaid block
 * @returns {Model}
 */
export function parse(src) {
  /** @type {Model} */
  const model = { type: 'flowchart', kindOfDiagram: '', direction: 'TD', title: '', describes: '', nodes: [], edges: [], notes: {}, steps: [], hints: {}, classes: {}, groups: [], warnings: [] };
  /** @type {Map<string, Node>} */
  const byId = new Map();
  const seenEdge = new Map();
  let header = false;
  // The groups that are open at this line, outermost first. A group inside a group is drawn as part of the
  // outer one, so every box belongs to the outermost.
  /** @type {string[]} */
  const open = [];
  /** @type {Map<string,string>} */
  const groupOf = new Map();
  const shaped = new Set();
  let warnedNested = false;

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
      groupOf.set(id, open[0]);
      model.groups.find((g) => g.id === open[0])?.members.push(id);
    }
    return n;
  };

  /** Gives a box its words. Where an author broke a label, the lines are kept as written; the label itself is the words in one line. */
  const say = (/** @type {Node} */ n, /** @type {string} */ words) => {
    const lines = wordsOf(words);
    // A box that held only an icon has no words left, and takes its id like any box with none.
    n.label = lines.join(' ') || n.id;
    if (lines.length > 1) n.breaks = lines;
    else delete n.breaks;
  };

  /** Gives a box its shape. A store of data (Mermaid's cylinder) is a box like any other, of the kind that holds data. */
  const shape = (/** @type {Node} */ n, /** @type {'box'|'pill'|'decision'|'store'} */ as) => {
    n.shape = as === 'store' ? 'box' : as;
    if (as === 'store' && !n.kind) n.kind = 'data';
  };

  /** Reads `A`, `A[Label]`, `A{Label}:::kind`, `A@{ shape: diam, label: "Label" }` at pos. */
  const readNode = (/** @type {string} */ s, /** @type {number} */ pos) => {
    const m = /^\s*([A-Za-z_]\w*)/.exec(s.slice(pos));
    if (!m) return null;
    let p = pos + m[0].length;
    const n = node(m[1]);
    for (const [open, closers, as] of OPENERS) {
      if (!s.startsWith(open, p)) continue;
      const start = p + open.length;
      // A quoted label may hold the closing bracket itself, so the closer is looked for after the quote ends.
      const quoted = s[start] === '"' ? s.indexOf('"', start + 1) : -1;
      const [end, close] = closers.map((c) => /** @type {[number,string]} */ ([s.indexOf(c, quoted > 0 ? quoted + 1 : start), c])).filter(([at]) => at >= 0).sort((a, b) => a[0] - b[0])[0] ?? [-1, ''];
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
      if (data.shape) shape(n, /** @type {'pill'|'decision'|'store'|undefined} */ (Object.keys(SHAPES).find((k) => SHAPES[/** @type {keyof typeof SHAPES} */ (k)].some((name) => name === data.shape))) ?? 'box');
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
    const had = { nodes: model.nodes.length, edges: model.edges.length };
    // A line that could not be read leaves nothing behind: no box from its first word, no half of a chain.
    const notRead = (/** @type {string} */ what = `not read: "${s}"`) => {
      for (const n of model.nodes.splice(had.nodes)) {
        byId.delete(n.id);
        shaped.delete(n.id);
        const g = model.groups.find((x) => x.id === groupOf.get(n.id));
        if (g) g.members = g.members.filter((id) => id !== n.id);
        groupOf.delete(n.id);
      }
      for (const e of model.edges.splice(had.edges)) seenEdge.set(`${e.from}-${e.to}`, (seenEdge.get(`${e.from}-${e.to}`) ?? 1) - 1);
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
      // With "&", every box before the link is linked to every box after it.
      for (const a of link.style === 'hidden' ? [] : prev.nodes) {
        for (const b of next.nodes) {
          if (a.id === b.id) {
            warn(line, `a link from ${a.id} to itself is not drawn`);
            continue;
          }
          const base = `${a.id}-${b.id}`;
          const count = (seenEdge.get(base) ?? 0) + 1;
          seenEdge.set(base, count);
          model.edges.push({ id: count === 1 ? base : `${base}#${count}`, from: a.id, to: b.id, label: link.label, style: link.style, head: link.head, tail: link.tail });
        }
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
    if (text.startsWith('%%')) return;

    if (!header) {
      header = true;
      const h = /^(flowchart|graph)\b\s*(TD|TB|BT|LR|RL)?/.exec(text);
      model.kindOfDiagram = text.split(/\s+/)[0];
      if (!h) {
        model.type = 'unsupported';
        return;
      }
      if (h[2] === 'LR' || h[2] === 'RL') model.direction = 'LR';
      if (h[2] === 'BT' || h[2] === 'RL') warn(line, `${h[2]} is drawn as ${model.direction}`);
      return;
    }
    if (model.type === 'unsupported') return;

    const group = /^subgraph\s+(.+)$/.exec(text);
    if (group) {
      // "subgraph id[Title]", or a title alone, which is then its name too.
      const named = /^([A-Za-z_][\w-]*)\s*\[\s*"?(.*?)"?\s*\]$/.exec(group[1]);
      const id = named ? named[1] : group[1].replace(/^"|"$/g, '').trim();
      if (open.length && !warnedNested) {
        warn(line, 'a group inside a group is drawn as part of the outer one');
        warnedNested = true;
      }
      if (!open.length) model.groups.push({ id, title: named ? wordsOf(named[2]).join(' ') || id : id, members: [] });
      open.push(open[0] ?? id);
      return;
    }
    if (text === 'end') return void open.pop();
    const classDef = /^classDef\s+([\w,]+)\s+(.*)$/.exec(text);
    if (classDef) {
      // The colour of its edge says most about what the author meant; else its fill; else its words.
      const colour = ['stroke', 'fill', 'color'].map((k) => new RegExp(`(?:^|,)\\s*${k}\\s*:\\s*#([0-9a-f]{6}|[0-9a-f]{3})\\b`, 'i').exec(classDef[2])?.[1]).find(Boolean);
      if (colour) for (const name of classDef[1].split(',')) model.classes[name] = `#${(colour.length === 3 ? [...colour].map((c) => c + c).join('') : colour).toLowerCase()}`;
      return;
    }
    if (STYLING.test(text)) return;
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
  for (const g of model.groups) {
    if (!byId.has(g.id) || shaped.has(g.id) || g.members.includes(g.id)) continue;
    const within = model.edges.filter((e) => g.members.includes(e.from) && g.members.includes(e.to));
    const exit = [...g.members].reverse().find((id) => !within.some((e) => e.from === id));
    const entry = g.members.find((id) => !within.some((e) => e.to === id));
    for (const e of model.edges) {
      if (e.from === g.id && exit) e.from = exit;
      if (e.to === g.id && entry) e.to = entry;
    }
    if (!g.members.length) model.warnings.push(`the group "${g.title}" has no boxes, so links to it are left out`);
    model.edges = model.edges.filter((e) => e.from !== g.id && e.to !== g.id && e.from !== e.to);
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

  for (const n of model.nodes) if (!n.kind) n.kind = n.shape === 'decision' ? 'decision' : n.shape === 'pill' ? 'terminal' : 'step';
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
  for (const e of model.edges) if (!next.get(e.from)?.includes(e.to)) next.get(e.from)?.push(e.to);
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
