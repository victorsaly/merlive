// Why: a sequence diagram is who says what to whom, in order. Mermaid's own sets the words of a long message
// across the lifelines between, and spaces participants by whatever falls out. Merlive reads the same text and
// places it by rule: participants one size and one step apart, a message to a row, its words beside its
// sender and off every lifeline, frames that hold exactly what is in them. The rules are in docs/SEQUENCE.md,
// and each is a check here. Pure: text in, a model out; a model in, coordinates out.

import { linesIn, notingTags, unclosed, wordsOf } from './parse.mjs';
import { wrap } from './layout.mjs';
import { colourChecks, colourLimits, contrast, looksOf, mix } from './design.mjs';
import { draw } from './render.mjs';

/** @typedef {'none'|'arrow'|'open'|'cross'|'half-top'|'half-bottom'|'stick-top'|'stick-bottom'} End what is drawn at an end of a message; top is the left-hand side of the way the line goes, which is above a line that goes right */
/** @typedef {'box'|'person'|'boundary'|'control'|'entity'|'database'|'collections'|'queue'} Mark how a participant is drawn */
/** @typedef {{id:string,label:string,breaks?:string[],role:string,kind:string,shape:Mark,created?:number,destroyed?:number}} Participant created, destroyed: the item that makes it or ends it */
/** @typedef {{type:'message',id:string,from:string,to:string,label:string,lines:string[],style:'solid'|'dotted',head:End,tail:End,headDot?:boolean,tailDot?:boolean,number:number,line:number}} Message headDot, tailDot: the end meets the middle of the lifeline, in a dot */
/** @typedef {{type:'note',id:string,place:'left'|'right'|'over',over:string[],label:string,lines:string[],line:number}} Note */
/** @typedef {{type:'open'|'else'|'close',block:number,section:number}} Edge the top of a block, the start of one of its later sections, its foot */
/** @typedef {Message|Note|Edge} Item */
/** @typedef {{id:string,kind:string,label:string,sections:string[],parent:number,line:number}} Block */
/** @typedef {{of:string,from:number,to:number|null,depth:number}} Activation from and to: items; depth: how many of the same participant were already open */
/**
 * @typedef {object} SequenceModel
 * @property {'sequence'} type
 * @property {string} kindOfDiagram
 * @property {string} title
 * @property {string} heading the title its author meant to be seen on the picture, not one written only for a reader who cannot see it
 * @property {string} describes
 * @property {Participant[]} participants in the order they stand, left to right
 * @property {Item[]} items everything that takes a row, in the order it was written
 * @property {Block[]} blocks loop, alt, opt, par, critical, break and rect, each with the names of its later sections
 * @property {{title:string,members:string[]}[]} groups the author's boxes round participants
 * @property {Activation[]} activations
 * @property {boolean} mirror whether every participant is drawn again at the foot of its lifeline: yes, unless its author turned mirrorActors off
 * @property {string[]} warnings
 */

// What is measured, named once. Sizes are worked out without a browser, from the average glyph of a UI face.
export const across = {
  widths: [96, 112, 128, 160, 192, 224], // the only widths a participant's box has; a diagram uses one of them throughout
  padBox: 24, // left and right inside a participant's box
  glyph: 7.1, // px per character of a participant's name at 13px
  headLine: 16, // px between two lines of a name
  headPad: 24, // above and below a name, together
  mostLines: 4, // of a name, and only when its author wrote that many; a plain name is wrapped to two
  mark: 30, // the height of the drawing of a person, a boundary, a control, an entity or a database, which has its name under it
  markGap: 4, // between such a drawing and the name under it
  markFoot: 4, // between that name and the lifeline that starts under it
  markHalf: 26, // how far from its middle a line stops that is drawn to such a drawing: clear of a boundary's bar, the widest of them
  stack: 5, // how far the second sheet of a collection shows behind the first, up and to the right
  cap: 8, // half the width of the round end of a queue, a cylinder on its side
  gap: 32, // the least room between two participants' boxes
  mostStep: 320, // the most from one lifeline to the next: past this a diagram of four no longer fits a laptop
  wordGlyph: 6.9, // px per character of a message's words at 12px
  wordWrap: 26, // characters a line of a message's words runs to before it wraps
  wordLine: 15, // px between two lines of a message's words
  wordOff: 6, // px between a message's words and its line
  clear: 12, // the least between words and the lifelines either side of them
  rowGap: 22, // between one row and the next
  top: 22, // from the participants' boxes to the first row, and from the last row to the foot
  selfOut: 28, // how far out a message to itself goes
  selfDown: 22, // and how far down before it comes back
  bar: 10, // the width of the bar that shows a participant is at work
  barStep: 5, // how far a second bar on the same participant sits to the right of the first
  noteGlyph: 6.6, // px per character of a note at 12px
  noteWrap: 28, // characters a line of a note runs to before it wraps
  noteLine: 15, // px between two lines of a note
  notePad: 9, // inside a note, all round
  noteOff: 10, // from a lifeline to a note beside it
  noteOver: 14, // how far a note over two participants reaches past their lifelines
  mostNoteLines: 6, // of a note: more than this is a paragraph, and belongs in the document
  frameHead: 24, // the row a frame's name takes, and the start of each later section
  framePad: 12, // from what a frame holds to its sides
  tagGlyph: 7.2, // px per character of a frame's kind, in capitals at 10.5px
  nameOff: 16, // from the first lifeline a frame is about to where the frame's name starts: past any bars on it
  tabClear: 8, // the least from the tab that names a frame's kind to the nearest lifeline the frame is about
  groupPad: 10, // from a group's participants to its frame
  groupTitle: 20, // the row a group's title takes, above its participants, when it is one line
  groupLine: 14, // px between two lines of a group's title
  groupGlyph: 7.9, // px per character of a group's title: 11px capitals, heavy and spaced
  number: 8, // the radius of the disc a message's number sits in
  cross: 6, // how far below its last message a participant that is destroyed ends
  dot: 4, // the radius of the dot where a message meets the middle of a lifeline
  pad: 28, // around the whole drawing
};

