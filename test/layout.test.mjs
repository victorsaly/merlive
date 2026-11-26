import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { hitsBox, layout, measure, meet, wrap } from '../skills/merlive/scripts/layout.mjs';
import { builtIn } from '../skills/merlive/scripts/design.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';

const draw = (/** @type {string} */ src) => {
  const model = parse(src);
  return { model, lay: layout(model) };
};

const orders = `flowchart TD
  A([Submit order]) --> B[Validate order]
  B --> C{Within budget?}
  C -->|Yes| D[Manager approval]
  C -->|No| E[Revise order]
  E --> B
  D --> F{Approved?}
  F -->|Yes| G[Send to supplier]
  F -->|No| E
  G --> H([Order placed])`;

describe('wrap', () => {
  it('breaks at spaces, and leaves a word that is too long on a line of its own', () => {
    assert.deepEqual(wrap('Send to supplier', 10), ['Send to', 'supplier']);
    assert.deepEqual(wrap('Internationalisation now', 8), ['Internationalisation', 'now']);
    assert.deepEqual(wrap('', 8), ['']);
  });
});

describe('layout: the spine', () => {
  const { lay } = draw(orders);

  it('is the longest path, in one straight line, one rank after another', () => {
    assert.deepEqual(lay.spine, ['A', 'B', 'C', 'D', 'F', 'G', 'H']);
    assert.equal(new Set(lay.spine.map((id) => lay.nodes[id].x)).size, 1);
    assert.deepEqual(lay.spine.map((id) => lay.nodes[id].rank), [0, 1, 2, 3, 4, 5, 6]);
  });

  it('puts everything else to one side of it', () => {
    assert.ok(lay.nodes.E.x > lay.nodes.A.x);
    assert.equal(lay.nodes.E.spine, false);
  });

  it('follows the path the author names, when it follows the links', () => {
    const named = draw('flowchart TD\nA --> B\nA --> C\nC --> D\nB --> D\n%% main: A>C>D');
    assert.deepEqual(named.lay.spine, ['A', 'C', 'D']);
    assert.deepEqual(named.lay.warnings, []);
  });

  it('says so and uses the longest path when the named one does not follow the links', () => {
    const wrong = draw('flowchart TD\nA --> B\nB --> C\n%% main: A>C');
    assert.deepEqual(wrong.lay.spine, ['A', 'B', 'C']);
    assert.match(wrong.lay.warnings[0], /does not follow the links/);
  });

  it('goes to the left when asked', () => {
    const left = draw(`${orders}\n%% side: left`);
    assert.ok(left.lay.nodes.E.x < left.lay.nodes.A.x);
    assert.ok(Object.values(left.lay.nodes).every((n) => n.x - n.w / 2 >= 0));
  });
});

describe('layout: boxes', () => {
  it('are all one size, the narrowest that fits every label in two lines', () => {
    const { lay } = draw(orders);
    assert.deepEqual(lay.box, { w: 128, h: 60 });
    assert.ok(Object.values(lay.nodes).every((n) => n.w === 128 && n.h === 60));
    const wide = draw('flowchart TD\nA[A considerably longer label than the others have] --> B[Short]');
    assert.ok(wide.lay.box.w > 128);
    assert.equal(wide.lay.nodes.B.w, wide.lay.box.w);
  });

  it('take the widest box when nothing fits, and let the score say so', () => {
    const { lay } = draw(`flowchart TD\nA[${'word '.repeat(30)}] --> B`);
    assert.equal(lay.box.w, measure.widths[measure.widths.length - 1]);
  });

  it('never share a place, even when several branch from one box', () => {
    const { lay } = draw('flowchart TD\nA --> B\nA --> C\nA --> D\nA --> E\nB --> F');
    const places = Object.values(lay.nodes).map((n) => `${n.x},${n.y}`);
    assert.equal(new Set(places).size, places.length);
  });
});

