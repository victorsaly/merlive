import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout } from '../skills/merlive/scripts/layout.mjs';
import { contrast, designFrom, kindFill, mix, presets } from '../skills/merlive/scripts/design.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';

const check = (/** @type {string} */ src, design = presets.quiet) => {
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
  it('passes every rule for the example, in each design that comes with it', () => {
    for (const design of Object.values(presets)) {
      const { result } = check(orders, design);
      assert.deepEqual(failed(result), [], design.name);
      assert.equal(result.pass, true);
    }
  });

  it('has a check for each rule in docs/PLACEMENT.md', () => {
    assert.deepEqual(check(orders).result.checks.map((c) => c.id), ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'D1']);
  });
});

describe('score: a broken rule is named, with where', () => {
  it('P1 when a box of the main path is off the line', () => {
    const { model, lay } = check(orders);
    lay.nodes.C.x += 40;
    const p1 = score(model, lay, presets.quiet).checks[0];
    assert.equal(p1.ok, false);
    assert.match(p1.detail, /"Within budget\?" is off the line/);
  });

  it('P2 when two boxes are too close', () => {
    const { model, lay } = check(orders);
    lay.nodes.E.y = lay.nodes.G.y;
    lay.nodes.E.x = lay.nodes.G.x + lay.box.w + 4;
    assert.ok(failed(score(model, lay, presets.quiet)).includes('P2'));
  });

  it('P3 when a line passes through a box', () => {
    const { model, lay } = check(orders);
    lay.edges['E-B'].points = [{ x: lay.nodes.A.x, y: lay.nodes.H.y }, { x: lay.nodes.A.x, y: lay.nodes.A.y }];
    const p3 = score(model, lay, presets.quiet).checks.find((c) => c.id === 'P3');
    assert.match(p3?.detail ?? '', /the link E to B passes through "Manager approval"/);
  });

  it('P4 when lines cross more than the links allow, and P5 when two share a path', () => {
    const { model, lay } = check(orders);
    const between = (lay.nodes.D.y + lay.nodes.F.y) / 2; // a row with no boxes, only the lines that pass it
    lay.edges['C-E'].points = [{ x: 0, y: between }, { x: 600, y: between }];
    lay.edges['F-E'].points = lay.edges['G-H'].points.map((p) => ({ ...p }));
    const out = failed(score(model, lay, presets.quiet));
    assert.ok(out.includes('P4') && out.includes('P5'), out.join());
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
    const p7 = score(model, lay, presets.quiet).checks.find((c) => c.id === 'P7');
    assert.match(p7?.detail ?? '', /sits on "Manager approval".*overlap/);
  });

  it('D1 when words cannot be read, in the mode where they cannot', () => {
    const faint = designFrom('faint', { light: { text: '#c9cdd3' }, dark: { edge: '#1a1f27' } });
    const d1 = check(orders, faint).result.checks.find((c) => c.id === 'D1');
    assert.equal(d1?.ok, false);
    assert.match(d1?.detail ?? '', /light: text on a step box is 1\.\d to 1, and needs 4\.5/);
    assert.match(d1?.detail ?? '', /dark: a line on the page/);
  });
});

describe('design', () => {
  it('mixes and measures colours', () => {
    assert.equal(mix('#000000', '#ffffff', 0.5), '#808080');
    assert.equal(Math.round(contrast('#000000', '#ffffff')), 21);
    assert.equal(contrast('#777777', '#777777'), 1);
    assert.equal(kindFill(presets.quiet.light, 'step'), presets.quiet.light.node);
    assert.notEqual(kindFill(presets.quiet.light, 'rework'), presets.quiet.light.node);
  });

  it('lays a design file over the one it extends, kinds and all', () => {
    const d = designFrom('storm', { extends: 'soft', radius: 4, light: { accent: '#112233', kinds: { vendor: '#445566' } } });
    assert.equal(d.name, 'storm');
    assert.equal(d.radius, 4);
    assert.equal(d.font, presets.soft.font);
    assert.equal(d.light.accent, '#112233');
    assert.equal(d.light.kinds.vendor, '#445566');
    assert.equal(d.light.kinds.rework, presets.soft.light.kinds.rework);
    assert.equal(d.dark, undefined);
  });

  it('keeps the dark look of the design it extends only when the light one is left alone', () => {
    assert.ok(designFrom('a', { radius: 2 }).dark);
    assert.equal(designFrom('b', { light: { bg: '#ffffff' } }).dark, undefined);
    assert.equal(designFrom('c', { light: { bg: '#ffffff' }, dark: { bg: '#000000' } }).dark?.bg, '#000000');
  });

  it('refuses a colour that is not one, a motion that is not one, and a preset that is not there, each with what to do', () => {
    assert.throws(() => designFrom('x', { light: { bg: 'blue' } }), /light\.bg must be a colour like #1f5fd1, not "blue"/);
    assert.throws(() => designFrom('x', { light: { kinds: { risk: '#fff' } } }), /light\.kinds\.risk must be a colour/);
    assert.throws(() => designFrom('x', { motion: 'wild' }), /motion must be none, calm or lively/);
    assert.throws(() => designFrom('loud'), /No design called "loud"\. Use one of: quiet, bold, soft/);
  });
});
