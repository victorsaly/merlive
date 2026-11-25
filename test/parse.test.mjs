import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { blocksOf, findLoops, parse } from '../skills/merlive/scripts/parse.mjs';

const flow = (/** @type {string} */ body) => parse(`flowchart TD\n${body}`);

describe('parse: boxes', () => {
  it('reads each bracket as its shape, and gives each a kind', () => {
    const m = flow('A[Box] --> B(Round)\nB --> C([Pill])\nC --> D{Ask}\nD --> E((Circle))\nE --> F[[Sub]]\nF --> G{{Hex}}');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.label, n.shape, n.kind]), [
      ['A', 'Box', 'box', 'step'], ['B', 'Round', 'box', 'step'], ['C', 'Pill', 'pill', 'terminal'], ['D', 'Ask', 'decision', 'decision'],
      ['E', 'Circle', 'pill', 'terminal'], ['F', 'Sub', 'box', 'step'], ['G', 'Hex', 'decision', 'decision'],
    ]);
  });

  it('keeps brackets that are inside a quoted label, and turns a line break into a space', () => {
    const m = flow('A["Save (draft)"] --> B[One<br/>two]');
    assert.equal(m.nodes[0].label, 'Save (draft)');
    assert.equal(m.nodes[1].label, 'One two');
  });

  it('uses the id as the label of a box that has none', () => {
    assert.equal(flow('start --> stop').nodes[0].label, 'start');
  });

  it('takes a kind from a class line and from :::', () => {
    const m = flow('A[One] --> B[Two]:::risk\nclass A rework');
    assert.deepEqual(m.nodes.map((n) => n.kind), ['rework', 'risk']);
  });
});

describe('parse: links', () => {
  it('reads arrows, their styles and their words', () => {
    const m = flow('A --> B\nA --- C\nA -.-> D\nA ==> E\nA -->|Yes| F\nA -- No --> G');
    assert.deepEqual(m.edges.map((e) => [e.to, e.style, e.arrow, e.label]), [
      ['B', 'solid', true, ''], ['C', 'solid', false, ''], ['D', 'dotted', true, ''], ['E', 'thick', true, ''], ['F', 'solid', true, 'Yes'], ['G', 'solid', true, 'No'],
    ]);
  });

  it('reads a chain as one link after another, and statements split by ;', () => {
    assert.deepEqual(flow('A --> B --> C; C --> D').edges.map((e) => e.id), ['A-B', 'B-C', 'C-D']);
  });

  it('gives a second link between the same boxes a name of its own', () => {
    assert.deepEqual(flow('A --> B\nA -->|again| B').edges.map((e) => e.id), ['A-B', 'A-B#2']);
  });
});

describe('parse: what it does not read, it says', () => {
  it('names &, a link to itself, a subgraph and a line it cannot read, each with its line', () => {
    const m = flow('A & B --> C\nD --> D\nsubgraph one\nE --> F\nend\nG ~~> H');
    assert.equal(m.warnings.length, 4);
    assert.match(m.warnings[0], /^line 2: "&"/);
    assert.match(m.warnings[1], /^line 3: a link from D to itself/);
    assert.match(m.warnings[2], /^line 4: subgraph/);
    assert.match(m.warnings[3], /^line 7: not read/);
    assert.ok(m.edges.some((e) => e.id === 'E-F'), 'the boxes inside a subgraph are still read');
  });

  it('reads past styling without a word', () => {
    const m = flow('A --> B\nclassDef x fill:#f00\nstyle A fill:#0f0\nlinkStyle 0 stroke:#00f\nclick A callback');
    assert.deepEqual(m.warnings, []);
    assert.equal(m.nodes.length, 2);
  });

  it('says a diagram that is not a flowchart is not one', () => {
    const m = parse('sequenceDiagram\n  A->>B: hi');
    assert.equal(m.type, 'unsupported');
    assert.equal(m.kindOfDiagram, 'sequenceDiagram');
    assert.equal(m.nodes.length, 0);
  });

  it('draws BT and RL the other way round, and says so', () => {
    assert.equal(parse('graph RL\nA --> B').direction, 'LR');
    assert.match(parse('graph BT\nA --> B').warnings[0], /BT is drawn as TD/);
    assert.equal(parse('flowchart LR\nA --> B').direction, 'LR');
  });
});

describe("parse: Merlive's own lines", () => {
  const src = `flowchart TD
  A --> B
  B --> C
  C --> A
  %% just a comment
  %% note A: Where it starts.
  %% note Z: Nobody.
  %% main: A > B > C
  %% side: left
  %% step: Forward | A>B>C | Two links.
  %% step: Round | loop 1 | All three.
  %% step: Wrong | A>C | No such link.
  %% step: None | loop 9 | No such loop.
  %% step: Pause | - | Nothing lit.`;
  const m = parse(src);

  it('keeps notes, and says when a note is for a box that is not there', () => {
    assert.deepEqual(m.notes, { A: 'Where it starts.', Z: 'Nobody.' });
    assert.ok(m.warnings.includes('note for Z: no such node'));
  });

  it('keeps the hints', () => {
    assert.deepEqual(m.hints, { main: ['A', 'B', 'C'], side: 'left' });
  });

  it("turns a step's path into the links it runs along", () => {
    assert.deepEqual(m.steps.map((s) => [s.title, s.seq, s.loop]), [
      ['Forward', ['A-B', 'B-C'], false], ['Round', ['A-B', 'B-C', 'C-A'], true], ['Wrong', [], false], ['None', [], false], ['Pause', [], false],
    ]);
    assert.ok(m.warnings.includes('step "Wrong": no link from A to C'));
    assert.ok(m.warnings.includes('step "None": there is no loop 9'));
  });
});

describe('findLoops', () => {
  it('finds each loop once, shortest first, from its earliest box', () => {
    const m = flow('A --> B\nB --> C\nC --> D\nC --> B\nD --> B');
    assert.deepEqual(findLoops(m), [['B', 'C'], ['B', 'C', 'D']]);
  });

  it('finds none in a flow that only goes forward', () => {
    assert.deepEqual(findLoops(flow('A --> B\nA --> C\nB --> C')), []);
  });
});

describe('blocksOf', () => {
  it('finds the mermaid blocks of a Markdown file, each under its heading, and no other fence', () => {
    const md = '# Top\n\n```mermaid\nflowchart TD\nA --> B\n```\n\n## Second ##\n\n```js\nlet a;\n```\n\n~~~mermaid\ngraph LR\nC --> D\n~~~\n';
    assert.deepEqual(blocksOf(md), [
      { source: 'flowchart TD\nA --> B', title: 'Top', line: 3 },
      { source: 'graph LR\nC --> D', title: 'Second', line: 14 },
    ]);
  });

  it('takes a .mmd file whole', () => {
    assert.deepEqual(blocksOf('flowchart TD\nA --> B', true), [{ source: 'flowchart TD\nA --> B', title: '', line: 1 }]);
  });
});