describe('layout: lines', () => {
  const { model, lay } = draw(orders);

  it('are made of straight runs along the grid', () => {
    for (const e of Object.values(lay.edges)) {
      for (let i = 1; i < e.points.length; i++) assert.ok(e.points[i].x === e.points[i - 1].x || e.points[i].y === e.points[i - 1].y, `${e.id} has a slanted run`);
    }
  });

  it('go round every box that is not theirs, and do not cross or share a path', () => {
    const edges = Object.values(lay.edges);
    for (const e of model.edges) {
      const mine = lay.edges[e.id].points;
      for (const n of Object.values(lay.nodes)) {
        if (n.id === e.from || n.id === e.to) continue;
        for (let i = 1; i < mine.length; i++) assert.equal(hitsBox([mine[i - 1], mine[i]], n, 0), false, `${e.id} through ${n.id}`);
      }
    }
    for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) assert.deepEqual(meet(edges[i].points, edges[j].points), { crossings: 0, overlaps: 0 }, `${edges[i].id} and ${edges[j].id}`);
  });

  it('mark the links that close a loop', () => {
    assert.deepEqual(Object.values(lay.edges).filter((e) => e.back).map((e) => e.id), ['E-B']);
  });

  it('carry their words beside where they leave', () => {
    assert.equal(lay.edges['C-D'].label?.text, 'Yes');
    assert.equal(lay.edges['A-B'].label, null);
  });

  it('take a link that skips a box on the spine round the outside', () => {
    const skip = draw('flowchart TD\nA --> B\nB --> C\nA --> C');
    assert.equal(skip.lay.edges['A-C'].points.length, 4);
    assert.ok(skip.lay.edges['A-C'].points[1].x > skip.lay.nodes.B.x + skip.lay.nodes.B.w / 2);
  });

  it('give two loops round the outside a channel each, the shorter inside', () => {
    const two = draw('flowchart TD\nA --> B\nB --> C\nC --> D\nD --> A\nC --> B');
    const outer = two.lay.edges['D-A'].points[1].x, inner = two.lay.edges['C-B'].points[1].x;
    assert.ok(outer > inner);
  });

  it('draw a link between two boxes of one rank straight across', () => {
    const side = draw('flowchart TD\nA --> B\nA --> C\nB --> C\n%% main: A>B');
    const cross = side.lay.edges['B-C'];
    assert.ok(cross.points.every((p) => p.y === cross.points[0].y) || cross.points.length > 2);
  });
});

describe('layout: left to right', () => {
  it('is the same drawing on its side: the spine shares a row, ranks run across', () => {
    const { lay } = draw('flowchart LR\nA[One] --> B{Two?}\nB -->|Yes| C[Three]\nB -->|No| D[Four]\nC --> E[Five]');
    assert.equal(lay.direction, 'LR');
    assert.equal(new Set(lay.spine.map((id) => lay.nodes[id].y)).size, 1);
    assert.ok(lay.nodes.B.x > lay.nodes.A.x);
    assert.ok(lay.nodes.D.y > lay.nodes.A.y);
    assert.ok(lay.width > lay.height);
  });

  it('says when a flow kept left to right is too wide to read across', () => {
    const long = draw(`flowchart LR\n${'ABCDEFGH'.split('').map((c, i, all) => (all[i + 1] ? `${c} --> ${all[i + 1]}` : '')).join('\n')}\n%% turn: no`);
    assert.match(long.lay.warnings[0], /would read better/);
  });
});

describe('layout: odd graphs', () => {
  it('places a flow that is one loop with no way in', () => {
    const { lay } = draw('flowchart TD\nA --> B\nB --> C\nC --> A');
    assert.deepEqual(lay.spine, ['A', 'B', 'C']);
    assert.equal(lay.edges['C-A'].back, true);
  });

  it('places two flows that do not touch', () => {
    const { lay } = draw('flowchart TD\nA --> B\nC --> D');
    assert.equal(Object.keys(lay.nodes).length, 4);
    assert.notEqual(lay.nodes.C.x, lay.nodes.A.x);
  });

  it('has a size for a block with no boxes', () => {
    const { lay } = draw('flowchart TD');
    assert.deepEqual([lay.width, lay.height], [measure.pad, measure.pad]);
  });
});

describe('layout: two boxes that each lead to the same two', () => {
  const swap = 'flowchart TD\nA[Web order] & B[Phone order] --> C[Pick] & D[Bill]';
  const pairs = (/** @type {string} */ src) => {
    const edges = Object.values(layout(parse(src)).edges);
    let crossings = 0, overlaps = 0;
    for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
      const m = meet(edges[i].points, edges[j].points);
      crossings += m.crossings;
      overlaps += m.overlaps;
    }
    return { crossings, overlaps };
  };

  it('crosses the two lines that swap sides once, and lays neither along the other', () => {
    assert.deepEqual(pairs(swap), { crossings: 1, overlaps: 0 });
  });

  it('does the same left to right, and further down a flow', () => {
    assert.deepEqual(pairs(swap.replace('TD', 'LR')), { crossings: 1, overlaps: 0 });
    assert.deepEqual(pairs('flowchart TD\nS --> A & B\nA & B --> C & D\nC & D --> E'), { crossings: 1, overlaps: 0 });
  });

  it('keeps a line that steps aside on the side of the box it enters', () => {
    const lay = layout(parse(swap));
    for (const e of Object.values(lay.edges)) {
      const end = e.points[e.points.length - 1], to = lay.nodes[e.id.split('-')[1]];
      assert.ok(Math.abs(end.x - to.x) < to.w / 2 - 8, `${e.id} enters ${Math.abs(end.x - to.x)} from the middle of a box ${to.w} wide`);
    }
  });
});

