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
    assert.deepEqual(m.edges.map((e) => [e.to, e.style, e.head, e.label]), [
      ['B', 'solid', 'arrow', ''], ['C', 'solid', 'none', ''], ['D', 'dotted', 'arrow', ''], ['E', 'thick', 'arrow', ''], ['F', 'solid', 'arrow', 'Yes'], ['G', 'solid', 'arrow', 'No'],
    ]);
    assert.ok(m.edges.every((e) => e.tail === 'none'));
  });

  it('reads a chain as one link after another, and statements split by ;', () => {
    assert.deepEqual(flow('A --> B --> C; C --> D').edges.map((e) => e.id), ['A-B', 'B-C', 'C-D']);
  });

  it('gives a second link between the same boxes a name of its own', () => {
    assert.deepEqual(flow('A --> B\nA -->|again| B').edges.map((e) => e.id), ['A-B', 'A-B#2']);
  });
});

describe('parse: what is at each end of a link', () => {
  const ends = (/** @type {string} */ body) => flow(body).edges.map((e) => [e.id, e.tail, e.head, e.style, e.label]);

  it('reads a circle and a cross at the far end', () => {
    assert.deepEqual(ends('A --o B\nB --x C'), [['A-B', 'none', 'circle', 'solid', ''], ['B-C', 'none', 'cross', 'solid', '']]);
  });

  it('reads a link that points both ways, and a circle or a cross at both ends', () => {
    assert.deepEqual(ends('A <--> B\nB o--o C\nC x--x D'), [['A-B', 'arrow', 'arrow', 'solid', ''], ['B-C', 'circle', 'circle', 'solid', ''], ['C-D', 'cross', 'cross', 'solid', '']]);
  });

  it('reads them dotted and thick, longer, and with words either way', () => {
    assert.deepEqual(ends('A <-.-> B\nB x==x C\nC o---o D\nD <-->|sync| E\nE <-- both --> F\nF -. maybe .-x G'), [
      ['A-B', 'arrow', 'arrow', 'dotted', ''], ['B-C', 'cross', 'cross', 'thick', ''], ['C-D', 'circle', 'circle', 'solid', ''],
      ['D-E', 'arrow', 'arrow', 'solid', 'sync'], ['E-F', 'arrow', 'arrow', 'solid', 'both'], ['F-G', 'none', 'cross', 'dotted', 'maybe'],
    ]);
  });

  it('keeps a box whose name starts with o or x, when a space comes before it', () => {
    const m = flow('A --- ops\nA --> xray');
    assert.deepEqual(m.nodes.map((n) => n.id), ['A', 'ops', 'xray']);
    assert.deepEqual(m.edges.map((e) => e.head), ['none', 'arrow']);
  });

  it('reads the boxes either side of an invisible link, and makes no link of it', () => {
    const m = flow('A[Order] ~~~ B[Pick]\nB --> C[Pack]');
    assert.deepEqual(m.nodes.map((n) => n.label), ['Order', 'Pick', 'Pack']);
    assert.deepEqual(m.edges.map((e) => e.id), ['B-C']);
    assert.deepEqual(m.warnings, []);
  });
});

describe('parse: the older shapes', () => {
  it('reads the flag, the double circle and the four that lean, with their words and nothing else', () => {
    const m = flow('A>Flagged] --> B(((Stop)))\nC[/Input/] --> D[\\Output\\]\nE[/Manual step\\] --> F[\\Priority/]');
    assert.deepEqual(m.nodes.map((n) => [n.label, n.shape]), [['Flagged', 'box'], ['Stop', 'pill'], ['Input', 'box'], ['Output', 'box'], ['Manual step', 'box'], ['Priority', 'box']]);
    assert.deepEqual(m.edges.map((e) => e.id), ['A-B', 'C-D', 'E-F']);
    assert.deepEqual(m.warnings, []);
  });

  it('closes a leaning shape at its own end, not at the next one along', () => {
    assert.deepEqual(flow('A[/Manual\\] --> B[/In/]').nodes.map((n) => n.label), ['Manual', 'In']);
  });

  it('leaves a plain box whose words begin with a slash as it was', () => {
    assert.deepEqual(flow('A[/api/orders] --> B').nodes.map((n) => [n.label, n.shape]), [['/api/orders', 'box'], ['B', 'box']]);
  });
});

