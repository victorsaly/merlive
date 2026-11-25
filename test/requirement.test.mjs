// Why: a requirement diagram is boxes and links too: requirements and the elements that meet them, each with
// the few things said of it, and relationships that say how one bears on another. These hold the reading,
// through parse(), and hold the corpus's own list (the `requirement` list of corpus/index.json) to what is read today. How a box
// with rows, a line above its name and a sentence under it is drawn is tested where it is drawn.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout } from '../skills/merlive/scripts/layout.mjs';
import { builtIn } from '../skills/merlive/scripts/design.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';
import { picture } from '../skills/merlive/scripts/render.mjs';
import { relationships, things } from '../skills/merlive/scripts/requirement.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const req = (/** @type {string} */ body) => parse(`requirementDiagram\n${body}`);
/** @typedef {import('../skills/merlive/scripts/parse.mjs').Model} Model */
const boxes = (/** @type {Model} */ m) => m.nodes.map((n) => [n.id, n.label, n.over]);
const links = (/** @type {Model} */ m) => m.edges.map((e) => [e.id, e.tail, e.head, e.style, e.label]);
const approval = 'requirement approval {\n  id: 1\n  text: Orders over the limit are approved by a manager.\n  risk: high\n  verifymethod: test\n}';
const flow = 'element approval_flow {\n  type: workflow\n  docref: docs/approval.md\n}';

describe('requirement: what it is taken for', () => {
  it('is read as boxes and links, into the model a flowchart gives', () => {
    const m = req(`${approval}\n${flow}\napproval_flow - satisfies -> approval`);
    assert.equal(m.type, 'flowchart');
    assert.equal(m.kindOfDiagram, 'requirementDiagram');
    assert.equal(m.direction, 'TD');
    assert.deepEqual(boxes(m), [['approval', 'approval', '«requirement»'], ['approval_flow', 'approval_flow', '«element»']]);
    assert.deepEqual(links(m), [['approval_flow-approval', 'none', 'arrow', 'dotted', 'satisfies']]);
    assert.deepEqual(m.nodes.map((n) => [n.shape, n.kind]), [['box', 'step'], ['box', 'step']]);
    assert.deepEqual(m.warnings, []);
  });

  it('is read with a semicolon after its first word, and is not taken for a flowchart with another', () => {
    assert.equal(parse(`requirementDiagram;\n${approval}`).nodes.length, 1);
    assert.equal(parse(`requirementDiagrams\n${approval}`).type, 'unsupported');
  });

  it('leaves an entity diagram and a flowchart read as they were', () => {
    assert.deepEqual(parse('erDiagram\nSUPPLIER ||--o{ ORDER : receives').edges.map((e) => e.id), ['SUPPLIER-ORDER']);
    assert.deepEqual(parse('flowchart TD\nA --> B').edges.map((e) => e.id), ['A-B']);
  });
});