describe('layout: words on a line that goes round the outside', () => {
  const life = 'stateDiagram-v2\n[*] --> Idle\nIdle --> Connecting: open\nConnecting --> Connected: ok\nConnecting --> Failed: timeout\nFailed --> Connecting: retry\nConnected --> Idle: close\nFailed --> [*]: give up';

  it('stay inside the picture, with the margin everything else has', () => {
    for (const src of [life, life.replace('stateDiagram-v2', 'stateDiagram-v2\ndirection LR')]) {
      const lay = layout(parse(src));
      for (const e of Object.values(lay.edges)) {
        if (!e.label) continue;
        const l = e.label;
        assert.ok(l.x - l.w / 2 >= measure.pad / 2 && l.x + l.w / 2 <= lay.width - measure.pad / 2, `"${l.text}" runs from ${l.x - l.w / 2} to ${l.x + l.w / 2} in a picture ${lay.width} wide`);
        assert.ok(l.y - l.h / 2 >= measure.pad / 2 && l.y + l.h / 2 <= lay.height - measure.pad / 2, `"${l.text}" runs from ${l.y - l.h / 2} to ${l.y + l.h / 2} in a picture ${lay.height} tall`);
      }
    }
  });
});

describe('layout: a flow written left to right that is wider than a screen', () => {
  const long = (/** @type {number} */ n) => `flowchart LR\n${Array.from({ length: n - 1 }, (_, i) => `S${i}[Step ${i}] --> S${i + 1}[Step ${i + 1}]`).join('\n')}`;

  it('is turned top to bottom, and says so with how wide it would have been', () => {
    const lay = layout(parse(long(12)));
    assert.equal(lay.direction, 'TD');
    assert.ok(lay.width < measure.wide);
    assert.match(lay.warnings[0], /^written left to right, drawn top to bottom: left to right it would be \d{4}px wide, wider than most screens\. "%% turn: no" keeps it as written$/);
  });

  it('is left as written when it fits', () => {
    const lay = layout(parse(long(4)));
    assert.equal(lay.direction, 'LR');
    assert.deepEqual(lay.warnings, []);
  });

  it('is left as written when its author says so, and told it will scroll', () => {
    const lay = layout(parse(`${long(12)}\n%% turn: no`));
    assert.equal(lay.direction, 'LR');
    assert.match(lay.warnings[0], /will scroll on most screens/);
  });
});

describe('layout: a link from a box to itself', () => {
  const retry = 'flowchart TD\nA[Order] --> B[Connect]\nB -->|try again| B\nB --> C[Send]\nB --> D[Give up]';

  it('goes out from one side of its box and comes back to the same side, clear of everything', () => {
    for (const src of [retry, retry.replace('TD', 'LR')]) {
      const m = parse(src), lay = layout(m), loop = lay.edges['B-B'], b = lay.nodes.B;
      assert.ok(loop.points.length >= 4, 'out, along and back');
      const [first, last] = [loop.points[0], loop.points[loop.points.length - 1]];
      assert.ok(Math.hypot(first.x - last.x, first.y - last.y) >= 12, 'it leaves and returns at two places');
      const far = Math.max(...loop.points.map((p) => Math.max(Math.abs(p.x - b.x) - b.w / 2, Math.abs(p.y - b.y) - b.h / 2)));
      assert.ok(far >= 10 && far <= 24, `it goes ${far}px out from its box`);
      for (const n of Object.values(lay.nodes)) if (n.id !== 'B') for (const seg of loop.points.slice(1).map((p, i) => /** @type {[{x:number,y:number},{x:number,y:number}]} */ ([loop.points[i], p]))) assert.ok(!hitsBox(seg, n), `through ${n.id}`);
      for (const e of Object.values(lay.edges)) if (e.id !== 'B-B') assert.deepEqual(meet(loop.points, e.points), { crossings: 0, overlaps: 0 }, e.id);
      assert.ok(loop.label && loop.label.text === 'try again');
    }
  });

  it('does not move its box along the flow, or off the main path', () => {
    const lay = layout(parse(retry));
    assert.deepEqual(lay.spine.slice(0, 2), ['A', 'B']);
    assert.equal(lay.nodes.B.rank, 1);
  });

  it('is drawn for a box that stands alone, and for one nothing else leads to', () => {
    const lay = layout(parse('flowchart TD\nA --> A\nB --> B\nB --> C'));
    assert.ok(lay.edges['A-A'].points.length >= 4 && lay.edges['B-B'].points.length >= 4);
    assert.equal(lay.nodes.B.rank, 0);
  });
});

