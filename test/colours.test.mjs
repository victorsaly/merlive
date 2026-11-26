// An author's colour always survives as a colour: what a box or a link was coloured stays a colour in the
// picture, in the design's own for that hue where it has one and the author's own where it has none, with the
// words on it still readable. Found on a real document (wild/flow-thirteen.mmd): a red, a green and three
// amber boxes were drawn like plain ones.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout } from '../skills/merlive/scripts/layout.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';
import { page, picture } from '../skills/merlive/scripts/render.mjs';
import { apart, builtIn, colourChecks, colourLimits, contrast, designFrom, designWith, hueOf, kindFill, kindShare } from '../skills/merlive/scripts/design.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const about = { title: 't', source: '', version: '0' };
const thirteen = readFileSync(join(root, 'wild/flow-thirteen.mmd'), 'utf8');
/** What a picture says of one kind, in light and in dark: its colour and its fill. */
const drawnAs = (/** @type {string} */ svg, /** @type {string} */ kind) => ({
  edge: [...svg.matchAll(new RegExp(`--mv-k-${kind}:(#[0-9a-f]{6})`, 'g'))].map((m) => m[1]),
  fill: [...svg.matchAll(new RegExp(`--mv-kf-${kind}:(#[0-9a-f]{6})`, 'g'))].map((m) => m[1]),
});

describe('colours: what an author coloured is read as its colour', () => {
  const kindOf = (/** @type {string} */ style) => {
    const m = parse(`flowchart TD\n  A[Raise] --> B[Approve]\n  style A ${style}`);
    return [m.nodes[0].kind, m.classes[m.nodes[0].kind]];
  };

  it('takes the fill, which is what a reader sees, when it is as strong a colour as the edge', () => {
    assert.deepEqual(kindOf('fill:#F44336,stroke:#D32F2F,color:#fff'), ['red', '#f44336']);
    assert.deepEqual(kindOf('fill:#f9f,stroke:#333,stroke-width:4px'), ['pink', '#ff99ff']);
    assert.deepEqual(kindOf('fill:#4CAF50'), ['green', '#4caf50']);
  });

  it('takes the edge when the fill is a pale wash of it, or no colour at all', () => {
    assert.deepEqual(kindOf('fill:#e1f5fe,stroke:#01579b,stroke-width:2px'), ['blue', '#01579b']);
    assert.deepEqual(kindOf('fill:#fff,stroke:#c00'), ['red', '#cc0000']);
    assert.deepEqual(kindOf('stroke:#333'), ['grey', '#333333']);
  });

  it('reads the colour of the words past: the words are the design\'s, held to its contrast', () => {
    assert.deepEqual(kindOf('color:#fff'), ['step', undefined]);
    assert.deepEqual(kindOf('color:#fff,fill:#F44336'), ['red', '#f44336']);
  });
});

