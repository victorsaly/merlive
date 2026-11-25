// Why: a class diagram is boxes and links: classes, and how one is tied to the next. So it is not given a
// drawing of its own. Its lines are read here into the model a flowchart gives: a class is a box with rows
// under its name, a relation is a link with something at each end, a namespace is a group. parse.mjs reads
// what every diagram shares (front matter, comments, classDef, style, Merlive's own lines) and hands the rest
// of each line to this reader, with the tools to make a box, a link and a group. Pure.

/** @typedef {import('./parse.mjs').Model} Model */
/** @typedef {import('./parse.mjs').Node} Node */
/** @typedef {import('./parse.mjs').Edge} Edge */
/** @typedef {import('./parse.mjs').Mark} Mark */
/**
 * @typedef {object} Tools what parse.mjs lends, so a class is made exactly as a flowchart's box is
 * @property {Model} model
 * @property {(id:string) => Node} node the box of this id, made if it is not there, and put in the group that is open
 * @property {(n:Node, words:string) => void} say gives a box its words
 * @property {(a:Node, b:Node, l:Pick<Edge,'label'|'style'|'head'|'tail'>, line:number) => Edge} connect
 * @property {(id:string, title:string, line:number) => void} frame opens a group, or one of that name again
 * @property {() => void} unframe closes the group opened last
 * @property {(line:number, what:string) => void} warn
 * @property {(text:string) => string[]} wordsOf
 */

// A class's name: letters of any alphabet, digits, underscores and dashes, as Mermaid's page says. One between
// backticks may hold anything else. Either is read as two groups: the backticked name, or the bare one.
const NAME = '[\\p{L}\\p{N}_][\\p{L}\\p{N}_-]*';
const REF = `(?:\`([^\`]+)\`|(${NAME}))`;
// What a class is generic over, after its name ("Basket~Item~"). It is shown, and is no part of the name.
const OVER = '(?:~([^\\s]*)~)?';
const COUNT = '(?:"([^"]*)"\\s*)?';

const LINES = {
  // [class] ["how many"] [end][line][end] ["how many"] [class] [: words]. An "o" is an end only when it stands
  // apart from a name, as Mermaid's own examples write it: "Depot --o Order", not "Depot --office".
  relation: new RegExp(`^${REF}${OVER}\\s*${COUNT}(<\\||\\*|(?<=[\\s"])o|<|\\(\\))?(--|\\.\\.)(\\|>|\\*|o(?=[\\s"])|>|\\(\\))?\\s*${COUNT}${REF}${OVER}\\s*(?::\\s*(.*))?$`, 'u'),
  declared: new RegExp(`^class\\s+${REF}(.*)$`, 'u'),
  member: new RegExp(`^${REF}\\s*:\\s*(.+)$`, 'u'),
  annotated: new RegExp(`^<<([^>]+)>>\\s*${REF}$`, 'u'),
  namespace: new RegExp(`^namespace\\s+(${NAME}(?:\\.${NAME})*)\\s*(?:\\["([^"]*)"\\])?\\s*\\{\\s*(\\})?$`, 'u'),
  noteFor: new RegExp(`^note\\s+for\\s+${REF}\\s+"(.*)"$`, 'u'),
  note: /^note\s+"(.*)"$/,
  cssClass: /^cssClass\s+"?([^"]+?)"?\s+(\w+)$/,
  direction: /^direction\s+(TB|TD|BT|LR|RL)$/,
  // What a page of Merlive cannot do: it opens no links and runs no code of an author's.
  acting: /^(click|link|callback)\s/,
  // Read by parse.mjs, as it reads them anywhere.
  shared: /^(classDef|style)\s/,
};

// What stands at an end of a relation, by how it is written at either end.
/** @type {Record<string, Mark>} */
const ENDS = { '<|': 'triangle', '|>': 'triangle', '*': 'diamond', o: 'diamond-open', '<': 'arrow', '>': 'arrow' };

