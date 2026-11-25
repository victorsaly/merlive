// Why: a block diagram is boxes and links, but its author places the boxes: a grid, a block that spans it, a
// space that holds a cell open. Merlive places boxes by rule. So these hold two things: that a block diagram
// which is a flow (every block joined, the grid no more than the order they come in) is read into the model a
// flowchart gives, and that one whose meaning is in its grid is left as Mermaid, with a sentence that says why
// and what to do. They also hold the corpus's own list (the `block` list of corpus/index.json) to what is read today.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout } from '../skills/merlive/scripts/layout.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';
import { builtIn } from '../skills/merlive/scripts/design.mjs';
import { arrowWays } from '../skills/merlive/scripts/block.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const block = (/** @type {string} */ body, head = 'block') => parse(`${head}\n${body}`);
/** @typedef {import('../skills/merlive/scripts/parse.mjs').Model} Model */
const boxes = (/** @type {Model} */ m) => m.nodes.map((n) => [n.id, n.label, n.shape]);
const links = (/** @type {Model} */ m) => m.edges.map((e) => [e.id, e.tail, e.head, e.style, e.label]);
const said = (/** @type {Model} */ m) => m.warnings.map((w) => w.replace(/^line \d+: /, ''));

describe('block: a flow', () => {
  it('is read as boxes and links, into the model a flowchart gives', () => {
    const m = block('columns 3\nweb["Web shop"] erp["ERP"] wh["Warehouse"]\nweb --> erp\nerp --> wh');
    assert.equal(m.type, 'flowchart');
    assert.equal(m.kindOfDiagram, 'block');
    assert.equal(m.left, undefined);
    assert.deepEqual(boxes(m), [['web', 'Web shop', 'box'], ['erp', 'ERP', 'box'], ['wh', 'Warehouse', 'box']]);
    assert.deepEqual(links(m), [['web-erp', 'none', 'arrow', 'solid', ''], ['erp-wh', 'none', 'arrow', 'solid', '']]);
    assert.deepEqual(m.warnings, []);
  });

  it('is read the same under its older name', () => {
    const m = block('a b\na --> b', 'block-beta');
    assert.deepEqual([m.type, m.kindOfDiagram, m.nodes.length, m.edges.length], ['flowchart', 'block-beta', 2, 1]);
    assert.equal(parse('blocks\na b').type, 'unsupported');
  });

  it('runs the way its blocks were written: along one row left to right, else top to bottom', () => {
    assert.equal(block('a b c\na --> b\nb --> c').direction, 'LR');
    assert.equal(block('columns auto\na b c\na --> b\nb --> c').direction, 'LR');
    assert.equal(block('columns 3\na b c\na --> b\nb --> c').direction, 'LR');
    assert.equal(block('columns 1\na\nb\na --> b').direction, 'TD');
    assert.equal(block('columns 2\na b\nc d\na --> b\nb --> c\nc --> d').direction, 'TD');
  });

  it('names a block by its id until it is given words, wherever they are given', () => {
    const m = block('columns 3\nstart space stop\nstart("Start") --> stop("Stop")');
    assert.deepEqual(boxes(m), [['start', 'Start', 'box'], ['stop', 'Stop', 'box']]);
    assert.deepEqual(boxes(block('quote order\nquote --> order')), [['quote', 'quote', 'box'], ['order', 'order', 'box']]);
    // Words given once are kept when the block is named again with none.
    assert.deepEqual(boxes(block('a["Raise"] b\na --> b\nb --> a')).map((b) => b[1]), ['Raise', 'b']);
  });

  it('keeps a line its author broke, and reads an entity code as its character', () => {
    const m = block('shop["Web shop<br/>and portal"] erp["ERP #amp; stock"]\nshop --> erp');
    assert.deepEqual(m.nodes[0].breaks, ['Web shop', 'and portal']);
    assert.equal(m.nodes[1].label, 'ERP & stock');
    // A block arrow that holds only spaces has no words, and is called by its id.
    assert.match(block('a b\na --> b\nfeeds<["&nbsp;&nbsp;"]>(down)').left ?? '', /"feeds" is a block arrow/);
  });

  it('makes a block that is only named in a link, as Mermaid does', () => {
    const m = block('shop["Shop"]\nshop --> erp');
    assert.deepEqual(boxes(m), [['shop', 'Shop', 'box'], ['erp', 'erp', 'box']]);
    assert.equal(m.type, 'flowchart');
  });

  it('reads several statements on one line, and a link with no spaces in it', () => {
    const m = block('a b a-->b');
    assert.deepEqual([m.nodes.length, links(m).map((l) => l[0])], [2, ['a-b']]);
  });

  it('is placed and passes its rules', () => {
    for (const src of ['columns 3\nweb["Web shop"] space erp["ERP"]\nweb --> erp', 'columns 1\na["Order"]\nb["Pick"]\nblock:g["Dispatch"]\n  c["Pack"] d["Send"]\nend\na --> b\nb --> c\nc --> d']) {
      const m = block(src), lay = layout(m);
      assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), [], src);
    }
  });
});