// Every arrow Mermaid has for a message, longest first so "-->>" is not read as "-->" and then ">". The last
// says the line is drawn back to the one named first: Mermaid's "reverse" half arrows, whose head is at the
// near end. What is above such a line when read from left to right is on the right-hand side of the way it goes.
const ARROWS = /** @type {[string,'solid'|'dotted',End,End,boolean][]} */ ([
  ['<<-->>', 'dotted', 'arrow', 'arrow', false],
  ['<<->>', 'solid', 'arrow', 'arrow', false],
  ['-->>', 'dotted', 'arrow', 'none', false],
  ['--|\\', 'dotted', 'half-top', 'none', false],
  ['--|/', 'dotted', 'half-bottom', 'none', false],
  ['--\\\\', 'dotted', 'stick-top', 'none', false],
  ['--//', 'dotted', 'stick-bottom', 'none', false],
  ['/|--', 'dotted', 'half-bottom', 'none', true],
  ['\\|--', 'dotted', 'half-top', 'none', true],
  ['//--', 'dotted', 'stick-bottom', 'none', true],
  ['\\\\--', 'dotted', 'stick-top', 'none', true],
  ['->>', 'solid', 'arrow', 'none', false],
  ['--x', 'dotted', 'cross', 'none', false],
  ['--)', 'dotted', 'open', 'none', false],
  ['-->', 'dotted', 'none', 'none', false],
  ['-|\\', 'solid', 'half-top', 'none', false],
  ['-|/', 'solid', 'half-bottom', 'none', false],
  ['-\\\\', 'solid', 'stick-top', 'none', false],
  ['-//', 'solid', 'stick-bottom', 'none', false],
  ['/|-', 'solid', 'half-bottom', 'none', true],
  ['\\|-', 'solid', 'half-top', 'none', true],
  ['//-', 'solid', 'stick-bottom', 'none', true],
  ['\\\\-', 'solid', 'stick-top', 'none', true],
  ['-x', 'solid', 'cross', 'none', false],
  ['-)', 'solid', 'open', 'none', false],
  ['->', 'solid', 'none', 'none', false],
]);

// How each kind of participant is drawn. Mermaid has a symbol for each; so does Merlive, drawn its own way.
/** @type {Record<string, Mark>} */
const MARKS = { actor: 'person', boundary: 'boundary', control: 'control', entity: 'entity', database: 'database', collections: 'collections', queue: 'queue' };
/** Whether a participant's name sits under its drawing, not inside it. */
export const namedUnder = (/** @type {{shape:Mark}} */ p) => p.shape === 'person' || p.shape === 'boundary' || p.shape === 'control' || p.shape === 'entity' || p.shape === 'database';

// The colours CSS has names for. A group may open with one ("box Aqua Buying"), and it is the group's colour, not
// the first word of its title. The colour itself is read past: the look is the design's.
const COLOURS = new Set('aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato transparent turquoise violet wheat white whitesmoke yellow yellowgreen'.split(' '));

/** Whether a Mermaid block is a sequence diagram: its first line that says anything, past front matter and comments. */
export function isSequence(/** @type {string} */ src) {
  let front = 'before';
  for (const raw of linesIn(src)) {
    const text = raw.trim();
    if (!text) continue;
    if (front === 'before') {
      front = text === '---' ? 'in' : 'after';
      if (front === 'in') continue;
    }
    if (front === 'in') {
      if (text === '---') front = 'after';
      continue;
    }
    if (!text.startsWith('%%')) return /^sequenceDiagram\b/.test(text);
  }
  return false;
}

/**
 * @param {string} src one Mermaid block that is a sequence diagram
 * @returns {SequenceModel}
 */
export const parseSequence = (src) => notingTags(() => read(src));

