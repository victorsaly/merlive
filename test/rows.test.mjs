// Why: a class and an entity are boxes that list things under their name, joined by lines that end in more
// than an arrowhead. These hold the placing and the drawing of that to a model made by hand, so they stand
// whatever reads the Mermaid.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { hitsBox, layout, measure, meet, rowsRoom } from '../skills/merlive/scripts/layout.mjs';
import { builtIn } from '../skills/merlive/scripts/design.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';
import { picture } from '../skills/merlive/scripts/render.mjs';

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