describe('block: shapes', () => {
  it('reads every shape Mermaid gives a block as the shape a flowchart draws', () => {
    const m = block('a["Box"] b("Round") c(["Stadium"]) d[["Subroutine"]] e[("Database")] f(("Circle")) g>"Flag"] h{"Decision"} i{{"Prepare"}} j[/"Input"/] k[\\"Output"\\] l[/"Manual"\\] m[\\"Trapezoid"/] n((("Stop")))');
    assert.deepEqual(m.nodes.map((n) => [n.label, n.shape]), [
      ['Box', 'box'], ['Round', 'box'], ['Stadium', 'pill'], ['Subroutine', 'subroutine'], ['Database', 'cylinder'], ['Circle', 'pill'], ['Flag', 'flag'],
      ['Decision', 'diamond'], ['Prepare', 'hexagon'], ['Input', 'lean-right'], ['Output', 'lean-left'], ['Manual', 'trapezoid'], ['Trapezoid', 'trapezoid-alt'], ['Stop', 'double-circle'],
    ]);
    assert.equal(m.nodes[4].kind, 'data', 'a cylinder holds data');
  });

  it('takes words apart from their block by a space, and a shape given later', () => {
    assert.deepEqual(boxes(block('a ["Label"] b\na --> b'))[0], ['a', 'Label', 'box']);
    assert.deepEqual(boxes(block('a b\na{"Enough?"} --> b'))[0], ['a', 'Enough?', 'diamond']);
  });

  it('says so when words are not in quotes, which Mermaid does not draw', () => {
    const m = block('a[Box] b\na --> b');
    assert.deepEqual(said(m), ['not read: "[Box]": the words of a block go in quotes, as in a["Box"]']);
    assert.deepEqual(boxes(m).map((b) => b[0]), ['a', 'b']);
  });
});

describe('block: links', () => {
  it('reads a link of each kind, and what is at its ends', () => {
    const m = block('columns 1\na\nb\nc\nd\ne\nf\ng\nh\na --> b\nb --- c\nc ==> d\nd -.-> e\ne --o f\nf --x g\ng <--> h\na ----> c');
    assert.deepEqual(links(m).map((l) => l.slice(1, 4)), [
      ['none', 'arrow', 'solid'], ['none', 'none', 'solid'], ['none', 'arrow', 'thick'], ['none', 'arrow', 'dotted'],
      ['none', 'circle', 'solid'], ['none', 'cross', 'solid'], ['arrow', 'arrow', 'solid'], ['none', 'arrow', 'solid'],
    ]);
    assert.deepEqual(m.warnings, []);
  });

  it('reads the words written into a link, of any kind', () => {
    const m = block('a b c d\na -- "sends orders" --> b\nb == "at once" ==> c\nc -. "later" .-> d');
    assert.deepEqual(links(m).map((l) => [l[3], l[4]]), [['solid', 'sends orders'], ['thick', 'at once'], ['dotted', 'later']]);
  });

  it('joins a link to a block that holds others to what is inside it, as a link to a group is', () => {
    const m = block('columns 1\nshop["Shop"]\nblock:back\n  erp["ERP"]\n  ledger["Ledger"]\nend\nbank["Bank"]\nshop --> back\nerp --> ledger\nback --> bank');
    assert.deepEqual(m.edges.map((e) => e.id), ['shop-erp', 'erp-ledger', 'ledger-bank']);
    assert.deepEqual(m.nodes.map((n) => n.id), ['shop', 'erp', 'ledger', 'bank']);
    assert.equal(m.type, 'flowchart');
  });

  it('says what Mermaid does not read as a link, and what to write', () => {
    assert.deepEqual(said(block('a b c\na --> b --> c\na --> b\nb --> c')), ['not read: "a --> b --> c": a link joins two blocks; write each link on a line of its own']);
    assert.deepEqual(said(block('a b\na -->|words| b\na --> b')), ['not read: "|words|": the words of a link are written into it in quotes, as in a -- "words" --> b']);
    assert.deepEqual(said(block('a b\na -- words --> b\na --> b')), ['not read: "-- words --> b": the words of a link go in quotes, as in a -- "words" --> b']);
    assert.deepEqual(said(block('a b\na -->\na --> b')), ['not read: "-->": a link goes from one block to another, and none follows it']);
    assert.deepEqual(said(block('a b\na ~~~ b\na --> b')), ['not read: "~~~"']);
  });
});