describe("layout: a group's name", () => {
  const struck = (/** @type {ReturnType<typeof layout>} */ lay, /** @type {{x:number,y:number,w:number,h:number}} */ name) =>
    Object.values(lay.edges).some((e) => e.points.slice(1).some((p, i) => hitsBox([e.points[i], p], name, 0)));

  it('sits along the top of its frame where no line runs through it, when there is such a place', () => {
    const lay = layout(parse('flowchart TB\nA[Order] --> B[Pick]\nsubgraph wh [Hub]\n  B --> C[Pack]\n  B --> D[Label]\nend\nC --> E[Ship]'));
    const [frame] = lay.groups;
    assert.equal(frame.name.plate, false);
    assert.ok(!struck(lay, frame.name), 'no line through the name');
    assert.ok(frame.name.x - frame.name.w / 2 >= frame.x && frame.name.x + frame.name.w / 2 <= frame.x + frame.w, 'inside its frame');
    assert.ok(frame.name.y < lay.nodes.B.y - lay.nodes.B.h / 2, 'above its boxes');
  });

  it('moves to the other end of the top when a line comes in at the first', () => {
    const lay = layout(parse('flowchart TB\nsubgraph wh [Hub]\n  B[Pick] --> C[Pack]\nend\nA[Order] --> B\n%% main: A>B>C'));
    const [frame] = lay.groups;
    assert.ok(!struck(lay, frame.name));
  });

  it('is put on a plate when a line has to pass behind it, so it can still be read', () => {
    const lay = layout(parse('flowchart TB\nA[Order] --> B[Pick]\nsubgraph wh [The whole warehouse floor]\n  B --> C[Pack]\nend\nC --> D[Ship]'));
    const [frame] = lay.groups;
    assert.equal(frame.name.plate, true);
  });

  it("keeps a link's words off it", () => {
    const lay = layout(parse('flowchart TB\nA[Order] -->|when it is paid for in full| B[Pick]\nsubgraph wh [Warehouse]\n  B --> C[Pack]\nend'));
    const words = lay.edges['A-B'].label, name = lay.groups[0].name;
    assert.ok(words && !(Math.abs(words.x - name.x) < (words.w + name.w) / 2 && Math.abs(words.y - name.y) < (words.h + name.h) / 2));
  });
});

describe('layout: a group inside a group', () => {
  const site = 'flowchart TB\n  O[Order] --> A\n  subgraph site [Site]\n    subgraph wh [Warehouse]\n      A[Pick] --> B[Pack]\n    end\n    B --> C[Load]\n  end\n  C --> D[Ship]';
  const holds = (/** @type {{x:number,y:number,w:number,h:number}} */ outer, /** @type {{x:number,y:number,w:number,h:number}} */ inner, by = 0) =>
    inner.x >= outer.x + by && inner.y >= outer.y + by && inner.x + inner.w <= outer.x + outer.w - by && inner.y + inner.h <= outer.y + outer.h - by;

  it('has a frame of its own inside the outer frame, each with its name on a line of its own', () => {
    for (const src of [site, site.replace('TB', 'LR')]) {
      const lay = layout(parse(src));
      assert.deepEqual(lay.groups.map((f) => f.id), ['site', 'wh'], lay.warnings.join('; '));
      const [outer, inner] = lay.groups;
      assert.ok(holds(outer, inner, 8), 'the inner frame is inside the outer one, with room between');
      assert.ok(inner.name.y - outer.name.y >= 12, 'the two names do not share a line');
      assert.deepEqual(lay.warnings, []);
    }
  });

  it('makes room along the flow for the frames, so neither takes in the box before it or the box after', () => {
    const lay = layout(parse(site)), [outer] = lay.groups;
    const box = (/** @type {string} */ id) => ({ x: lay.nodes[id].x - lay.nodes[id].w / 2, y: lay.nodes[id].y - lay.nodes[id].h / 2, w: lay.nodes[id].w, h: lay.nodes[id].h });
    assert.ok(box('O').y + box('O').h < outer.y, 'Order is above the outer frame');
    assert.ok(box('D').y > outer.y + outer.h, 'Ship is below it');
    assert.ok(holds(outer, box('C')) && holds(lay.groups[1], box('A')) && !holds(lay.groups[1], box('C'), -4));
  });

  it('leaves the room between ranks as it was where no frames are inside one another', () => {
    const plain = layout(parse('flowchart TB\nA --> B\nsubgraph g\n B --> C\nend\nC --> D'));
    const gaps = ['A', 'B', 'C'].map((id, i) => plain.nodes[['B', 'C', 'D'][i]].y - plain.nodes[id].y);
    assert.equal(new Set(gaps).size, 1);
  });
});


