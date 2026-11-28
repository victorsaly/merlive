// Why: a block diagram is the one kind whose author places the boxes. These hold the grid placement to what
// was written: every block in its cell, as wide as the columns it spans, spaces left empty, a block that holds
// others drawn round a grid of its own, and links that go round blocks and never through one.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { hitsBox, layout, measure, segmentsOf } from '../skills/merlive/scripts/layout.mjs';
import { gridMeasure, placeGrid } from '../skills/merlive/scripts/grid.mjs';
import { builtIn } from '../skills/merlive/scripts/design.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';
import { picture } from '../skills/merlive/scripts/render.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const grid = (/** @type {string} */ body) => {
  const m = parse(`block\n${body}`), lay = layout(m);
  return { m, lay, at: lay.nodes, broken: score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`) };
};
const left = (/** @type {{x:number,w:number}} */ n) => n.x - n.w / 2, right = (/** @type {{x:number,w:number}} */ n) => n.x + n.w / 2;
const top = (/** @type {{y:number,h:number}} */ n) => n.y - n.h / 2, bottom = (/** @type {{y:number,h:number}} */ n) => n.y + n.h / 2;
const six = 'columns 3\na["Shop"] b["Portal"] c["Phone"]\nd["ERP"] e["Stock"] f["Ledger"]';

describe('grid: which diagrams are placed on their author\'s grid', () => {
  it('places a block diagram whose meaning is in its grid on that grid, and says nothing against it', () => {
    const { m, lay } = grid(six);
    assert.deepEqual([m.type, m.placedBy, m.left, m.warnings], ['flowchart', 'grid', undefined, []]);
    assert.match(m.placedWhy ?? '', /joined to nothing by a link/);
    assert.ok(lay.grids?.length === 1);
    assert.deepEqual(lay.spine, []);
  });

  it('leaves a block diagram that is a flow to be placed by rank, as it was', () => {
    const { m, lay } = grid('a["Shop"] b["ERP"]\na --> b');
    assert.equal(m.placedBy, undefined);
    assert.equal(lay.grids, undefined);
    assert.deepEqual(lay.spine, ['a', 'b']);
  });

  it('gives placeGrid what layout gives: every box, every link, a size', () => {
    const m = parse(`block\n${six}\na --> e`), lay = placeGrid(m);
    assert.deepEqual(Object.keys(lay.nodes), ['a', 'b', 'c', 'd', 'e', 'f']);
    assert.deepEqual(Object.keys(lay.edges), ['a-e']);
    assert.ok(lay.width > 0 && lay.height > 0 && lay.direction === 'TD' && lay.reversed === false);
  });
});

describe('grid: cells', () => {
  it('fills the columns row by row, every column as wide as every other, every row as tall as its tallest', () => {
    const { at, lay, broken } = grid(six);
    assert.deepEqual(broken, []);
    assert.ok(at.a.y === at.b.y && at.b.y === at.c.y && at.d.y === at.e.y && at.d.y > at.a.y);
    assert.ok(at.a.x === at.d.x && at.b.x === at.e.x && at.c.x === at.f.x);
    assert.equal(at.b.x - at.a.x, lay.box.w + gridMeasure.gap);
    assert.equal(top(at.d) - bottom(at.a), gridMeasure.gap);
    for (const n of Object.values(at)) assert.deepEqual([n.w, n.h], [lay.box.w, lay.box.h]);
  });

  it('makes a block that spans columns as wide as those columns and the gaps between them', () => {
    const { at, lay, broken } = grid('columns 3\nshop["Web shop"]:3\nerp["ERP"]:2 stock["Stock"]\nshop --> erp\nerp --> stock');
    assert.deepEqual(broken, []);
    assert.equal(at.shop.w, 3 * lay.box.w + 2 * gridMeasure.gap);
    assert.equal(at.erp.w, 2 * lay.box.w + gridMeasure.gap);
    assert.equal(left(at.erp), left(at.shop));
    assert.equal(right(at.stock), right(at.shop));
  });

  it('starts a new row for a block that does not fit what is left of this one, and lays "columns auto" in one row', () => {
    const wrapped = grid('columns 3\na b c:2\nd').at;
    assert.ok(wrapped.c.y > wrapped.a.y && left(wrapped.c) === left(wrapped.a));
    assert.ok(wrapped.d.y === wrapped.c.y && left(wrapped.d) > right(wrapped.c));
    const row = grid('a b c d').at;
    assert.equal(new Set(Object.values(row).map((n) => n.y)).size, 1);
    assert.ok(row.a.x < row.b.x && row.c.x < row.d.x);
  });

  it('leaves a space empty: the block after it comes where its author put it, and an empty row stays empty', () => {
    const { at, lay, broken } = grid('columns 3\nweb["Web shop"] space erp["ERP"]\nspace:3\nwh["Warehouse"]:3\nweb --> erp\nerp --> wh');
    assert.deepEqual(broken, []);
    assert.equal(at.erp.x - at.web.x, 2 * (lay.box.w + gridMeasure.gap));
    assert.equal(top(at.wh) - bottom(at.web), lay.box.h + 2 * gridMeasure.gap);
    assert.deepEqual(Object.keys(at), ['web', 'erp', 'wh']);
  });

  it('makes every block of a row as tall as the one with the most lines', () => {
    const { at, broken } = grid('columns 2\na["One"] b["A much longer label that has to be wrapped to more lines than one"]');
    assert.deepEqual(broken, []);
    assert.ok(at.b.lines.length > 1);
    assert.equal(at.a.h, at.b.h);
    assert.equal(at.a.h, measure.boxPad + measure.lineHeight * at.b.lines.length);
  });

  it('draws a box that is in no cell under the grid, and says so', () => {
    const m = parse(`block\n${six}`);
    m.nodes.push({ id: 'z', label: 'Stray', shape: 'box', kind: 'step' });
    const lay = placeGrid(m);
    assert.ok(lay.nodes.z.y > lay.nodes.d.y);
    assert.match(lay.warnings.join('\n'), /"Stray" is in no cell of the grid: it is drawn under it/);
  });
});

describe('grid: a block that holds others', () => {
  const nested = 'columns 3\ntop["Everything"]:3\nblock:left:2\n  columns 2\n  h["Buy"] i["Pick"] j["Pack"] k["Send"]\nend\ng["Bank"]\nblock:wide:3\n  l["Mon"] m["Tue"] n["Wed"]\nend';

  it('keeps room for a name in every frame of a row when any frame in it has one, so what they hold lines up', () => {
    const { at, lay, broken } = grid('columns 2\nblock:named["Buying"]\n  a["Raise"]\nend\nblock:bare\n  b["Deliver"]\nend\nblock:alone\n  c["Pay"]\nend');
    assert.deepEqual(broken, []);
    assert.equal(at.a.y, at.b.y, 'side by side, the two blocks inside are in one line');
    const [named, bare, alone] = ['named', 'bare', 'alone'].map((id) => /** @type {typeof lay.groups[0]} */ (lay.groups.find((f) => f.id === id)));
    assert.deepEqual([named.y, named.h], [bare.y, bare.h]);
    // A row with no name in it keeps no room for one.
    assert.equal(top(at.c) - alone.y, measure.framePad);
    assert.equal(top(at.a) - named.y, measure.framePad + measure.frameTitle);
  });

  it('is a frame over the columns it spans, round a grid of its own', () => {
    const { at, lay, broken } = grid(nested);
    assert.deepEqual(broken, []);
    assert.deepEqual(lay.groups.map((f) => f.id), ['left', 'wide']);
    const [l, wide] = lay.groups;
    assert.equal(l.w, 2 * lay.box.w + gridMeasure.gap);
    assert.equal(wide.w, at.top.w);
    for (const id of ['h', 'i', 'j', 'k']) assert.ok(left(at[id]) >= l.x + measure.framePad && right(at[id]) <= l.x + l.w - measure.framePad && top(at[id]) >= l.y + measure.framePad && bottom(at[id]) <= l.y + l.h - measure.framePad, id);
    assert.ok(at.h.y === at.i.y && at.j.y > at.h.y && at.j.x === at.h.x);
    assert.ok(at.l.y === at.m.y && at.m.y === at.n.y && at.l.y > at.j.y);
  });

  it('is as tall as its row, and so is the block beside it', () => {
    const { at, lay } = grid(nested);
    assert.equal(at.g.h, lay.groups[0].h);
    assert.equal(top(at.g), lay.groups[0].y);
  });

  it('leaves the cell of a block that holds nothing empty, with no frame', () => {
    const { lay, at, broken } = grid('columns 3\na["One"]\nblock:g\nend\nb["Two"]');
    assert.deepEqual(broken, []);
    assert.deepEqual(lay.groups, []);
    assert.equal(at.b.x - at.a.x, 2 * (lay.box.w + gridMeasure.gap));
  });

  it('keeps room for its name only when it has one', () => {
    const named = grid('block:buying["Buying"]\n  a["Raise"] b["Approve"]\nend\nc["Pay"]'), bare = grid('block:buying\n  a["Raise"] b["Approve"]\nend\nc["Pay"]');
    const f = named.lay.groups[0], g = bare.lay.groups[0];
    assert.deepEqual(named.broken, []);
    assert.equal(top(named.at.a) - f.y, measure.framePad + measure.frameTitle);
    assert.equal(top(bare.at.a) - g.y, measure.framePad);
    assert.ok(f.name.w > 0 && f.name.x - f.name.w / 2 >= f.x && f.name.y > f.y && f.name.y < top(named.at.a));
    assert.deepEqual([g.name.w, g.name.h], [0, 0]);
  });
});

describe('grid: links', () => {
  const straight = (/** @type {{x:number,y:number}[]} */ pts) => pts.length === 2;

  it('goes straight between two blocks side by side, and between one and the one under it', () => {
    const { at, lay, broken } = grid('columns 2\na["Quote"] b["Order"]\nc["Stock"] d["Books"]\na --> b\na --> c');
    assert.deepEqual(broken, []);
    const across = lay.edges['a-b'].points, down = lay.edges['a-c'].points;
    assert.ok(straight(across) && across[0].y === across[1].y && across[0].x === right(at.a) && across[1].x === left(at.b));
    assert.ok(straight(down) && down[0].x === down[1].x && down[0].y === bottom(at.a) && down[1].y === top(at.c));
  });

  it('goes straight over a space, which is free room', () => {
    const { lay, broken } = grid('columns 3\nweb["Web shop"] space erp["ERP"]\nspace:3\nwh["Warehouse"]:3\nweb --> erp\nerp --> wh');
    assert.deepEqual(broken, []);
    assert.ok(straight(lay.edges['web-erp'].points) && straight(lay.edges['erp-wh'].points));
  });

  it('goes round a block that is in the way, and never through one', () => {
    const { m, lay, at, broken } = grid('columns 3\na["Shop"] b["Portal"] c["Phone"]\nd["ERP"] e["Stock"] f["Ledger"]\na --> c\na --> f\nd --> c');
    assert.deepEqual(broken.filter((b) => !b.startsWith('P4')), []);
    for (const e of m.edges) {
      const pts = lay.edges[e.id].points;
      for (const n of Object.values(at)) if (n.id !== e.from && n.id !== e.to) assert.ok(!segmentsOf(pts).some((s) => hitsBox(s, n, 0)), `${e.id} through ${n.id}`);
      for (const [p, q] of segmentsOf(pts)) assert.ok(p.x === q.x || p.y === q.y, `${e.id} turns at right angles`);
    }
    assert.ok(lay.edges['a-c'].points.length > 2);
  });

  it('goes round the outside when a block spans every column between two others, and keeps the margin there', () => {
    const { lay, at, broken } = grid('columns 3\nspace a["Order"] space\nw["A band across every column"]:3\nspace c["Invoice"] space\na --> c');
    assert.deepEqual(broken, []);
    const pts = lay.edges['a-c'].points;
    assert.ok(pts.length === 6 && pts.some((p) => p.x < left(at.w)), 'out, along, down past the band, along, in');
    assert.ok(Math.min(...pts.map((p) => p.x)) >= measure.pad / 2 && left(at.w) > measure.pad, 'everything moved over to make the room');
    assert.ok(lay.grids?.every((g) => Math.abs(g.x - left(at.w)) < 1), 'and the grid is still where its blocks are');
  });

  it('gives two links that take the same gap a line each, and two between the same blocks a port each', () => {
    const crossed = grid('columns 2\na b\nc d\ne\na --> d\nb --> c');
    assert.deepEqual(crossed.broken.filter((b) => !b.startsWith('P4')), []);
    const twice = grid('columns 1\na\nb\nc\na --> b\na --> b');
    assert.deepEqual(twice.broken, []);
    assert.notEqual(twice.lay.edges['a-b'].points[0].x, twice.lay.edges['a-b#2'].points[0].x);
  });

  it('makes the gaps wide enough for the words of a link, which sit on no block', () => {
    const { lay, at, broken } = grid('columns 2\na["Shop"] b["ERP"]\nc["Stock"] d["Alone"]\na -- "sends every order to" --> b\na -- "asks" --> c');
    assert.deepEqual(broken, []);
    assert.ok(left(at.b) - right(at.a) > gridMeasure.gap);
    assert.equal(lay.edges['a-b'].label?.text, 'sends every order to');
  });

  it('ends a line on the outline of the shape it meets', () => {
    const { lay, at } = grid('columns 2\na{"Ready?"} b(["Go"])\nc["Alone"]\na --> b');
    const pts = lay.edges['a-b'].points;
    assert.equal(pts[0].x, right(at.a), 'the point of a rhombus is the edge of its box');
    assert.equal(pts[1].x, left(at.b));
  });

  it('draws a link from a block to itself as a small loop out of its side', () => {
    const { lay, at, broken } = grid('columns 2\na["Retry"] b["Alone"]\na --> a');
    assert.deepEqual(broken, []);
    const pts = lay.edges['a-a'].points;
    assert.ok(pts.length === 4 && pts.every((p) => p.x >= right(at.a)));
  });

  it('counts every crossing: the author chose where the blocks are, so none is forgiven as forced', () => {
    const { m, lay } = grid('columns 2\na b\nc d\ne\na --> c\na --> d\nb --> c\nb --> d');
    const p4 = score(m, lay, builtIn).checks.find((c) => c.id === 'P4');
    assert.doesNotMatch(p4?.detail ?? '', /forces|cannot be drawn without/);
  });
});

describe('grid: arrows drawn as blocks', () => {
  it('draws each as an arrow pointing the way it was written, in its cell', () => {
    const { m, at, broken, lay } = grid('columns 3\nshop["Shop"] to<["orders"]>(right) erp["ERP"]\nspace down<["stock"]>(down) space\nspace wh["Warehouse"] space');
    assert.deepEqual(broken, []);
    assert.deepEqual(m.nodes.map((n) => n.shape), ['box', 'arrow-right', 'box', 'arrow-down', 'box']);
    assert.ok(at.to.y === at.shop.y && at.down.x === at.to.x && at.wh.x === at.down.x);
    assert.ok(at.down.h > at.shop.h, 'an arrow that points down has room for its head');
    assert.match(picture(m, lay, builtIn, { title: 't' }), /<polygon class="mv-shape" points="[^"]+"\/>/);
  });

  it('reads every way an arrow can point, and says what one that points along two lines is drawn as', () => {
    const m = parse('block\ncolumns 4\nr<["Right"]>(right) l<["Left"]>(left) u<["Up"]>(up) d<["Down"]>(down)\nx<["Both ways"]>(x) y<["Up and down"]>(y) rl<["There and back"]>(right, left) xd<["Across and down"]>(x, down)');
    assert.deepEqual(m.nodes.map((n) => n.shape), ['arrow-right', 'arrow-left', 'arrow-up', 'arrow-down', 'arrow-x', 'arrow-y', 'arrow-x', 'arrow-x']);
    assert.deepEqual(m.warnings, ['line 4: the block arrow "Across and down" points x and down, and is drawn pointing both ways across: Merlive draws an arrow along one line']);
  });

  it('leaves an arrow with no words with none, as its author drew it', () => {
    const { m, broken } = grid('columns 1\ndb(("DB"))\nfeeds<["&nbsp;&nbsp;&nbsp;"]>(down)\nerp["ERP"]');
    assert.equal(m.nodes[1].label, '');
    assert.deepEqual(broken, []);
  });
});

describe('grid: the rules', () => {
  it('holds a block to exactly its cells, and says which is not', () => {
    const { m, lay } = grid(six);
    const fine = score(m, lay, builtIn).checks;
    assert.match(fine.find((c) => c.id === 'P2')?.detail ?? '', /each exactly its cells/);
    assert.match(fine.find((c) => c.id === 'P1')?.detail ?? '', /a grid its author placed has no main path/);
    lay.nodes.b.w += 12;
    assert.match(score(m, lay, builtIn).checks.find((c) => c.id === 'P2')?.detail ?? '', /"Portal" is not exactly its cells/);
    lay.nodes.b.w -= 12;
    lay.nodes.e.y += 6;
    assert.match(score(m, lay, builtIn).checks.find((c) => c.id === 'P2')?.detail ?? '', /"Stock" is not exactly its cells/);
  });

  it('holds a frame to its cells too', () => {
    const { m, lay } = grid('columns 2\nblock:g\n  a b\nend\nc\nd:2');
    lay.groups[0].w -= 20;
    assert.match(score(m, lay, builtIn).checks.find((c) => c.id === 'P2')?.detail ?? '', /the frame of "g" is not exactly its cells/);
  });

  it('draws every block sample of the corpus that is placed by its author, with no rule broken and every block in the picture', () => {
    /** @type {{file:string,placedBy?:string}[]} */
    const list = JSON.parse(readFileSync(join(root, 'corpus/index.json'), 'utf8')).block;
    const placed = list.filter((s) => s.placedBy === 'grid');
    assert.ok(placed.length >= 10, `${placed.length} samples`);
    for (const s of placed) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8')), lay = layout(m);
      assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), [], s.file);
      assert.deepEqual(lay.warnings, [], s.file);
      for (const n of Object.values(lay.nodes)) assert.ok(left(n) >= 0 && top(n) >= 0 && right(n) <= lay.width && bottom(n) <= lay.height, `${s.file}: ${n.id}`);
      assert.match(picture(m, lay, builtIn, { title: 't' }), /^<svg /);
    }
  });
});

describe('grid: a grid that says its own measures', () => {
  // A row of small cells with nothing running between them, as a packet's bits are: a box of a flow's size and
  // room for three lines between each two would make it many times wider than what it says.
  const cells = (/** @type {string} */ body, /** @type {{least?:number,gap?:number}} */ says = {}) => {
    const m = parse(`block\n${body}`);
    Object.assign(/** @type {object} */ (m.grid), says);
    const lay = layout(m);
    return { m, lay, at: lay.nodes, grid: /** @type {NonNullable<typeof lay.grids>} */ (lay.grids)[0], broken: score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`) };
  };
  const four = 'columns 4\na["URG"] b["ACK"] c["PSH"] d["RST"]';

  it('is as it always was when it says nothing: a box of a flow\'s size, and room for lines between', () => {
    const { grid: g } = cells(four);
    assert.deepEqual([g.colW, g.gapX, g.gapY], [measure.widths[0], gridMeasure.gap, gridMeasure.gap]);
  });

  it('keeps the gap it says, across and down', () => {
    const { grid: g, at, broken } = cells(`${four}\ne["Window"]:4`, { gap: 16 });
    assert.deepEqual([g.gapX, g.gapY], [16, 16]);
    assert.equal(left(at.b) - right(at.a), 16);
    assert.equal(top(at.e) - bottom(at.a), 16);
    assert.deepEqual(broken, []);
  });

  it('still makes a gap as wide as the words of a link that crosses it', () => {
    const { grid: g } = cells('columns 3\na["A"] b["B"] c["C"]\na -- "sends every order to" --> b', { gap: 16 });
    assert.ok(g.gapX > gridMeasure.gap, `${g.gapX}px`);
  });

  it('takes the narrowest column its words fit, from the least it says up, and not the next of a flow\'s six widths', () => {
    const { grid: g, at, lay, broken } = cells(four, { least: 24, gap: 16 });
    // Three letters and the room a box keeps clear of its words.
    assert.ok(g.colW >= 3 * measure.glyph + 28 && g.colW < 3 * measure.glyph + 28 + gridMeasure.fine, `${g.colW}px`);
    assert.deepEqual(at.a.lines, ['URG']);
    assert.equal(at.a.w, g.colW);
    assert.ok(lay.width < 4 * measure.widths[0]);
    assert.deepEqual(broken, []);
  });

  it('is no narrower than the least it says, however short its words', () => {
    assert.equal(cells('columns 2\na["A"] b["B"]', { least: 90 }).grid.colW, 90);
  });

  it('gives a block that spans columns the gaps between them too, so a long name over many narrow columns fits', () => {
    const { grid: g, at, broken } = cells('columns 4\na["A"] b["B"] c["C"] d["D"]\ne["Sequence number"]:4', { least: 24, gap: 16 });
    assert.ok(g.colW < 60, `${g.colW}px`);
    assert.deepEqual(at.e.lines, ['Sequence number']);
    assert.deepEqual(broken, []);
  });

  it('falls back on the widths a flow has when no narrow column fits', () => {
    const { grid: g } = cells('columns 2\na["An order that somebody raised"] b["B"]', { least: 24 });
    assert.ok(measure.widths.includes(g.colW), `${g.colW}px`);
  });
});