describe('parse: words', () => {
  it('turns entity codes into the characters they stand for, in a box and on a link', () => {
    const m = flow('A["Marked #quot;rush#quot;"] -->|#gt; 100 #amp; up| B["Thanks #9829; #hearts;"]');
    assert.deepEqual(m.nodes.map((n) => n.label), ['Marked "rush"', 'Thanks ♥ ♥']);
    assert.equal(m.edges[0].label, '> 100 & up');
  });

  it('leaves a code it does not know, and one that is no character, as they were typed', () => {
    assert.deepEqual(flow('A["Colour #fff; here"] --> B["Bell #7; and #1114112;"]').nodes.map((n) => n.label), ['Colour #fff; here', 'Bell #7; and #1114112;']);
  });

  it('reads a Markdown string as plain words, its own line breaks kept', () => {
    const m = flow('A["`**Urgent** order`"] --> B["`Pick *today*\n  and _pack_ it`"]\nB --> C["`snake_case stays`"]');
    assert.deepEqual(m.nodes.map((n) => n.label), ['Urgent order', 'Pick today and pack it', 'snake_case stays']);
    assert.deepEqual(m.nodes[1].breaks, ['Pick today', 'and pack it']);
    assert.deepEqual(m.edges.map((e) => e.id), ['A-B', 'B-C']);
    assert.deepEqual(m.warnings, []);
  });

  it('says so when a Markdown string is never closed', () => {
    const m = flow('A --> B\nC["`Pick *today*\nC --> D');
    assert.match(m.warnings[0], /^line 3: not read: a Markdown string that is never closed/);
    assert.deepEqual(m.nodes.map((n) => n.id), ['A', 'B']);
  });

  it('leaves a Font Awesome icon out and keeps the words; a box that was only an icon takes its id', () => {
    const m = flow('A["fa:fa-truck Shipped"] --> B[fa:fa-check Delivered]\nB --> done[fab:fa-github]');
    assert.deepEqual(m.nodes.map((n) => n.label), ['Shipped', 'Delivered', 'done']);
  });

  it('does the same for the title of a group and for a label written with @{ }', () => {
    const m = flow('subgraph wh ["Pick #amp; pack"]\n  A@{ label: "fa:fa-box Parcel #9829;" } --> B\nend');
    assert.equal(m.groups[0].title, 'Pick & pack');
    assert.equal(m.nodes[0].label, 'Parcel ♥');
  });
});

describe('parse: & between boxes', () => {
  it('links every box before a link to every box after it', () => {
    const m = flow('A[Web] & B[Phone] --> C[Pick] & D[Bill]');
    assert.deepEqual(m.edges.map((e) => e.id), ['A-C', 'A-D', 'B-C', 'B-D']);
    assert.deepEqual(m.nodes.map((n) => n.label), ['Web', 'Phone', 'Pick', 'Bill']);
    assert.deepEqual(m.warnings, []);
  });

  it('carries on down a chain, with the words and the style of each link', () => {
    const m = flow('A -->|go| B & C -.-> D');
    assert.deepEqual(m.edges.map((e) => [e.id, e.style, e.label]), [['A-B', 'solid', 'go'], ['A-C', 'solid', 'go'], ['B-D', 'dotted', ''], ['C-D', 'dotted', '']]);
  });

  it('names boxes with no link between them, and gives each its class', () => {
    const m = flow('A[One]:::risk & B[Two]');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.kind]), [['A', 'risk'], ['B', 'step']]);
    assert.deepEqual(m.edges, []);
  });
});

describe('parse: front matter', () => {
  it('reads past it to the flowchart, and keeps its title', () => {
    const m = parse('---\ntitle: Order to cash\nconfig:\n  look: handDrawn\n  title: not this one\n---\nflowchart LR\n  A[Order] --> B[Cash]');
    assert.equal(m.type, 'flowchart');
    assert.equal(m.direction, 'LR');
    assert.equal(m.title, 'Order to cash');
    assert.deepEqual(m.edges.map((e) => e.id), ['A-B']);
    assert.deepEqual(m.warnings, []);
  });

  it('takes a quoted title without its quotes, and lets accTitle say otherwise', () => {
    assert.equal(parse('---\ntitle: "Order: to cash"\n---\nflowchart LR\nA --> B').title, 'Order: to cash');
    assert.equal(parse('---\ntitle: One\n---\nflowchart LR\naccTitle: Two\nA --> B').title, 'Two');
  });

  it('still names another kind of diagram behind it', () => {
    const m = parse('---\ntitle: Calls\n---\nsequenceDiagram\n  A->>B: hello');
    assert.equal(m.type, 'unsupported');
    assert.equal(m.kindOfDiagram, 'sequenceDiagram');
  });

  it('says so when it is never closed, and draws nothing from a guess', () => {
    const m = parse('---\ntitle: Order to cash\nflowchart LR\nA --> B');
    assert.equal(m.nodes.length, 0);
    assert.match(m.warnings[0], /^line 1: the front matter is never closed; end it with a line of ---/);
  });

  it('is only front matter on the first line: a --- further down is a link', () => {
    const m = flow('A[One]\nA --- B');
    assert.deepEqual(m.edges.map((e) => [e.id, e.head]), [['A-B', 'none']]);
  });
});

