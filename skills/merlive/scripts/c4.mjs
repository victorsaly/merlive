// Why: a C4 diagram is boxes and links: people, systems, containers and components, the boundaries they sit in,
// and what each asks of another. So it is not given a drawing of its own. Its lines are read here into the model
// a flowchart gives: an element is a box that says what it is over its name and what it does under it, a
// boundary is a group, a relation a link. parse.mjs reads what every kind shares (front matter, comments, what
// the picture is called, Merlive's own lines) and hands the rest of each line to this reader, with the tools to
// make a box, a link and a group. Pure.

import { iconFor } from './icons.mjs';

/** @typedef {import('./parse.mjs').Model} Model */
/** @typedef {import('./parse.mjs').Node} Node */
/** @typedef {import('./parse.mjs').Edge} Edge */
/**
 * @typedef {object} Tools what parse.mjs lends, so an element is made exactly as a flowchart's box is
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

// What Mermaid takes between the brackets of each thing, in the order it takes them. An argument may also be
// given by name ("$techn="C#""), wherever it stands; it then takes the place of the one that stood there.
const PLACES = {
  // A person and a system say what they do; a container and a component say first what they are made in.
  plain: ['alias', 'label', 'descr', 'sprite', 'tags', 'link'],
  built: ['alias', 'label', 'techn', 'descr', 'sprite', 'tags', 'link'],
  boundary: ['alias', 'label', 'type', 'tags', 'link'],
  node: ['alias', 'label', 'type', 'descr', 'sprite', 'tags', 'link'],
  relation: ['from', 'to', 'label', 'techn', 'descr', 'sprite', 'tags', 'link'],
  look: ['alias', 'bgColor', 'fontColor', 'borderColor', 'shadowing', 'shape', 'sprite', 'techn', 'legendText', 'legendSprite'],
  linkLook: ['from', 'to', 'textColor', 'lineColor', 'offsetX', 'offsetY'],
};

// "Person", "SystemDb_Ext", "ContainerQueue": what it is, whether it is a store or a queue, whether it is
// someone else's. A person is never a store.
const ELEMENT = /^(?:(Person)|(System|Container|Component)(Db|Queue)?)(_Ext)?$/;
// A boundary, and what Mermaid calls it when it is given no type. A node of a deployment is a boundary too: it
// holds what runs on it.
/** @type {Record<string, 'boundary'|'node'>} */
const BOUNDARIES = { Boundary: 'boundary', Enterprise_Boundary: 'boundary', System_Boundary: 'boundary', Container_Boundary: 'boundary', Deployment_Node: 'node', Node: 'node', Node_L: 'node', Node_R: 'node' };
// A relation. Which way Mermaid is asked to draw it (up, down, left, right) is read past: where a box goes is
// Merlive's to say. "back" runs from the second to the first, and "both" has an arrowhead at each end.
/** @type {Record<string, 'on'|'back'|'both'>} */
const RELATIONS = { Rel: 'on', BiRel: 'both', Rel_U: 'on', Rel_Up: 'on', Rel_D: 'on', Rel_Down: 'on', Rel_L: 'on', Rel_Left: 'on', Rel_R: 'on', Rel_Right: 'on', Rel_Back: 'back', RelIndex: 'on' };

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

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
 * "Name(a, "b", $c="d") {" as its name, its arguments and what follows its brackets. An argument is words in
 * quotes, which may hold commas and brackets; a bare word; a name with its value; or nothing at all, between
 * two commas. Nothing, when the line is not written so.
 * @param {string} text
 * @returns {{name:string,given:{key?:string,value?:string}[],after:string}|null}
 */