describe('grid: a block with a line over its name', () => {
  const over = (/** @type {string} */ line, /** @type {{least?:number,gap?:number}} */ says = {}) => {
    const m = parse('block\ncolumns 3\na["Kind"] b["Flags"] c["Length"]');
    Object.assign(/** @type {object} */ (m.grid), says);
    /** @type {any} */ (m.nodes[0]).over = line;
    const lay = layout(m);
    return { m, lay, at: lay.nodes, broken: score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`) };
  };

  it('is taller by that line, and so is its row', () => {
    const { at, broken } = over('0–7');
    assert.equal(at.a.h, measure.boxPad + measure.lineHeight + measure.overLine);
    assert.equal(at.b.h, at.a.h);
    assert.deepEqual(broken, []);
  });

  it('is wide enough for the line, which is never wrapped', () => {
    const line = '1000000–1000007', { at, broken } = over(line, { least: 24, gap: 16 });
    assert.ok(at.a.w >= line.length * measure.overGlyph + 2 * measure.overIn, `${at.a.w}px`);
    assert.deepEqual(broken, []);
  });

  it('draws the line above the name, inside the box', () => {
    const { m, lay, at } = over('0–7');
    const g = /<g class="mv-node" data-node="a".*?<\/g>/s.exec(picture(m, lay, builtIn, { title: 't' }))?.[0] ?? '';
    const lineY = Number(/class="mv-over" x="[\d.]+" y="([\d.]+)"/.exec(g)?.[1]), nameY = Number(/<text><tspan x="[\d.]+" y="([\d.]+)">Kind/.exec(g)?.[1]);
    assert.ok(lineY > top(at.a) && lineY < nameY && nameY < bottom(at.a), `${top(at.a)} < ${lineY} < ${nameY} < ${bottom(at.a)}`);
  });
});

describe('grid: what a board asked of it', () => {
  // A kanban board is placed here too (kanban.mjs): cards that list things, columns with nothing in them, and
  // nothing running between the cells. Each is shown on a block diagram's own grid, so these hold without it.
  const two = () => parse('block\ncolumns 2\na["One"] b["Two"]\nc["Three"] d["Four"]');
  const broken = (/** @type {import('../skills/merlive/scripts/parse.mjs').Model} */ m) => score(m, layout(m), builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`);

  it('makes a block that lists rows under its name as tall as they need, and its row with it', () => {
    const m = two();
    m.nodes[0].rows = [['ticket: MC-2038', 'assigned: knsv']];
    const lay = layout(m), at = lay.nodes;
    assert.equal(at.a.h, lay.box.h + 2 * measure.rowPad + 2 * measure.rowLine);
    assert.equal(at.b.h, at.a.h, 'the block beside it is as tall as its row');
    assert.equal(at.c.h, measure.boxPad + measure.lineHeight, 'the row under it is as it was');
    assert.equal(top(at.c) - bottom(at.a), gridMeasure.gap);
    assert.deepEqual(broken(m), []);
  });

  it('makes every column wide enough for the longest row a block lists', () => {
    const m = two(), row = 'assigned: Somebody With A Long Name';
    m.nodes[3].rows = [[row]];
    const lay = layout(m);
    assert.ok(row.length * measure.rowGlyph + 2 * measure.rowIn <= lay.nodes.d.w, `${lay.nodes.d.w}px`);
    assert.equal(lay.nodes.a.w, lay.nodes.d.w);
    assert.deepEqual(broken(m), []);
    const plain = layout(two());
    assert.ok(plain.nodes.a.w < lay.nodes.a.w, 'and no wider than its words need when nothing is listed');
  });

  it('keeps the room for a name that a block which lists rows needs: the longest such name, in lines', () => {
    const m = two();
    Object.assign(m.nodes[0], { label: 'Create the documentation for the feature', rows: [['ticket: 1']] });
    const lay = layout(m), lines = lay.nodes.a.lines.length;
    assert.ok(lines > 1);
    assert.equal(lay.box.h, measure.boxPad + measure.lineHeight * lines);
    assert.equal(lay.nodes.a.h, lay.box.h + 2 * measure.rowPad + measure.rowLine);
    assert.deepEqual(broken(m), []);
  });

  it('draws a cell that holds nothing as a frame when it has a name of its own, as tall as its row', () => {
    const m = parse('block\ncolumns 3\na["One"]\nblock:g\nend\nb["Two"]');
    /** @type {any} */ (m.grid?.cells[1]).title = 'Waiting';
    const lay = layout(m);
    assert.deepEqual(lay.groups.map((f) => [f.id, f.title]), [['g', 'Waiting']]);
    const f = lay.groups[0];
    assert.ok(f.x > right(lay.nodes.a) && f.x + f.w < left(lay.nodes.b) && f.y === top(lay.nodes.a) && f.h === lay.nodes.a.h);
    assert.ok(f.name.w > 0 && f.name.x - f.name.w / 2 >= f.x && f.name.x + f.name.w / 2 <= f.x + f.w);
    assert.deepEqual(broken(m), []);
  });

  it('sets cells close when their author says nothing runs between them, and only while nothing does', () => {
    const m = two();
    /** @type {any} */ (m.grid).close = true;
    const lay = layout(m), at = lay.nodes;
    assert.equal(left(at.b) - right(at.a), gridMeasure.close);
    assert.equal(top(at.c) - bottom(at.a), gridMeasure.close);
    assert.deepEqual(broken(m), []);
    const joined = parse('block\ncolumns 2\na["One"] b["Two"]\nc["Three"] d["Four"]\ne["Five"]\na --> d');
    assert.equal(joined.placedBy, 'grid');
    /** @type {any} */ (joined.grid).close = true;
    assert.equal(left(layout(joined).nodes.b) - right(layout(joined).nodes.a), gridMeasure.gap);
  });
});
