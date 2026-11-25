// Why: a requirement diagram is boxes and links: requirements, the elements that meet them, and relationships
// that say how one bears on another. So it is not given a drawing of its own. Its lines are read here into the
// model a flowchart gives: a requirement or an element is a box that says what it is above its name, lists the
// few things said of it as rows, and carries its text as the sentence about it; a relationship is a link that
// says its word. parse.mjs reads what every kind shares (front matter, comments, classDef, Merlive's own lines)
// and hands the rest of each line to this reader, with the tools to make a box and a link. Pure.

/** @typedef {import('./parse.mjs').Model} Model */
/** @typedef {import('./parse.mjs').Node} Node */
/** @typedef {import('./parse.mjs').Edge} Edge */
/**
 * @typedef {object} Tools what parse.mjs lends, so a requirement is made exactly as a flowchart's box is
 * @property {Model} model
 * @property {(id:string) => Node} node the box of this id, made if it is not there
 * @property {(n:Node, words:string) => void} say gives a box its words
 * @property {(a:Node, b:Node, l:Pick<Edge,'label'|'style'|'head'|'tail'>, line:number) => unknown} connect
 * @property {(ids:string[], css:string) => void} outline keeps what a style says of these boxes, as parse.mjs does for a flowchart's
 * @property {(line:number, what:string) => void} warn
 * @property {(text:string) => string[]} wordsOf
 */

/**
 * Every word that opens a thing in a requirement diagram, as Mermaid's reader sees it (it takes any case), with
 * what the thing is called above its name and which of the two families it is: the two are told different things.
 * @type {Record<string, {called:string, family:'requirement'|'element'}>}
 */
export const things = {
  requirement: { called: 'requirement', family: 'requirement' },
  functionalrequirement: { called: 'functional requirement', family: 'requirement' },
  interfacerequirement: { called: 'interface requirement', family: 'requirement' },
  performancerequirement: { called: 'performance requirement', family: 'requirement' },
  physicalrequirement: { called: 'physical requirement', family: 'requirement' },
  designconstraint: { called: 'design constraint', family: 'requirement' },
  element: { called: 'element', family: 'element' },
};

// How one thing bears on another. Mermaid draws six of the seven as a broken line with an arrowhead at the
// thing written second. "contains" it draws as a solid line with a crossed ring at the thing that contains and
// nothing at the other end: the nearest mark there is here is the circle.
const BEARS = /** @type {const} */ ({ style: 'dotted', tail: 'none', head: 'arrow' });
/** @type {Record<string, Pick<Edge,'style'|'head'|'tail'>>} */
export const relationships = {
  contains: { style: 'solid', tail: 'circle', head: 'none' },
  copies: BEARS,
  derives: BEARS,
  satisfies: BEARS,
  verifies: BEARS,
  refines: BEARS,
  traces: BEARS,
};

// What is said of each family, by the word its author writes (in any case), in the order it is listed in, with
// the word a reader is shown. A requirement's text is not a row: it is the sentence about the box.
const SAID = /** @type {const} */ ({
  requirement: { id: 'id', text: 'text', risk: 'risk', verifymethod: 'verify' },
  element: { type: 'type', docref: 'doc' },
});
const HAS = { requirement: 'an id, a text, a risk and a verifymethod', element: 'a type and a docref' };
// The only values Mermaid takes for these two; anything else it will not draw.
const KNOWN = {
  risk: { values: ['low', 'medium', 'high'], called: 'the risk', list: 'low, medium and high' },
  verify: { values: ['analysis', 'demonstration', 'inspection', 'test'], called: 'the way to verify', list: 'analysis, demonstration, inspection and test' },
};

// A name: words in quotes, or a run of anything a relationship, a class or a block is not written with.
const NAME = '"[^"]*"|[^\\s"<>{}:-](?:[^"<>{}:-]*[^\\s"<>{}:-])?';
const CLASSES = '[\\w-]+(?:\\s*,\\s*[\\w-]+)*';
const READ = {
  thing: new RegExp(`^(${Object.keys(things).join('|')})\\s+(\\S.*)$`, 'i'),
  // After the word that opens it: its name, its classes if it is given any, and the { its fields open with.
  opens: new RegExp(`^(${NAME})\\s*(?::::\\s*(${CLASSES}))?\\s*(\\{)?\\s*(.*)$`),
  field: /^(\w+)\s*:\s*(\S.*)$/,
  // "<from> - <word> -> <to>", and the same relationship written from its other end: "<to> <- <word> - <from>".
  forward: new RegExp(`^(${NAME})\\s*-\\s*(\\w+)\\s*->\\s*(${NAME})$`),
  backward: new RegExp(`^(${NAME})\\s*<-\\s*(\\w+)\\s*-\\s*(${NAME})$`),
  classed: new RegExp(`^(${NAME})\\s*:::\\s*(${CLASSES})$`),
  direction: /^direction\s+(TB|TD|BT|LR|RL)$/,
  kinds: /^class\s+(\S.*?)\s+([\w-]+)(?:,[\w,-]*)?$/,
  style: /^style\s+((?:"[^"]*"|[^\s",]+)(?:\s*,\s*(?:"[^"]*"|[^\s",]+))*)\s+(\S.*)$/,
  // What parse.mjs reads for every kind of diagram: what a class looks like.
  shared: /^(classDef|linkStyle)\s/,
};

