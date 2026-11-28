// Why: a mindmap is boxes and links too: a tree, each line a box and each step in from the margin a link to
// the box it is under. These hold the reading, through parse(), and hold the corpus's own list
// (corpus/mindmap.json) to what is read today. How a tree is placed and drawn is tested where it is placed and
// drawn: here it is only checked that every sample is, with no rule broken.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout } from '../skills/merlive/scripts/layout.mjs';
import { builtIn } from '../skills/merlive/scripts/design.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';
import { page, picture } from '../skills/merlive/scripts/render.mjs';
import { drawnAs } from '../skills/merlive/scripts/mindmap.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const map = (/** @type {string} */ body) => parse(`mindmap\n${body}`);
/** @typedef {import('../skills/merlive/scripts/parse.mjs').Model} Model */
const boxes = (/** @type {Model} */ m) => m.nodes.map((n) => [n.id, n.label]);
const links = (/** @type {Model} */ m) => m.edges.map((e) => e.id);
const ordering = '  root((Ordering))\n    Buying\n      Quotes\n      Orders\n    Paying\n      Invoices';

describe('mindmap: what it is taken for', () => {
  it('reads how far in each line is without splitting the whole source again for every box', () => {
    const src = `mindmap\n  root((Plan))\n${Array.from({ length: 500 }, (_, i) => `    Idea ${i}`).join('\n')}`;
    const split = String.prototype.split;
    let whole = 0;
    String.prototype.split = function (/** @type {any[]} */ ...args) {
      if (this.length === src.length) whole++;
      return split.apply(this, /** @type {any} */ (args));
    };
    try {
      assert.equal(parse(src).nodes.length, 501);
    } finally {
      String.prototype.split = split;
    }
    assert.ok(whole <= 2, `the source was split ${whole} times`);
  });

  it('calls a plain box an idea on the page, and says nothing of a map of its root alone', () => {
    assert.equal(map('  root((Plan))\n    Goals').meanings?.step, 'Idea');
    assert.equal(map('  root((Plan))').meanings?.step, undefined);
  });

  it('is read as boxes and links, into the model a flowchart gives: a tree that grows to the right', () => {
    const m = map(ordering);
    assert.equal(m.type, 'flowchart');
    assert.equal(m.kindOfDiagram, 'mindmap');
    assert.equal(m.direction, 'LR');
    assert.deepEqual(boxes(m), [['root', 'Ordering'], ['Buying', 'Buying'], ['Quotes', 'Quotes'], ['Orders', 'Orders'], ['Paying', 'Paying'], ['Invoices', 'Invoices']]);
    assert.deepEqual(links(m), ['root-Buying', 'Buying-Quotes', 'Buying-Orders', 'root-Paying', 'Paying-Invoices']);
    assert.deepEqual(m.warnings, []);
  });

  it('joins a box to the one it is under by a line with nothing at either end', () => {
    assert.deepEqual(map(ordering).edges.map((e) => [e.tail, e.head, e.style, e.label]), Array(5).fill(['none', 'none', 'solid', '']));
  });

  it('is read with a semicolon after its first word, and is not taken for one with another word', () => {
    assert.equal(parse(`mindmap;\n${ordering}`).nodes.length, 6);
    assert.equal(parse(`mindmaps\n${ordering}`).type, 'unsupported');
  });

  it('is a tree of one box when only its root is written, and of none when nothing is', () => {
    assert.deepEqual(boxes(map('  Ordering')), [['Ordering', 'Ordering']]);
    assert.deepEqual([map('').nodes.length, map('').warnings], [0, []]);
  });

  it('is not turned top to bottom for being wide, unless its author asks: a tree of many leaves is far wider that way', () => {
    assert.equal(map(ordering).hints.turn, false);
    assert.equal(map(`${ordering}\n  %% turn: yes`).hints.turn, true);
    assert.equal(map(`  %% turn: yes\n${ordering}`).hints.turn, true);
  });
});

