import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout } from '../skills/merlive/scripts/layout.mjs';
import { apart, builtIn, contrast, designFrom, kindFill, mix, sights } from '../skills/merlive/scripts/design.mjs';
import { forcedCrossings, score } from '../skills/merlive/scripts/score.mjs';

const check = (/** @type {string} */ src, design = builtIn) => {
  const model = parse(src);
  const lay = layout(model);
  return { model, lay, result: score(model, lay, design) };
};
const failed = (/** @type {{checks:{id:string,ok:boolean}[]}} */ result) => result.checks.filter((c) => !c.ok).map((c) => c.id);

const orders = `flowchart TD
  A([Submit order]) --> B[Validate order]
  B --> C{Within budget?}
  C -->|Yes| D[Manager approval]
  C -->|No| E[Revise order]
  E --> B
  D --> F{Approved?}
  F -->|Yes| G[Send to supplier]
  F -->|No| E
  G --> H([Order placed])
  class E rework`;

describe('score: what Merlive places itself passes', () => {
  it('passes every rule for the example, in light and in dark', () => {
    const { result } = check(orders);
    assert.deepEqual(failed(result), []);
    assert.equal(result.pass, true);
    assert.match(result.checks.find((c) => c.id === 'D1')?.detail ?? '', /light and dark/);
  });

  it('passes with every kind of box the built-in look has a colour for, all in one diagram', () => {
    const kinds = Object.keys(builtIn.light.kinds);
    const all = `flowchart TD\n${kinds.map((k, i) => `N${i}[A ${k}]:::${k}${i ? '' : ' --> N1'}${i > 1 ? `\nN${i - 1} --> N${i}` : ''}`).join('\n')}`;
    const { model, result } = check(all);
    assert.deepEqual([...new Set(model.nodes.map((n) => n.kind))].sort(), [...kinds].sort());
    assert.deepEqual(failed(result), []);
  });

  it('has a check for each rule in docs/PLACEMENT.md', () => {
    assert.deepEqual(check(orders).result.checks.map((c) => c.id), ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'D1', 'D2']);
  });
});