describe('colours: an author\'s colour survives as a colour', () => {
  const m = parse(thirteen), lay = layout(m);

  it('draws a box its author filled unlike a plain box, in light and in dark, with no design file', () => {
    // No designWith here: a picture and a page give an author's colours a place themselves, so no caller can forget.
    for (const svg of [picture(m, lay, builtIn, about), page(m, lay, builtIn, about)]) {
      const plain = drawnAs(svg, 'step');
      for (const kind of ['red', 'green', 'yellow']) {
        const got = drawnAs(svg, kind);
        assert.equal(got.fill.length, 2, `${kind}: a fill in light and in dark`);
        got.fill.forEach((fill, i) => {
          assert.notEqual(fill, plain.fill[i], `${kind}: its fill is not a plain box's`);
          assert.notEqual(got.edge[i], plain.edge[i], `${kind}: its edge is not a plain box's`);
        });
      }
    }
  });

  it('draws it as a fill that is seen, not a faint wash: far enough from a plain box to be told from it at a glance', () => {
    const d = designWith(builtIn, m);
    for (const p of [d.light, /** @type {import('../skills/merlive/scripts/design.mjs').Palette} */ (d.dark)]) {
      for (const kind of ['red', 'green', 'yellow']) assert.ok(apart(kindFill(p, kind), p.node) >= colourLimits.seen, `${kind}: ${apart(kindFill(p, kind), p.node).toFixed(1)}`);
    }
  });

  it('draws two colours an author chose unlike each other', () => {
    const d = designWith(builtIn, m);
    for (const p of [d.light, /** @type {import('../skills/merlive/scripts/design.mjs').Palette} */ (d.dark)]) {
      const fills = ['red', 'green', 'yellow'].map((k) => kindFill(p, k));
      assert.equal(new Set(fills).size, 3);
      assert.ok(apart(p.kinds.red, p.kinds.green) >= colourLimits.tellApart && apart(p.kinds.red, p.kinds.yellow) >= colourLimits.tellApart && apart(p.kinds.green, p.kinds.yellow) >= colourLimits.tellApart);
    }
  });

  it('keeps the words on every fill readable, and every rule kept', () => {
    assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), []);
    const d = designWith(builtIn, m);
    for (const p of [d.light, /** @type {import('../skills/merlive/scripts/design.mjs').Palette} */ (d.dark)]) {
      for (const kind of ['red', 'green', 'yellow']) assert.ok(contrast(p.text, kindFill(p, kind)) >= colourLimits.text, kind);
    }
  });

  it('thins a fill only as far as its words need, and never for a colour they read on at full strength', () => {
    const harsh = parse('flowchart TD\n  A[Navy] --> B[Lemon]\n  style A fill:#000080\n  style B fill:#ffff00'), d = designWith(builtIn, harsh);
    for (const p of [d.light, /** @type {import('../skills/merlive/scripts/design.mjs').Palette} */ (d.dark)]) {
      for (const kind of ['blue', 'yellow']) assert.ok(contrast(p.text, kindFill(p, kind)) >= colourLimits.text, `${kind}: ${contrast(p.text, kindFill(p, kind)).toFixed(2)}`);
    }
    assert.deepEqual(score(harsh, layout(harsh), builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), []);
    assert.ok(kindShare.said > 2 * kindShare.tint, 'a colour its author gave is a fill, more than twice the wash a kind of Merlive\'s own has');
  });
});