describe('mindmap: the tree', () => {
  it('puts a line under the nearest line above it that is further left, however unevenly it is written', () => {
    // Mermaid's own example: C is not as far in as B, and not as far out as A, so it is under A beside B.
    const m = map('    Root\n        A\n            B\n          C\n      D\n         E');
    assert.deepEqual(links(m), ['Root-A', 'A-B', 'A-C', 'Root-D', 'D-E']);
    assert.deepEqual(m.warnings, []);
  });

  it('counts a tab as one step in, as Mermaid does', () => {
    assert.deepEqual(links(map('\tRoot\n\t\tA\n\t\t\tB\n\t\tC')), ['Root-A', 'A-B', 'Root-C']);
  });

  it('takes the root wherever it is written, even at the margin', () => {
    assert.deepEqual(links(parse('mindmap\nRoot\n  A\n  B')), ['Root-A', 'Root-B']);
  });

  it('passes empty lines', () => {
    assert.deepEqual(links(map('  Root\n\n    A\n\n\n    B')), ['Root-A', 'Root-B']);
  });

  it('says so when a line is as far left as the root: Mermaid has one root and will not draw two', () => {
    const m = map('  Root\n    A\n  Second\n    B');
    assert.deepEqual(links(m), ['Root-A', 'Root-Second', 'Second-B']);
    assert.deepEqual(m.warnings, ['line 4: "Second" is written as far left as the root "Root", or further: a mindmap has one root, and Mermaid will not draw this one. It is drawn as a branch of the root; write it further in than the root']);
    assert.equal(map('      Root\n  A').warnings.length, 1);
  });

  it('makes a box of every line, so two lines of the same words are two boxes', () => {
    const m = map('  Root\n    Same\n    Same\n      Under the second');
    assert.deepEqual(boxes(m), [['Root', 'Root'], ['Same', 'Same'], ['Same_2', 'Same'], ['Under_the_second', 'Under the second']]);
    assert.deepEqual(links(m), ['Root-Same', 'Root-Same_2', 'Same_2-Under_the_second']);
  });
});

describe('mindmap: shapes', () => {
  it('gives a shape no meaning a flowchart gives it: a hexagon is no decision, a circle no start or end', () => {
    const m = map('  root((Ordering))\n    a{{Buying}}\n    b((Paying))\n    c(Receiving)\n    d[Returns]\n    e))Late((\n    f)Idea(');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.kind]), [['root', 'root'], ['a', 'step'], ['b', 'step'], ['c', 'step'], ['d', 'step'], ['e', 'step'], ['f', 'step']]);
    const html = page(m, layout(m), builtIn, { title: 't', source: 'x', version: '0' });
    assert.doesNotMatch(html, /Decision|Start or end/);
  });

  const shaped = (/** @type {string} */ line) => map(`  Root\n    ${line}`).nodes[1];

  it('reads each of Mermaid\'s shapes into the nearest one Merlive draws', () => {
    assert.deepEqual(['a[Square]', 'a(Rounded)', 'a((Circle))', 'a{{Hexagon}}', 'Bare words'].map((line) => [shaped(line).label, shaped(line).shape]), [
      ['Square', 'box'], ['Rounded', 'box'], ['Circle', 'pill'], ['Hexagon', 'hexagon'], ['Bare words', 'box'],
    ]);
  });

  it('draws a bang as a box with a heavy outline and a cloud as a round-ended box with a dashed one, and says each once', () => {
    const m = map('  Root\n    a))Late((\n    b))Lost((\n    c)Maybe(\n    d)Perhaps(');
    assert.deepEqual(m.nodes.slice(1).map((n) => [n.label, n.shape, n.heavy ?? false, n.dashed ?? false]), [
      ['Late', 'box', true, false], ['Lost', 'box', true, false], ['Maybe', 'pill', false, true], ['Perhaps', 'pill', false, true],
    ]);
    assert.deepEqual(m.warnings, [
      'line 3: a bang (written "))words((") has no drawing of its own in Merlive: each is drawn as a box with a heavy outline',
      'line 5: a cloud (written ")words(") has no drawing of its own in Merlive: each is drawn as a round-ended box with a dashed outline',
    ]);
  });

  it('says once that a square and a rounded box are drawn alike, when a mindmap has both', () => {
    assert.deepEqual(map('  Root\n    a[Square]\n    b(Rounded)\n    c[Another]').warnings, ['line 4: a square "[words]" and a rounded "(words)" are both drawn as the design\'s own box, whose corners are the design\'s: they are not told apart']);
    assert.deepEqual(map('  Root\n    a[Square]\n    Bare').warnings, []);
    assert.deepEqual(map('  Root\n    b(Rounded)\n    Bare').warnings, []);
  });

  it('knows what each of Mermaid\'s shapes is drawn as', () => {
    assert.deepEqual(Object.keys(drawnAs).sort(), ['bang', 'circle', 'cloud', 'default', 'hexagon', 'rounded', 'square']);
  });

  it('gives the root its shape like any other, and tells it apart as the root', () => {
    const m = map('  root((Ordering))\n    Buying');
    assert.deepEqual(m.nodes.map((n) => [n.shape, n.kind]), [['pill', 'root'], ['box', 'step']]);
  });
});

