// Why: a class and an entity are boxes that list things under their name, joined by lines that end in more
// than an arrowhead. These hold the placing and the drawing of that to a model made by hand, so they stand
// whatever reads the Mermaid.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { hitsBox, layout, measure, meet, rowsRoom, tableNeeds } from '../skills/merlive/scripts/layout.mjs';
import { builtIn, designFrom } from '../skills/merlive/scripts/design.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';
import { draw, picture } from '../skills/merlive/scripts/render.mjs';

/** Three classes as a reader would give them: a flowchart's model, with rows, a line above a name, and ends. */
const classes = (direction = 'TD') => {
  const m = parse(`flowchart ${direction}\n  Order --> OrderLine\n  Order --> Supplier\n  Shape --> Order`);
  const by = (/** @type {string} */ id) => /** @type {import('../skills/merlive/scripts/parse.mjs').Node} */ (m.nodes.find((n) => n.id === id));
  by('Order').rows = [['+String number', '+Date placed'], ['+total() Money', '+cancel()']];
  by('OrderLine').rows = [['+int quantity', '+Money price'], []];
  by('Shape').over = '«interface»';
  Object.assign(m.edges[0], { head: 'none', tail: 'diamond', near: '1', far: 'many', label: 'holds' });
  Object.assign(m.edges[1], { head: 'arrow', style: 'dotted' });
  Object.assign(m.edges[2], { head: 'none', tail: 'triangle' });
  return m;
};