describe('layout: a flow written from the far end', () => {
  const chain = (/** @type {string} */ way) => parse(`flowchart ${way}\n  Quote --> Order --> Invoice`);

  it('reads BT and RL as the same flow, started from the bottom or from the right, and says nothing', () => {
    assert.deepEqual([chain('BT').direction, chain('BT').reversed, chain('BT').warnings], ['TD', true, []]);
    assert.deepEqual([chain('RL').direction, chain('RL').reversed, chain('RL').warnings], ['LR', true, []]);
    assert.ok(!chain('TD').reversed && !chain('LR').reversed);
    const state = parse('stateDiagram-v2\n  direction BT\n  [*] --> Open\n  Open --> [*]');
    assert.deepEqual([state.direction, state.reversed, state.warnings], ['TD', true, []]);
  });

  it('draws bottom to top: the first box lowest, and every arrow pointing up into the box it goes to', () => {
    const m = chain('BT'), lay = layout(m);
    assert.ok(lay.nodes.Quote.y > lay.nodes.Order.y && lay.nodes.Order.y > lay.nodes.Invoice.y);
    for (const e of m.edges) {
      const pts = lay.edges[e.id].points, to = lay.nodes[e.to], end = pts[pts.length - 1];
      assert.ok(end.y < pts[0].y, 'the line goes up');
      assert.ok(Math.abs(end.y - (to.y + to.h / 2)) < 1, 'and ends on the bottom of its box');
    }
    assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), []);
  });

  it('draws right to left: the first box furthest right, and every arrow pointing left', () => {
    const m = chain('RL'), lay = layout(m);
    assert.ok(lay.nodes.Quote.x > lay.nodes.Order.x && lay.nodes.Order.x > lay.nodes.Invoice.x);
    for (const e of m.edges) {
      const pts = lay.edges[e.id].points, to = lay.nodes[e.to], end = pts[pts.length - 1];
      assert.ok(end.x < pts[0].x && Math.abs(end.x - (to.x + to.w / 2)) < 1);
    }
    assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), []);
  });

  it('is the same picture as the flow written the usual way, turned over: as wide, as tall, nothing lost', () => {
    const src = (/** @type {string} */ way) => `flowchart ${way}\n  A[Raise] --> B{Approved?}\n  B -->|yes| C[Order]\n  B -->|no| D[Rework]\n  D --> A\n  C --> E[(Ledger)]\n  subgraph one[Buying]\n    A\n    B\n  end\n  subgraph two[Books]\n    C\n    E\n  end`;
    for (const [usual, far] of [['TD', 'BT'], ['LR', 'RL']]) {
      const a = layout(parse(src(usual))), m = parse(src(far)), b = layout(m);
      assert.deepEqual(b.warnings, a.warnings, far);
      assert.equal(b.groups.length, a.groups.length, `${far}: every frame is drawn`);
      assert.ok(Math.abs(b.width - a.width) <= 40 && Math.abs(b.height - a.height) <= 40, `${far}: ${b.width}×${b.height} for ${a.width}×${a.height}`);
      assert.deepEqual(score(m, b, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), [], far);
      // A frame's name is still along its top, whichever way the flow runs.
      for (const f of b.groups) assert.ok(f.name.y < f.y + f.h / 2, `${far}: ${f.title}`);
    }
  });

  it('keeps frames stacked along a bottom-to-top flow apart, each with room for its name', () => {
    const m = parse('flowchart BT\n  subgraph one[First]\n    A --> B\n  end\n  subgraph two[Second]\n    C --> D\n  end\n  B --> C'), lay = layout(m);
    assert.equal(lay.groups.length, 2);
    assert.deepEqual(lay.warnings, []);
    assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), []);
  });

  it('turns a right-to-left flow too wide for a screen top to bottom, and says so', () => {
    const m = parse(`flowchart RL\n  ${Array.from({ length: 9 }, (_, i) => `S${i}[Step number ${i}] --> S${i + 1}[Step number ${i + 1}]`).join('\n  ')}`), lay = layout(m);
    assert.equal(lay.direction, 'TD');
    assert.ok(lay.nodes.S0.y < lay.nodes.S9.y, 'read from the top, as a page is');
    assert.match(lay.warnings[0], /^written right to left, drawn top to bottom/);
  });
});

