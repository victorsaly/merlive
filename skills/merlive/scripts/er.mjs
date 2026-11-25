// Why: an entity diagram is boxes and links: entities, each with the attributes it lists, and relationships
// that say how many of one there are for one of the other. So it is not given a drawing of its own. Its lines
// are read here into the model a flowchart gives: an entity is a box with rows, a relationship a link that ends
// in a count. parse.mjs reads what the two share (front matter, comments, groups, classDef, Merlive's own
// lines) and hands the rest of each line to this reader, with the tools to make a box and a link. Pure.

/** @typedef {import('./parse.mjs').Model} Model */
/** @typedef {import('./parse.mjs').Node} Node */
/** @typedef {import('./parse.mjs').Edge} Edge */
/** @typedef {import('./parse.mjs').Mark} Mark */
/**
 * @typedef {object} Tools what parse.mjs lends, so an entity is made exactly as a flowchart's box is
 * @property {Model} model
 * @property {(id:string) => Node} node the box of this id, made if it is not there, and put in the group that is open
 * @property {(n:Node, words:string) => void} say gives a box its words
 * @property {(a:Node, b:Node, l:Pick<Edge,'label'|'style'|'head'|'tail'>, line:number) => unknown} connect
 * @property {(ids:string[], css:string) => void} outline keeps what a style says of these boxes, as parse.mjs does for a flowchart's
 * @property {(line:number, what:string) => void} warn
 * @property {(text:string) => string[]} wordsOf
 */

/**
 * How many, in every word Mermaid has for it, and the mark each is drawn as. The crow's foot marks themselves
 * ("||", "}o" and the rest) are in MARKS below; both may be written at either end of a relationship.
 * @type {Record<string, Mark>}
 */
export const cardinalities = {
  'one or zero': 'zero-or-one',
  'zero or one': 'zero-or-one',
  'one or more': 'one-or-many',
  'one or many': 'one-or-many',
  'many(1)': 'one-or-many',
  '1+': 'one-or-many',
  'zero or more': 'zero-or-many',
  'zero or many': 'zero-or-many',
  'many(0)': 'zero-or-many',
  '0+': 'zero-or-many',
  'only one': 'one',
  1: 'one',
};

// The crow's foot marks. The outer character is the most there can be and the inner the least, so each is
// written one way at the left of a relationship and mirrored at its right; Mermaid takes either at either end.
/** @type {Record<string, Mark>} */
const MARKS = { '|o': 'zero-or-one', 'o|': 'zero-or-one', '||': 'one', '}o': 'zero-or-many', 'o{': 'zero-or-many', '}|': 'one-or-many', '|{': 'one-or-many' };

// A relationship that gives the second entity its identity is a solid line; one that does not is dotted.
/** @type {Record<string, 'solid'|'dotted'>} */
const LINES = { '--': 'solid', '..': 'dotted', to: 'solid', 'optionally to': 'dotted' };