describe('colours: whose colour it is drawn in', () => {
  const one = (/** @type {string} */ style, more = '') => parse(`flowchart TD\n  A[Raise] --> B[Approve]${more}\n  style B ${style}`);

  it('is the design\'s own colour for that hue, where it has one: the diagram fits the site', () => {
    const d = designWith(builtIn, one('fill:#4CAF50'));
    assert.equal(d.light.kinds.green, builtIn.light.kinds.terminal);
    assert.equal(d.dark?.kinds.green, builtIn.dark?.kinds.terminal);
    assert.equal(designWith(builtIn, one('fill:#F44336')).light.kinds.red, builtIn.light.kinds.risk);
  });

  it('is the author\'s own colour where the design has none of that hue, changed only as far as it must be to be seen on the page', () => {
    // Merlive's own design has no purple, and nothing within a reader's reach of one.
    const d = designWith(builtIn, one('fill:#7b1fa2'));
    assert.ok(!Object.values(builtIn.light.kinds).includes(d.light.kinds.purple), 'not one of the design\'s');
    // A colour that is already seen on the page is the author's own, to the letter.
    assert.equal(d.light.kinds.purple, '#7b1fa2');
    // On the dark page it would be lost, so it is lightened there, and is a purple still.
    assert.notEqual(d.dark?.kinds.purple, '#7b1fa2');
    assert.equal(hueOf(/** @type {string} */ (d.dark?.kinds.purple)), 'purple');
    assert.ok(contrast(/** @type {string} */ (d.dark?.kinds.purple), /** @type {string} */ (d.dark?.bg)) >= colourLimits.line);
    const pale = designWith(builtIn, one('fill:#ce93d8')).light.kinds.purple;
    assert.notEqual(pale, '#ce93d8');
    assert.equal(hueOf(pale), 'purple');
    assert.ok(contrast(pale, builtIn.light.bg) >= colourLimits.line);
    // A hue near one of the design's is the design's: a teal is its blue, a lemon its amber.
    assert.equal(designWith(builtIn, one('fill:#00bcd4')).light.kinds.teal, builtIn.light.kinds.data);
    assert.equal(designWith(builtIn, one('fill:#ffeb3b')).light.kinds.yellow, builtIn.light.kinds.decision);
  });

  it('is never the colour of another kind in the same diagram: its own green is taken, so it keeps the author\'s', () => {
    const m = one('fill:#4CAF50', '\n  S([Start]) --> A'), d = designWith(builtIn, m);
    assert.notEqual(d.light.kinds.green, builtIn.light.kinds.terminal);
    assert.equal(hueOf(d.light.kinds.green), 'green');
    assert.deepEqual(score(m, layout(m), builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), []);
  });

  it('is the design\'s nearest colour that is still free only when its author\'s own could not be told from one already there', () => {
    // A green all but the one a start has: its own would be one colour with the start's, to the eye.
    const m = one('fill:#2e8052', '\n  S([Start]) --> A'), d = designWith(builtIn, m);
    assert.ok(Object.values(builtIn.light.kinds).includes(d.light.kinds.green) && d.light.kinds.green !== builtIn.light.kinds.terminal);
    assert.deepEqual(score(m, layout(m), builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), []);
    // And with every colour of the design in the diagram already, it is its author's own: D2 then names the two.
    const full = { ...builtIn, modes: /** @type {const} */ ('light'), light: { ...builtIn.light, kinds: { terminal: builtIn.light.kinds.terminal } } };
    assert.equal(designWith(full, m).light.kinds.green, '#2e8052');
    assert.match(score(m, layout(m), full).checks.find((c) => c.id === 'D2')?.detail ?? '', /green and terminal boxes look alike/);
  });

  it('never makes two colours an author chose one to the eye, whichever is found first', () => {
    // A design whose pink is too near this purple to tell from it: the purple is its author's own, found first,
    // so the pink is not the design's pink after it, but its author's own too.
    const design = designFrom({ light: { kinds: { rework: '#a21f9c' } } });
    const m = parse('flowchart TD\n  A[Raise] --> B[Approve]\n  style A fill:#7b1fa2\n  style B fill:#e91e63'), d = designWith(design, m);
    assert.deepEqual([d.light.kinds.purple, d.light.kinds.pink], ['#7b1fa2', '#e91e63']);
    assert.deepEqual(score(m, layout(m), design).checks.filter((c) => !c.ok && c.id === 'D2').map((c) => c.detail), []);
  });

  it('is a grey when its author made it grey, not the design\'s nearest colour', () => {
    const d = designWith(builtIn, one('stroke:#333'));
    assert.equal(hueOf(d.light.kinds.grey), 'grey');
    assert.equal(hueOf(/** @type {string} */ (d.dark?.kinds.grey)), 'grey');
  });

  it('is the colour a design file names for that hue, which wins, and is still a fill', () => {
    const design = designFrom({ light: { kinds: { red: '#aa0044' } }, dark: { kinds: { red: '#ff6688' } } }), m = one('fill:#F44336');
    const svg = picture(m, layout(m), design, about), got = drawnAs(svg, 'red');
    assert.deepEqual(got.edge, ['#aa0044', '#ff6688']);
    const d = designWith(design, m);
    assert.ok(apart(kindFill(d.light, 'red'), d.light.node) >= colourLimits.seen);
  });

  it('leaves a diagram nobody coloured, and a kind of Merlive\'s own, as they were', () => {
    const plain = parse('flowchart TD\n  A([Start]) --> B{Sure?}');
    assert.equal(designWith(builtIn, plain), builtIn);
    assert.equal(kindFill(builtIn.light, 'decision'), kindFill(designWith(builtIn, parse(thirteen)).light, 'decision'), 'a decision keeps its quiet wash');
    assert.equal(designWith(designWith(builtIn, parse(thirteen)), parse(thirteen)).light.kinds.red, designWith(builtIn, parse(thirteen)).light.kinds.red, 'given twice, the same');
  });
});