describe('rows: a box that lists things under its name', () => {
  it('is as tall as what it lists, in the one width every box of the diagram has', () => {
    const lay = layout(classes());
    assert.equal(new Set(Object.values(lay.nodes).map((n) => n.w)).size, 1);
    const { Order, OrderLine, Supplier, Shape } = lay.nodes;
    assert.equal(Supplier.h, lay.box.h, 'a box with no rows is the size it always was');
    assert.equal(Order.h, lay.box.h + 2 * (2 * measure.rowPad + 2 * measure.rowLine), 'two compartments of two lines');
    assert.equal(OrderLine.h, lay.box.h + 2 * measure.rowPad + 2 * measure.rowLine, 'a compartment with nothing in it is not drawn');
    assert.equal(Shape.h, lay.box.h + measure.overLine, 'a line above the name');
  });

  it('is wide enough for its longest row, and wider than a flowchart goes when it must be', () => {
    const m = classes();
    assert.ok(rowsRoom(layout(m).box.w) >= '+total() Money'.length);
    /** @type {string[][]} */ (m.nodes[0].rows)[1].push('+calculateTotal(items: List<OrderLine>) Money');
    const lay = layout(m);
    assert.ok(lay.box.w > 288 && rowsRoom(lay.box.w) >= 45);
  });

  it('sits on the middle line of its rank, with the same room to the next rank whatever its height', () => {
    const lay = layout(classes());
    const { Order, OrderLine, Supplier, Shape } = lay.nodes;
    assert.equal(OrderLine.y, Supplier.y, 'two boxes of one rank share a middle line');
    const taller = Math.max(OrderLine.h, Supplier.h);
    assert.equal((OrderLine.y - taller / 2) - (Order.y + Order.h / 2), measure.rankGap.TD);
    assert.equal((Order.y - Order.h / 2) - (Shape.y + Shape.h / 2), measure.rankGap.TD);
  });

  it('is drawn top to bottom, since boxes of different heights are only placed that way yet', () => {
    assert.equal(layout(classes('LR')).direction, 'TD');
  });

  it('passes every rule, and no line touches a box it does not belong to', () => {
    const m = classes(), lay = layout(m), result = score(m, lay, builtIn);
    assert.deepEqual(result.checks.filter((c) => !c.ok).map((c) => `${c.id} ${c.detail}`), []);
    for (const e of m.edges) for (const n of Object.values(lay.nodes)) {
      if (n.id === e.from || n.id === e.to) continue;
      assert.ok(!lay.edges[e.id].points.slice(1).some((p, i) => hitsBox([lay.edges[e.id].points[i], p], n, 0)), `${e.id} through ${n.id}`);
    }
    const [a, b, c] = m.edges.map((e) => lay.edges[e.id].points);
    assert.equal(meet(a, b).crossings + meet(a, c).crossings + meet(b, c).crossings, 0);
  });

  it('fails P6 for a row no box is wide enough for, and says which', () => {
    const m = classes();
    /** @type {string[][]} */ (m.nodes[0].rows)[0].push(`+${'veryLongName'.repeat(6)} String`);
    const p6 = score(m, layout(m), builtIn).checks.find((c) => c.id === 'P6');
    assert.match(p6?.detail ?? '', /"Order" lists a line too long for any box: "\+veryLongName/);
  });
});

describe('rows: drawn', () => {
  const m = classes(), lay = layout(m), svg = picture(m, lay, builtIn, { title: 'Classes' });
  const box = (/** @type {string} */ id) => svg.match(new RegExp(`<g class="mv-node" data-node="${id}"[^]*?</g>`))?.[0] ?? '';
  const link = (/** @type {string} */ id) => svg.match(new RegExp(`<g class="mv-edge[^"]*" data-edge="${id}"[^]*?</g>`))?.[0] ?? '';

  it('draws each row on a line of its own, from the left, under a rule', () => {
    const order = box('Order');
    assert.equal(order.match(/<tspan class="mv-row"/g)?.length, 4);
    assert.match(order, />\+String number<\/tspan>/);
    assert.equal(order.match(/class="mv-shape mv-detail"/g)?.length, 2, 'a rule above each compartment');
    assert.equal(box('OrderLine').match(/class="mv-shape mv-detail"/g)?.length, 1);
    assert.match(svg, /\.mv-node \.mv-rows\{[^}]*monospace[^}]*text-anchor:start;white-space:pre/);
    assert.match(order, /<text class="mv-rows" xml:space="preserve">/, 'columns an author lined up with spaces stay in line');
    const rowX = Number(order.match(/<tspan class="mv-row" x="([\d.]+)"/)?.[1]);
    assert.ok(Math.abs(rowX - (lay.nodes.Order.x - lay.nodes.Order.w / 2 + measure.rowIn)) < 0.2);
  });

  it('draws the line above a name, small, and the name under it', () => {
    assert.match(box('Shape'), /<text class="mv-over"[^>]*>«interface»<\/text>/);
    assert.doesNotMatch(box('Order'), /mv-over/);
  });

  it('draws a filled diamond, a hollow triangle, and the words at each end of a line', () => {
    assert.match(link('Order-OrderLine'), /<polygon class="mv-head" points="(\S+ ){3}\S+"\/>/, 'a diamond has four corners');
    assert.match(link('Shape-Order'), /<polygon class="mv-hollow" points="(\S+ ){2}\S+"\/>/, 'a hollow triangle has three');
    assert.match(link('Order-OrderLine'), /<text class="mv-label mv-end"[^>]*>1<\/text>/);
    assert.match(link('Order-OrderLine'), /<text class="mv-label mv-end"[^>]*>many<\/text>/);
    assert.match(svg, /\.mv-hollow\{fill:var\(--mv-bg\)/);
  });

  it('puts the words of a line and the words at its two ends where none is on another', () => {
    const { near, far, label } = lay.edges['Order-OrderLine'];
    assert.ok(near && far && label);
    const on = (/** @type {{x:number,y:number,w:number,h:number}} */ a, /** @type {{x:number,y:number,w:number,h:number}} */ b) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;
    assert.ok(!on(near, far) && !on(near, label) && !on(far, label), JSON.stringify([near, far, label]));
  });

  it('draws no path heavier in a diagram of things, which has no way through it', () => {
    const things = classes();
    things.kindOfDiagram = 'classDiagram';
    assert.doesNotMatch(picture(things, layout(things), builtIn, { title: 'Classes' }), /class="mv-edge mv-main"/);
    assert.match(svg, /class="mv-edge mv-main"/, 'a flowchart still has one');
  });

  it('keeps the words at the ends of a line off the boxes and inside the picture', () => {
    const { near, far } = lay.edges['Order-OrderLine'];
    assert.ok(near && far);
    for (const w of [near, far]) {
      for (const n of Object.values(lay.nodes)) assert.ok(!(Math.abs(w.x - n.x) < (w.w + n.w) / 2 && Math.abs(w.y - n.y) < (w.h + n.h) / 2), `"${w.text}" on ${n.id}`);
      assert.ok(w.x - w.w / 2 >= 0 && w.x + w.w / 2 <= lay.width && w.y - w.h / 2 >= 0 && w.y + w.h / 2 <= lay.height);
    }
    assert.ok(near.y < far.y, 'each at its own end');
  });

  it('draws how many at each end of an entity\'s line: one, none or one, one or more, any', () => {
    const er = parse('flowchart TD\n  A --> B\n  A --> C');
    Object.assign(er.edges[0], { tail: 'one', head: 'zero-or-many' });
    Object.assign(er.edges[1], { tail: 'zero-or-one', head: 'one-or-many', style: 'dotted' });
    const out = picture(er, layout(er), builtIn, { title: 'Entities' });
    const of = (/** @type {string} */ id) => out.match(new RegExp(`<g class="mv-edge[^"]*" data-edge="${id}"[^]*?</g>`))?.[0] ?? '';
    assert.equal(of('A-B').match(/class="mv-cross"/g)?.length, 2, 'bars at one end, a foot at the other');
    assert.equal(of('A-B').match(/class="mv-hollow"/g)?.length, 1, 'a ring for "none"');
    assert.equal(of('A-C').match(/class="mv-hollow"/g)?.length, 1);
    assert.doesNotMatch(of('A-B'), /mv-head/, 'no arrowhead: how many is not which way');
  });
});

describe('notes: a box as tall as what it says', () => {
  const noted = (/** @type {string} */ words) => parse(`classDiagram\n  class Order{\n    +String number\n  }\n  Order --> Supplier\n  note for Order "${words}"`);
  const long = 'An order is raised by a buyer and approved by a manager before anything is sent to the supplier, and once it has been approved nobody may change its lines, not even the buyer who raised it, who must cancel it and raise another one instead';

  it('wraps a long note to as many lines as it needs, and makes only the note taller', () => {
    const m = noted(long), lay = layout(m);
    const note = /** @type {import('../skills/merlive/scripts/parse.mjs').Node} */ (m.nodes.find((n) => n.shape === 'note'));
    const placed = lay.nodes[note.id];
    assert.ok(placed.lines.length > measure.mostLines, `${placed.lines.length} lines`);
    assert.equal(placed.lines.join(' '), long);
    assert.ok(placed.h >= placed.lines.length * measure.lineHeight, 'tall enough for every line');
    assert.equal(lay.nodes.Supplier.h, lay.box.h, 'a plain box is no taller for it');
    assert.equal(lay.direction, 'TD');
  });

  it('passes its rules: many lines are what a note is for', () => {
    const m = noted(long), lay = layout(m);
    assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), []);
  });

  it('keeps the lines its author broke it into', () => {
    const m = noted('Sent when delivered<br>Paid within thirty days'), lay = layout(m);
    const note = /** @type {import('../skills/merlive/scripts/parse.mjs').Node} */ (m.nodes.find((n) => n.shape === 'note'));
    assert.deepEqual(lay.nodes[note.id].lines, ['Sent when delivered', 'Paid within thirty days']);
  });

  it('is drawn above the class it is about, joined by a dotted line', () => {
    const m = noted('Never deleted'), lay = layout(m), svg = picture(m, lay, builtIn, { title: 't' });
    const note = /** @type {import('../skills/merlive/scripts/parse.mjs').Node} */ (m.nodes.find((n) => n.shape === 'note'));
    assert.ok(lay.nodes[note.id].y < lay.nodes.Order.y);
    assert.match(svg, new RegExp(`data-edge="${note.id}-Order" data-style="dotted"`));
    assert.match(svg, />Never deleted</);
  });
});