/**
 * A member as a reader should see it: who may see it, its types and what it gives back kept as written, a
 * generic type in the angle brackets a reader knows ("List~int~" is "List<int>"), and the two signs Mermaid
 * puts at the end of a member said in words, since a sign nobody is told the meaning of says nothing.
 * @param {string} written
 */
export function shown(written) {
  let text = '', depth = 0;
  const typed = written.trim().replace(/\s+/g, ' ');
  // A ~ opens a generic when it follows a name and something follows it; it closes one that is open; any other
  // (the one in front of a member that only its package may see) is left alone.
  [...typed].forEach((c, i, all) => {
    const before = all[i - 1] ?? '', after = all[i + 1] ?? '';
    if (c !== '~') text += c;
    else if (/[\p{L}\p{N}_]/u.test(before) && after !== '' && !/[\s~),]/.test(after) && all.indexOf('~', i + 1) > 0) (text += '<'), depth++;
    else if (depth > 0) (text += '>'), depth--;
    else text += c;
  });
  // One never closed was not a generic after all: the line is shown as it was typed.
  if (depth > 0) text = typed;
  const said = { '*': ' {abstract}', $: ' {static}' };
  // A method is marked after its brackets or after what it gives back; a field only at its very end, and only
  // as static.
  const method = /^(.*\))([*$])?(?:\s+(.*?))?([*$])?$/.exec(text);
  if (method && text.includes('(')) {
    const [, call, first, back, last] = method, mark = /** @type {'*'|'$'|undefined} */ (first ?? last);
    return `${call}${back ? ` ${back}` : ''}${mark ? said[mark] : ''}`;
  }
  return text.endsWith('$') ? `${text.slice(0, -1).trimEnd()}${said.$}` : text;
}

/**
 * Reads the lines of a class diagram into the model parse.mjs is building.
 * @param {Tools} tools
 * @returns {{read:(text:string, line:number) => boolean, done:() => void}} read says whether the line was this
 *   reader's; one that was not (a classDef, a style) is left for parse.mjs, which reads it as it does anywhere.
 */