const escaped = (/** @type {string} */ s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Longest first, so "1+" is not read as "1" and "optionally to" not as "to".
const either = (/** @type {string[]} */ words) => [...words].sort((a, b) => b.length - a.length).map(escaped).join('|');

// An entity's name: words in quotes, or a run of anything that is not a space or one of the characters a
// relationship, an alias, a class or a block of attributes is written with.
const NAME = '"[^"]+"|[^\\s"{}|:\\[\\],]+?';
const ALIAS = '(?:\\[\\s*("[^"]*"|[^\\]"]*?)\\s*\\])?';
const CLASS = '(?::::([\\w-]+)(?:,[\\w,-]*)?)?';
const ENTITY = `(${NAME})${ALIAS}${CLASS}${ALIAS}`;
// How many: a mark, which may touch the name it follows, or words, which a space parts from it.
const MANY = (/** @type {string} */ gap) => `(?:\\s*(${either(Object.keys(MARKS))})|\\s${gap}(${either(Object.keys(cardinalities))})(?=\\s|$|-|\\.))`;

const READ = {
  // "<first> <how many><line><how many> <second> : <words>". Only the first entity must be there; a
  // relationship with no words is read as one with none, though Mermaid asks for them.
  relationship: new RegExp(`^(${NAME})${CLASS}${MANY('*')}\\s*(${either(Object.keys(LINES))})${MANY('*')}\\s*(${NAME})${CLASS}\\s*(?::\\s*(.*))?$`),
  entity: new RegExp(`^${ENTITY}\\s*(\\{\\s*(\\})?)?$`),
  crowded: new RegExp(`^${ENTITY}\\s*\\{.*\\S.*\\}$`),
  // "<type> <name> <keys> "<comment>"": a type may hold brackets, and between them a comma and a space.
  attribute: /^([^\s"(]+(?:\([^)]*\))?[^\s"]*)\s+(\*?[^\s"]+)(?:\s+((?:PK|FK|UK)(?:\s*,\s*(?:PK|FK|UK))*))?(?:\s+"([^"]*)")?$/,
  direction: /^direction\s+(TB|TD|BT|LR|RL)$/,
  kinds: /^class\s+(\S.*?)\s+([\w-]+)(?:,[\w,-]*)?$/,
  style: /^style\s+((?:"[^"]*"|[^\s",]+)(?:\s*,\s*(?:"[^"]*"|[^\s",]+))*)\s+(\S.*)$/,
  kept: /^(class|style|direction|subgraph|classDef|linkStyle)\b/,
  // What parse.mjs reads for every kind of diagram: groups, and what a class looks like.
  shared: /^(subgraph\s|end$|classDef\s|linkStyle\s)/,
};

/** A line with what comes after "%%" taken off, unless the "%%" is inside quotes. */
function uncommented(/** @type {string} */ text) {
  let quoted = false;
  for (let i = 0; i < text.length - 1; i++) {
    if (text[i] === '"') quoted = !quoted;
    else if (!quoted && text[i] === '%' && text[i + 1] === '%') return text.slice(0, i).trim();
  }
  return text;
}

/** A list written with commas, each item bare or in quotes, as the items themselves. */
const listed = (/** @type {string} */ text) => (text.match(/"[^"]*"|[^\s",]+/g) ?? []).map((x) => x.replace(/^"|"$/g, ''));

/**
 * The reader for one entity diagram. `read` takes each line parse.mjs does not read itself and says whether it
 * was the reader's; `done` finishes what can only be known once every line has been read.
 * @param {Tools} tools
 */