export function called(text) {
  const opens = /^([A-Za-z_]\w*)\s*\(/.exec(text);
  if (!opens) return null;
  /** @type {{key?:string,value?:string}[]} */
  const given = [];
  let at = opens[0].length;
  const spaces = () => {
    while (/\s/.test(text[at] ?? '')) at++;
  };
  for (;;) {
    spaces();
    if (text[at] === ')') break;
    if (text[at] === ',') given.push({});
    else if (text[at] === '"') {
      const ends = text.indexOf('"', at + 1);
      given.push({ value: text.slice(at + 1, ends) });
      at = ends + 1;
    } else {
      const named = /^\$(\w+)\s*=\s*"([^"]*)"/.exec(text.slice(at)), bare = /^[^,)"]*/.exec(text.slice(at))?.[0] ?? '';
      if (!named && !bare.trim()) return null;
      given.push(named ? { key: named[1], value: named[2] } : { value: bare.trim() });
      at += named ? named[0].length : bare.length;
    }
    spaces();
    if (text[at] === ',') at++;
    else if (text[at] !== ')') return null;
  }
  return { name: opens[1], given, after: text.slice(at + 1).trim() };
}

/**
 * The reader for one C4 diagram. `read` takes each line parse.mjs does not read itself; `done` finishes what can
 * only be known once every line has been read.
 * @param {Tools} tools
 * @returns {{read:(text:string, line:number) => boolean, done:() => void}} every line of a C4 diagram is this
 *   reader's: none is a flowchart's
 */