export function classReader({ model, node, say, connect, frame, unframe, warn, wordsOf }) {
  model.kindOfDiagram = 'classDiagram';
  /** What is open at this line, the innermost last: a class's block, or a namespace, which may be several deep at once. */
  /** @type {({is:'class',id:string,line:number}|{is:'namespace',id:string,line:number,deep:number})[]} */
  const open = [];
  /** What each class lists, in the order it was written: what it holds, and what it does. */
  /** @type {Map<string,{holds:string[],does:string[]}>} */
  const listed = new Map();
  let toldTheWay = false;

  const idOf = (/** @type {string|undefined} */ ticked, /** @type {string|undefined} */ bare) => /** @type {string} */ (ticked ?? bare);
  const made = (/** @type {string} */ id) => model.nodes.some((n) => n.id === id);
  // A note is drawn where its author put it: a sheet of its own on the picture, joined to the class it is
  // about by a dotted line, or to nothing. Its lines are kept as they were broken.
  let notes = 0;
  const note = (/** @type {string} */ written) => {
    const lines = wordsOf(written.replace(/\\n/g, '<br/>'));
    if (!lines.join('')) return null;
    let id = `note${++notes}`;
    while (made(id)) id = `note${++notes}`;
    const sheet = node(id);
    Object.assign(sheet, { label: lines.join(' '), shape: 'note', kind: 'note' }, lines.length > 1 ? { breaks: lines } : {});
    return sheet;
  };
  const lists = (/** @type {string} */ id, /** @type {string} */ written) => {
    const of = listed.get(id) ?? { holds: [], does: [] };
    listed.set(id, of);
    // Mermaid tells the two apart by the brackets: what has them is something the class does.
    (written.includes('(') ? of.does : of.holds).push(shown(written));
  };
  const annotates = (/** @type {Node} */ n, /** @type {string} */ words) => void (n.over = `«${words.trim()}»`);
  const namespaceNow = () => /** @type {{is:'namespace',id:string}|undefined} */ ([...open].reverse().find((o) => o.is === 'namespace'))?.id;

  /** "class Name", with any of: what it is generic over, a label, a kind, an annotation, and a block of members. */
  const declare = (/** @type {RegExpExecArray} */ found, /** @type {string} */ text, /** @type {number} */ line) => {
    const id = idOf(found[1], found[2]);
    /** @type {{over?:string,label?:string,kind?:string,note?:string,block?:string}} */
    const with_ = {};
    let rest = found[3];
    for (let before = ''; rest !== before;) {
      before = rest;
      const take = (/** @type {RegExp} */ like, /** @type {keyof typeof with_} */ as) => {
        const m = like.exec(rest);
        if (!m || with_[as] !== undefined) return;
        with_[as] = m[1];
        rest = rest.slice(m[0].length);
      };
      take(/^~([^\s[{<:]*)~/, 'over');
      take(/^\s*\["([^"]*)"\]/, 'label');
      take(/^\s*:::(\w+)/, 'kind');
      take(/^\s*<<([^>]+)>>/, 'note');
      take(/^\s*\{(.*)$/, 'block');
    }
    // Anything left over is something this reader does not know, and a class is not made from half a line.
    if (rest.trim()) return warn(line, `not read: "${text}"`);
    const n = node(id);
    if (with_.label !== undefined) say(n, with_.label);
    else if (with_.over !== undefined) say(n, `${id}<${shown(`T~${with_.over}~`).slice(2, -1)}>`);
    if (with_.kind) n.kind = with_.kind;
    if (with_.note) annotates(n, with_.note);
    if (with_.block === undefined) return;
    // A block opened and closed on one line holds at most the one member written between.
    const inner = with_.block.trim();
    if (!inner.endsWith('}')) return void open.push({ is: 'class', id, line });
    if (inner.slice(0, -1).trim()) lists(id, inner.slice(0, -1));
  };

  const relate = (/** @type {RegExpExecArray} */ found, /** @type {string} */ text, /** @type {number} */ line) => {
    const [, tickedA, bareA, , nearA, left, way, right, nearB, tickedB, bareB, , words] = found;
    const a = idOf(tickedA, bareA), b = idOf(tickedB, bareB);
    const link = { label: wordsOf(words ?? '').join(' '), style: /** @type {'solid'|'dotted'} */ (way === '..' ? 'dotted' : 'solid') };
    const counted = (/** @type {Edge} */ e, /** @type {string|undefined} */ near, /** @type {string|undefined} */ far) => {
      if (near) e.near = near;
      if (far) e.far = far;
    };
    if (left === '()' || right === '()') {
      if (left === right) return warn(line, `not read: a lollipop at both ends of "${text}"`);
      // A lollipop is an interface a class offers. Mermaid draws each as a circle of its own beside the class,
      // never shared between two. Here each is a box of its own, named for the interface and said to be one,
      // with the circle on its line.
      const [offers, name] = left === '()' ? [b, a] : [a, b];
      const owner = node(offers), lolly = node(`${offers}_${name}`);
      say(lolly, name);
      annotates(lolly, 'interface');
      const e = left === '()'
        ? connect(lolly, owner, { ...link, tail: 'circle', head: ENDS[right ?? ''] ?? 'none' }, line)
        : connect(owner, lolly, { ...link, tail: ENDS[left ?? ''] ?? 'none', head: 'circle' }, line);
      return counted(e, nearA, nearB);
    }
    const tail = ENDS[left ?? ''] ?? 'none', head = ENDS[right ?? ''] ?? 'none';
    // Both classes are made in the order they were written, whichever way the link then runs.
    const first = node(a), second = node(b);
    // A link runs from the class it was written from to the other. "Is a" is the one that is turned: the class
    // at the triangle is the parent, and a parent is read first, so it sits above its children however the
    // line was written ("Duck --|> Animal" and "Animal <|-- Duck" are the same picture). With a triangle at
    // both ends, or at neither, there is no parent to put first and the written order stands.
    if (head === 'triangle' && tail !== 'triangle') return counted(connect(second, first, { ...link, tail: head, head: tail }, line), nearB, nearA);
    counted(connect(first, second, { ...link, tail, head }, line), nearA, nearB);
  };

  const read = (/** @type {string} */ raw, /** @type {number} */ line) => {
    const inside = open[open.length - 1];
    // Inside a class's block every line is a member, as it was written, but for the two that are not.
    if (inside?.is === 'class') {
      const member = raw.trim();
      if (member === '}') open.pop();
      else if (/^<<[^>]+>>$/.test(member)) annotates(node(inside.id), member.slice(2, -2));
      else lists(inside.id, member);
      return true;
    }
    const text = raw.replace(/\s*;$/, '').trim();
    if (!text || LINES.acting.test(text)) return true;
    if (LINES.shared.test(text)) return false;

    if (text === '}') {
      if (!inside) return warn(line, 'not read: a "}" with nothing open'), true;
      open.pop();
      for (let i = 0; i < inside.deep; i++) unframe();
      return true;
    }
    const way = LINES.direction.exec(text);
    if (way) {
      // Boxes of different heights are only placed top to bottom yet, so any other way is read past, and said.
      if (!/^T[BD]$/.test(way[1]) && !toldTheWay) warn(line, `a class diagram is drawn top to bottom for now: "${text}" is read past`);
      toldTheWay ||= !/^T[BD]$/.test(way[1]);
      return true;
    }

    const space = LINES.namespace.exec(text);
    if (space) {
      // "A.B.C" is C inside B inside A, each made if it is not there; one written inside another is inside it.
      const outer = namespaceNow(), parts = space[1].split('.');
      parts.forEach((part, i) => frame([...(outer ? [outer] : []), ...parts.slice(0, i + 1)].join('.'), part, line));
      const id = [...(outer ? [outer] : []), ...parts].join('.');
      const group = model.groups.find((g) => g.id === id);
      if (group && space[2] !== undefined) group.title = wordsOf(space[2]).join(' ') || group.title;
      if (space[3]) parts.forEach(() => unframe());
      else open.push({ is: 'namespace', id, line, deep: parts.length });
      return true;
    }

    const noted = LINES.noteFor.exec(text);
    if (noted) {
      const about = node(idOf(noted[1], noted[2])), sheet = note(noted[3]);
      if (sheet) connect(sheet, about, { label: '', style: 'dotted', head: 'none', tail: 'none' }, line);
      return true;
    }
    const general = LINES.note.exec(text);
    if (general) return note(general[1]), true;

    const css = LINES.cssClass.exec(text);
    if (css) {
      for (const id of css[1].split(',').map((x) => x.trim()).filter(Boolean)) {
        if (made(id)) node(id).kind = css[2];
        else warn(line, `cssClass names "${id}", which is not a class here`);
      }
      return true;
    }

    const declared = LINES.declared.exec(text);
    if (declared) return declare(declared, text, line), true;
    const annotated = LINES.annotated.exec(text);
    if (annotated) return annotates(node(idOf(annotated[2], annotated[3])), annotated[1]), true;
    const related = LINES.relation.exec(text);
    if (related) return relate(related, text, line), true;
    const member = LINES.member.exec(text);
    if (member) return node(idOf(member[1], member[2])), lists(idOf(member[1], member[2]), member[3]), true;
    return warn(line, `not read: "${text}"`), true;
  };

  const done = () => {
    for (const left of open) warn(left.line, `the ${left.is} ${left.id} is never closed; end it with a line of }`);
    // What a class holds comes before what it does, as a reader of class diagrams expects; a part with nothing
    // in it is not drawn as an empty band.
    for (const n of model.nodes) {
      const of = listed.get(n.id);
      const rows = of ? [of.holds, of.does].filter((part) => part.length) : [];
      if (rows.length) n.rows = rows;
    }
  };

  return { read, done };
}