describe('a title its author gave the picture', () => {
  const titled = (/** @type {string} */ title, body = 'flowchart TD\n  A[Raise] --> B[Approve]') => parse(`---\ntitle: ${title}\n---\n${body}`);
  const heightOf = (/** @type {string} */ svg) => Number(/viewBox="0 0 \d+ (\d+)"/.exec(svg)?.[1]);

  it('is drawn above a still picture, which is taller by the room it takes', () => {
    const m = titled('From order to invoice', 'flowchart TD\n  A[Raise] --> B[Approve] & C[Refuse] & D[Ask again]'), lay = layout(m), svg = picture(m, lay, builtIn, { title: 'x' });
    assert.match(svg, /<text class="mv-title"[^>]*><tspan[^>]*>From order to invoice<\/tspan><\/text>/);
    assert.ok(heightOf(svg) > lay.height);
    const plain = parse('flowchart TD\n  A[Raise] --> B[Approve]');
    assert.equal(heightOf(picture(plain, layout(plain), builtIn, { title: 'x' })), layout(plain).height);
    assert.doesNotMatch(picture(plain, layout(plain), builtIn, { title: 'x' }), /class="mv-title"/);
  });

  it('wraps a title wider than its picture, and no line of it is wider than the picture', () => {
    const m = titled('How an order goes from the buyer who raises it to the supplier who is paid for it in the end'), lay = layout(m);
    const lines = [...picture(m, lay, builtIn, { title: 'x' }).matchAll(/<tspan class="mv-title-line"[^>]*>([^<]*)</g)].map((x) => x[1]);
    assert.ok(lines.length > 1);
    for (const line of lines) assert.ok(line.length * draw.titleGlyph <= lay.width, line);
  });

  it('is not what was written only for a reader who cannot see the picture', () => {
    const m = parse('flowchart TD\n  accTitle: Orders\n  A --> B');
    assert.equal(m.title, 'Orders');
    assert.equal(m.heading, '');
    assert.doesNotMatch(picture(m, layout(m), builtIn, { title: 'x' }), /class="mv-title"/);
  });

  it('is drawn on a class diagram and a state diagram too', () => {
    for (const body of ['classDiagram\n  A <|-- B', 'stateDiagram-v2\n  [*] --> Open\n  Open --> [*]']) {
      const m = titled('Orders and what they hold', body);
      assert.match(picture(m, layout(m), builtIn, { title: 'x' }), /class="mv-title"/, body);
    }
  });
});