describe('mindmap: names and words', () => {
  it('keeps an id apart from its words: the id is what Merlive\'s own lines name the box by', () => {
    const m = map('  root((Ordering))\n    buy[Buying things]\n  %% note buy: Starts with a quote');
    assert.deepEqual(boxes(m), [['root', 'Ordering'], ['buy', 'Buying things']]);
    assert.deepEqual(m.notes, { buy: 'Starts with a quote' });
  });

  it('gives a box with no id one from its words, with _ for what an id cannot hold', () => {
    assert.deepEqual(boxes(map('  ((Ordering & paying))\n    Tony\'s list')), [['Ordering___paying', 'Ordering & paying'], ['Tony_s_list', 'Tony\'s list']]);
  });

  it('takes an id of several words, and words of any script', () => {
    assert.deepEqual(boxes(map('  Root\n    my id[The label]\n    Zamówienia 🧾')), [['Root', 'Root'], ['my_id', 'The label'], ['Zam_wienia__', 'Zamówienia 🧾']]);
  });

  it('reads what is before a bracket in bare words as an id, as Mermaid does', () => {
    // "Costs (monthly)" is, to Mermaid, a rounded box called Costs that says "monthly".
    assert.deepEqual(boxes(map('  Root\n    Costs (monthly)')), [['Root', 'Root'], ['Costs', 'monthly']]);
  });

  it('takes words in quotes, with what a bracket would otherwise end', () => {
    assert.deepEqual(boxes(map('  Root\n    a["Paid: in full (or part)"]')).pop(), ['a', 'Paid: in full (or part)']);
  });

  it('reads every label as Markdown, in a Markdown string or not: bold, italic and its own line breaks', () => {
    const m = map('  id1["`**Ordering** from\nstart to *end*`"]\n    a[**Urgent** order]\n    Pick *today*\n    On time<br/>and in full');
    assert.deepEqual(m.nodes.map((n) => [n.label, n.breaks ?? null]), [
      ['Ordering from start to end', ['Ordering from', 'start to end']], ['Urgent order', null], ['Pick today', null], ['On time and in full', ['On time', 'and in full']],
    ]);
    assert.deepEqual(m.nodes[0].emphasis, [{ words: 'Ordering', strong: true }, { words: ' from start to ' }, { words: 'end', em: true }]);
    assert.deepEqual(m.nodes[1].emphasis, [{ words: 'Urgent', strong: true }, { words: ' order' }]);
    assert.deepEqual(m.nodes[2].emphasis, [{ words: 'Pick ' }, { words: 'today', em: true }]);
    assert.deepEqual(m.warnings, []);
  });

  it('puts what is under a Markdown string of several lines under it, by where its first line began', () => {
    assert.deepEqual(links(map('  root["`Ordering\nand paying`"]\n    Buying\n      Quotes')), ['root-Buying', 'Buying-Quotes']);
  });

  it('gives a box written with nothing in its brackets its id for words', () => {
    assert.deepEqual(boxes(map('  Root\n    orders[]')).pop(), ['orders', 'orders']);
  });
});

describe('mindmap: icons and classes', () => {
  it('gives the box on the line above the icon written under it, when Merlive has a drawing of it', () => {
    const m = map('  Root\n    Reading\n    ::icon(fa fa-book)\n    Paying\n      ::icon(fa fa-credit-card)');
    assert.deepEqual(m.nodes.map((n) => [n.label, n.icon ?? null]), [['Root', null], ['Reading', 'book'], ['Paying', 'credit-card']]);
    assert.deepEqual(m.warnings, []);
  });

  it('says once when an icon is one it has no drawing for, and keeps the words', () => {
    const m = map('  Root\n    A\n    ::icon(mdi mdi-skull-outline)\n    B\n    ::icon(mdi mdi-skull-outline)');
    assert.deepEqual(m.nodes.map((n) => [n.label, n.icon ?? null]), [['Root', null], ['A', null], ['B', null]]);
    assert.deepEqual(m.warnings, ['line 4: the icon "mdi mdi-skull-outline" is not one Merlive has a drawing for; it is left out and its words kept']);
  });

  it('makes the box on the line above of the kind its class names: the first, where several are given', () => {
    const m = map('  Root\n    A[Overdue]\n    :::urgent large\n    B\n  %% kind urgent: Needs doing today');
    assert.deepEqual(m.nodes.map((n) => n.kind), ['root', 'urgent', 'step']);
    assert.deepEqual(m.meanings, { step: 'Idea', urgent: 'Needs doing today' });
    assert.deepEqual(m.warnings, []);
  });

  it('lets a class say what the root is, in place of "root"', () => {
    assert.equal(map('  Root\n  :::start').nodes[0].kind, 'start');
  });

  it('says so when an icon or a class has no line above it to belong to', () => {
    assert.deepEqual(map('  ::icon(fa fa-book)\n  :::urgent\n  Root').warnings, [
      'line 2: not read: "::icon(fa fa-book)": an icon belongs to the box on the line above it, and nothing is above this one',
      'line 3: not read: ":::urgent": a class belongs to the box on the line above it, and nothing is above this one',
    ]);
  });
});