describe('requirement: a requirement', () => {
  it('lists its id, its risk and how it is verified under its name, and keeps its text as the sentence about it', () => {
    const [n] = req(approval).nodes;
    assert.deepEqual(n.rows, [['id: 1', 'risk: high', 'verify: test']]);
    assert.equal(n.text, 'Orders over the limit are approved by a manager.');
    assert.equal(n.over, '«requirement»');
  });

  it('says which of the six kinds of requirement it is, in the line above its name', () => {
    const kinds = ['requirement', 'functionalRequirement', 'interfaceRequirement', 'performanceRequirement', 'physicalRequirement', 'designConstraint'];
    const m = req(kinds.map((kind, i) => `${kind} r${i} {\n  id: ${i}\n}`).join('\n'));
    assert.deepEqual(m.nodes.map((n) => n.over), ['«requirement»', '«functional requirement»', '«interface requirement»', '«performance requirement»', '«physical requirement»', '«design constraint»']);
    assert.deepEqual(Object.keys(things), [...kinds.map((k) => k.toLowerCase()), 'element']);
    assert.deepEqual(m.warnings, []);
  });

  it('lists them in one order, whatever order they were written in, and only those that were written', () => {
    assert.deepEqual(req('requirement a {\n  verifymethod: analysis\n  text: Words first\n  id: 9\n}').nodes[0].rows, [['id: 9', 'verify: analysis']]);
    const bare = req('requirement a {\n}\nrequirement b {\n  text: Only words\n}').nodes;
    assert.deepEqual(bare.map((n) => [n.rows, n.text]), [[undefined, undefined], [undefined, 'Only words']]);
  });

  it('reads its words for Mermaid whatever their case, and writes a risk and a method the one way', () => {
    const m = req('Requirement approval {\n  ID: REQ_1\n  Text: Approved.\n  Risk: High\n  VerifyMethod: Demonstration\n}\nrequirement b {\n  risk: MEDIUM\n  verifymethod: Inspection\n}\nrequirement c {\n  risk: low\n}');
    assert.deepEqual(m.nodes.map((n) => n.rows), [[['id: REQ_1', 'risk: high', 'verify: demonstration']], [['risk: medium', 'verify: inspection']], [['risk: low']]]);
    assert.deepEqual(m.warnings, []);
  });

  it('takes an id and a text in quotes, with what could not be written without them', () => {
    const [n] = req('requirement a {\n  id: "REQ-1.2 b"\n  text: "Orders, over the limit: approved (by a manager)."\n}').nodes;
    assert.deepEqual(n.rows, [['id: REQ-1.2 b']]);
    assert.equal(n.text, 'Orders, over the limit: approved (by a manager).');
  });

  it('reads a text as Markdown, in quotes or not, as plain words on one line', () => {
    assert.equal(req('requirement a {\n  text: "*Orders* over the limit<br/>are **approved**"\n}').nodes[0].text, 'Orders over the limit are approved');
    assert.equal(req('requirement a {\n  text: one **two** three\n}').nodes[0].text, 'one two three');
  });

  it('keeps a risk or a method Mermaid does not know as it was written, and says what Mermaid knows', () => {
    const m = req('requirement a {\n  risk: extreme\n  verifymethod: guess\n}');
    assert.deepEqual(m.nodes[0].rows, [['risk: extreme', 'verify: guess']]);
    assert.deepEqual(m.warnings, [
      'line 3: the risk "extreme" is kept as written, but Mermaid only knows low, medium and high: write one of those',
      'line 4: the way to verify "guess" is kept as written, but Mermaid only knows analysis, demonstration, inspection and test: write one of those',
    ]);
  });

  it('keeps the first of a thing said twice, as Mermaid does, and says so', () => {
    const m = req('requirement a {\n  id: 1\n  id: 2\n  text: one\n  text: two\n}');
    assert.deepEqual([m.nodes[0].rows, m.nodes[0].text], [[['id: 1']], 'one']);
    assert.deepEqual(m.warnings, ['line 4: "id: 2" is the second id of a: the first is kept, as Mermaid keeps it', 'line 6: "text: two" is the second text of a: the first is kept, as Mermaid keeps it']);
  });
});

describe('requirement: an element', () => {
  it('lists its type and the document it points to under its name', () => {
    const [n] = req(flow).nodes;
    assert.deepEqual([n.over, n.rows, n.text], ['«element»', [['type: workflow', 'doc: docs/approval.md']], undefined]);
  });

  it('takes them in quotes, in any case, and one without the other', () => {
    const m = req('Element a {\n  Type: "word processor"\n  DocRef: "https://example.com/a b"\n}\nelement b {\n  docref: docs/b.md\n}\nelement c {\n}');
    assert.deepEqual(m.nodes.map((n) => n.rows), [[['type: word processor', 'doc: https://example.com/a b']], [['doc: docs/b.md']], undefined]);
    assert.deepEqual(m.warnings, []);
  });

  it('says so when it is given what only a requirement has, and a requirement what only an element has', () => {
    const m = req('element a {\n  type: x\n  id: 1\n}\nrequirement b {\n  id: 1\n  type: x\n  docref: y\n}');
    assert.deepEqual(m.nodes.map((n) => n.rows), [[['type: x']], [['id: 1']]]);
    assert.deepEqual(m.warnings, [
      'line 4: not read: "id: 1" is not said of an element: it has a type and a docref',
      'line 8: not read: "type: x" is not said of a requirement: it has an id, a text, a risk and a verifymethod',
      'line 9: not read: "docref: y" is not said of a requirement: it has an id, a text, a risk and a verifymethod',
    ]);
  });
});

