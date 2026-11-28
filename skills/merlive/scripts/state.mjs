// Why: a state diagram is boxes and links: states, and the ways from one to the next. So it is not given a
// drawing of its own. Its lines are read here into the model a flowchart gives, and placed, checked and drawn
// by the same rules. parse.mjs reads what the two share (front matter, comments, classes, Merlive's own lines)
// and hands the rest of each line to this reader, with the tools to make a box, a link and a group. Pure.

/** @typedef {import('./parse.mjs').Model} Model */
/** @typedef {import('./parse.mjs').Node} Node */
/**
 * @typedef {object} Tools what parse.mjs lends, so a state is made exactly as a flowchart's box is
 * @property {Model} model
 * @property {(id:string) => Node} node the box of this id, made if it is not there, and put in the group that is open
 * @property {(n:Node, words:string) => void} say gives a box its words, in its author's lines
 * @property {(a:Node, b:Node, l:{label:string,style:'solid',head:'arrow',tail:'none'}, line:number) => void} connect
 * @property {(id:string, title:string, line:number) => void} frame opens a group
 * @property {() => void} unframe closes the group opened last
 * @property {(g:{id:string,title:string,members:string[]}) => void} join turns links to a group's name into links to where it starts and ends
 * @property {(line:number, what:string) => void} warn
 * @property {(text:string) => string[]} wordsOf
 */

// A state's name, as Mermaid's own examples write one. The same letters a flowchart's box may be named with,
// so Merlive's own lines ("%% note Draft: …", "%% main: start>Draft") can name a state.
const ID = '[A-Za-z_]\\w*';
const KIND = '(?::::(\\w+(?:-\\w+)*))?';
const END = `(\\[\\*\\]|${ID})${KIND}`;

const LINES = {
  transition: new RegExp(`^${END}\\s*-->\\s*${END}\\s*(?::\\s*(.*))?$`),
  // "state id", 'state "words" as id', either as a choice, a fork or a join, or opening a composite state.
  state: new RegExp(`^state\\s+(?:"([^"]*)"\\s+as\\s+)?(${ID})\\s*(?:<<(choice|fork|join)>>|\\[\\[(choice|fork|join)\\]\\])?\\s*(\\{)?$`),
  described: new RegExp(`^(${ID})${KIND}\\s*:\\s*(.+)$`),
  alone: new RegExp(`^(${ID})${KIND}$`),
  note: new RegExp(`^note\\s+(?:left|right)\\s+of\\s+(${ID})\\s*(?::\\s*(.*))?$`, 'i'),
  direction: /^direction\s+(TB|TD|BT|LR|RL)$/,
  // PlantUML's lines for how a diagram is drawn, which Mermaid takes and which change nothing here.
  drawing: /^(hide\s+empty\s+description|scale\s+.+)$/i,
  shared: /^(classDef|class)\s/,
};

/**
 * Reads the lines of a state diagram into the model parse.mjs is building.
 * @param {Tools} tools
 * @returns {{read:(text:string, line:number) => boolean, done:() => void}} read says whether the line was this
 *   reader's; one that was not (a class, a classDef) is left for parse.mjs, which reads it as it does anywhere.
 */