export function erReader({ model, node, say, connect, outline, warn, wordsOf }) {
  /** The id each name was given. A name may hold anything; an id holds only what Merlive's own lines can name. */
  /** @type {Map<string,string>} */
  const idOf = new Map();
  /** The entities there are, by id: the ones a box was made for. */
  /** @type {Map<string,Node>} */
  const made = new Map();
  /** The entity whose attributes are being read, and the line they opened on. */
  /** @type {{n:Node,name:string,line:number}|null} */
  let listing = null;
  /** How many groups are open: a group's own direction is its own, and is read past as a flowchart's is. */
  let groups = 0;
  let turned = false;
  /** Classes given by a "class" line, kept until every entity is known: one may be named before it is declared. */
  /** @type {[string[], string][]} */
  const classed = [];

  /** The id of a name: itself where it can be, else with "_" for what an id cannot hold, and a number if that is taken. */
  const idFor = (/** @type {string} */ written) => {
    const name = written.replace(/^"|"$/g, '');
    // A relationship may be with a group, which is named by its id exactly as its author wrote it.
    if (model.groups.some((g) => g.id === name)) return name;
    const known = idOf.get(name);
    if (known) return known;
    const plain = name.replace(/[^A-Za-z0-9_]/gu, '_'), taken = new Set(idOf.values());
    let id = plain;
    for (let n = 2; taken.has(id); n++) id = `${plain}_${n}`;
    idOf.set(name, id);
    return id;
  };

  /** The box of an entity, made the first time it is named, with its name for its words until it is given an alias. */
  const entity = (/** @type {string} */ written, /** @type {string|undefined} */ alias = undefined, /** @type {string|undefined} */ kind = undefined) => {
    const id = idFor(written), n = node(id);
    if (!made.has(id)) {
      made.set(id, n);
      // Mermaid reads a name in quotes as Markdown; a name without them is its letters and nothing else.
      say(n, /^".*"$/.test(written) ? `\`${written.slice(1, -1)}\`` : written);
    }
    if (alias !== undefined && alias.replace(/^"|"$/g, '').trim()) say(n, alias);
    if (kind) n.kind = kind;
    return n;
  };

  /** One attribute as its row: its type, its name, its keys, its comment, in the order Mermaid has them. */
  const attribute = (/** @type {string} */ text, /** @type {number} */ line) => {
    const read = READ.attribute.exec(text);
    if (!read) return void warn(line, `not read: "${text}" is not an attribute: write its type, then its name`);
    const [, type, name, keys = '', comment] = read;
    // A star before a name is another way of saying it is the primary key.
    const all = [...(name.startsWith('*') && !/\bPK\b/.test(keys) ? ['PK'] : []), ...keys.split(',').map((k) => k.trim()).filter(Boolean)];
    return [type, name.replace(/^\*/, ''), all.join(', '), comment === undefined ? '' : `"${wordsOf(comment).join(' ')}"`].filter(Boolean).join(' ');
  };

  const read = (/** @type {string} */ raw, /** @type {number} */ line) => {
    const text = uncommented(raw);
    if (!text) return true;

    if (listing) {
      if (text === '}') return (listing = null), true;
      const row = attribute(text, line);
      // Every attribute of an entity is in one compartment, however many times the entity is declared.
      if (row) (listing.n.rows ??= [[]])[0].push(row);
      return true;
    }
    if (text === '}') return warn(line, 'not read: a "}" with no entity open'), true;

    if (READ.shared.test(text)) {
      groups += text.startsWith('subgraph') ? 1 : text === 'end' ? -1 : 0;
      return false;
    }
    const way = READ.direction.exec(text);
    if (way) {
      if (groups > 0) return false;
      // Boxes of different heights are only placed top to bottom yet, so that is how every entity diagram runs.
      if (way[1] !== 'TB' && way[1] !== 'TD' && !turned) warn(line, `an entity diagram is drawn top to bottom for now: "${text}" is read past`);
      turned ||= way[1] !== 'TB' && way[1] !== 'TD';
      return true;
    }
    const kinds = READ.kinds.exec(text);
    // A box is of one kind: where several classes are given, the first is the one it is.
    if (kinds) return classed.push([listed(kinds[1]), kinds[2]]), true;
    const style = READ.style.exec(text);
    if (style) return outline(listed(style[1]).map(idFor), style[2]), true;

    // A word Mermaid keeps for itself, with nothing after it that could be read, is not an entity's name.
    if (READ.kept.test(text)) return warn(line, `not read: "${text}"`), true;

    const related = READ.relationship.exec(text);
    if (related) {
      const [, first, firstKind, leftMark, leftWords, between, rightMark, rightWords, second, secondKind, words] = related;
      const a = entity(first, undefined, firstKind), b = entity(second, undefined, secondKind);
      const tail = leftMark ? MARKS[leftMark] : cardinalities[leftWords], head = rightMark ? MARKS[rightMark] : cardinalities[rightWords];
      connect(a, b, { label: wordsOf(words ?? '').join(' '), style: LINES[between], head, tail }, line);
      return true;
    }
    const alone = READ.entity.exec(text);
    if (alone) {
      const [, name, aliasBefore, kind, aliasAfter, opens, closes] = alone;
      const n = entity(name, aliasBefore ?? aliasAfter, kind);
      if (opens && !closes) listing = { n, name: name.replace(/^"|"$/g, ''), line };
      return true;
    }
    if (READ.crowded.test(text)) return warn(line, `not read: "${text}"; write each attribute on a line of its own, between { and }`), true;
    return warn(line, `not read: "${text}"`), true;
  };

  const done = () => {
    if (listing) warn(listing.line, `the attributes of ${listing.name} are never closed; end them with a line of }`);
    for (const [names, kind] of classed) {
      for (const n of names.map((name) => made.get(idOf.get(name) ?? name)).filter((x) => x !== undefined)) n.kind = kind;
    }
  };

  return { read, done };
}