describe('requirement: names', () => {
  it('names a requirement in quotes, in several words, or in another alphabet, and gives it an id Merlive\'s own lines can use', () => {
    const m = req('requirement "Order approval" {\n  id: 1\n}\nelement the flow {\n  type: x\n}\nrequirement "Händler ❤" {\n  id: 2\n}\nthe flow - satisfies -> "Order approval"\n%% note Order_approval: Asked of every order.\n%% main: the_flow>Order_approval');
    assert.deepEqual(boxes(m).map(([id, label]) => [id, label]), [['Order_approval', 'Order approval'], ['the_flow', 'the flow'], ['H_ndler__', 'Händler ❤']]);
    assert.deepEqual(m.edges.map((e) => e.id), ['the_flow-Order_approval']);
    assert.deepEqual(m.notes, { Order_approval: 'Asked of every order.' });
    assert.deepEqual(m.hints.main, ['the_flow', 'Order_approval']);
    assert.deepEqual(m.warnings, []);
  });

  it('keeps two names apart that differ only in what an id cannot hold', () => {
    const m = req('requirement "a b" {\n  id: 1\n}\nrequirement a.b {\n  id: 2\n}\na.b - refines -> "a b"');
    assert.deepEqual(boxes(m).map(([id, label]) => [id, label]), [['a_b', 'a b'], ['a_b_2', 'a.b']]);
    assert.deepEqual(m.edges.map((e) => e.id), ['a_b_2-a_b']);
  });

  it('reads a name as Markdown, and keeps what it stresses', () => {
    const [n] = req('requirement "**Order** approval" {\n  id: 1\n}').nodes;
    assert.equal(n.label, 'Order approval');
    assert.deepEqual(n.emphasis, [{ words: 'Order', strong: true }, { words: ' approval' }]);
  });

  it('keeps the first of a name declared twice, as Mermaid does, and says so once', () => {
    const m = req('requirement a {\n  id: 1\n}\nrequirement a {\n  id: 2\n  text: again\n}\nelement b {\n  type: x\n}\nelement b {\n  type: y\n}');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.rows, n.text]), [['a', [['id: 1']], undefined], ['b', [['type: x']], undefined]]);
    assert.deepEqual(m.warnings, ['line 5: a is declared twice: the first is kept, as Mermaid keeps it', 'line 12: b is declared twice: the first is kept, as Mermaid keeps it']);
  });

  it('draws a name that is both a requirement and an element as the element, as Mermaid does, whichever came first', () => {
    for (const body of ['requirement a {\n  id: 1\n  text: words\n}\nelement a {\n  type: x\n}', 'element a {\n  type: x\n}\nrequirement a {\n  id: 1\n  text: words\n}']) {
      const m = req(body);
      assert.deepEqual(m.nodes.map((n) => [n.id, n.over, n.rows, n.text]), [['a', '«element»', [['type: x']], undefined]], body);
      assert.deepEqual(m.warnings.map((w) => w.replace(/^line \d+: /, '')), ['a is both a requirement and an element: it is drawn as the element, as Mermaid draws it']);
    }
  });
});