describe('block: blocks that hold others', () => {
  it('reads one as a group, named when its author named it', () => {
    const m = block('columns 1\nshop["Shop"]\nblock:back["Back office"]\n  columns 2\n  erp["ERP"] ledger["Ledger"]\nend\nshop --> erp\nerp --> ledger');
    assert.deepEqual(m.groups, [{ id: 'back', title: 'Back office', members: ['erp', 'ledger'] }]);
    assert.deepEqual(m.warnings, []);
  });

  it('gives one with no name none, and one with no id an id nobody wrote', () => {
    const m = block('shop\nblock:back\n  erp\nend\nblock\n  block_1\nend\nshop --> erp\nerp --> block_1');
    assert.deepEqual(m.groups.map((g) => [g.id, g.title, g.members]), [['back', '', ['erp']], ['block/1', '', ['block_1']]]);
  });

  it('puts one written inside another inside it', () => {
    const m = block('columns 1\nshop\nblock:firm\n  block:buying\n    erp\n  end\n  block:books\n    ledger\n  end\nend\nshop --> erp\nerp --> ledger');
    assert.deepEqual(m.groups.map((g) => [g.id, g.parent, g.members]), [['firm', undefined, ['erp', 'ledger']], ['buying', 'firm', ['erp']], ['books', 'firm', ['ledger']]]);
  });

  it('says so when one is never closed, or closed twice', () => {
    assert.deepEqual(said(block('a\nblock:g\n  b\na --> b')), ['the block g is never closed; end it with a line of "end"']);
    assert.deepEqual(said(block('a b\nend\na --> b')), ['not read: an "end" with no block open']);
  });
});

describe('block: what a block looks like', () => {
  it('reads a style and a class as a flowchart does: a kind for its colour, and its outline', () => {
    const m = block('a("Start") b("Stop")\na --> b\nstyle a fill:#636,stroke:#333,stroke-width:4px\nstyle b fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5');
    assert.equal(m.nodes[0].heavy, true);
    assert.equal(m.nodes[1].dashed, true);
    const k = block('shop erp ledger\nshop --> erp\nerp --> ledger\nclassDef back fill:#6e6ce6,stroke:#333,stroke-width:4px;\nclass erp,ledger back');
    assert.deepEqual(k.nodes.map((n) => n.kind), ['step', 'back', 'back']);
    assert.deepEqual(k.warnings, []);
  });

  it('gives a class to a block named after the class line too', () => {
    const m = block('class a hot\nclassDef hot fill:#f00\na b\na --> b');
    assert.equal(m.nodes[0].kind, 'hot');
  });

  it('says so when a style or a class line cannot be read', () => {
    assert.deepEqual(said(block('a b\na --> b\nstyle a,b fill:#f00')), ['not read: "style a,b fill:#f00": a style is for one block; write a line for each']);
    assert.deepEqual(said(block('a b\na --> b\nclass a')), ['not read: "class a": write the blocks, then the class, as in class a,b urgent']);
    assert.deepEqual(said(block('a b\na --> b\nclassDef')), ['not read: "classDef"']);
  });
});

describe('block: what is not a block', () => {
  it('reads past a comment on a line of its own, and says a comment after blocks is not one', () => {
    assert.deepEqual(block('%% how an order goes\na b\n%% joined\na --> b').warnings, []);
    const m = block('a b %% the two ends\na --> b');
    assert.deepEqual(said(m), ['not read: "%% the two ends": Mermaid draws a comment after blocks as more blocks; put it on a line of its own']);
    assert.equal(m.nodes.length, 2);
  });

  it('keeps the title of its front matter', () => {
    assert.equal(parse('---\ntitle: From shop to ledger\n---\nblock\n  a b\n  a --> b').title, 'From shop to ledger');
  });

  it('says what it cannot read, and reads the rest of the line', () => {
    const m = block('a & b\na --> b');
    assert.deepEqual(said(m), ['not read: "&"']);
    assert.equal(m.edges.length, 1);
    assert.deepEqual(said(block('a b\na --> b\ncolumns three')), ['not read: "columns three": write how many columns as a number, or "columns auto"']);
  });
});