describe('score: a broken rule is named, with where', () => {
  // A timeline section named in a sentence: a frame on a grid whose name wraps.
  const named = () => {
    const m = parse('timeline\nsection Everything the buyer does before the supplier hears of it\nMonday : Raised\nsection Delivery\nFriday : Delivered');
    return { m, lay: layout(m) };
  };
  const p8 = (/** @type {any} */ m, /** @type {any} */ lay) => /** @type {any} */ (score(m, lay, builtIn).checks.find((c) => c.id === 'P8'));

  it('passes a wrapped name that keeps to its frame, its lines, and its place over what the frame holds (P8)', () => {
    const { m, lay } = named();
    assert.equal(p8(m, lay).ok, true);
  });

  it('names a group\'s name of more lines than a name wraps to (P8)', () => {
    const { m, lay } = named(), f = lay.groups[0];
    f.lines = ['Everything', 'the buyer', 'does before', 'the supplier hears of it'];
    assert.match(p8(m, lay).detail, /the name of the group "Everything the buyer does before the supplier hears of it" takes 4 lines; a name wraps to 3 at most/);
  });

  it('names a group\'s name that runs past its frame (P8)', () => {
    const { m, lay } = named(), f = lay.groups[1];
    f.name.x = f.x + f.w;
    assert.match(p8(m, lay).detail, /the name of the group "Delivery" runs past its frame/);
  });

  it('names a group\'s name that a box lies on (P8)', () => {
    const { m, lay } = named(), f = lay.groups[0], monday = lay.nodes.period1;
    monday.y = f.name.y;
    assert.match(p8(m, lay).detail, /the name of the group "Everything the buyer[^"]*" lies under "Monday"/);
  });

  it('names a line that runs along the edge of a group (P5)', () => {
    const m = parse('flowchart TD\n  subgraph G [Group]\n    A\n  end\n  B --> A'), lay = layout(m), g = lay.groups[0];
    const e = Object.values(lay.edges)[0];
    e.points = [{ x: g.x - 20, y: g.y + 1 }, { x: g.x + g.w / 2, y: g.y + 1 }, { x: g.x + g.w / 2, y: lay.nodes.A.y - lay.nodes.A.h / 2 }];
    const p5 = /** @type {any} */ (score(m, lay, builtIn).checks.find((c) => c.id === 'P5'));
    assert.equal(p5.ok, false);
    assert.match(p5.detail, /runs along the edge of the group "Group"/);
  });

  it('P1 when a box of the main path is off the line', () => {
    const { model, lay } = check(orders);
    lay.nodes.C.x += 40;
    const p1 = score(model, lay, builtIn).checks[0];
    assert.equal(p1.ok, false);
    assert.match(p1.detail, /"Within budget\?" is off the line/);
  });

  it('P1 when the main path takes an exception where there is the plain way, unless its author named it', () => {
    const src = 'flowchart TD\nA[Ask] --> G[Groq]\nG -- "limit gone" --> O[OpenAI]\nO --> ANS[Answer]\nG --> ANS';
    const { model, lay } = check(src);
    lay.spine = ['A', 'G', 'O', 'ANS'];
    for (const id of lay.spine) lay.nodes[id].x = lay.nodes.A.x;
    const p1 = score(model, lay, builtIn).checks[0];
    assert.equal(p1.ok, false);
    assert.match(p1.detail, /takes "limit gone" out of "Groq", where a link without words goes on/);
    const named = check(`${src}\n%% main: A>G>O>ANS`);
    assert.equal(named.result.checks[0].ok, true);
  });

  it('P8 when the name of a group in a flow runs past its frame', () => {
    const { model, lay } = check('flowchart TD\nX[Draft] --> A\nsubgraph C [Checks]\n  A[Credit] --> B[Stock]\nend');
    lay.groups[0].name.w = lay.groups[0].w + 40;
    const p8 = /** @type {any} */ (score(model, lay, builtIn).checks.find((c) => c.id === 'P8'));
    assert.equal(p8.ok, false);
    assert.match(p8.detail, /the name of the group "Checks" runs past its frame/);
  });

  it('P8 when a name is on a plate where, wrapped narrower, it would have sat beside the line', () => {
    const { model, lay } = check('flowchart TD\nX[Draft] --> A\nsubgraph C [Checks before sending]\n  A[Credit] --> B[Stock]\nend');
    const [f] = lay.groups;
    delete f.lines;
    f.name = { ...f.name, x: f.x + f.w / 2, w: f.w - 20, h: 12, y: f.y + 12, plate: true };
    const p8 = /** @type {any} */ (score(model, lay, builtIn).checks.find((c) => c.id === 'P8'));
    assert.equal(p8.ok, false);
    assert.match(p8.detail, /the name of the group "Checks before sending" is on a plate, where in 3 lines it would sit beside the line/);
  });

  it('P2 when two boxes are too close', () => {
    const { model, lay } = check(orders);
    lay.nodes.E.y = lay.nodes.G.y;
    lay.nodes.E.x = lay.nodes.G.x + lay.box.w + 4;
    assert.ok(failed(score(model, lay, builtIn)).includes('P2'));
  });

  it('P3 when a line passes through a box', () => {
    const { model, lay } = check(orders);
    lay.edges['E-B'].points = [{ x: lay.nodes.A.x, y: lay.nodes.H.y }, { x: lay.nodes.A.x, y: lay.nodes.A.y }];
    const p3 = score(model, lay, builtIn).checks.find((c) => c.id === 'P3');
    assert.match(p3?.detail ?? '', /the link E to B passes through "Manager approval"/);
  });

  it('P4 when lines cross more than the links allow, and P5 when two share a path', () => {
    const { model, lay } = check(orders);
    const between = (lay.nodes.D.y + lay.nodes.F.y) / 2; // a row with no boxes, only the lines that pass it
    lay.edges['C-E'].points = [{ x: 0, y: between }, { x: 600, y: between }];
    lay.edges['F-E'].points = lay.edges['G-H'].points.map((p) => ({ ...p }));
    const out = failed(score(model, lay, builtIn));
    assert.ok(out.includes('P4') && out.includes('P5'), out.join());
  });

  it('P4 allows the crossing a diagram forces: two boxes that each lead to the same two', () => {
    const { model, lay, result } = check('flowchart TD\nA[Web order] & B[Phone order] --> C[Pick] & D[Bill]');
    assert.equal(forcedCrossings(model, lay), 1);
    assert.deepEqual(failed(result), []);
    assert.equal(result.checks.find((c) => c.id === 'P4')?.detail, '1 crossing, which this diagram cannot be drawn without');
  });

  it('P4 counts one forced crossing for every two boxes of a rank that share two of another, and none for a diamond', () => {
    const forced = (/** @type {string} */ src) => {
      const { model, lay } = check(`flowchart TD\n${src}`);
      return forcedCrossings(model, lay);
    };
    assert.equal(forced('A & B & C --> D & E'), 3);
    assert.equal(forced('A --> B & C --> D'), 0, 'a diamond is drawn with no crossing');
    assert.equal(forced('A & B --> C\nA --> D\nC --> E\nB --> E'), 0);
    assert.equal(forced('D --> A & B\nC --> A & B'), 1, 'whichever way the links point');
  });

  it('P4 still refuses a crossing the diagram does not force, and says how many it does', () => {
    const { model, lay } = check('flowchart TD\nA[Web order] & B[Phone order] --> C[Pick] & D[Bill]');
    lay.edges['A-C'].points = [{ x: 0, y: (lay.nodes.A.y + lay.nodes.C.y) / 2 }, { x: 900, y: (lay.nodes.A.y + lay.nodes.C.y) / 2 }];
    const p4 = score(model, lay, builtIn).checks.find((c) => c.id === 'P4');
    assert.equal(p4?.ok, false);
    assert.match(p4?.detail ?? '', /^\d+ crossings; 4 links allow 0, and the diagram forces 1 more$/);
  });

  it('P6 when a label needs too many lines, or holds a word too long for any box', () => {
    const many = check(`flowchart TD\nA[${'several words that go on '.repeat(6)}] --> B`).result.checks.find((c) => c.id === 'P6');
    assert.match(many?.detail ?? '', /needs \d+ lines; shorten it/);
    const long = check('flowchart TD\nA[Pneumonoultramicroscopicsilicovolcanoconiosis] --> B').result.checks.find((c) => c.id === 'P6');
    assert.match(long?.detail ?? '', /word too long/);
  });

  it('P7 when a label sits on a box or on another label', () => {
    const { model, lay } = check(orders);
    const yes = lay.edges['C-D'].label, no = lay.edges['C-E'].label;
    assert.ok(yes && no);
    Object.assign(yes, { x: lay.nodes.D.x, y: lay.nodes.D.y });
    Object.assign(no, { x: lay.nodes.D.x, y: lay.nodes.D.y });
    const p7 = score(model, lay, builtIn).checks.find((c) => c.id === 'P7');
    assert.match(p7?.detail ?? '', /sits on "Manager approval".*overlap/);
  });

  it('P7 when a label runs off the picture', () => {
    const { model, lay } = check(orders);
    const yes = lay.edges['C-D'].label;
    assert.ok(yes);
    yes.x = 2;
    const p7 = score(model, lay, builtIn).checks.find((c) => c.id === 'P7');
    assert.match(p7?.detail ?? '', /the label "Yes" runs off the picture/);
  });

  it("P8 when a line runs through a group's name that is on no plate, and not when it is on one", () => {
    const { model, lay } = check('flowchart TB\nA[Order] --> B[Pick]\nsubgraph wh [Hub]\n  B --> C[Pack]\n  B --> D[Label]\nend\nC --> E[Ship]');
    assert.equal(score(model, lay, builtIn).checks.find((c) => c.id === 'P8')?.ok, true);
    const name = lay.groups[0].name, into = lay.edges['A-B'].points;
    Object.assign(name, { x: into[0].x, y: (into[0].y + into[into.length - 1].y) / 2 });
    const p8 = score(model, lay, builtIn).checks.find((c) => c.id === 'P8');
    assert.match(p8?.detail ?? '', /a line runs through the name of the group "Hub"/);
    name.plate = true;
    assert.equal(score(model, lay, builtIn).checks.find((c) => c.id === 'P8')?.ok, true);
  });

  it('D1 when words cannot be read, in the mode where they cannot', () => {
    const faint = designFrom({ name: 'faint', light: { text: '#c9cdd3' }, dark: { edge: '#0d2a30' } });
    const d1 = check(orders, faint).result.checks.find((c) => c.id === 'D1');
    assert.equal(d1?.ok, false);
    assert.match(d1?.detail ?? '', /light: text on a step box is 1\.\d to 1, and needs 4\.5/);
    assert.match(d1?.detail ?? '', /dark: a line on the page/);
  });

  it('D2 when two kinds of box are the same colour to everyone', () => {
    const same = designFrom({ light: { kinds: { rework: '#2c7d4f' } } });
    const d2 = check(orders, same).result.checks.find((c) => c.id === 'D2');
    assert.equal(d2?.ok, false);
    assert.match(d2?.detail ?? '', /^light: terminal and rework boxes look alike \(0 apart, and need 12\)$/);
  });

  it('D2 when two kinds differ only to people who see red and green apart', () => {
    // A red and a green of the same lightness: plain to most, one colour to about one man in twelve.
    const redGreen = designFrom({ light: { kinds: { terminal: '#3a8f3a', rework: '#c05a3a' } } });
    assert.ok(apart('#3a8f3a', '#c05a3a') > 40);
    const d2 = check(orders, redGreen).result.checks.find((c) => c.id === 'D2');
    assert.match(d2?.detail ?? '', /terminal and rework boxes look alike to someone who does not see red and green apart \(\d+ apart, and need 12\)/);
  });

  it('D2 only for the kinds a diagram uses, and only those the design gives a colour', () => {
    const same = designFrom({ light: { kinds: { external: '#0a84c4' } } }); // the same as data, and neither is in the diagram
    assert.equal(check(orders, same).result.checks.find((c) => c.id === 'D2')?.ok, true);
    const own = check('flowchart TD\nA[One]:::vendor --> B[Two]:::partner').result.checks.find((c) => c.id === 'D2');
    assert.equal(own?.ok, true);
  });
});