describe('mindmap: what Merlive and Mermaid share', () => {
  it('reads a comment on a line of its own past, and keeps %% after words as words, as Mermaid does', () => {
    const m = map('  Root\n    %% not a box\n    A %% still its words');
    assert.deepEqual(boxes(m), [['Root', 'Root'], ['A____still_its_words', 'A %% still its words']]);
  });

  it('takes the title from front matter, and Merlive\'s own lines as a flowchart does', () => {
    const m = parse(`---\ntitle: Ordering, start to end\n---\nmindmap\n${ordering}\n  %% note Buying: Starts with a quote\n  %% step: Buy | root>Buying | First the buying`);
    assert.equal(m.title, 'Ordering, start to end');
    assert.equal(m.heading, 'Ordering, start to end');
    assert.deepEqual(m.notes, { Buying: 'Starts with a quote' });
    assert.equal(m.steps.length, 1);
    assert.deepEqual(m.warnings, []);
  });

  it('takes accTitle and accDescr as a flowchart does, though Mermaid\'s own mindmap would make boxes of them', () => {
    const m = map('  accTitle: Ordering\n  accDescr: What ordering is made of\n  Root\n    A');
    assert.deepEqual([m.title, m.describes, m.nodes.length], ['Ordering', 'What ordering is made of', 2]);
  });

  it('makes a box of every other line: a mindmap has no classDef, style or direction of its own', () => {
    assert.deepEqual(boxes(map('  Root\n    classDef urgent fill:#fee\n    direction LR')).slice(1), [['classDef_urgent_fill__fee', 'classDef urgent fill:#fee'], ['direction_LR', 'direction LR']]);
  });
});

describe('mindmap: what it cannot read, it says', () => {
  const told = (/** @type {string} */ line) => map(`  Root\n    ${line}`).warnings;

  it('says what to write when a bracket is never closed, or closed with something after it', () => {
    assert.deepEqual(told('a[One'), ['line 3: not read: "a[One": what "[" opens is closed by "]" at the end of the line']);
    assert.deepEqual(told('a[One] two'), ['line 3: not read: "a[One] two": what "[" opens is closed by "]" at the end of the line']);
    assert.deepEqual(told('a((One)'), ['line 3: not read: "a((One)": what "((" opens is closed by "))" at the end of the line']);
    assert.deepEqual(told('a))One'), ['line 3: not read: "a))One": what "))" opens is closed by "((" at the end of the line']);
  });

  it('says what to write for a bracket that opens nothing in a mindmap', () => {
    assert.deepEqual(told('a{One}'), ['line 3: not read: "a{One}": a single "{" opens nothing in a mindmap; a hexagon is written a{{words}}, and words with a bracket in them go in quotes inside a shape: a["words (more)"]']);
    assert.deepEqual(told('One}'), ['line 3: not read: "One}": a single "}" opens nothing in a mindmap; a hexagon is written a{{words}}, and words with a bracket in them go in quotes inside a shape: a["words (more)"]']);
  });

  it('makes no box of a line it does not read, and puts nothing under it', () => {
    const m = map('  Root\n    a{One}\n      Under nothing\n    B');
    assert.deepEqual(links(m), ['Root-Under_nothing', 'Root-B']);
  });
});

describe('mindmap: drawn', () => {
  it('is drawn as a tree to the right: each box right of the one it is under, and no line heavier than another once it is known for a diagram of things', () => {
    const m = map(ordering), lay = layout(m);
    assert.equal(lay.direction, 'LR');
    for (const e of m.edges) assert.ok(lay.nodes[e.to].x > lay.nodes[e.from].x, e.id);
    const svg = picture(m, lay, builtIn, { title: 't' });
    assert.match(svg, />Ordering</);
    assert.doesNotMatch(svg, /marker-end|class="mv-head"/);
    assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), []);
  });
});