describe('block: a diagram placed by its author is left as Mermaid', () => {
  const why = (/** @type {Model} */ m) => m.left ?? '';

  it('leaves one whose blocks no link joins, and says why and what to do', () => {
    const m = block('columns 3\na["Shop"] b["Portal"] c["Phone"]\nd["ERP"] e["Stock"] f["Ledger"]');
    assert.equal(m.type, 'unsupported');
    assert.equal(why(m), 'its blocks are placed by its author, in a grid, and Merlive places boxes by rule and does not keep a grid yet: "Shop", "Portal", "Phone" and 3 more are joined to nothing by a link. To have it drawn, join every block to another with a link, give each one column, and keep a space only between two blocks that a link joins');
    assert.deepEqual(m.warnings, [`line 3: left as Mermaid: ${why(m)}`]);
    // What was read is still there, for whoever draws the grid one day.
    assert.equal(m.nodes.length, 6);
  });

  it('leaves one with a block that spans columns, which says more than the order of a flow', () => {
    const m = block('columns 3\nshop["Web shop"]:3\nerp["ERP"]:2 stock["Stock"]\nshop --> erp\nerp --> stock');
    assert.equal(m.type, 'unsupported');
    assert.match(why(m), /: "Web shop" spans 3 columns \(line 3\); "ERP" spans 2 columns \(line 4\)\. To have it drawn/);
  });

  it('leaves one with a block arrow, which is an arrow between two cells and not a block', () => {
    const m = block('columns 3\nshop["Shop"] to<["orders"]>(right) erp["ERP"]\nshop --> erp');
    assert.equal(m.type, 'unsupported');
    assert.match(why(m), /: "orders" is a block arrow \(line 3\)\. To have it drawn/);
  });

  it('reads past a space that makes room for a link, along a row or down a column', () => {
    assert.equal(block('columns 3\nshop space erp\nshop --> erp').type, 'flowchart');
    assert.equal(block('columns 1\na\nspace\nb\nb --> a').type, 'flowchart');
    assert.equal(block('shop space:3 erp ledger\nshop --> erp\nerp --> ledger').type, 'flowchart');
    assert.equal(block('a space space b\na --> b').type, 'flowchart');
    assert.deepEqual(block('columns 3\nshop space erp\nshop --> erp').warnings, []);
  });

  it('leaves one with a space that puts a block where its author wanted it', () => {
    const m = block('columns 3\na b c\nspace d space\na --> b\nb --> c\nb --> d');
    assert.equal(m.type, 'unsupported');
    assert.match(why(m), /: the space on line 4 places a block, and does not make room for a link\. To have it drawn/);
    assert.equal(block('space a b\na --> b').type, 'unsupported', 'a space before the first block');
    assert.equal(block('a b space\na --> b').type, 'unsupported', 'a space after the last');
  });

  it('leaves one with a block inside another that no link of its own joins', () => {
    const m = block('block:g\n  a\n  b\nend\nc\ng --> c');
    assert.equal(m.type, 'unsupported');
    assert.match(why(m), /: "a", "b" are joined to nothing by a link\./);
  });

  it('says every reason up to three, and how many more there are', () => {
    const m = block('columns 4\na:2 b:2\nc:2 d:2\ne:4');
    assert.match(why(m), /: "a" spans 2 columns \(line 3\); "b" spans 2 columns \(line 3\); "c" spans 2 columns \(line 4\); and 3 more\. To have it drawn/);
  });

  it('keeps what was written, cell by cell, for whoever places a grid', () => {
    const m = block('columns 3\nweb["Web shop"] space erp["ERP"]\nspace:3\nblock:g:2\n  columns 1\n  a\nend\ndown<["stock"]>(down)\nweb --> erp');
    assert.deepEqual(m.grid, {
      columns: 3,
      cells: [
        { is: 'block', id: 'web', span: 1, line: 3 },
        { is: 'space', span: 1, line: 3 },
        { is: 'block', id: 'erp', span: 1, line: 3 },
        { is: 'space', span: 3, line: 4 },
        { is: 'group', id: 'g', span: 2, line: 5, grid: { columns: 1, cells: [{ is: 'block', id: 'a', span: 1, line: 7 }] } },
        { is: 'arrow', id: 'down', span: 1, line: 9, points: ['down'] },
      ],
    });
    assert.deepEqual(block('a b\na --> b').grid, { columns: 'auto', cells: [{ is: 'block', id: 'a', span: 1, line: 2 }, { is: 'block', id: 'b', span: 1, line: 2 }] });
  });

  it('reads every way a block arrow can point', () => {
    const m = block('r<["Right"]>(right) l<["Left"]>(left) u<["Up"]>(up) d<["Down"]>(down) x<["Both"]>(x) y<["Up and down"]>(y) xd<["Across and down"]>(x, down)');
    assert.deepEqual(m.grid?.cells.map((c) => (c.is === 'arrow' ? c.points : [])), [['right'], ['left'], ['up'], ['down'], ['x'], ['y'], ['x', 'down']]);
    assert.deepEqual(arrowWays, ['right', 'left', 'up', 'down', 'x', 'y']);
    assert.deepEqual(said(block('a<["x"]>(sideways) b\na --> b')).slice(0, 1), ['not read: "(sideways)": a block arrow points right, left, up, down, x (both ways across) or y (both ways up and down)']);
  });

  it('leaves a block diagram of one block, which has nothing to join it to', () => {
    assert.equal(block('erp["ERP"]').type, 'unsupported');
    // One with no blocks at all is a blank block, as any diagram with nothing in it.
    assert.deepEqual([block('columns 2').type, block('columns 2').left], ['flowchart', undefined]);
  });
});

