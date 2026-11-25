// Why: an architecture diagram is boxes and links: services, the groups they run in, and the lines between
// them. So it is not given a drawing of its own. Its lines are read here into the model a flowchart gives: a
// service is a box with an icon beside its words, a group a group, an edge a link. An author of one also says
// which side of a service each edge leaves by. Where things go is Merlive's to decide, by its rules, so the
// sides are read for the two things they say about order (which of two services comes first, and whether the
// whole runs across or down) and for nothing else. parse.mjs reads what every kind shares (front matter,
// comments, Merlive's own lines) and hands the rest of each line to this reader. Pure.

import { iconFor } from './icons.mjs';

/** @typedef {import('./parse.mjs').Model} Model */
/** @typedef {import('./parse.mjs').Node} Node */
/** @typedef {import('./parse.mjs').Edge} Edge */
/**
 * @typedef {object} Tools what parse.mjs lends, so a service is made exactly as a flowchart's box is
 * @property {Model} model
 * @property {(id:string) => Node} node the box of this id, made if it is not there, and put in the groups that are open
 * @property {(n:Node, words:string) => void} say gives a box its words
 * @property {(a:Node, b:Node, l:Pick<Edge,'label'|'style'|'head'|'tail'>, line:number) => unknown} connect
 * @property {(id:string, title:string, line:number) => void} frame opens a group, made if it is not there, inside the one open
 * @property {() => void} unframe closes the group opened last
 * @property {(line:number, what:string) => void} warn
 * @property {(text:string) => string[]} wordsOf
 */

/**
 * The five icons Mermaid is born with, and the name Merlive's own drawings know each by. Any other name is
 * looked for as written: a pack ("logos:aws-lambda") is somebody's marks, which Merlive neither fetches nor draws.
 * @type {Record<string, string>}
 */
export const builtInIcons = { cloud: 'cloud', database: 'database', disk: 'hard-drive', internet: 'internet', server: 'server' };

// A service whose icon is one of these is a store of data, and so of the kind that holds data, as a flowchart's
// cylinder is.
const holdsData = new Set(['database', 'disk']);

const ID = '[\\w-]+';
// An icon between round brackets, and a title between square ones: each may be left out.
const ICON = '(?:\\(\\s*("[^"]*"|[^()]*?)\\s*\\))?';
const TITLE = '(?:\\[(.*)\\])?';
const IN = `(?:\\s+in\\s+(${ID}))?`;
const SIDE = '([TBLR])';

const READ = {
  group: new RegExp(`^group\\s+(${ID})\\s*${ICON}\\s*${TITLE}${IN}$`),
  service: new RegExp(`^service\\s+(${ID})\\s*${ICON}\\s*${TITLE}${IN}$`),
  junction: new RegExp(`^junction\\s+(${ID})${IN}$`),
  // "<first>{group}:<side> <-- or -[words]- with an arrowhead at either end> <side>:<second>{group}"
  edge: new RegExp(`^(${ID})(\\{group\\})?\\s*:\\s*${SIDE}\\s*(<)?\\s*(?:--|-\\s*\\[(.*)\\]\\s*-)\\s*(>)?\\s*${SIDE}\\s*:\\s*(${ID})(\\{group\\})?$`),
  // A line that was meant for an edge, whatever is wrong with it.
  edgeLike: new RegExp(`--|->|<-|^${ID}(\\{group\\})?\\s*:`),
  title: /^title\s+(\S.*)$/,
  // Lining services up in a row or a column is their author placing them: placing is by rule here.
  align: /^align\s+(row|column)\b/,
};

/** How each thing is written, to say when a line that starts as one cannot be read. */
const WRITTEN = { group: 'group g(cloud)[Title] in group', service: 'service api(server)[Title] in group', junction: 'junction j in group' };

/** A line with what comes after "%%" taken off, unless the "%%" is inside quotes. */
function uncommented(/** @type {string} */ text) {
  let quoted = false;
  for (let i = 0; i < text.length - 1; i++) {
    if (text[i] === '"') quoted = !quoted;
    else if (!quoted && text[i] === '%' && text[i + 1] === '%') return text.slice(0, i).trim();
  }
  return text;
}

/**
 * The reader for one architecture diagram. `read` takes each line parse.mjs does not read itself; `done` makes
 * the boxes, the groups and the links once every line has been read, since a service may be said to be in a
 * group that is only declared further down.
 * @param {Tools} tools
 */