describe('design: the sums', () => {
  it('mixes and measures colours', () => {
    assert.equal(mix('#000000', '#ffffff', 0.5), '#808080');
    assert.equal(Math.round(contrast('#000000', '#ffffff')), 21);
    assert.equal(contrast('#777777', '#777777'), 1);
    assert.equal(kindFill(builtIn.light, 'step'), builtIn.light.node);
    assert.notEqual(kindFill(builtIn.light, 'rework'), builtIn.light.node);
  });

  it('says how far apart two colours look: nothing for the same, about 100 for black and white', () => {
    assert.equal(apart('#336699', '#336699'), 0);
    assert.equal(Math.round(apart('#000000', '#ffffff')), 100);
  });

  it('leaves a grey the same grey for every kind of sight', () => {
    for (const [name, rows] of Object.entries(sights)) {
      for (const row of rows) assert.ok(Math.abs(row[0] + row[1] + row[2] - 1) < 1e-5, name);
      assert.ok(apart('#808080', '#808080', /** @type {keyof typeof sights} */ (name)) === 0);
    }
    assert.ok(Math.abs(apart('#404040', '#c0c0c0', 'protan') - apart('#404040', '#c0c0c0')) < 0.01);
  });

  it('brings a red and a green close together for red-green colour blindness, and leaves blue and yellow apart', () => {
    assert.ok(apart('#3a8f3a', '#c05a3a', 'deutan') < apart('#3a8f3a', '#c05a3a') / 3);
    assert.ok(apart('#1d5fbf', '#c9a400', 'deutan') > 60);
    assert.ok(apart('#1d5fbf', '#c9a400', 'protan') > 60);
  });
});