describe('requirement: relationships', () => {
  const pair = 'requirement a {\n  id: 1\n}\nrequirement b {\n  id: 2\n}\n';

  it('reads each of the seven as a dotted arrow that says its word, from the one written first', () => {
    for (const word of ['copies', 'derives', 'satisfies', 'verifies', 'refines', 'traces']) {
      assert.deepEqual(links(req(`${pair}a - ${word} -> b`)), [['a-b', 'none', 'arrow', 'dotted', word]], word);
    }
    assert.deepEqual(Object.keys(relationships), ['contains', 'copies', 'derives', 'satisfies', 'verifies', 'refines', 'traces']);
  });

  it('reads "contains" as a solid line with a mark at the one that contains, and no arrowhead', () => {
    assert.deepEqual(links(req(`${pair}a - contains -> b`)), [['a-b', 'circle', 'none', 'solid', 'contains']]);
  });

  it('reads one written the other way round as the same relationship: from the one after the word', () => {
    assert.deepEqual(links(req(`${pair}b <- satisfies - a\nb <- contains - a`)), [['a-b', 'none', 'arrow', 'dotted', 'satisfies'], ['a-b#2', 'circle', 'none', 'solid', 'contains']]);
  });

  it('reads one with no spaces, with many, with its word in capitals, and with names in quotes', () => {
    const m = req(`${pair}requirement "c d" {\n  id: 3\n}\na-contains->b\na<-traces-b\na   -   Satisfies   ->   "c d"\n"c d" <- refines - a`);
    assert.deepEqual(links(m), [['a-b', 'circle', 'none', 'solid', 'contains'], ['b-a', 'none', 'arrow', 'dotted', 'traces'], ['a-c_d', 'none', 'arrow', 'dotted', 'satisfies'], ['a-c_d#2', 'none', 'arrow', 'dotted', 'refines']]);
    assert.deepEqual(m.warnings, []);
  });

  it('reads one from a requirement to itself, and one written before what it joins is declared', () => {
    const m = req(`a - refines -> a\nb - derives -> a\n${pair}`);
    assert.deepEqual(links(m), [['a-a', 'none', 'arrow', 'dotted', 'refines'], ['b-a', 'none', 'arrow', 'dotted', 'derives']]);
    assert.deepEqual(m.nodes.map((n) => [n.id, n.over, n.rows]), [['a', '«requirement»', [['id: 1']]], ['b', '«requirement»', [['id: 2']]]]);
    assert.deepEqual(m.warnings, []);
  });

  it('draws what is in a relationship and never declared as a plain box, and says what to do', () => {
    const m = req(`${pair}a - contains -> nobody`);
    assert.deepEqual(m.nodes.map((n) => [n.id, n.over]), [['a', '«requirement»'], ['b', '«requirement»'], ['nobody', undefined]]);
    assert.deepEqual(m.warnings, ['line 8: nobody is in a relationship and is never declared: it is drawn as a plain box, and Mermaid will not draw this diagram; declare it as a requirement or an element']);
  });

  it('says so when the word between two names is not a relationship', () => {
    const m = req(`${pair}a - owns -> b\nb <- owns - a`);
    assert.equal(m.edges.length, 0);
    assert.deepEqual(m.warnings, [
      'line 8: not read: "a - owns -> b": "owns" is not a relationship; write contains, copies, derives, satisfies, verifies, refines or traces',
      'line 9: not read: "b <- owns - a": "owns" is not a relationship; write contains, copies, derives, satisfies, verifies, refines or traces',
    ]);
  });
});

describe('requirement: direction', () => {
  it('is drawn top to bottom, and says so once when another direction is asked for', () => {
    assert.deepEqual(req(`direction TB\n${approval}`).warnings, []);
    const m = req(`direction LR\n${approval}\ndirection RL`);
    assert.equal(m.direction, 'TD');
    assert.ok(!m.reversed);
    assert.deepEqual(m.warnings, ['line 2: a requirement diagram is drawn top to bottom for now: "direction LR" is read past']);
  });
});

describe('requirement: classes and styles', () => {
  it('takes a kind from a class: given where a thing is declared, to a name alone, or to several in a line; the first of several classes', () => {
    const m = req('requirement a:::important {\n  id: 1\n}\nrequirement "b c":::quiet,late {\n  id: 2\n}\nelement d {\n  type: x\n}\nelement e {\n  type: y\n}\nrequirement f {\n  id: 3\n}\nd:::quiet\n"b c":::important\nclass e, f late,quiet\nclassDef important stroke:#c62828,stroke-width:4px\nclassDef quiet,late stroke-dasharray: 4 2\nclassDef default fill:#f9f');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.kind, n.heavy ?? false, n.dashed ?? false]), [['a', 'important', true, false], ['b_c', 'important', true, false], ['d', 'quiet', false, true], ['e', 'late', false, true], ['f', 'late', false, true]]);
    assert.deepEqual(m.warnings, []);
  });

  it('takes a class given to a name in quotes, and one given before the name is declared', () => {
    const m = req('class "Order approval" urgent\nrequirement "Order approval" {\n  id: 1\n}');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.kind]), [['Order_approval', 'urgent']]);
  });

  it('says so when a class is given to a name that is nothing here', () => {
    const m = req(`${approval}\nclass nobody urgent\nno one:::urgent`);
    assert.deepEqual(m.warnings, ['line 8: a class is given to "nobody", which is not a requirement or an element here', 'line 9: a class is given to "no one", which is not a requirement or an element here']);
    assert.equal(m.nodes.length, 1);
  });

  it("keeps what a style says of a thing's outline, for one or for several, whatever their names hold", () => {
    const m = req('requirement a {\n  id: 1\n}\nrequirement "b c" {\n  id: 2\n}\nelement d.e {\n  type: x\n}\nstyle a fill:#f9f,stroke:#333,stroke-width:4px\nstyle "b c",d.e stroke:#c00,stroke-dasharray: 5 5');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.kind, n.heavy ?? false, n.dashed ?? false]), [['a', 'grey', true, false], ['b_c', 'red', false, true], ['d_e', 'red', false, true]]);
    assert.deepEqual(m.warnings, []);
  });
});