export function architectureReader({ model, node, say, connect, frame, unframe, warn, wordsOf }) {
  // Whether it was written "architecture-beta" or, as a later Mermaid has it, "architecture".
  model.kindOfDiagram = 'architecture-beta';

  /** @typedef {{what:'group'|'service'|'junction',id:string,icon?:string,title?:string,within?:string,line:number}} Declared */
  /** Everything declared, by the id its author wrote, in the order it was written. */
  /** @type {Map<string, Declared>} */
  const declared = new Map();
  /** @type {{a:string,b:string,aGroup:boolean,bGroup:boolean,aSide:string,intoA:boolean,intoB:boolean,words:string,line:number}[]} */
  const edges = [];
  /** What is to be said, with its line: said in the order of the lines, whenever it was found out. */
  /** @type {[number, string][]} */
  const told = [];
  const tell = (/** @type {number} */ line, /** @type {string} */ what) => void told.push([line, what]);

  const read = (/** @type {string} */ raw, /** @type {number} */ line) => {
    const text = uncommented(raw);
    if (!text) return true;

    const title = READ.title.exec(text);
    if (title) return (model.title = model.heading = wordsOf(title[1]).join(' ')), true;
    if (READ.align.test(text)) return true;

    for (const what of /** @type {const} */ (['group', 'service', 'junction'])) {
      if (!new RegExp(`^${what}\\b`).test(text)) continue;
      const found = READ[what].exec(text);
      if (!found) return tell(line, `not read: "${text}"; a ${what} is written like: ${WRITTEN[what]}`), true;
      const [, id, icon, name, within] = what === 'junction' ? [found[0], found[1], undefined, undefined, found[2]] : found;
      const first = declared.get(id);
      if (first) return tell(line, `not read: the id "${id}" is already a ${first.what}; give this ${what} an id of its own`), true;
      declared.set(id, { what, id, icon: icon || undefined, title: name, within, line });
      return true;
    }

    const edge = READ.edge.exec(text);
    if (edge) {
      const [, a, aGroup, aSide, intoA, words, intoB, , b, bGroup] = edge;
      edges.push({ a, b, aGroup: Boolean(aGroup), bGroup: Boolean(bGroup), aSide, intoA: Boolean(intoA), intoB: Boolean(intoB), words: words ?? '', line });
      return true;
    }
    if (READ.edgeLike.test(text)) return tell(line, `not read: "${text}"; an edge is written with the side it leaves and the side it meets, like api:R -- L:db`), true;
    return tell(line, `not read: "${text}"`), true;
  };

  const done = () => {
    /** The id of each thing in the model: itself where it can be, else with "_" for what Merlive's own lines cannot name, and a number if that is taken. */
    /** @type {Map<string,string>} */
    const ids = new Map();
    const idFor = (/** @type {string} */ written) => {
      const known = ids.get(written);
      if (known) return known;
      const plain = written.replace(/\W/g, '_'), taken = new Set(ids.values());
      let id = plain;
      for (let n = 2; taken.has(id); n++) id = `${plain}_${n}`;
      ids.set(written, id);
      return id;
    };
    for (const d of declared.values()) idFor(d.id);

    // The group each thing is in, once what cannot be has been said and set aside.
    for (const d of declared.values()) {
      if (d.within === undefined) continue;
      const outer = declared.get(d.within);
      if (!outer) tell(d.line, `the group "${d.within}" that ${d.id} is said to be in is never declared; ${d.id} is drawn in no group. Declare it with a line like: group ${d.within}[Title]`);
      else if (outer.what !== 'group') tell(d.line, `"${d.within}" is a ${outer.what}, not a group, so ${d.id} cannot be in it; ${d.id} is drawn in no group`);
      if (outer?.what !== 'group') delete d.within;
    }
    /** The groups a thing is in, from the outermost to its own. */
    const above = (/** @type {Declared} */ d) => {
      /** @type {Declared[]} */
      const chain = [];
      for (let up = d.within === undefined ? undefined : declared.get(d.within); up && !chain.includes(up); up = up.within === undefined ? undefined : declared.get(up.within)) chain.unshift(up);
      return chain;
    };
    // Two groups each inside the other are inside nothing that can be drawn.
    const circling = [...declared.values()].filter((d) => d.what === 'group' && d.within !== undefined && above(d).includes(d));
    for (const d of circling) tell(d.line, `the group "${d.id}" is said to be inside "${d.within}", which is inside it; each is drawn outside the other`);
    for (const d of circling) delete d.within;

    const titleOf = (/** @type {Declared} */ d) => wordsOf(d.title ?? '').join(' ') || d.id;
    /** Opens the groups a thing is in, outermost first, so what is made next is made inside them; says how many to close. */
    const within = (/** @type {Declared[]} */ chain) => {
      for (const g of chain) frame(idFor(g.id), titleOf(g), g.line);
      return () => chain.forEach(() => unframe());
    };

    // Groups first, each after the ones it is in, so an outer frame is drawn before what lies on it.
    for (const d of declared.values()) if (d.what === 'group') within([...above(d), d])();

    /** Icons Merlive has no drawing for: each is said once. */
    const strangers = new Set();
    for (const d of declared.values()) {
      if (d.what === 'group') continue;
      const close = within(above(d)), n = node(idFor(d.id));
      close();
      if (d.what === 'junction') {
        // Where lines meet and nothing else: a small round box with no words, of a kind of its own.
        Object.assign(n, { label: '', shape: 'pill', kind: 'junction' });
        continue;
      }
      say(n, d.title === undefined || !wordsOf(d.title).length ? d.id : d.title);
      if (d.icon === undefined) continue;
      const drawing = iconFor(builtInIcons[d.icon] ?? d.icon);
      if (drawing) n.icon = drawing.name;
      else if (!strangers.has(d.icon)) tell(d.line, `the icon "${d.icon}" is not one Merlive has a drawing for; it is left out and its words kept`);
      if (!drawing) strangers.add(d.icon);
      if (holdsData.has(d.icon)) n.kind = 'data';
    }

    for (const d of declared.values()) {
      if (d.what === 'group' && !model.groups.find((g) => g.id === idFor(d.id))?.members.length) tell(d.line, `the group "${titleOf(d)}" has nothing in it, so it is not drawn; put a service in it with "in ${d.id}"`);
    }

    /** The box an edge names. One never declared is still drawn, and said once. */
    const unknown = new Set();
    const end = (/** @type {string} */ written, /** @type {number} */ line) => {
      if (declared.has(written) || unknown.has(written)) return node(idFor(written));
      unknown.add(written);
      tell(line, `"${written}" is linked but never declared; it is drawn as a box named ${written}. Declare it with a line like: service ${written}(server)[Title]`);
      const n = node(idFor(written));
      say(n, written);
      return n;
    };
    let across = 0, down = 0, fromGroup = false;
    for (const e of edges) {
      const a = end(e.a, e.line), b = end(e.b, e.line);
      // An edge out of a group is drawn by Mermaid from the frame. A line here ends at a box, so it is drawn
      // from the service its author named, which is truer than a guess at which box the group ends in.
      if ((e.aGroup || e.bGroup) && !fromGroup) tell(e.line, `a link out of a group ("${e.aGroup ? e.a : e.b}{group}") is drawn from the service it names: Merlive draws a line to a box, not to a frame`);
      fromGroup ||= e.aGroup || e.bGroup;
      if (e.aSide === 'L' || e.aSide === 'R') across++;
      else down++;
      // The side an edge leaves its first service by says which of the two comes first: the first, when it
      // leaves by the right or the bottom; the second, when by the left or the top. Each arrowhead stays on the
      // service it points into.
      const firstIsA = e.aSide === 'R' || e.aSide === 'B';
      const mark = (/** @type {boolean} */ into) => (into ? 'arrow' : 'none');
      const link = { label: wordsOf(e.words).join(' '), style: /** @type {const} */ ('solid') };
      if (firstIsA) connect(a, b, { ...link, tail: mark(e.intoA), head: mark(e.intoB) }, e.line);
      else connect(b, a, { ...link, tail: mark(e.intoB), head: mark(e.intoA) }, e.line);
    }
    // It runs the way most of its edges do: across, when more leave by a left or a right side than by a top or
    // a bottom, else down.
    model.direction = across > down ? 'LR' : 'TD';

    for (const [line, what] of told.sort((p, q) => p[0] - q[0])) warn(line, what);
  };

  return { read, done };
}