describe('mindmap: the corpus', () => {
  /** @type {{file:string,covers:string,boxes:number,links:number,has?:string[],rows:number[],ends:string[][],kinds?:string[],shapes?:string[],direction?:string,title?:string,loses?:string,says?:string}[]} */
  const list = JSON.parse(readFileSync(join(root, 'corpus/index.json'), 'utf8')).mindmap;

  it('lists every sample that is there, and every sample listed is there', () => {
    assert.deepEqual(list.map((s) => s.file).sort(), readdirSync(join(root, 'corpus/mindmap')).filter((f) => f.endsWith('.mmd')).map((f) => `mindmap/${f}`).sort());
    for (const s of list) assert.ok(s.covers && Number.isInteger(s.boxes) && Number.isInteger(s.links) && Array.isArray(s.rows) && Array.isArray(s.ends), s.file);
  });

  it('is read as its list says: boxes, links, shapes, what each link ends in, words, and nothing left unread', () => {
    for (const s of list) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8'));
      assert.match(m.kindOfDiagram, /^mindmap;?$/, s.file);
      assert.equal(m.direction, 'LR', s.file);
      assert.equal(m.nodes.length, s.boxes, `${s.file}: boxes`);
      assert.equal(m.edges.length, s.links, `${s.file}: links`);
      // A tree: one link fewer than boxes, and nothing in a group.
      assert.equal(m.edges.length, Math.max(0, m.nodes.length - 1), `${s.file}: a tree`);
      assert.equal(m.groups.length, 0, `${s.file}: groups`);
      assert.deepEqual(m.nodes.map((n) => n.rows?.[0].length ?? 0), s.rows, `${s.file}: rows`);
      assert.deepEqual(m.edges.map((e) => [e.tail, e.head]), s.ends, `${s.file}: ends`);
      if (s.shapes) assert.deepEqual(m.nodes.map((n) => n.shape), s.shapes, `${s.file}: shapes`);
      const said = m.nodes.map((n) => n.label);
      for (const words of s.has ?? []) assert.ok(said.includes(words), `${s.file}: "${words}" is not among its words: ${said.join(' | ')}`);
      for (const kind of s.kinds ?? []) assert.ok(m.nodes.some((n) => n.kind === kind), `${s.file}: no box of the kind ${kind}`);
      if (s.title !== undefined) assert.equal(m.title, s.title, s.file);
      // What a sample is known to be told is in its list; anything else said means something was not read.
      assert.deepEqual(m.warnings.map((w) => w.replace(/^line \d+: /, '')), s.says ? [s.says] : [], s.file);
    }
  });

  it('covers every shape Mermaid has for a mindmap, an icon, a class, and bold and italic', () => {
    const models = list.map((s) => parse(readFileSync(join(root, 'corpus', s.file), 'utf8')));
    const nodes = models.flatMap((m) => m.nodes);
    for (const shape of new Set(Object.values(drawnAs).map((d) => d.shape))) assert.ok(nodes.some((n) => n.shape === shape), shape);
    assert.ok(nodes.some((n) => n.heavy) && nodes.some((n) => n.dashed), 'a bang and a cloud');
    assert.ok(nodes.some((n) => n.icon) && nodes.some((n) => n.emphasis?.some((r) => r.strong)) && nodes.some((n) => n.emphasis?.some((r) => r.em)) && nodes.some((n) => n.breaks));
    assert.ok(nodes.some((n) => n.kind !== 'root' && n.kind !== 'step'), 'a class');
  });

  // Placement by rank gives each box the nearest free lane of its rank, wherever the boxes under the one before
  // it will go. In a tree of many leaves a box then sits beside its sister, in the way of the lines to her own,
  // and two lines cross. Until placement keeps a box clear of what is under the box before it, such a tree is
  // refused by the rule named here. When that is mended this list is empty, and this test says so.
  /** @type {Record<string, string>} */
  const refused = /** @type {Record<string,string>} */ ({});

  it('is drawn without breaking a rule, every sample of it but a tree of many leaves', () => {
    for (const s of list) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8')), lay = layout(m);
      const broken = score(m, lay, builtIn).checks.filter((c) => !c.ok);
      if (refused[s.file]) assert.deepEqual(broken.map((c) => c.id), [refused[s.file]], `${s.file}: now drawn by rule, so take it out of the list above`);
      else assert.deepEqual(broken.map((c) => `${c.id}: ${c.detail}`), [], s.file);
      assert.deepEqual(lay.warnings, [], s.file);
    }
  });
});