describe('requirement: what Merlive and Mermaid share', () => {
  it('reads front matter, a title for readers who cannot see it, comments and Merlive\'s own lines', () => {
    const m = parse(`---\ntitle: What an order needs\n---\nrequirementDiagram\n  accDescr: What has to be true before an order is sent\n  %% a comment\n  %%{init: {"theme": "forest"}}%%\n  requirement approval { %% not this\n    %% nor this\n    id: 1\n  }\n  ${flow.replace(/\n/g, '\n  ')}\n  approval_flow - satisfies -> approval\n  %% note approval: Asked of every order.\n  %% step: How it is met | approval_flow>approval | The flow is what meets it.\n  %% side: left`);
    assert.equal(m.title, 'What an order needs');
    assert.equal(m.heading, 'What an order needs');
    assert.equal(m.describes, 'What has to be true before an order is sent');
    assert.deepEqual(m.nodes[0].rows, [['id: 1']]);
    assert.deepEqual(m.notes, { approval: 'Asked of every order.' });
    assert.deepEqual(m.steps[0].seq, ['approval_flow-approval']);
    assert.deepEqual(m.hints, { side: 'left' });
    assert.deepEqual(m.warnings, []);
  });

  it('keeps "%%" after what is said of a thing as words, as Mermaid does: only after the { is it a comment', () => {
    const [n] = req('requirement a { %% a comment\n  id: 1 %% its number\n  text: "Up to 100%% of the order"\n}').nodes;
    assert.deepEqual([n.rows, n.text], [[['id: 1 %% its number']], 'Up to 100%% of the order']);
  });
});

describe('requirement: what it cannot read, it says', () => {
  it('says what is not a line of a requirement diagram, with its line, and makes no box of it', () => {
    const m = req(`${approval}\nthis is not a statement\nA --> B\nclass\nstyle\ndirection sideways\nsubgraph one\nend`);
    assert.deepEqual(m.warnings.map((w) => w.replace(/^line \d+: /, '')), ['not read: "this is not a statement"', 'not read: "A --> B"', 'not read: "class"', 'not read: "style"', 'not read: "direction sideways"', 'not read: "subgraph one"', 'not read: "end"']);
    assert.equal(m.nodes.length, 1);
    assert.equal(m.groups.length, 0);
  });

  it('says how to write fields that are not on lines of their own, a requirement with no { after it, and a name that needs quotes', () => {
    assert.deepEqual(req('requirement order-approval {\n}').warnings.slice(0, 1), ['line 2: not read: "requirement order-approval {"; put its name in quotes if it holds more than letters, digits and spaces']);
    const m = req('requirement a { id: 1 }\nrequirement b\n{\n  id: 2\n}\nelement c {}');
    assert.deepEqual(m.warnings, [
      'line 2: not read: "requirement a { id: 1 }"; write each thing said of it on a line of its own, between { and }',
      'line 3: not read: "requirement b"; open what is said of it with { at the end of this line, and close it with } on a line of its own',
      'line 4: not read: "{"',
      'line 5: not read: "id: 2"',
      'line 6: not read: a "}" with nothing open',
    ]);
    assert.deepEqual(m.nodes.map((n) => [n.id, n.over]), [['c', '«element»']]);
  });

  it('says what it cannot read among the things said of a requirement, and when they are never closed', () => {
    const m = req('requirement a {\n  id: 1\n  owner: Asha\n  just words\n  id:\n  text: kept');
    assert.deepEqual(m.warnings, [
      'line 4: not read: "owner: Asha" is not said of a requirement: it has an id, a text, a risk and a verifymethod',
      'line 5: not read: "just words"',
      'line 6: not read: "id:"',
      'line 2: what is said of a is never closed; end it with a line of }',
    ]);
    assert.deepEqual([m.nodes[0].rows, m.nodes[0].text], [[['id: 1']], 'kept']);
  });
});