export function stateReader({ model, node, say, connect, frame, unframe, join, warn, wordsOf }) {
  /** The composite states open at this line, the innermost last, each with the states used inside it. */
  /** @type {{id:string,line:number,members:string[],region:number,framed:boolean}[]} */
  const open = [];
  /** The composite states that "--" parted, each with its regions: a link into one goes into them all. */
  /** @type {Map<string, string[]>} */
  const parted = new Map();
  /** Composite states closed inside another: links to them are joined before links to the one they are in. */
  /** @type {{id:string,members:string[]}[]} */
  const inner = [];
  /** The words each state was given, a line at a time, and each composite state its title. */
  /** @type {Map<string,string[]>} */
  const described = new Map();
  /** @type {{id:string,line:number,lines:string[]}|null} */
  let noting = null;

  const state = (/** @type {string} */ id, /** @type {string|undefined} */ kind = undefined) => {
    const n = node(id);
    for (const scope of open) if (!scope.members.includes(id)) scope.members.push(id);
    if (kind) n.kind = kind;
    return n;
  };

  // Mermaid draws where a diagram starts and ends as dots. Here they are the pills every start and end is,
  // with the word a dot leaves a reader to work out. One of each, and a composite state has its own.
  const dot = (/** @type {boolean} */ ends) => {
    // A region after the first has a start and an end of its own, as the composite state itself has.
    const inside = open[open.length - 1], scope = inside && (inside.region > 1 ? `${inside.id}_${inside.region}` : inside.id);
    const n = state(`${scope ? `${scope}_` : ''}${ends ? 'end' : 'start'}`);
    Object.assign(n, { label: ends ? 'End' : 'Start', shape: 'pill' });
    return n;
  };

  const describe = (/** @type {string} */ id, /** @type {string} */ words) => {
    described.set(id, [...(described.get(id) ?? []), words]);
    return (described.get(id) ?? []).join('<br/>');
  };

  const note = (/** @type {string} */ id, /** @type {string[]} */ lines) => {
    const words = lines.flatMap((l) => wordsOf(l)).join(' ');
    if (words) model.notes[id] = [model.notes[id], words].filter(Boolean).join(' ');
  };

  const read = (/** @type {string} */ raw, /** @type {number} */ line) => {
    // What follows %% on a line is a comment; so is a ; at its end.
    const text = raw.replace(/\s+%%.*$/, '').replace(/\s*;$/, '').trim();
    if (noting) {
      if (/^end\s+note$/i.test(text)) {
        note(noting.id, noting.lines);
        noting = null;
      } else noting.lines.push(text);
      return true;
    }
    if (!text || LINES.drawing.test(text)) return true;
    if (LINES.shared.test(text)) return false;

    const way = LINES.direction.exec(text);
    if (way) {
      // A composite state's own direction is read past, as a group's is: it runs the way the rest does.
      if (open.length) return true;
      model.direction = way[1] === 'LR' || way[1] === 'RL' ? 'LR' : 'TD';
      if (way[1] === 'BT' || way[1] === 'RL') model.reversed = true;
      else delete model.reversed;
      return true;
    }
    if (text === '--') {
      // What "--" parts are regions that run side by side. Each is a group with no name inside the composite
      // state. The first is only known to be one now, so it is made of what the composite state holds so far.
      const inside = open[open.length - 1];
      if (!inside) return warn(line, 'not read: "--" parts the regions of a composite state, and none is open here'), true;
      const regions = parted.get(inside.id) ?? [];
      parted.set(inside.id, regions);
      if (inside.framed) unframe();
      else if (inside.members.length) {
        const first = `${inside.id}/1`, at = model.groups.findIndex((g) => g.id === inside.id);
        for (const g of model.groups) if (g.parent === inside.id) g.parent = first;
        model.groups.splice(at + 1, 0, { id: first, title: '', members: [...inside.members], parent: inside.id });
        regions.push(first);
      }
      inside.region = Math.max(inside.region, 1) + 1;
      const next = `${inside.id}/${inside.region}`;
      frame(next, '', line);
      regions.push(next);
      inside.framed = true;
      return true;
    }
    if (text === '}') {
      const closed = open.pop();
      if (!closed) return warn(line, 'not read: a "}" with no composite state open'), true;
      if (closed.framed) unframe();
      if (open.length) inner.push(closed);
      unframe();
      return true;
    }

    const noted = LINES.note.exec(text);
    if (noted) {
      if (noted[2] === undefined) noting = { id: noted[1], line, lines: [] };
      else note(noted[1], [noted[2]]);
      return true;
    }

    const declared = LINES.state.exec(text);
    if (declared) {
      const [, words, id, mark, markToo, composite] = declared;
      if (composite) {
        // A composite state is a group. It is named by its own words, which may come on a later line.
        if (words) describe(id, words);
        frame(id, id, line);
        open.push({ id, line, members: [], region: 0, framed: false });
        return true;
      }
      const n = state(id);
      if ((mark ?? markToo) === 'choice') n.shape = 'diamond';
      if (words) say(n, describe(id, words));
      return true;
    }

    const moved = LINES.transition.exec(text);
    if (moved) {
      const [, from, fromKind, to, toKind, words] = moved;
      const a = from === '[*]' ? dot(false) : state(from, fromKind), b = to === '[*]' ? dot(true) : state(to, toKind);
      connect(a, b, { label: wordsOf(words ?? '').join(' '), style: 'solid', head: 'arrow', tail: 'none' }, line);
      return true;
    }

    const given = LINES.described.exec(text);
    if (given) return say(state(given[1], given[2]), describe(given[1], given[3])), true;
    const alone = LINES.alone.exec(text);
    if (alone) return state(alone[1], alone[2]), true;
    return warn(line, `not read: "${text}"`), true;
  };

  const done = () => {
    if (noting) warn(noting.line, `the note on ${noting.id} is never ended; end it with a line of "end note"`);
    for (const left of open) warn(left.line, `the composite state ${left.id} is never closed; end it with a line of }`);
    // Going into a composite state starts every region of it. The link is joined to where the first begins, as
    // a link to any group is; here it is drawn again to where each other region begins.
    for (const [id, regions] of parted) {
      const into = model.edges.filter((e) => e.to === id && e.from !== id);
      for (const region of regions.slice(1)) {
        const members = model.groups.find((g) => g.id === region)?.members ?? [];
        const begins = members.find((m) => !model.edges.some((e) => e.to === m && e.from !== m && members.includes(e.from)));
        if (begins) for (const e of into) connect(node(e.from), node(begins), { label: e.label, style: e.style, head: e.head, tail: e.tail }, 0);
      }
    }
    // The innermost first, so that by the time a link to an outer one is joined, what is inside it is boxes.
    /** @type {string[]} */
    const joined = [];
    for (const { id, members } of inner) {
      join({ id, title: id, members: members.filter((m) => !joined.includes(m)) });
      joined.push(id);
    }
    for (const g of model.groups) {
      const words = wordsOf((described.get(g.id) ?? []).join(' ')).join(' ');
      if (words) g.title = words;
    }
  };

  return { read, done };
}