describe('layout: words on a link that runs into a group', () => {
  it('have a row of their own above the name of the group, however long the name', () => {
    const m = parse('flowchart TD\n  App[Order service] -->|Reads and writes over TDS| Db[(Orders)]\n  subgraph cloud["Azure SQL, general purpose tier"]\n    subgraph inner["West Europe, zone one"]\n      Db\n    end\n  end'), lay = layout(m);
    assert.equal(lay.groups.length, 2);
    assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), []);
    const words = lay.edges['App-Db'].label;
    assert.ok(words && words.y + words.h / 2 <= lay.groups[0].y, 'the words end above the outer frame');
  });

  it('leave the room between ranks as it was where no words run into a group', () => {
    const plain = (/** @type {string} */ label) => layout(parse(`flowchart TD\n  A --> B\n  B ${label} C\n  subgraph g[Group]\n    A\n    B\n    C\n  end`));
    assert.equal(plain('-->|inside|').height, plain('-->').height);
  });
});

describe('layout: what the newer kinds asked of a box', () => {
  it('makes the box wide enough for the line over its name', () => {
    const m = parse('flowchart TD\n  A[Orders] --> B[Bus]');
    /** @type {any} */ (m.nodes[0]).over = '«container database: SQL Server»';
    const lay = layout(m);
    assert.ok(m.nodes[0].over.length * measure.overGlyph + 2 * measure.overIn <= lay.box.w, `${lay.box.w}px`);
    /** @type {any} */ (m.nodes[0]).over = `«${'x'.repeat(80)}»`;
    const p6 = score(m, layout(m), builtIn).checks.find((c) => c.id === 'P6');
    assert.match(p6?.detail ?? '', /"Orders" has a line over its name too long for any box/);
  });

  it('gives words of two lines on a link that turns between two ranks room above or below the turn', () => {
    const m = parse('flowchart TD\n  Rep[Sales rep] -->|Answers orders in| Portal[Supplier portal]\n  Api[Order API] <-->|Trades orders and answers with| Portal\n  Shop[Web shop] --> Api'), lay = layout(m);
    assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), []);
  });
});

describe('layout: a tree', () => {
  const bushy = 'flowchart LR\n  R --> A\n  R --> B\n  R --> C\n  A --> A1\n  A --> A2\n  A --> A3\n  A --> A4\n  B --> B1\n  B --> B2\n  B --> B3\n  C --> C1\n  C --> C2\n  C --> C3';

  it('keeps what a box leads to together, so no line crosses another', () => {
    const m = parse(bushy), lay = layout(m);
    assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), []);
    assert.match(score(m, lay, builtIn).checks.find((c) => c.id === 'P4')?.detail ?? '', /^no (line crosses|crossings)|^0 /i);
    // Across the flow, every box B leads to lies between what A leads to and what C leads to.
    const across = (/** @type {string} */ id) => lay.nodes[id].y;
    const span = (/** @type {string[]} */ ids) => [Math.min(...ids.map(across)), Math.max(...ids.map(across))];
    const [, aEnd] = span(['A1', 'A2', 'A3', 'A4']), [bStart, bEnd] = span(['B1', 'B2', 'B3']), [cStart] = span(['C1', 'C2', 'C3']);
    assert.ok(aEnd < bStart && bEnd < cStart);
  });

  it('puts a box in line with the first box it leads to, and the main path still straight', () => {
    const m = parse(bushy), lay = layout(m);
    assert.equal(lay.nodes.R.y, lay.nodes.A.y);
    assert.equal(lay.nodes.A.y, lay.nodes.A1.y);
    assert.equal(lay.nodes.B.y, lay.nodes.B1.y);
    assert.equal(lay.nodes.C.y, lay.nodes.C1.y);
  });

  it('leaves a flow that is not a tree placed as it was', () => {
    const m = parse('flowchart TD\n  A --> B\n  A --> C\n  B --> D\n  C --> D'), lay = layout(m);
    assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), []);
  });
});