describe('parse: @{ … }', () => {
  it('reads a box written with a shape and a label', () => {
    const m = flow('A@{ shape: rect, label: "Take the order" } --> B@{ shape: diam, label: "In stock?" }\nB --> C@{ shape: cyl, label: "Orders" }\nB --> D@{ shape: stadium, label: Done }');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.label, n.shape, n.kind]), [
      ['A', 'Take the order', 'box', 'step'], ['B', 'In stock?', 'decision', 'decision'], ['C', 'Orders', 'box', 'data'], ['D', 'Done', 'pill', 'terminal'],
    ]);
    assert.deepEqual(m.edges.map((e) => e.id), ['A-B', 'B-C', 'B-D']);
    assert.deepEqual(m.warnings, []);
  });

  it('knows a shape by any of its names, and draws one it has no drawing for as a box', () => {
    const m = flow('A@{ shape: decision }\nB@{ shape: database }\nC@{ shape: terminal }\nD@{ shape: lightning-bolt }\nE@{ shape: hex }\nF@{ shape: dbl-circ }');
    assert.deepEqual(m.nodes.map((n) => [n.shape, n.kind]), [['decision', 'decision'], ['box', 'data'], ['pill', 'terminal'], ['box', 'step'], ['decision', 'decision'], ['pill', 'terminal']]);
    assert.deepEqual(m.warnings, []);
  });

  it('keeps a comma, a colon and a closing brace that are inside a quoted label', () => {
    const m = flow('A@{ label: "Pick, pack: {all}", shape: rect } --> B');
    assert.equal(m.nodes[0].label, 'Pick, pack: {all}');
    assert.deepEqual(m.edges.map((e) => e.id), ['A-B']);
  });

  it('keeps where an author broke the label', () => {
    assert.deepEqual(flow('A@{ label: "Check stock<br/>in both" }').nodes[0].breaks, ['Check stock', 'in both']);
  });

  it('adds to a box that already has its words, and to one named on an earlier line', () => {
    const m = flow('A[Quote]@{ row: 1, column: 1 } --> B[Order]\nB@{ shape: diam }');
    assert.deepEqual(m.nodes.map((n) => [n.label, n.shape]), [['Quote', 'box'], ['Order', 'decision']]);
    assert.deepEqual(m.warnings, []);
  });

  it('keeps the label of an icon and of an image, and nothing else of them', () => {
    const m = flow('A@{ icon: "fa:user", form: "square", label: "Buyer", pos: "t", h: 60 } --> B@{ img: "https://example.com/a.svg", label: "Supplier", w: 60 }');
    assert.deepEqual(m.nodes.map((n) => [n.label, n.shape]), [['Buyer', 'box'], ['Supplier', 'box']]);
    assert.ok(!JSON.stringify(m).includes('example.com'));
  });

  it('reads one written over several lines', () => {
    const m = flow('A@{\n  shape: diam\n  label: "In stock?"\n}\nA --> B');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.label, n.shape]), [['A', 'In stock?', 'decision'], ['B', 'B', 'box']]);
    assert.deepEqual(m.warnings, []);
  });

  it('reads a link that has an id, and past what is set on it', () => {
    const m = flow('A e1@--> B\nB e2@==>|go| C\nC e3@-- back --> A\ne1@{ animate: true }\ne2@{ animation: fast }\ne3@{ curve: linear, step: 2 }');
    assert.deepEqual(m.edges.map((e) => [e.id, e.style, e.label]), [['A-B', 'solid', ''], ['B-C', 'thick', 'go'], ['C-A', 'solid', 'back']]);
    assert.deepEqual(m.nodes.map((n) => n.id), ['A', 'B', 'C'], 'what is set on a link makes no box');
    assert.deepEqual(m.warnings, []);
  });

  it('reads past a group shown collapsed', () => {
    const m = flow('Start --> one\nsubgraph one [Checks]\n  A --> B\nend\none --> End\none@{ view: collapsed }');
    assert.deepEqual(m.nodes.map((n) => n.id), ['Start', 'A', 'B', 'End']);
    assert.deepEqual(m.warnings, []);
  });

  it('says so when one is never closed, and leaves nothing of it behind', () => {
    const m = flow('A --> B\nC@{ shape: diam, label: "In stock?"\nC --> D');
    assert.match(m.warnings[0], /^line 3: not read: an @\{ that is never closed/);
    assert.deepEqual(m.nodes.map((n) => n.id), ['A', 'B']);
  });
});

describe('parse: what it does not read, it says', () => {
  it('names a link to itself and a line it cannot read, each with its line', () => {
    const m = flow('A & --> C\nD --> D\nE --> F\nG ~~> H');
    assert.equal(m.warnings.length, 3);
    assert.match(m.warnings[0], /^line 2: not read/);
    assert.match(m.warnings[1], /^line 3: a link from D to itself/);
    assert.match(m.warnings[2], /^line 5: not read/);
    assert.deepEqual(m.nodes.map((n) => n.id), ['D', 'E', 'F'], 'what could be read is kept, and nothing of what could not');
  });

  it('says a group with no boxes has none, and leaves the links to it out', () => {
    const m = flow('subgraph empty\nend\nA --> empty');
    assert.match(m.warnings[0], /the group "empty" has no boxes/);
    assert.deepEqual(m.edges, []);
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
    assert.deepEqual(blocksOf('flowchart TD\nA --> B', 'mmd'), [{ source: 'flowchart TD\nA --> B', title: '', line: 1 }]);
  });
});