describe('requirement: drawn', () => {
  it('is placed and drawn by the rules every diagram of boxes and links is held to', () => {
    const m = parse(readFileSync(join(root, 'corpus/requirement/requirement-whole.mmd'), 'utf8')), lay = layout(m);
    assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), []);
    const svg = picture(m, lay, builtIn, { title: 't' });
    assert.match(svg, /class="mv-over"[^>]*>«requirement»</);
    assert.match(svg, />risk: high</);
    assert.match(svg, /data-style="dotted"/);
  });
});

describe('requirement: the corpus', () => {
  /** @type {{file:string,covers:string,boxes:number,links:number,has?:string[],rows:number[],ends:string[][],kinds?:string[],title?:string,loses?:string,says?:string}[]} */
  const list = JSON.parse(readFileSync(join(root, 'corpus/index.json'), 'utf8')).requirement;

  it('lists every sample that is there, and every sample listed is there', () => {
    assert.deepEqual(list.map((s) => s.file).sort(), readdirSync(join(root, 'corpus/requirement')).filter((f) => f.endsWith('.mmd')).map((f) => `requirement/${f}`).sort());
    for (const s of list) assert.ok(s.covers && Number.isInteger(s.boxes) && Number.isInteger(s.links) && Array.isArray(s.rows) && Array.isArray(s.ends), s.file);
  });

  it('is read as its list says: boxes, links, rows, what each link ends in, words, and nothing left unread', () => {
    for (const s of list) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8'));
      assert.equal(m.kindOfDiagram, 'requirementDiagram', s.file);
      assert.equal(m.nodes.length, s.boxes, `${s.file}: boxes`);
      assert.equal(m.edges.length, s.links, `${s.file}: links`);
      assert.equal(m.groups.length, 0, `${s.file}: groups`);
      assert.deepEqual(m.nodes.map((n) => n.rows?.[0].length ?? 0), s.rows, `${s.file}: rows`);
      assert.deepEqual(m.edges.map((e) => [e.tail, e.head]), s.ends, `${s.file}: ends`);
      const said = [...m.nodes.flatMap((n) => [n.label, n.over ?? '', n.text ?? '', ...(n.rows ?? []).flat()]), ...m.edges.map((e) => e.label)];
      for (const words of s.has ?? []) assert.ok(said.includes(words), `${s.file}: "${words}" is not among its words: ${said.join(' | ')}`);
      for (const kind of s.kinds ?? []) assert.ok(m.nodes.some((n) => n.kind === kind), `${s.file}: no box of the kind ${kind}`);
      if (s.title !== undefined) assert.equal(m.title, s.title, s.file);
      // What a sample is known to be told is in its list; anything else said means something was not read.
      assert.deepEqual(m.warnings.map((w) => w.replace(/^line \d+: /, '')), s.says ? [s.says] : [], s.file);
    }
  });

  it('covers every kind of requirement, every relationship, every risk and every way to verify', () => {
    const models = list.map((s) => parse(readFileSync(join(root, 'corpus', s.file), 'utf8')));
    assert.deepEqual([...new Set(models.flatMap((m) => m.nodes.map((n) => n.over)))].sort(), Object.values(things).map((t) => `«${t.called}»`).sort());
    assert.deepEqual([...new Set(models.flatMap((m) => m.edges.map((e) => e.label)))].sort(), Object.keys(relationships).sort());
    const rows = new Set(models.flatMap((m) => m.nodes.flatMap((n) => (n.rows ?? []).flat())));
    for (const row of ['risk: low', 'risk: medium', 'risk: high', 'verify: analysis', 'verify: demonstration', 'verify: inspection', 'verify: test']) assert.ok(rows.has(row), row);
  });

  it('is drawn without breaking a rule, every sample of it', () => {
    for (const s of list) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8')), lay = layout(m);
      assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), [], s.file);
    }
  });
});