describe('block: the corpus', () => {
  /** @type {{file:string,covers:string,boxes:number,links:number,groups?:number,has?:string[],shapes?:string[],ends?:string[][],kinds?:string[],title?:string,direction?:string,left?:string,loses?:string}[]} */
  const list = JSON.parse(readFileSync(join(root, 'corpus/index.json'), 'utf8')).block;

  it('lists every sample that is there, and every sample listed is there', () => {
    assert.deepEqual(list.map((s) => s.file).sort(), readdirSync(join(root, 'corpus/block')).filter((f) => f.endsWith('.mmd')).map((f) => `block/${f}`).sort());
    for (const s of list) assert.ok(s.covers && Number.isInteger(s.boxes) && Number.isInteger(s.links), s.file);
  });

  it('is read as its list says: boxes, links, groups, shapes, words, and whether it is drawn or left', () => {
    for (const s of list) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8'));
      assert.match(m.kindOfDiagram, /^block(-beta)?$/, s.file);
      assert.equal(m.nodes.length, s.boxes, `${s.file}: boxes`);
      assert.equal(m.edges.length, s.links, `${s.file}: links`);
      assert.equal(m.groups.length, s.groups ?? 0, `${s.file}: groups`);
      if (s.shapes) assert.deepEqual(m.nodes.map((n) => n.shape), s.shapes, `${s.file}: shapes`);
      if (s.ends) assert.deepEqual(m.edges.map((e) => [e.tail, e.head]), s.ends, `${s.file}: ends`);
      if (s.direction) assert.equal(m.direction, s.direction, `${s.file}: direction`);
      const words = [...m.nodes.map((n) => n.label), ...m.edges.map((e) => e.label), ...m.groups.map((g) => g.title)];
      for (const w of s.has ?? []) assert.ok(words.includes(w), `${s.file}: "${w}" is not among its words: ${words.join(' | ')}`);
      for (const kind of s.kinds ?? []) assert.ok(m.nodes.some((n) => n.kind === kind), `${s.file}: no box of the kind ${kind}`);
      if (s.title !== undefined) assert.equal(m.title, s.title, s.file);
      // A sample is drawn, with nothing to say, or left as Mermaid, saying only why.
      assert.equal(m.type, s.left ? 'unsupported' : 'flowchart', `${s.file}: ${m.left ?? 'drawn'}`);
      if (s.left) assert.ok((m.left ?? '').includes(s.left), `${s.file}: left because "${m.left}", not "${s.left}"`);
      assert.deepEqual(m.warnings.map((w) => w.replace(/^line \d+: /, '')), s.left ? [`left as Mermaid: ${m.left}`] : [], s.file);
    }
  });

  it('has both kinds: flows that are drawn, and grids that are left', () => {
    assert.ok(list.filter((s) => !s.left).length >= 15 && list.filter((s) => s.left).length >= 8);
  });

  it('places every sample that is drawn, and each passes its rules', () => {
    for (const s of list.filter((x) => !x.left)) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8')), lay = layout(m);
      assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), [], s.file);
    }
  });
});