describe('design: the built-in look', () => {
  it('has a light and a dark, with the same kinds in each', () => {
    assert.equal(builtIn.name, 'merlive');
    assert.deepEqual(Object.keys(builtIn.dark?.kinds ?? {}), Object.keys(builtIn.light.kinds));
    assert.equal(designFrom(), builtIn);
  });

  it('keeps every two of its kinds further apart than the limit, for every kind of sight, with room', () => {
    for (const p of [builtIn.light, /** @type {import('../skills/merlive/scripts/design.mjs').Palette} */ (builtIn.dark)]) {
      const colours = Object.values(p.kinds);
      for (const sight of /** @type {(keyof typeof sights)[]} */ (Object.keys(sights))) {
        colours.forEach((a, i) => colours.slice(i + 1).forEach((b) => assert.ok(apart(a, b, sight) >= 17, `${a} and ${b}, ${sight}`)));
      }
    }
  });
});

describe('design: a project\'s own file', () => {
  it('is laid over the built-in look, kinds and all, and is called "your" design unless it has a name', () => {
    const d = designFrom({ radius: 4, light: { accent: '#112233', kinds: { vendor: '#445566' } } });
    assert.equal(d.name, 'your');
    assert.equal(d.radius, 4);
    assert.equal(d.font, builtIn.font);
    assert.equal(d.light.accent, '#112233');
    assert.equal(d.light.kinds.vendor, '#445566');
    assert.equal(d.light.kinds.rework, builtIn.light.kinds.rework);
    assert.equal(designFrom({ name: 'storm' }).name, 'storm');
  });

  it('keeps the built-in dark only when it leaves the light colours alone', () => {
    assert.ok(designFrom({ radius: 2 }).dark);
    assert.equal(designFrom({ light: { bg: '#ffffff' } }).dark, undefined);
    assert.equal(designFrom({ light: { bg: '#ffffff' }, dark: { bg: '#000000' } }).dark?.bg, '#000000');
    assert.equal(designFrom({ dark: { bg: '#000000' } }).light.bg, builtIn.light.bg);
  });

  it('takes a colour for a kind with a hyphen in its name, as a class may have, and still refuses what is not a name', () => {
    assert.equal(designFrom({ light: { kinds: { 'read-only': '#445566' } } }).light.kinds['read-only'], '#445566');
    assert.throws(() => designFrom({ light: { kinds: { 'x}body{': '#445566' } } }), /light\.kinds has "x}body\{"; a kind is named in letters, digits, _ and a hyphen between them only/);
    assert.throws(() => designFrom({ light: { kinds: { '-x': '#445566' } } }), /a kind is named in letters/);
  });

  it('refuses a colour that is not one, a motion that is not one, and a file that is not an object, each with what to do', () => {
    assert.throws(() => designFrom({ light: { bg: 'blue' } }), /light\.bg must be a colour like #1f5fd1, not "blue"/);
    assert.throws(() => designFrom({ light: { kinds: { risk: '#fff' } } }), /light\.kinds\.risk must be a colour/);
    assert.throws(() => designFrom({ motion: 'wild' }), /motion must be none, calm or lively/);
    assert.throws(() => designFrom([]), /A design file holds one JSON object/);
  });
});