export function c4Reader({ model, node, say, connect, frame, unframe, outline, warn, wordsOf }) {
  // Mermaid numbers the relations of a dynamic diagram, which is the one C4 diagram that is read in an order.
  const dynamic = model.kindOfDiagram === 'C4Dynamic';
  const person = iconFor('user')?.name;
  /** The id each alias was given. An alias may hold anything; an id holds only what Merlive's own lines can name. */
  /** @type {Map<string,string>} */
  const idOf = new Map();
  /** The elements there are, by id. */
  /** @type {Set<string>} */
  const declared = new Set();
  /**
   * Every boundary in the order it was written: what it is called, the boundary it is in, and whether a group
   * was opened for it. One with nothing in it is drawn as a box once all is read.
   * @type {{id:string,is:'boundary'|'node',label:string,type:string,descr:string,parent?:string,framed:boolean,line:number}[]}
   */
  const bounds = [];
  /** The boundaries open at this line, the innermost last. */
  /** @type {typeof bounds} */
  const open = [];
  /** A boundary whose "{" has not come yet: Mermaid takes it on the line below too. */
  /** @type {typeof bounds[number]|null} */
  let awaiting = null;
  /** Relations are joined once every line is read: one may be written before what it joins, or inside a boundary neither end is in. */
  /** @type {{from:string,to:string,label:string,techn:string,way:'on'|'back'|'both',line:number}[]} */
  const relations = [];
  /** Words in quotes that run on down the lines, until the quotes close. */
  /** @type {{text:string,line:number}|null} */
  let held = null;
  /** What is said once, however often it is met. */
  /** @type {Set<string>} */
  const said = new Set();
  const once = (/** @type {string} */ what, /** @type {number} */ line, /** @type {string} */ words) => {
    if (!said.has(what)) warn(line, words);
    said.add(what);
  };

  /** The id of an alias: itself where it can be, else with "_" for what an id cannot hold, and a number if that is taken. */
  const idFor = (/** @type {string} */ alias) => {
    const known = idOf.get(alias);
    if (known) return known;
    const plain = alias.replace(/[^A-Za-z0-9_]/gu, '_'), taken = new Set(idOf.values());
    let id = plain;
    for (let n = 2; taken.has(id); n++) id = `${plain}_${n}`;
    idOf.set(alias, id);
    return id;
  };

  const words = (/** @type {string|undefined} */ written) => wordsOf(written ?? '').join(' ');

  /** What was given, by what it is: by its name where it has one, else by where it stands. Nothing given is not there. */
  const sorted = (/** @type {{key?:string,value?:string}[]} */ given, /** @type {string[]} */ places) => {
    /** @type {Record<string,string>} */
    const by = {};
    given.forEach((g, i) => {
      const what = g.key ?? places[i];
      if (what && g.value) by[what] = g.value;
    });
    return by;
  };

  /** What a box is, over its name: «container: C#», with what it is made in when that is said. */
  const over = (/** @type {string} */ what, /** @type {string} */ made) => `«${what}${made ? `: ${made}` : ''}»`;

  const element = (/** @type {RegExpExecArray} */ is, /** @type {Record<string,string>} */ by) => {
    const [, isPerson, thing, store, outside] = is;
    const id = idFor(by.alias), n = node(id);
    declared.add(id);
    say(n, by.label ?? by.alias);
    n.over = over([outside ? 'external' : '', (isPerson ?? thing).toLowerCase(), store === 'Db' ? 'database' : store === 'Queue' ? 'queue' : ''].filter(Boolean).join(' '), words(by.techn));
    // A store of data is the cylinder it is in a flowchart. A queue is the nearest shape there is: the pill,
    // which is a cylinder seen from its side.
    n.shape = store === 'Db' ? 'cylinder' : store === 'Queue' ? 'pill' : 'box';
    // What is someone else's is of the kind the design keeps for that, and that says more than what it holds.
    n.kind = outside ? 'external' : store ? 'data' : '';
    if (isPerson && person) n.icon = person;
    // Declared again, an element is said anew: what it did before is not what it does now.
    if (words(by.descr)) n.text = words(by.descr);
    else delete n.text;
  };

  const boundary = (/** @type {'boundary'|'node'} */ is, /** @type {Record<string,string>} */ by, /** @type {number} */ line) => ({
    id: idFor(by.alias), is, label: words(by.label) || by.alias, type: words(by.type), descr: is === 'node' ? words(by.descr) : '',
    ...(open.length ? { parent: open[open.length - 1].id } : {}), framed: false, line,
  });

  const opened = (/** @type {typeof bounds[number]} */ b) => {
    frame(b.id, `${b.label}${b.type ? ` [${b.type}]` : ''}`, b.line);
    b.framed = true;
    open.push(b);
  };

  /** How Mermaid is told an element should look. A colour is kept as a flowchart keeps a style's; the rest is the design's. */
  const look = (/** @type {Record<string,string>} */ by, /** @type {number} */ line) => {
    if (!by.alias) return;
    const id = idFor(by.alias), colours = [by.bgColor, by.borderColor].filter(Boolean);
    if (!colours.length) return;
    if (bounds.some((b) => b.id === id)) return once('boundary look', line, `UpdateElementStyle colours the boundary "${by.alias}": how a group looks is the design's, so it is read past`);
    if (!declared.has(id)) return;
    const hex = colours.find((c) => HEX.test(c)), named = colours.find((c) => !HEX.test(c));
    if (hex) outline([id], `fill:${hex}`);
    else once('named colour', line, `UpdateElementStyle gives "${by.alias}" a colour by name ("${named}"): only a colour written as #rrggbb is read; it is then kept as a colour, the design's own of that hue where it has one`);
  };

  const statement = (/** @type {string} */ text, /** @type {number} */ line) => {
    if (text === '{') {
      if (!awaiting) return warn(line, 'not read: a "{" with no boundary before it');
      opened(awaiting);
      awaiting = null;
      return;
    }
    // A boundary with no "{" after it holds nothing.
    awaiting = null;
    if (text === '}') {
      if (!open.pop()) return warn(line, 'not read: a "}" with no boundary open');
      return unframe();
    }
    const title = /^title\s+(\S.*)$/.exec(text);
    if (title) return void (model.title = model.heading = words(title[1]));

    const call = called(text);
    if (!call) return warn(line, /^[A-Za-z_]\w*\s*\(/.test(text) ? `not read: "${text}": close its brackets, and put a comma between its arguments` : `not read: "${text}"`);
    const { name, given, after } = call;
    const is = ELEMENT.exec(name), holds = BOUNDARIES[name], way = RELATIONS[name];
    if (after && !(holds && after === '{')) return warn(line, after === '{' ? `not read: "${text}": only a boundary or a node is followed by {` : `not read: "${text}"`);

    if (is || holds) {
      const by = sorted(given, is ? (is[1] || is[2] === 'System' ? PLACES.plain : PLACES.built) : PLACES[holds]);
      if (!by.alias) return warn(line, `not read: "${text}" has no alias: write it as ${name}(alias, "label")`);
      if (is) return element(is, by);
      const b = boundary(holds, by, line);
      bounds.push(b);
      if (after === '{') opened(b);
      else awaiting = b;
      return;
    }
    if (way) {
      // The index a relation is given says nothing Mermaid draws: it numbers them itself, in the order written.
      const by = sorted(name === 'RelIndex' ? given.slice(1) : given, PLACES.relation);
      if (!by.from || !by.to) return warn(line, `not read: "${text}" does not say what it joins: write it as ${name}(${name === 'RelIndex' ? 'index, ' : ''}from, to, "label")`);
      return void relations.push({ from: by.from, to: by.to, label: words(by.label), techn: words(by.techn), way, line });
    }
    if (name === 'UpdateElementStyle') return look(sorted(given, PLACES.look), line);
    if (name === 'UpdateRelStyle') {
      const by = sorted(given, PLACES.linkLook);
      // Moving a link's words is asking Mermaid to mend its own placing, and Merlive places them itself.
      if (by.textColor || by.lineColor) once('link look', line, "UpdateRelStyle colours a link: a link's colour is the design's here, so it is read past");
      return;
    }
    // How many boxes Mermaid puts in a row is its own placing too.
    if (name === 'UpdateLayoutConfig') return;
    warn(line, `not read: "${text}": Mermaid's C4 has no ${name}`);
  };

  const read = (/** @type {string} */ raw, /** @type {number} */ line) => {
    // Words in quotes may run on down the lines: they are one line of words, read from where they began.
    const text = held ? `${held.text} ${raw}` : raw, from = held?.line ?? line;
    if ((text.match(/"/g) ?? []).length % 2) held = { text, line: from };
    else {
      held = null;
      const plain = uncommented(text);
      if (plain) statement(plain, from);
    }
    return true;
  };

  const done = () => {
    if (held) warn(held.line, `not read: quotes that are never closed, and everything after them: "${held.text}"`);
    for (const left of open) warn(left.line, `the boundary ${left.id} is never closed; end it with a line of }`);

    // A boundary with nothing in it, element or boundary, cannot be drawn as a group: a group is what it holds.
    // It is drawn as a box of its name, where it stands, which is what a node with nothing on it is.
    for (const b of bounds) {
      const group = model.groups.findIndex((g) => g.id === b.id);
      if (b.framed && (model.groups[group]?.members.length || bounds.some((inner) => inner.parent === b.id))) {
        if (b.descr) warn(b.line, `the node "${b.label}" is described as "${b.descr}", which is not drawn: a group has a name and nothing more`);
        continue;
      }
      if (group >= 0) model.groups.splice(group, 1);
      const n = node(b.id);
      declared.add(b.id);
      say(n, b.label);
      n.over = over(b.is, b.type);
      if (b.descr) n.text = b.descr;
      for (let up = b.parent; up !== undefined; up = bounds.find((x) => x.id === up)?.parent) model.groups.find((g) => g.id === up)?.members.push(b.id);
    }

    let nth = 0;
    const end = (/** @type {string} */ alias, /** @type {number} */ line) => {
      const id = idFor(alias);
      // A boundary is named as an element is; what joins it is taken to where it begins or ends by parse.mjs.
      if (!declared.has(id) && !bounds.some((b) => b.id === id)) once(`undeclared ${id}`, line, `a relation names "${alias}", which nothing declares: it is drawn as a box of that name; declare it with Person, System, Container or Component`);
      return node(id);
    };
    for (const r of relations) {
      const a = end(r.from, r.line), b = end(r.to, r.line);
      const label = [dynamic ? `${++nth}:` : '', r.label, r.techn ? `[${r.techn}]` : ''].filter(Boolean).join(' ');
      connect(r.way === 'back' ? b : a, r.way === 'back' ? a : b, { label, style: 'solid', head: 'arrow', tail: r.way === 'both' ? 'arrow' : 'none' }, r.line);
    }
  };

  return { read, done };
}