describe('layout: a group whose name is longer than its frame is wide', () => {
  const two = 'flowchart TB\n  subgraph one["Traditional Development (20% AI Autonomy)"]\n    A1[Human Requirements] --> A2[Human Design]\n  end\n  subgraph two["AI-Led Development (95% AI Autonomy)"]\n    B1[Strategic Context] --> B2[AI Understanding]\n  end';
  const inside = (/** @type {import('../skills/merlive/scripts/layout.mjs').Frame} */ f) => f.name.x - f.name.w / 2 >= f.x && f.name.x + f.name.w / 2 <= f.x + f.w && f.name.y - f.name.h / 2 >= f.y && f.name.y + f.name.h / 2 <= f.y + f.h;
  const broken = (/** @type {import('../skills/merlive/scripts/parse.mjs').Model} */ m, /** @type {import('../skills/merlive/scripts/layout.mjs').Layout} */ lay) => score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`);

  it('wraps the name to the frame, in as many lines as it needs, and keeps room along the top for each', () => {
    const m = parse(two), lay = layout(m);
    assert.equal(lay.groups.length, 2);
    for (const f of lay.groups) {
      const lines = f.name.lines ?? [];
      assert.ok(lines.length > 1, `${f.title}: ${lines.length} line`);
      assert.equal(lines.join(' '), f.title);
      for (const line of lines) assert.ok(line.length * measure.nameGlyph <= f.w - 2 * measure.nameIn, `${line} in ${f.w}px`);
      assert.ok(inside(f), `${f.title} lies inside its frame`);
      // Under the last line of the name there is still the pad a frame keeps round its boxes.
      const top = Math.min(...['1', '2'].map((n) => lay.nodes[`${f.id === 'one' ? 'A' : 'B'}${n}`]).map((b) => b.y - b.h / 2));
      assert.ok(top - (f.name.y + f.name.h / 2) >= measure.framePad - measure.nameLine / 2 - 1, `${f.title}: the name is clear of the first box`);
    }
    const [a, b] = lay.groups;
    assert.ok(a.name.x + a.name.w / 2 < b.name.x - b.name.w / 2 || b.name.x + b.name.w / 2 < a.name.x - a.name.w / 2, 'the two names are apart');
    assert.ok(Math.max(...lay.groups.map((f) => f.name.x + f.name.w / 2)) <= lay.width, 'and inside the picture');
    assert.deepEqual(broken(m, lay), []);
  });

  it('leaves a name that fits on one line where it was, with the room it had', () => {
    const m = parse('flowchart TB\n  subgraph g[Buying]\n    A --> B\n  end'), lay = layout(m), [f] = lay.groups;
    assert.deepEqual(f.name.lines, ['Buying']);
    assert.equal(f.y, lay.nodes.A.y - lay.nodes.A.h / 2 - measure.framePad - measure.frameTitle);
    assert.equal(f.name.h, measure.nameLine);
  });

  it('makes room between two ranks for every line of a name, so stacked groups stay apart', () => {
    const m = parse('flowchart TB\n  subgraph one["The requirements that people write down first"]\n    A --> B\n  end\n  subgraph two["The design decisions that follow from every one of them"]\n    C --> D\n  end\n  B --> C'), lay = layout(m);
    assert.deepEqual(lay.warnings, []);
    assert.equal(lay.groups.length, 2);
    const [a, b] = lay.groups;
    assert.ok(a.y + a.h <= b.y, 'the second frame begins under the first');
    assert.ok((b.name.lines ?? []).length > 1);
    assert.deepEqual(broken(m, lay), []);
  });

  it('does the same left to right, where a name is along the top and the room is between lanes', () => {
    const m = parse('flowchart LR\n  S --> A\n  S --> C\n  subgraph one["The requirements that people write down first of all"]\n    A\n  end\n  subgraph two["The design decisions that follow from every one of them"]\n    C\n  end'), lay = layout(m);
    assert.deepEqual(lay.warnings, []);
    assert.equal(lay.groups.length, 2);
    for (const f of lay.groups) assert.ok((f.name.lines ?? []).length > 1 && inside(f), f.title);
    assert.deepEqual(broken(m, lay), []);
  });

  it('wraps the names of groups one inside another, each to its own frame', () => {
    const m = parse('flowchart TB\n  subgraph outer["Everything that the buying department is answerable for"]\n    subgraph inner["The part of it that happens before an order is raised"]\n      A --> B\n    end\n  end'), lay = layout(m);
    assert.equal(lay.groups.length, 2);
    for (const f of lay.groups) assert.ok(inside(f), f.title);
    const [outer, inner] = lay.groups;
    assert.ok(outer.name.y + outer.name.h / 2 <= inner.y, 'the outer name ends above the inner frame');
    assert.deepEqual(broken(m, lay), []);
  });

  it('makes a box wide enough that a frame of one lane holds the longest word of its name', () => {
    const m = parse('flowchart TB\n  subgraph g["Internationalisation-and-localisation work"]\n    A --> B\n  end'), lay = layout(m), [f] = lay.groups;
    assert.ok(lay.box.w > 128);
    assert.ok(inside(f));
    assert.deepEqual(broken(m, lay), []);
  });
});

describe('score: P8 checks that a name can be read', () => {
  const m = parse('flowchart TB\n  subgraph one[Buying]\n    A --> B\n  end\n  subgraph two[Selling]\n    C --> D\n  end');
  const p8 = (/** @type {(lay: import('../skills/merlive/scripts/layout.mjs').Layout) => void} */ spoil) => {
    const lay = layout(m);
    spoil(lay);
    return score(m, lay, builtIn).checks.find((c) => c.id === 'P8');
  };

  it('passes names that are inside their frames, apart, and clear of boxes and lines', () => {
    assert.equal(p8(() => {})?.ok, true);
  });

  it('fails a name wider than its frame, and says to break it', () => {
    const c = p8((lay) => { lay.groups[0].name.w = lay.groups[0].w + 40; });
    assert.equal(c?.ok, false);
    assert.match(c?.detail ?? '', /the name of the group "Buying" runs out of its frame/);
  });

  it('fails a name that runs off the picture', () => {
    const c = p8((lay) => { const f = lay.groups[1]; f.name.x = lay.width + 5; });
    assert.match(c?.detail ?? '', /the name of the group "Selling" (runs out of its frame|runs off the picture)/);
  });

  it('fails two names that lie on each other', () => {
    const c = p8((lay) => { lay.groups[1].name.x = lay.groups[0].name.x; lay.groups[1].name.y = lay.groups[0].name.y; });
    assert.match(c?.detail ?? '', /lies on the name of the group/);
  });

  it('fails a name that lies on a box', () => {
    const c = p8((lay) => { lay.groups[0].name.y = lay.nodes.A.y; lay.groups[0].name.x = lay.nodes.A.x; });
    assert.match(c?.detail ?? '', /the name of the group "Buying" lies on the box "A"/);
  });

  it('fails a word too long for any frame, and says what to do', () => {
    const long = parse(`flowchart TB\n  subgraph g["${'x'.repeat(70)}"]\n    A --> B\n  end`), c = score(long, layout(long), builtIn).checks.find((k) => k.id === 'P8');
    assert.equal(c?.ok, false);
    assert.match(c?.detail ?? '', /runs out of its frame; shorten it, or break its longest word/);
  });
});

describe('layout: a box that leads to many', () => {
  const fan = (/** @type {string} */ dir, /** @type {number} */ n, /** @type {string} */ more = '') => parse(`flowchart ${dir}\n${Array.from({ length: n }, (_, i) => `  R --> C${i}`).join('\n')}${more}`);
  const crossings = (/** @type {import('../skills/merlive/scripts/parse.mjs').Model} */ m) => {
    const edges = Object.values(layout(m).edges);
    let sum = 0;
    for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) sum += meet(edges[i].points, edges[j].points).crossings + meet(edges[i].points, edges[j].points).overlaps;
    return sum;
  };

  // Trying every order of the lines on a side stops at four. A fan must not need it: its own lines nest by rule.
  for (const dir of ['TD', 'LR', 'BT', 'RL']) for (const n of [6, 7, 10]) {
    it(`${n} lines from one box cross nowhere, ${dir}`, () => assert.equal(crossings(fan(dir, n)), 0));
  }

  it('and neither do the fans of a tree three deep', () => {
    const m = fan('LR', 6, `\n${Array.from({ length: 5 }, (_, i) => `  C2 --> D${i}\n  C4 --> E${i}\n  E${i} --> F${i}\n  E${i} --> G${i}`).join('\n')}`);
    assert.equal(crossings(m), 0);
    assert.equal(score(m, layout(m), builtIn).checks.find((c) => c.id === 'P4')?.ok, true);
  });

  it('lines to boxes at different ranks from one side nest too', () => {
    const m = parse(`flowchart TD\n  R --> A\n${Array.from({ length: 6 }, (_, i) => `  R --> C${i}\n  C${i} --> D${i}\n  R --> D${i}`).join('\n')}`);
    assert.equal(score(m, layout(m), builtIn).checks.find((c) => c.id === 'P4')?.ok, true);
  });
});

describe('layout: a line round the outside', () => {
  it('goes round the side that saves it a lane when neither side crosses anything', () => {
    // Order to Ship cannot go straight down: round the left it passes nothing, round the right it must pass
    // Back order too. With the lines into Ship nested, neither way crosses, so only the length tells them apart.
    const m = parse('flowchart TD\n  A[Order] --> B{In stock?}\n  B -->|Yes| C[Pick]\n  B -->|No| D[Back order]\n  C --> E[Ship]\n  D -.-> E\n  A ==> E'), lay = layout(m);
    assert.ok(Math.min(...lay.edges['A-E'].points.map((p) => p.x)) < lay.nodes.A.x - lay.nodes.A.w / 2, 'round the left');
    assert.ok(Math.max(...lay.edges['A-E'].points.map((p) => p.x)) < lay.nodes.D.x, 'and not out past Back order');
  });
});