function read(/** @type {string} */ src) {
  /** @type {SequenceModel} */
  const model = { type: 'sequence', kindOfDiagram: 'sequenceDiagram', title: '', heading: '', describes: '', participants: [], items: [], blocks: [], groups: [], activations: [], mirror: true, warnings: [] };
  /** @type {Map<string, Participant>} */
  const byId = new Map();
  const warn = (/** @type {number} */ line, /** @type {string} */ what) => model.warnings.push(`line ${line}: ${what}`);
  // What is open at this line, outermost first: blocks, and the boxes round participants. One "end" closes either.
  /** @type {{what:'block'|'group',index:number,line:number}[]} */
  const open = [];
  /** @type {Map<string, Activation[]>} */
  const active = new Map();
  let counting = false, next = 1, by = 1;
  let lastMessage = -1, messages = 0, notes = 0;
  /** @type {{id:string,line:number}|null} */
  let making = null;
  /** @type {{id:string,line:number}|null} */
  let ending = null;

  const who = (/** @type {string} */ id) => {
    let p = byId.get(id);
    if (!p) {
      p = { id, label: id, role: 'participant', kind: 'step', shape: 'box' };
      byId.set(id, p);
      model.participants.push(p);
      // A participant is in the group it is first named in.
      const group = open.findLast((o) => o.what === 'group');
      if (group) model.groups[group.index].members.push(id);
    }
    return p;
  };

  /** "participant B as Buyer", "actor B", "participant D@{ "type": "database", "alias": "Orders" } as Order book". */
  const declare = (/** @type {string} */ keyword, /** @type {string} */ rest) => {
    const m = /^(.+?)(?:\s*@\{([^}]*)\})?(?:\s+as\s+(.+))?$/.exec(rest);
    if (!m) return null;
    const p = who(m[1].trim());
    const type = /"?type"?\s*:\s*"?([\w-]+)"?/.exec(m[2] ?? '')?.[1];
    // The name after "as" wins over one inside the braces, as it does in Mermaid.
    const lines = wordsOf(m[3] ?? /"?alias"?\s*:\s*"([^"]*)"/.exec(m[2] ?? '')?.[1] ?? p.id);
    p.label = lines.join(' ') || p.id;
    if (lines.length > 1) p.breaks = lines;
    else delete p.breaks;
    p.role = type ?? keyword;
    // A person is a figure, of the kind that is outside; a database is a cylinder, of the kind that holds data.
    // Each of the other symbols Mermaid has is a drawing of its own; a type Merlive has never met is a plain box.
    p.shape = MARKS[p.role] ?? 'box';
    p.kind = p.role === 'actor' ? 'external' : p.role === 'database' ? 'data' : 'step';
    return p;
  };

  const begin = (/** @type {string} */ id, /** @type {number} */ at) => {
    const stack = active.get(id) ?? [];
    /** @type {Activation} */
    const a = { of: who(id).id, from: at, to: null, depth: stack.length };
    stack.push(a);
    active.set(id, stack);
    model.activations.push(a);
  };
  const finish = (/** @type {string} */ id, /** @type {number} */ at, /** @type {number} */ line) => {
    const a = active.get(id)?.pop();
    if (!a) return warn(line, `${id} is not active, so there is nothing to deactivate`);
    a.to = Math.max(at, a.from);
  };

  /** "Buyer->>+ERP: Raise order": who, the arrow, whether it starts or ends a bar, to whom, and the words. */
  const message = (/** @type {string} */ s, /** @type {number} */ line) => {
    const colon = s.indexOf(':');
    const head = colon < 0 ? s : s.slice(0, colon);
    // A name may hold a dash and an x ("Fed-ex"), so every place an arrow could be is tried, and the one with a
    // participant already known on each side of it wins.
    // "()" beside a name is the middle of that participant's line: the message meets it there, in a dot.
    /** @type {{from:string,to:string,sign:string,arrow:typeof ARROWS[number],known:number,tailDot:boolean,headDot:boolean}[]} */
    const tries = [];
    for (let i = 1; i < head.length; i++) {
      const arrow = ARROWS.find(([a]) => head.startsWith(a, i));
      if (!arrow) continue;
      const rest = /^\s*(\(\))?\s*([+-]?)\s*(\(\))?\s*(.+?)\s*$/.exec(head.slice(i + arrow[0].length));
      const near = /^(.*?)\s*(\(\))?$/.exec(head.slice(0, i).trim()), from = near?.[1] ?? '';
      if (from && rest) tries.push({ from, to: rest[4], sign: rest[2], arrow, known: Number(byId.has(from)) + Number(byId.has(rest[4])), tailDot: Boolean(near?.[2]), headDot: Boolean(rest[1] || rest[3]) });
    }
    const found = tries.sort((a, b) => b.known - a.known)[0];
    if (!found) return false;
    const at = model.items.length, lines = wordsOf(colon < 0 ? '' : s.slice(colon + 1));
    const [, style, endHead, endTail, back] = found.arrow;
    // The one named first stands first, whichever way the line is drawn.
    const first = who(found.from).id, second = who(found.to).id;
    const [from, to] = back ? [second, first] : [first, second];
    const dots = { ...((back ? found.tailDot : found.headDot) ? { headDot: true } : {}), ...((back ? found.headDot : found.tailDot) ? { tailDot: true } : {}) };
    model.items.push({ type: 'message', id: `m${++messages}`, from, to, label: lines.join(' '), lines, style, head: endHead, tail: endTail, ...dots, number: counting ? next : 0, line });
    if (counting) next += by;
    lastMessage = at;
    if (found.sign === '+') begin(second, at);
    if (found.sign === '-') finish(first, at, line);
    if (making) {
      if (making.id === to && from !== to) /** @type {Participant} */ (byId.get(to)).created = at;
      else warn(making.line, `nothing makes ${making.id}: the message after "create" must go to it`);
      making = null;
    }
    if (ending) {
      if (ending.id === to || ending.id === from) /** @type {Participant} */ (byId.get(ending.id)).destroyed = at;
      else warn(ending.line, `nothing ends ${ending.id}: the message after "destroy" must be to or from it`);
      ending = null;
    }
    return true;
  };

  const statement = (/** @type {string} */ s, /** @type {number} */ line) => {
    let m;
    if ((m = /^title\s*:?\s+(.+)$/i.exec(s))) return void (model.title = model.heading = wordsOf(m[1]).join(' '));
    if ((m = /^autonumber(?:\s+(off|\d+)(?:\s+(\d+))?)?$/.exec(s))) {
      counting = m[1] !== 'off';
      if (m[1] && m[1] !== 'off') next = Number(m[1]);
      if (m[2]) by = Number(m[2]);
      return;
    }
    if ((m = /^(create\s+)?(participant|actor)\s+(.+)$/.exec(s))) {
      const p = declare(m[2], m[3]);
      if (!p) return warn(line, `not read: "${s}"`);
      if (m[1]) making = { id: p.id, line };
      return;
    }
    if ((m = /^destroy\s+(.+)$/.exec(s))) return void (ending = { id: who(m[1].trim()).id, line });
    if ((m = /^box(?:\s+(.*))?$/.exec(s))) {
      // "box Aqua Buying", "box rgb(33,66,99) Buying", "box Buying": the colour, if there is one, comes first.
      const colour = /^(?:(?:rgba?|hsla?)\([^)]*\)|#[0-9a-f]{3,8}\b|([a-z]+)\b)\s*/i.exec(m[1] ?? '');
      const title = colour && (colour[1] === undefined || COLOURS.has(colour[1].toLowerCase())) ? (m[1] ?? '').slice(colour[0].length) : m[1] ?? '';
      open.push({ what: 'group', index: model.groups.push({ title: wordsOf(title).join(' '), members: [] }) - 1, line });
      return;
    }
    if ((m = /^(loop|alt|opt|par|critical|break|rect)(?:\s+(.*))?$/.exec(s))) {
      const parent = open.findLast((o) => o.what === 'block')?.index ?? -1;
      // A rect is a highlight behind some rows. What follows the word is its colour, and the look is the design's.
      const index = model.blocks.push({ id: `b${model.blocks.length + 1}`, kind: m[1], label: m[1] === 'rect' ? '' : wordsOf(m[2] ?? '').join(' '), sections: [], parent, line }) - 1;
      open.push({ what: 'block', index, line });
      model.items.push({ type: 'open', block: index, section: 0 });
      return;
    }
    if ((m = /^(else|and|option)(?:\s+(.*))?$/.exec(s))) {
      const block = open.findLast((o) => o.what === 'block');
      if (!block) return warn(line, `this "${m[1]}" is in no block; it belongs between "alt", "par" or "critical" and their "end"`);
      const section = model.blocks[block.index].sections.push(wordsOf(m[2] ?? '').join(' '));
      model.items.push({ type: 'else', block: block.index, section });
      return;
    }
    if (s === 'end') {
      const closed = open.pop();
      if (!closed) return warn(line, 'this "end" closes nothing');
      if (closed.what === 'block') model.items.push({ type: 'close', block: closed.index, section: 0 });
      return;
    }
    // A bar starts and ends at the last message, as it does in Mermaid: "activate" follows the message it is about.
    if ((m = /^(activate|deactivate)\s+(.+)$/.exec(s))) return m[1] === 'activate' ? begin(m[2].trim(), Math.max(lastMessage, 0)) : finish(m[2].trim(), Math.max(lastMessage, 0), line);
    if ((m = /^note\s+(left of|right of|over)\s+([^:]+):\s*(.*)$/i.exec(s))) {
      const over = m[2].split(',').map((id) => who(id.trim()).id).slice(0, 2);
      const lines = wordsOf(m[3]);
      model.items.push({ type: 'note', id: `n${++notes}`, place: /** @type {Note['place']} */ (m[1].toLowerCase().split(' ')[0]), over, label: lines.join(' '), lines, line });
      return;
    }
    // The menus Mermaid hangs on a participant open links. A page of Merlive opens none, so they are read past.
    if (/^(links?|properties|details)\s+[^:]+:/.test(s)) return;
    if (!message(s, line)) warn(line, `not read: "${s}"`);
  };

  /** A line cut at each ; that does not end an entity code ("#59;" is how a message holds a semicolon, "&lt;" a <). */
  const statementsIn = (/** @type {string} */ text) => text.split(/(?<!#\w+|&#x?[0-9a-f]+|&(?:quot|amp|lt|gt|apos|nbsp));/i).map((x) => x.trim()).filter(Boolean);

  /** @type {'before'|'in'|'after'} */
  let front = 'before';
  let header = false;
  /** @type {string[]|null} */
  let describing = null;
  linesIn(src).forEach((raw, i) => {
    const text = raw.trim(), line = i + 1;
    if (!text) return;
    if (front === 'before') {
      front = text === '---' ? 'in' : 'after';
      if (front === 'in') return;
    }
    if (front === 'in') {
      const title = /^title\s*:\s*(.*?)\s*$/.exec(raw);
      if (title) model.title = model.heading = title[1].replace(/^(["'])(.*)\1$/, '$2');
      // Mermaid draws every participant again at the foot unless its author says not to.
      if (/^mirrorActors\s*:\s*false\b/.test(text)) model.mirror = false;
      if (text === '---') front = 'after';
      return;
    }
    if (/^%%\{.*\bmirrorActors["']?\s*:\s*false\b/.test(text)) model.mirror = false;
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
    if (unclosed(text)) warn(line, unclosed(text));
    if (text.startsWith('%%')) return;
    if (!header) return void (header = true);
    for (const part of statementsIn(text)) statement(part, line);
  });

  // What was left open is said, and closed where the text ends, so the rest is still drawn.
  for (const left of open.reverse()) {
    if (left.what === 'group') warn(left.line, 'this box is never closed; end it with a line of "end"');
    else {
      warn(left.line, `this ${model.blocks[left.index].kind} is never closed; end it with a line of "end"`);
      model.items.push({ type: 'close', block: left.index, section: 0 });
    }
  }
  if (making) warn(making.line, `nothing makes ${making.id}: the message after "create" must go to it`);
  if (ending) warn(ending.line, `nothing ends ${ending.id}: the message after "destroy" must be to or from it`);
  model.groups = model.groups.filter((g) => g.members.length);
  return model;
}

// ---- placement -------------------------------------------------------------------------------------------

/** @typedef {{x:number,y:number}} Pt */
/** @typedef {{x:number,y:number,w:number,h:number,lines:string[]}} Words the middle of where words sit, their size, and their lines */
/** @typedef {{x:number,y:number,w:number,h:number,lines:string[],from:number,to:number,foot:number|null,ends:boolean}} Stood a participant's box by its middle, its lifeline from and to, and its box at the foot if it has one */
/** @typedef {{id:string,kind:string,y:number,h:number}} Row */
/** @typedef {{y:number,points:Pt[],self:boolean,words:Words|null,number:Pt|null}} Sent */
/** @typedef {{id:string,kind:string,label:string,x:number,y:number,w:number,h:number,nameAt:number,dividers:{y:number,label:string}[]}} Frame from its top left corner; nameAt: where its name and its sections' names start */
/** @typedef {{of:string,x:number,y:number,w:number,h:number,depth:number}} Bar by the middle of its top */
/**
 * @typedef {object} SequenceLayout
 * @property {number} width
 * @property {number} height
 * @property {{w:number,h:number}} head the one size of a participant's box
 * @property {number} step from one lifeline to the next
 * @property {boolean} feet whether the participants are drawn again at the foot
 * @property {Record<string, Stood>} participants
 * @property {Row[]} rows
 * @property {Record<string, Sent>} messages
 * @property {Record<string, Words>} notes
 * @property {Frame[]} frames
 * @property {Bar[]} bars
 * @property {{title:string,x:number,y:number,w:number,h:number,name:Words|null}[]} groups each from its top left corner, with where its title sits if it has one
 * @property {string[]} warnings
 */

/** How wide the tab is that names a frame's kind, in capitals. */
export const tabOf = (/** @type {string} */ kind) => kind.length * across.tagGlyph + 16;

/** How many characters a line of a participant's name may run to, in a footprint of some width: a second sheet and a round end each take some of it. */
export const roomAt = (/** @type {number} */ w, /** @type {Mark} */ shape = 'box') => Math.floor((w - across.padBox - (shape === 'collections' ? across.stack : shape === 'queue' ? 2 * across.cap : 0)) / across.glyph);
/** A participant's name in a box of some width: the author's own lines where they broke it, else as it falls. */
export const nameLines = (/** @type {Participant} */ p, /** @type {number} */ w) => (p.breaks ? p.breaks.flatMap((b) => wrap(b, roomAt(w, p.shape))) : wrap(p.label, roomAt(w, p.shape)));
/** A group's title in a frame with some room inside it, wrapped; and how many characters that room is. */
const titleRoom = (/** @type {number} */ px) => Math.max(1, Math.floor(px / across.groupGlyph));
const longestWord = (/** @type {string} */ words) => Math.max(0, ...words.split(/\s+/).map((x) => x.length));
const widest = (/** @type {string[]} */ lines, /** @type {number} */ glyph) => Math.ceil(Math.max(0, ...lines.map((l) => l.length)) * glyph);

/**
 * @param {SequenceModel} model
 * @returns {SequenceLayout}
 */
export function layoutSequence(model) {
  /** @type {string[]} */
  const warnings = [];
  const people = model.participants;
  const col = new Map(people.map((p, i) => [p.id, i]));
  const at = (/** @type {string} */ id) => col.get(id) ?? 0;

  // 1. One size for every participant: the narrowest in which every name takes two lines or fewer (as many
  //    as its author wrote, if they broke it), no word is cut, and the longest word of a group's title fits
  //    across the participants it is over. It is as tall as the tallest needs: a box round its name, or a
  //    drawing with its name under it.
  const fits = (/** @type {Participant} */ p, /** @type {number} */ w) => {
    const lines = nameLines(p, w);
    return lines.length <= (p.breaks ? across.mostLines : 2) && lines.every((l) => l.length <= roomAt(w, p.shape));
  };
  /** The room a group's title has, at the least: its participants, a box and a gap each, less the last gap. */
  const titleFits = (/** @type {SequenceModel['groups'][number]} */ g, /** @type {number} */ w) => longestWord(g.title) <= titleRoom(g.members.length * w + (g.members.length - 1) * across.gap);
  const w = across.widths.find((width) => people.every((p) => fits(p, width)) && model.groups.every((g) => titleFits(g, width))) ?? across.widths.find((width) => people.every((p) => fits(p, width))) ?? across.widths[across.widths.length - 1];
  const names = new Map(people.map((p) => [p.id, nameLines(p, w)]));
  const most = Math.min(across.mostLines, Math.max(1, ...[...names.values()].map((l) => l.length)));
  const h = Math.max(across.headPad + across.headLine * most, people.some(namedUnder) ? across.mark + across.markGap + across.headLine * most + across.markFoot : 0);
  // Where a line meets a participant made part way down: the middle of a box, or the middle of a drawing, which
  // is nearer the top of its footprint; and at the side of the box, or just clear of the drawing.
  const up = (/** @type {Participant} */ p) => (namedUnder(p) ? across.mark / 2 : h / 2);
  const reach = (/** @type {Participant} */ p) => (namedUnder(p) ? across.markHalf : w / 2);

  // 2. One step from each lifeline to the next: wide enough for the widest words that sit in a gap.
  const wordsOfMessage = (/** @type {Message} */ m) => m.lines.flatMap((l) => wrap(l, across.wordWrap));
  const noteLines = (/** @type {Note} */ n, max = across.noteWrap) => n.lines.flatMap((l) => wrap(l, max));
  let step = w + across.gap;
  model.items.forEach((item, index) => {
    if (item.type === 'message') {
      const px = widest(wordsOfMessage(item), across.wordGlyph);
      // Beside a message to itself the words share the gap with its loop; beside a participant made here, with its box.
      const beside = item.from === item.to ? across.selfOut + across.clear : people[at(item.to)].created === index ? w / 2 : 0;
      if (item.from !== item.to || at(item.from) < people.length - 1) step = Math.max(step, px + beside + 2 * across.clear + across.bar);
    } else if (item.type === 'note' && item.over.length === 1) {
      const px = widest(noteLines(item), across.noteGlyph) + 2 * across.notePad;
      const inner = item.place === 'right' ? at(item.over[0]) < people.length - 1 : item.place === 'left' ? at(item.over[0]) > 0 : false;
      if (inner) step = Math.max(step, px + across.noteOff + across.clear + across.bar);
      if (item.place === 'over') step = Math.max(step, px / 2 + across.clear);
    }
  });
  step = Math.min(across.mostStep, Math.ceil(step / 8) * 8);
  const x = (/** @type {string} */ id) => at(id) * step;

  // How many bars a participant carries at an item, for where a line meets it: at the edge of its outermost bar.
  const barsAt = (/** @type {string} */ id, /** @type {number} */ index) => model.activations.filter((a) => a.of === id && a.from <= index && (a.to === null || index <= a.to)).length;
  const rightOf = (/** @type {string} */ id, /** @type {number} */ index) => x(id) + (barsAt(id, index) ? (barsAt(id, index) - 1) * across.barStep + across.bar / 2 : 0);
  const leftOf = (/** @type {string} */ id, /** @type {number} */ index) => x(id) - (barsAt(id, index) ? across.bar / 2 : 0);

  // 3. Rows. Everything written takes a row of its own, in the order it was written, one gap apart. A frame's
  //    name and the start of each later section take a row too, half a gap from what they are about.
  /** @type {Row[]} */
  const rows = [];
  /** @type {Record<string, Sent>} */
  const messages = {};
  /** @type {Record<string, Words>} */
  const notes = {};
  /** @type {Map<number, number>} */
  const lineOf = new Map(); // where an item's line is, for bars
  /** @type {Map<number, {open:number,close:number,elses:number[]}>} */
  const edges = new Map();
  /** @type {Map<string, number>} */
  const headAt = new Map();
  /** @type {Map<string, number>} */
  const endAt = new Map();
  let cursor = h + across.top;
  let before = 'head';
  model.items.forEach((item, index) => {
    const half = before === 'open' || before === 'else' || item.type === 'close' || item.type === 'else';
    if (before !== 'head') cursor += half ? across.rowGap / 2 : across.rowGap;
    before = item.type;
    if (item.type === 'open' || item.type === 'else' || item.type === 'close') {
      const edge = edges.get(item.block) ?? { open: 0, close: 0, elses: [] };
      if (item.type === 'open') edge.open = cursor;
      else if (item.type === 'close') edge.close = cursor;
      else edge.elses.push(cursor);
      edges.set(item.block, edge);
      const tall = item.type === 'close' ? 0 : across.frameHead;
      rows.push({ id: `${model.blocks[item.block].id}:${item.type}${item.section || ''}`, kind: item.type, y: cursor, h: tall });
      cursor += tall;
      lineOf.set(index, cursor);
      return;
    }
    if (item.type === 'note') {
      const [a, b = a] = item.over.map(x).sort((p, q) => p - q);
      const span = b - a + 2 * across.noteOver;
      // A note over two participants is as wide as the room between them, and its words wrap to that.
      const lines = b > a ? noteLines(item, Math.max(across.noteWrap, Math.floor((span - 2 * across.notePad) / across.noteGlyph))) : noteLines(item);
      const wide = b > a ? span : Math.max(48, widest(lines, across.noteGlyph) + 2 * across.notePad);
      const tall = lines.length * across.noteLine + 2 * across.notePad;
      const id = item.over[0];
      const mid = b > a ? (a + b) / 2 : item.place === 'right' ? rightOf(id, index) + across.noteOff + wide / 2 : item.place === 'left' ? leftOf(id, index) - across.noteOff - wide / 2 : a;
      notes[item.id] = { x: mid, y: cursor + tall / 2, w: wide, h: tall, lines };
      rows.push({ id: item.id, kind: 'note', y: cursor, h: tall });
      cursor += tall;
      lineOf.set(index, cursor - tall / 2);
      return;
    }
    const lines = wordsOfMessage(item), px = widest(lines, across.wordGlyph), tall = lines.length * across.wordLine;
    const top = cursor;
    if (item.from === item.to) {
      // Out to the right, down, and back: the words sit beside the loop, level with its middle.
      const y = top + Math.max(item.number ? across.number : 0, (tall - across.selfDown) / 2);
      const from = rightOf(item.from, index), out = from + across.selfOut;
      messages[item.id] = {
        y, self: true, points: [{ x: from, y }, { x: out, y }, { x: out, y: y + across.selfDown }, { x: from, y: y + across.selfDown }],
        words: lines.length ? { x: out + 8 + px / 2, y: y + across.selfDown / 2, w: px, h: tall, lines } : null,
        number: item.number ? { x: from + across.number + 2, y } : null,
      };
      cursor = Math.max(y + across.selfDown, y + across.selfDown / 2 + tall / 2);
      lineOf.set(index, y + across.selfDown);
    } else {
      const right = at(item.to) > at(item.from), dir = right ? 1 : -1;
      const receiver = people[at(item.to)], made = receiver.created === index;
      // The words sit above the line. A participant made here has its box on the line, so the row is as tall as what of it is above the line.
      const y = top + Math.max(tall ? tall + across.wordOff : 0, item.number ? across.number : 0, made ? up(receiver) : 0);
      // An end written with () meets the middle of the lifeline, whatever bars are on it.
      const from = item.tailDot ? x(item.from) : right ? rightOf(item.from, index) : leftOf(item.from, index);
      // It ends at the side of a box made here, short of the cross of a participant ended here, else at the lifeline or its bar.
      const ended = receiver.destroyed === index;
      const to = made ? x(item.to) - dir * reach(receiver) : ended ? x(item.to) - dir * (across.cross + 2) : item.headDot ? x(item.to) : right ? leftOf(item.to, index) : rightOf(item.to, index);
      // Beside the sender, in the gap to the next lifeline: never across a lifeline, however far the message goes.
      const gapEnd = made && Math.abs(at(item.to) - at(item.from)) === 1 ? to : x(item.from) + dir * step;
      messages[item.id] = {
        y, self: false, points: [{ x: from, y }, { x: to, y }],
        words: lines.length ? { x: (x(item.from) + gapEnd) / 2, y: y - across.wordOff - tall / 2, w: px, h: tall, lines } : null,
        number: item.number ? { x: from + dir * (across.number + 2), y } : null,
      };
      if (made) headAt.set(item.to, y + h / 2 - up(receiver));
      cursor = made ? y + h - up(receiver) : y + 2;
      lineOf.set(index, y);
    }
    for (const id of new Set([item.from, item.to])) {
      if (people[at(id)].destroyed === index) {
        endAt.set(id, lineOf.get(index) ?? cursor);
        cursor = Math.max(cursor, (lineOf.get(index) ?? cursor) + across.cross);
      }
    }
    rows.push({ id: item.id, kind: 'message', y: top, h: cursor - top });
  });
  const foot = cursor + (model.items.length ? across.top : 0);
  // Every participant is drawn again at the foot of its lifeline, as Mermaid draws it, unless its author said not to.
  const feet = model.mirror && people.length > 0;

  /** @type {Record<string, Stood>} */
  const participants = {};
  for (const p of people) {
    const y = headAt.get(p.id) ?? h / 2, ends = endAt.has(p.id);
    participants[p.id] = { x: x(p.id), y, w, h, lines: names.get(p.id) ?? [p.label], from: y + h / 2, to: endAt.get(p.id) ?? foot, foot: feet && !ends ? foot + h / 2 : null, ends };
  }

  // 4. Bars: from the message that starts one to the message that ends it, a second on the same participant
  //    half a bar to the right of the first.
  /** @type {Bar[]} */
  const bars = model.activations.map((a) => {
    const from = lineOf.get(a.from) ?? h + across.top;
    const to = a.to === null ? participants[a.of].to : Math.max(lineOf.get(a.to) ?? from, from + across.bar);
    return { of: a.of, x: x(a.of) + a.depth * across.barStep, y: from, w: across.bar, h: to - from, depth: a.depth };
  });

  // 5. Frames: round exactly what a block holds, the innermost first so that an outer one holds its inner ones.
  /** @type {(Frame|null)[]} */
  const framed = model.blocks.map(() => null);
  for (let b = model.blocks.length - 1; b >= 0; b--) {
    const block = model.blocks[b], edge = edges.get(b);
    if (!edge) continue;
    let l = Infinity, r = -Infinity;
    const take = (/** @type {number} */ a, /** @type {number} */ c) => {
      l = Math.min(l, a);
      r = Math.max(r, c);
    };
    let inside = false, firstLife = Infinity;
    // A frame takes in the lane of every participant it is about: half a box either side of its lifeline, and to
    // the left enough for the tab that names the frame to sit clear of that lifeline.
    const lane = (/** @type {string} */ id) => {
      firstLife = Math.min(firstLife, x(id));
      take(x(id) - Math.max(w / 2, tabOf(block.kind) + across.tabClear) + across.framePad, x(id) + w / 2 - across.framePad);
    };
    model.items.forEach((item) => {
      if ((item.type === 'open' || item.type === 'close') && item.block === b) return void (inside = item.type === 'open');
      if (!inside) return;
      if (item.type === 'message') [item.from, item.to].forEach(lane);
      if (item.type === 'note') item.over.forEach(lane);
      if (item.type === 'message') {
        const m = messages[item.id];
        take(Math.min(...m.points.map((p) => p.x)), Math.max(...m.points.map((p) => p.x)));
        if (m.words) take(m.words.x - m.words.w / 2, m.words.x + m.words.w / 2);
        if (people[at(item.to)].created !== undefined && headAt.has(item.to) && headAt.get(item.to) === m.y) take(x(item.to) - w / 2, x(item.to) + w / 2);
      } else if (item.type === 'note') take(notes[item.id].x - notes[item.id].w / 2, notes[item.id].x + notes[item.id].w / 2);
    });
    for (const inner of framed) if (inner && model.blocks[Number(inner.id.slice(1)) - 1].parent === b) take(inner.x, inner.x + inner.w);
    if (l === Infinity) {
      warnings.push(`line ${block.line}: this ${block.kind} holds nothing, and is left out`);
      continue;
    }
    // A frame's name starts just past the first lifeline the frame is about, so the line does not strike it
    // through; and the frame is wide enough for the longest of its names.
    const nameAt = firstLife + across.nameOff;
    const named = nameAt - (l - across.framePad) + Math.max(...[block.label, ...block.sections].map((s) => s.length * across.noteGlyph)) + across.framePad;
    framed[b] = {
      id: block.id, kind: block.kind, label: block.label, x: l - across.framePad, y: edge.open, w: Math.max(r - l + 2 * across.framePad, named), h: edge.close - edge.open, nameAt,
      dividers: edge.elses.map((y, i) => ({ y, label: block.sections[i] ?? '' })),
    };
  }
  const frames = /** @type {Frame[]} */ (framed.filter(Boolean));

  // 6. Groups: a frame round the participants an author boxed together, from above their boxes to the foot. Its
  //    title sits inside it, above its participants, wrapped to the frame; the row of titles is as tall as the
  //    longest of them needs, so every group starts at the same height.
  /** @type {{title:string,cols:number[],lines:string[]}[]} */
  const boxed = [];
  for (const g of model.groups) {
    const cols = g.members.map(at).sort((a, b) => a - b);
    if (cols[cols.length - 1] - cols[0] !== cols.length - 1) {
      warnings.push(`the group "${g.title}" is not drawn: its participants do not stand side by side`);
      continue;
    }
    boxed.push({ title: g.title, cols, lines: g.title ? wrap(g.title, titleRoom((cols.length - 1) * step + w)) : [] });
  }
  const titleLines = Math.max(0, ...boxed.map((g) => g.lines.length));
  const above = boxed.length ? across.groupPad + (titleLines ? across.groupTitle + (titleLines - 1) * across.groupLine : 0) : 0;
  const bottom = foot + (feet ? h : 0);
  /** @type {SequenceLayout['groups']} */
  const groups = boxed.map((g) => {
    const gx = g.cols[0] * step - w / 2 - across.groupPad, gw = (g.cols.length - 1) * step + w + 2 * across.groupPad, tall = g.lines.length * across.groupLine;
    // The last line of a title sits just above the participants; a shorter title leaves the room above it.
    const name = g.lines.length ? { x: gx + gw / 2, y: -(across.groupTitle - across.groupLine) - tall / 2, w: widest(g.lines, across.groupGlyph), h: tall, lines: g.lines } : null;
    return { title: g.title, x: gx, y: -above, w: gw, h: bottom + above + across.groupPad, name };
  });

  // 7. Room all round: everything moves so that the leftmost and topmost thing is one margin in.
  const lefts = [-w / 2, ...Object.values(notes).map((n) => n.x - n.w / 2), ...frames.map((f) => f.x), ...groups.map((g) => g.x), ...Object.values(messages).flatMap((m) => (m.words ? [m.words.x - m.words.w / 2] : []))];
  const rights = [(people.length - 1) * step + w / 2, ...Object.values(notes).map((n) => n.x + n.w / 2), ...frames.map((f) => f.x + f.w), ...groups.map((g) => g.x + g.w),
    ...Object.values(messages).flatMap((m) => [...m.points.map((p) => p.x), ...(m.words ? [m.words.x + m.words.w / 2] : [])])];
  const dx = across.pad - Math.min(...lefts), dy = across.pad + above;
  const move = (/** @type {{x:number,y:number}} */ o) => {
    o.x += dx;
    o.y += dy;
  };
  for (const p of Object.values(participants)) {
    move(p);
    p.from += dy;
    p.to += dy;
    if (p.foot !== null) p.foot += dy;
  }
  for (const m of Object.values(messages)) {
    m.y += dy;
    m.points.forEach(move);
    if (m.words) move(m.words);
    if (m.number) move(m.number);
  }
  Object.values(notes).forEach(move);
  bars.forEach(move);
  for (const g of groups) {
    move(g);
    if (g.name) move(g.name);
  }
  for (const f of frames) {
    move(f);
    f.nameAt += dx;
    for (const d of f.dividers) d.y += dy;
  }
  for (const r of rows) r.y += dy;
  return {
    width: Math.ceil(Math.max(...rights) + dx + across.pad), height: Math.ceil(bottom + dy + across.pad + (groups.length ? across.groupPad : 0)),
    head: { w, h }, step, feet, participants, rows, messages, notes, frames, bars, groups, warnings,
  };
}

// ---- the rules -------------------------------------------------------------------------------------------

/** @typedef {{id:string,rule:string,ok:boolean,detail:string}} Check */

const boxOf = (/** @type {{x:number,y:number,w:number,h:number}} */ o) => ({ l: o.x - o.w / 2, r: o.x + o.w / 2, t: o.y - o.h / 2, b: o.y + o.h / 2 });
const meet = (/** @type {ReturnType<typeof boxOf>} */ a, /** @type {ReturnType<typeof boxOf>} */ b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

/**
 * @param {SequenceModel} model
 * @param {SequenceLayout} lay
 * @param {import('./design.mjs').Design} design
 * @returns {{pass:boolean,checks:Check[]}}
 */
export function scoreSequence(model, lay, design) {
  /** @type {Check[]} */
  const checks = [];
  const add = (/** @type {string} */ id, /** @type {string} */ rule, /** @type {string[]} */ broken, /** @type {string} */ fine) =>
    checks.push({ id, rule, ok: broken.length === 0, detail: broken.length ? broken.join('; ') : fine });
  const people = model.participants;
  const label = (/** @type {string} */ id) => people.find((p) => p.id === id)?.label ?? id;
  const sent = /** @type {Message[]} */ (model.items.filter((i) => i.type === 'message'));
  const noted = /** @type {Note[]} */ (model.items.filter((i) => i.type === 'note'));

  // S1
  /** @type {string[]} */
  const stray = [];
  const first = people.length ? lay.participants[people[0].id] : null;
  people.forEach((p, i) => {
    const stood = lay.participants[p.id];
    const off = first ? Math.abs(stood.x - (first.x + i * lay.step)) : 0;
    if (off > 0.5) stray.push(`${p.label} stands ${Math.round(off)}px out of step`);
    if (stood.w !== lay.head.w || stood.h !== lay.head.h) stray.push(`${p.label} is not the size of the others`);
    if (first && p.created === undefined && Math.abs(stood.y - first.y) > 0.5 && people[0].created === undefined) stray.push(`${p.label} does not stand in the row`);
  });
  // A participant drawn again at the foot stands under itself, below everything that was said.
  const lastRow = lay.rows.length ? lay.rows[lay.rows.length - 1].y + lay.rows[lay.rows.length - 1].h : 0;
  for (const p of people) {
    const stood = lay.participants[p.id];
    if (stood.foot === null) continue;
    if (stood.foot - stood.h / 2 < lastRow + across.top - 0.5) stray.push(`${p.label} is drawn again at the foot over the last row`);
    if (stood.foot + stood.h / 2 > lay.height) stray.push(`${p.label} runs off the foot of the drawing`);
  }
  if (people.length > 1 && lay.step < lay.head.w + across.gap) stray.push(`participants stand ${lay.step}px apart, and need ${lay.head.w + across.gap}`);
  add('S1', 'Participants stand in one row, one size, one step apart', stray, `${people.length} participants, ${lay.step}px apart`);

  // S2
  /** @type {string[]} */
  const uneven = [];
  lay.rows.slice(1).forEach((row, i) => {
    const prev = lay.rows[i];
    const half = prev.kind === 'open' || prev.kind === 'else' || row.kind === 'close' || row.kind === 'else';
    const gap = row.y - (prev.y + prev.h);
    if (gap < -0.5) uneven.push(`${prev.id} and ${row.id} share a row`);
    else if (Math.abs(gap - (half ? across.rowGap / 2 : across.rowGap)) > 0.5) uneven.push(`the gap between ${prev.id} and ${row.id} is ${Math.round(gap)}px, and the rhythm is ${half ? across.rowGap / 2 : across.rowGap}`);
  });
  add('S2', 'Every row is one message or one note, an even gap apart', uneven, `${lay.rows.filter((r) => r.kind === 'message' || r.kind === 'note').length} rows`);

  // S3
  /** @type {string[]} */
  const covered = [];
  const worded = sent.filter((m) => lay.messages[m.id]?.words);
  worded.forEach((m, i) => {
    const words = /** @type {Words} */ (lay.messages[m.id].words), box = boxOf(words);
    for (const p of people) {
      const stood = lay.participants[p.id];
      if (stood.from <= box.b && stood.to >= box.t && stood.x > box.l - 2 && stood.x < box.r + 2) covered.push(`the words "${m.label}" sit on the lifeline of ${p.label}`);
    }
    for (const o of worded.slice(i + 1)) if (meet(box, boxOf(/** @type {Words} */ (lay.messages[o.id].words)))) covered.push(`the words "${m.label}" and "${o.label}" overlap`);
    if (box.l < 0 || box.r > lay.width) covered.push(`the words "${m.label}" run off the drawing`);
  });
  add('S3', "A message's words sit beside its sender, clear of every lifeline and of each other", covered, `${worded.length} clear`);

  // S4
  /** @type {string[]} */
  const loose = [];
  const frameOf = new Map(lay.frames.map((f) => [f.id, f]));
  const named = (/** @type {Block} */ b) => `the ${b.kind}${b.label ? ` "${b.label}"` : ''}`;
  /** @type {number[]} */
  const within = [];
  for (const item of model.items) {
    if (item.type === 'open') within.push(item.block);
    else if (item.type === 'close') within.pop();
    else if (item.type !== 'else') {
      for (const b of within) {
        const f = frameOf.get(model.blocks[b].id);
        if (!f) continue;
        const held = item.type === 'message'
          ? [...lay.messages[item.id].points.map((p) => ({ x: p.x, y: p.y, w: 0, h: 0 })), ...(lay.messages[item.id].words ? [/** @type {Words} */ (lay.messages[item.id].words)] : [])]
          : [lay.notes[item.id]];
        if (held.some((o) => boxOf(o).l < f.x - 0.5 || boxOf(o).r > f.x + f.w + 0.5 || boxOf(o).t < f.y - 0.5 || boxOf(o).b > f.y + f.h + 0.5)) loose.push(`${named(model.blocks[b])} does not hold "${item.label}"`);
      }
    }
  }
  model.blocks.forEach((b, i) => {
    const f = frameOf.get(b.id);
    if (!f) return;
    // The tab that names a frame is words too: no lifeline runs through it.
    if (b.kind !== 'rect') for (const p of people) {
      const stood = lay.participants[p.id];
      if (stood.from <= f.y && stood.to >= f.y && stood.x > f.x - 1 && stood.x < f.x + tabOf(b.kind) + 1) loose.push(`the name of ${named(b)} sits on the lifeline of ${p.label}`);
    }
    const parent = b.parent >= 0 ? frameOf.get(model.blocks[b.parent].id) : null;
    if (parent && (f.x <= parent.x || f.y <= parent.y || f.x + f.w >= parent.x + parent.w || f.y + f.h >= parent.y + parent.h)) loose.push(`${named(b)} is not inside ${named(model.blocks[b.parent])}`);
    for (const o of model.blocks.slice(i + 1)) {
      const g = frameOf.get(o.id);
      // Two frames that are not one inside the other must not touch.
      let up = o.parent;
      while (up >= 0 && up !== i) up = model.blocks[up].parent;
      if (g && up !== i && f.x < g.x + g.w && g.x < f.x + f.w && f.y < g.y + g.h && g.y < f.y + f.h) loose.push(`${named(b)} and ${named(o)} overlap`);
    }
  });
  add('S4', 'A frame holds exactly what is in it, and frames nest without touching', loose, `${lay.frames.length} frames`);

  // S5
  /** @type {string[]} */
  const crowded = [];
  noted.forEach((n, i) => {
    const box = boxOf(lay.notes[n.id]);
    for (const m of sent) {
      const s = lay.messages[m.id];
      const xs = s.points.map((p) => p.x), ys = s.points.map((p) => p.y);
      if (meet(box, { l: Math.min(...xs), r: Math.max(...xs), t: Math.min(...ys) - 1, b: Math.max(...ys) + 1 }) || (s.words && meet(box, boxOf(s.words)))) crowded.push(`the note "${n.label}" sits on the message "${m.label}"`);
    }
    for (const o of noted.slice(i + 1)) if (meet(box, boxOf(lay.notes[o.id]))) crowded.push(`the notes "${n.label}" and "${o.label}" overlap`);
    if (box.l < 0 || box.r > lay.width) crowded.push(`the note "${n.label}" runs off the drawing`);
  });
  add('S5', 'A note sits clear of messages and of other notes', crowded, `${noted.length} clear`);

  // S6
  /** @type {string[]} */
  const stacked = [];
  lay.bars.forEach((a, i) => {
    if (a.h <= 0) stacked.push(`a bar on ${label(a.of)} has no length`);
    for (const b of lay.bars.slice(i + 1)) if (a.of === b.of && Math.abs(a.x - b.x) < across.barStep - 0.5 && a.y < b.y + b.h && b.y < a.y + a.h) stacked.push(`two bars on ${label(a.of)} lie on each other`);
  });
  add('S6', 'Bars on one participant stack side by side, and never lie on each other', stacked, `${lay.bars.length} bars`);

  // S7
  /** @type {string[]} */
  const tight = [];
  for (const p of people) {
    const lines = lay.participants[p.id].lines;
    if (lines.length > (p.breaks ? across.mostLines : 2)) tight.push(`"${p.label}" needs ${lines.length} lines; shorten it, or give it a shorter name with "as"`);
    else if (lines.some((l) => l.length > roomAt(lay.head.w, p.shape))) tight.push(`"${p.label}" has a word too long for a participant's box; give it a shorter name with "as"`);
  }
  for (const m of sent) {
    const words = lay.messages[m.id].words;
    if (words && m.from !== m.to && words.w > lay.step - 2 * across.clear) tight.push(`the message "${m.label}" has a word too long for the gap it sits in; break it with <br/> or shorten it`);
  }
  // A group's title is a name too: it stays inside its frame and the drawing, above the participants it is over.
  const headTop = Math.min(...people.map((p) => lay.participants[p.id].y - lay.participants[p.id].h / 2));
  for (const g of lay.groups) {
    if (!g.name) continue;
    const box = boxOf(g.name);
    if (g.name.w > g.w - 2 * across.groupPad + 0.5) tight.push(`the title "${g.title}" has a word too long for its group; shorten the word, or the title`);
    else if (box.l < g.x || box.r > g.x + g.w || box.t < g.y || box.b > headTop || box.l < 0 || box.r > lay.width) tight.push(`the title "${g.title}" is not inside its group`);
  }
  for (const n of noted) if (lay.notes[n.id].lines.length > across.mostNoteLines) tight.push(`the note "${n.label}" needs ${lay.notes[n.id].lines.length} lines; shorten it`);
  add('S7', 'Names, words and notes fit where they sit', tight, 'all fit');

  // D1, D2: the same sums as a flowchart's, for the kinds of participant this diagram has.
  const [d1, d2] = colourChecks(design, [...new Set(people.map((p) => p.kind))]);
  // A group's title is quiet text on the group's own fill, which is a little off the page's.
  if (lay.groups.some((g) => g.name)) for (const [mode, p] of looksOf(design)) {
    const c = contrast(p.muted, mix(p.text, p.bg, draw.frame));
    if (c < colourLimits.text) d1.broken.push(`${mode}: the title of a group is ${c.toFixed(1)} to 1, and needs ${colourLimits.text}`);
  }
  const looks = looksOf(design).map(([mode]) => mode).join(' and ');
  add('D1', 'Words and lines can be read against what is behind them', d1.broken, `${design.name} passes in ${looks}`);
  add('D2', 'Kinds of box can be told apart', d2.broken, 'apart in ordinary and red-green colour-blind sight');

  return { pass: checks.every((c) => c.ok), checks };
}