/** A list written with commas, each item bare or in quotes, as the items themselves. */
const listed = (/** @type {string} */ text) => (text.match(/"[^"]*"|[^\s",]+/g) ?? []).map((x) => x.replace(/^"|"$/g, ''));
const unquoted = (/** @type {string} */ written) => written.replace(/^"([^]*)"$/, '$1').trim();

/**
 * The reader for one requirement diagram. `read` takes each line parse.mjs does not read itself and says
 * whether it was the reader's; `done` finishes what can only be known once every line has been read.
 * @param {Tools} tools
 */
export function requirementReader({ node, say, connect, outline, warn, wordsOf }) {
  /** The id each name was given. A name may hold anything; an id holds only what Merlive's own lines can name. */
  /** @type {Map<string,string>} */
  const idOf = new Map();
  /** The ids a box has been made for. */
  /** @type {Set<string>} */
  const made = new Set();
  /** What was declared, by id: its box, which family it is, and what has been said of it so far. */
  /** @type {Map<string,{n:Node,name:string,family:'requirement'|'element',called:string,said:Record<string,string>}>} */
  const declared = new Map();
  /** What a relationship named before anything declared it, with the line it was first named on. */
  /** @type {Map<string,{name:string,line:number}>} */
  const named = new Map();
  /** The thing whose fields are being read (nothing, for one whose fields are not kept), and the line they opened on. */
  /** @type {{of:ReturnType<typeof declared.get>,name:string,line:number}|null} */
  let listing = null;
  let turned = false;
  /** Classes given by a line of their own, kept until everything is known: a name may be classed before it is declared. */
  /** @type {[string[], string, number][]} */
  const classed = [];

  /** The id of a name: itself where it can be, else with "_" for what an id cannot hold, and a number if that is taken. */
  const idFor = (/** @type {string} */ written) => {
    const name = unquoted(written), known = idOf.get(name);
    if (known) return known;
    const plain = name.replace(/[^A-Za-z0-9_]/gu, '_'), taken = new Set(idOf.values());
    let id = plain;
    for (let n = 2; taken.has(id); n++) id = `${plain}_${n}`;
    idOf.set(name, id);
    return id;
  };

  /** The box of a name, made the first time it is met. Mermaid reads a name as Markdown, in quotes or not. */
  const box = (/** @type {string} */ written) => {
    const id = idFor(written), n = node(id);
    if (!made.has(id)) say(n, `\`${unquoted(written)}\``);
    made.add(id);
    return n;
  };

  /** Gives a box what its thing is called, the rows that list what was said of it, and its sentence. */
  const settle = (/** @type {NonNullable<ReturnType<typeof declared.get>>} */ { n, family, called, said }) => {
    n.over = `«${called}»`;
    const rows = Object.entries(SAID[family]).filter(([key, shown]) => shown !== 'text' && said[key] !== undefined).map(([key, shown]) => `${shown}: ${said[key]}`);
    if (rows.length) n.rows = [rows];
    else delete n.rows;
    if (said.text) n.text = said.text;
    else delete n.text;
  };

  /** Declares a requirement or an element. What Mermaid does with a name declared twice is done here, and said. */
  const declare = (/** @type {string} */ word, /** @type {string} */ written, /** @type {number} */ line) => {
    const { called, family } = things[word.toLowerCase()], n = box(written), name = unquoted(written), was = declared.get(n.id);
    named.delete(n.id);
    // Mermaid keeps requirements and elements apart and, where a name is both, draws the element.
    if (was && was.family !== family) warn(line, `${name} is both a requirement and an element: it is drawn as the element, as Mermaid draws it`);
    else if (was) warn(line, `${name} is declared twice: the first is kept, as Mermaid keeps it`);
    if (was && (was.family === family || family === 'requirement')) return undefined;
    const of = { n, name, family, called, said: {} };
    declared.set(n.id, of);
    settle(of);
    return of;
  };

  /** One thing said of what is open: "id: 1", "text: …", "type: …". The first of each is kept, as Mermaid keeps it. */
  const field = (/** @type {string} */ text, /** @type {number} */ line) => {
    const of = listing?.of, read = READ.field.exec(text);
    if (!read) return void warn(line, `not read: "${text}"`);
    // What is said of a thing whose own declaration is not kept goes with it.
    if (!of) return;
    const key = read[1].toLowerCase(), shown = /** @type {Record<string,string>} */ (SAID[of.family])[key];
    if (!shown) return void warn(line, `not read: "${text}" is not said of ${of.family === 'element' ? 'an' : 'a'} ${of.family}: it has ${HAS[of.family]}`);
    if (of.said[key] !== undefined) return void warn(line, `"${text}" is the second ${key} of ${of.name}: the first is kept, as Mermaid keeps it`);
    // A text is read as Markdown, as Mermaid reads it, and kept as plain words on one line.
    let value = wordsOf(shown === 'text' ? `\`${unquoted(read[2])}\`` : read[2]).join(' ');
    const known = KNOWN[/** @type {keyof typeof KNOWN} */ (shown)];
    if (known && known.values.includes(value.toLowerCase())) value = value.toLowerCase();
    else if (known) warn(line, `${known.called} "${value}" is kept as written, but Mermaid only knows ${known.list}: write one of those`);
    of.said[key] = value;
    settle(of);
  };

  const relate = (/** @type {string} */ from, /** @type {string} */ word, /** @type {string} */ to, /** @type {string} */ text, /** @type {number} */ line) => {
    const look = relationships[word.toLowerCase()];
    if (!look) return void warn(line, `not read: "${text}": "${word}" is not a relationship; write ${Object.keys(relationships).slice(0, -1).join(', ')} or traces`);
    const [a, b] = [from, to].map((written) => {
      const n = box(written);
      if (!declared.has(n.id) && !named.has(n.id)) named.set(n.id, { name: unquoted(written), line });
      return n;
    });
    connect(a, b, { label: word.toLowerCase(), ...look }, line);
  };

  const read = (/** @type {string} */ text, /** @type {number} */ line) => {

    if (listing) {
      if (text === '}') listing = null;
      else field(text, line);
      return true;
    }
    if (text === '}') return warn(line, 'not read: a "}" with nothing open'), true;
    if (READ.shared.test(text)) return false;

    const way = READ.direction.exec(text);
    if (way) {
      // Boxes of different heights are only placed top to bottom yet, so that is how every requirement diagram runs.
      if (way[1] !== 'TB' && way[1] !== 'TD' && !turned) warn(line, `a requirement diagram is drawn top to bottom for now: "${text}" is read past`);
      turned ||= way[1] !== 'TB' && way[1] !== 'TD';
      return true;
    }
    const kinds = READ.kinds.exec(text);
    // A box is of one kind: where several classes are given, the first is the one it is.
    if (kinds) return classed.push([listed(kinds[1]), kinds[2], line]), true;
    const style = READ.style.exec(text);
    if (style) return outline(listed(style[1]).map(idFor), style[2]), true;

    const thing = READ.thing.exec(text), opens = thing && READ.opens.exec(thing[2]);
    if (thing && opens) {
      // Mermaid takes "%%" for a comment on a line of its own, which parse.mjs reads past, and after the { that
      // opens a thing. Anywhere else it is part of the words, and is kept as that.
      const [, name, classes, brace] = opens, rest = opens[4].replace(/^%%.*$/, '');
      // Mermaid takes a bare name of letters, digits and spaces; anything else in one ends it too soon.
      if (!brace && rest) return warn(line, `not read: "${text}"; put its name in quotes if it holds more than letters, digits and spaces`), true;
      if (!brace) return warn(line, `not read: "${text}"; open what is said of it with { at the end of this line, and close it with } on a line of its own`), true;
      if (rest && rest !== '}') return warn(line, `not read: "${text}"; write each thing said of it on a line of its own, between { and }`), true;
      const of = declare(thing[1], name, line);
      if (of && classes) of.n.kind = classes.split(',')[0].trim();
      if (!rest) listing = { of, name: unquoted(name), line };
      return true;
    }

    const forward = READ.forward.exec(text);
    if (forward) return relate(forward[1], forward[2], forward[3], text, line), true;
    const backward = READ.backward.exec(text);
    if (backward) return relate(backward[3], backward[2], backward[1], text, line), true;
    const alone = READ.classed.exec(text);
    if (alone) return classed.push([[unquoted(alone[1])], alone[2].split(',')[0].trim(), line]), true;
    return warn(line, `not read: "${text}"`), true;
  };

  const done = () => {
    if (listing) warn(listing.line, `what is said of ${listing.name} is never closed; end it with a line of }`);
    for (const { name, line } of named.values()) warn(line, `${name} is in a relationship and is never declared: it is drawn as a plain box, and Mermaid will not draw this diagram; declare it as a requirement or an element`);
    for (const [names, kind, line] of classed) {
      for (const name of names) {
        const of = declared.get(idOf.get(name) ?? '');
        if (of) of.n.kind = kind;
        else warn(line, `a class is given to "${name}", which is not a requirement or an element here`);
      }
    }
  };

  return { read, done };
}