describe('colours: a box its author only edged, or gave a pale wash and a strong edge', () => {
  const one = (/** @type {string} */ style) => parse(`flowchart TD\n  A[Raise] --> B[Approve]\n  style B ${style}`);

  it('is told from one its author filled', () => {
    assert.deepEqual(one('fill:#F44336,stroke:#D32F2F,color:#fff').filled, ['red']);
    assert.deepEqual(one('fill:#e1f5fe,stroke:#01579b,stroke-width:2px').filled, []);
    assert.deepEqual(one('stroke:#c00').filled, []);
    assert.deepEqual(parse('flowchart TD\n  A --> B\n  classDef hot fill:#F44336\n  classDef cool fill:#e1f5fe,stroke:#01579b\n  class A hot\n  class B cool').filled, ['hot']);
    assert.deepEqual(parse('flowchart TD\n  A --> B\n  linkStyle 0 stroke:#F44336').filled, [], 'a line has nothing to fill');
  });

  it('is drawn as written: its edge in the colour, its fill a wash of it and not a fill', () => {
    const m = one('fill:#e1f5fe,stroke:#01579b,stroke-width:2px'), d = designWith(builtIn, m);
    for (const p of [d.light, /** @type {import('../skills/merlive/scripts/design.mjs').Palette} */ (d.dark)]) {
      assert.equal(kindFill(p, 'blue'), kindFill({ ...p, filled: [] }, 'blue'));
      assert.ok(apart(kindFill(p, 'blue'), p.node) < apart(kindFill({ ...p, filled: ['blue'] }, 'blue'), p.node), 'paler than a fill');
      assert.ok(apart(p.kinds.blue, p.stroke) >= colourLimits.seen, 'its edge is not a plain box\'s');
    }
    assert.deepEqual(score(m, layout(m), builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), []);
  });
});

describe('colours: a link its author coloured', () => {
  it('keeps a colour, in the line and its head', () => {
    const m = parse('flowchart TD\n  A --> B\n  B --> C\n  linkStyle 0 stroke:#F44336,stroke-width:4px');
    assert.equal(m.edges[0].kind, 'red');
    const svg = picture(m, layout(m), builtIn, about), got = drawnAs(svg, 'red');
    assert.equal(got.edge.length, 2);
    assert.notEqual(got.edge[0], builtIn.light.stroke);
    assert.notEqual(got.edge[0], builtIn.light.edge);
    assert.match(svg, /\[data-kind="red"\] \.mv-line[^{]*\{stroke:var\(--mv-k-red\)\}/);
    assert.ok(contrast(got.edge[0], builtIn.light.bg) >= colourLimits.line && contrast(got.edge[1], /** @type {string} */ (builtIn.dark?.bg)) >= colourLimits.line);
  });
});

describe('colours: the rule has its check', () => {
  it('fails D2 when a box its author coloured would be drawn like a plain one', () => {
    // A design whose red is its own box colour: the red box its author filled could not be told from any other.
    const washed = { ...builtIn, modes: /** @type {const} */ ('light'), light: { ...builtIn.light, kinds: { ...builtIn.light.kinds, red: builtIn.light.node }, said: ['red'], filled: ['red'] } };
    const d2 = colourChecks(washed, ['step', 'red']).find((c) => c.id === 'D2');
    assert.match(d2?.broken.join('\n') ?? '', /a red box is drawn like a plain one, though its author gave it a colour/);
    // And one whose red is its own edge colour: the box its author edged red has the edge of any other.
    const edged = { ...builtIn, modes: /** @type {const} */ ('light'), light: { ...builtIn.light, kinds: { ...builtIn.light.kinds, red: builtIn.light.stroke }, said: ['red'], filled: [] } };
    assert.match(colourChecks(edged, ['step', 'red']).find((c) => c.id === 'D2')?.broken.join('\n') ?? '', /a red box is drawn like a plain one/);
    assert.deepEqual(colourChecks(designWith(builtIn, parse(thirteen)), ['step', 'red', 'green', 'yellow']).flatMap((c) => c.broken), []);
  });
});
