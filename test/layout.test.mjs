import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { hitsBox, layout, measure, meet, wrap } from '../skills/merlive/scripts/layout.mjs';

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

  it('says when a flow is too wide to read across', () => {
    const long = draw(`flowchart LR\n${'ABCDEFGH'.split('').map((c, i, all) => (all[i + 1] ? `${c} --> ${all[i + 1]}` : '')).join('\n')}`);
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