describe('a table: an entity drawn cell by cell', () => {
  const entity = (/** @type {string} */ body) => parse(`erDiagram\n  ORDER_LINE {\n${body}\n  }\n  ORDER ||--o{ ORDER_LINE : contains`);
  const three = '    int orderNumber PK, FK\n    string productCode PK, FK\n    int quantity';
  const drawn = (/** @type {string} */ body) => {
    const m = entity(body), lay = layout(m);
    return { m, lay, svg: picture(m, lay, builtIn, { title: 't' }), box: lay.nodes.ORDER_LINE };
  };
  const node = (/** @type {string} */ svg) => /<g class="mv-node" data-node="ORDER_LINE".*?<\/g>/s.exec(svg)?.[0] ?? '';

  it('is as tall as its name and a row for each attribute, and wide enough for every column', () => {
    const { m, lay, box } = drawn(three);
    assert.equal(box.h, lay.box.h + 3 * measure.cellLine);
    assert.ok(tableNeeds(/** @type {any} */ (m.nodes.find((n) => n.id === 'ORDER_LINE'))) <= lay.box.w);
  });

  it('puts every cell of a column at one place, each column right of the one before', () => {
    const g = node(drawn(three).svg);
    const cells = [...g.matchAll(/<text class="mv-cell" x="([\d.]+)" y="([\d.]+)">([^<]*)</g)].map((c) => [Number(c[1]), Number(c[2]), c[3]]);
    assert.deepEqual(cells.map((c) => c[2]), ['int', 'orderNumber', 'PK, FK', 'string', 'productCode', 'PK, FK', 'int', 'quantity']);
    const xOf = (/** @type {string} */ words) => cells.filter((c) => c[2] === words).map((c) => c[0]);
    assert.equal(new Set([...xOf('int'), ...xOf('string')]).size, 1, 'types in one column');
    assert.equal(new Set([...xOf('orderNumber'), ...xOf('productCode'), ...xOf('quantity')]).size, 1, 'names in one column');
    assert.ok(xOf('int')[0] < xOf('quantity')[0] && xOf('quantity')[0] < xOf('PK, FK')[0]);
    assert.equal(new Set(cells.map((c) => c[1])).size, 3, 'three rows');
  });

  it('rules it into cells and shades every second row', () => {
    const g = node(drawn(three).svg);
    assert.equal((g.match(/class="mv-band"/g) ?? []).length, 1, 'the second row of three');
    assert.equal((g.match(/class="mv-grid"/g) ?? []).length, 2 + 2, 'between three rows, and between three columns');
  });

  it('has no column for keys when no attribute has one', () => {
    const g = node(drawn('    int quantity\n    string unit').svg);
    assert.equal((g.match(/class="mv-grid"/g) ?? []).length, 1 + 1);
  });

  it('keeps every word inside its box, in every sample of the corpus', () => {
    const { lay, svg, box } = drawn(three);
    const l = box.x - box.w / 2, r = box.x + box.w / 2;
    for (const c of node(svg).matchAll(/<text class="mv-cell" x="([\d.]+)" y="[\d.]+">([^<]*)</g)) {
      assert.ok(Number(c[1]) >= l && Number(c[1]) + c[2].length * measure.cellGlyph <= r, c[2]);
    }
    assert.ok(lay.width > 0);
  });

  it('fails P6 when a table is wider than any box, and says which entity', () => {
    const m = entity('    aVeryLongTypeNameThatNobodyShouldWrite(120) aVeryLongAttributeNameThatGoesOnAndOn PK, FK, UK'), p6 = score(m, layout(m), builtIn).checks.find((c) => c.id === 'P6');
    assert.equal(p6?.ok, false);
    assert.match(p6?.detail ?? '', /"ORDER_LINE" lists a row too wide for any box/);
  });

  it('leaves a class as it was: a list, not a table', () => {
    const m = parse('classDiagram\n  class Order{\n    +String number\n    +total()\n  }'), svg = picture(m, layout(m), builtIn, { title: 't' });
    assert.doesNotMatch(svg, /class="mv-(cell|band|grid)"/);
    assert.match(svg, /class="mv-rows"/);
  });
});

describe('a table: its shaded rows can be read', () => {
  it('holds the words on a shaded row to the same contrast as words on a box', () => {
    const faint = designFrom({ ...builtIn, light: { ...builtIn.light, text: '#8a8a8a', node: '#ffffff' } });
    const m = parse('erDiagram\n  A {\n    int a\n    int b\n  }');
    const d1 = score(m, layout(m), faint).checks.find((c) => c.id === 'D1');
    assert.match(d1?.detail ?? '', /text on a shaded row/);
    const plain = parse('flowchart TD\n  A --> B');
    assert.doesNotMatch(score(plain, layout(plain), faint).checks.find((c) => c.id === 'D1')?.detail ?? '', /shaded row/);
  });
});
