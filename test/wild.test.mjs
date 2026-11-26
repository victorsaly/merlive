// Real documents: what docs/WILD.md says is what the code does today, and nothing that was drawn stops being.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { made, wild } from '../scripts/wild.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('wild: real Mermaid, held to', () => {
  const { rows, markdown, page } = wild();

  it('has every sample it lists, each with where it was written', () => {
    assert.ok(rows.length >= 12);
    for (const r of rows) {
      assert.ok(existsSync(join(root, 'wild', r.sample.file)), r.sample.file);
      assert.match(r.sample.repo, /^[\w-]+\/[\w-]+$/);
      assert.ok(r.sample.path && r.sample.commit && r.sample.block > 0, r.sample.file);
    }
  });

  it('says in docs/WILD.md what the code does today (npm run wild)', () => {
    assert.equal(readFileSync(join(root, 'docs/WILD.md'), 'utf8'), markdown);
  });

  it('says the same on the page to look at, wild/compare.html, and has every picture the page shows', () => {
    assert.equal(readFileSync(join(root, 'wild/compare.html'), 'utf8'), page);
    for (const src of page.matchAll(/<img src="([^"]+)"/g)) assert.ok(existsSync(join(root, 'wild', src[1])), src[1]);
  });

  it("keeps Victor's word on each sample: not looked at yet, fine, or worse with a note saying what", () => {
    for (const r of rows) {
      assert.match(r.sample.verdict, /^(|fine|worse)$/, r.sample.file);
      if (r.sample.verdict === 'worse') assert.ok(r.sample.note, `${r.sample.file}: say what is worse`);
    }
  });

  it('keeps the pictures in wild/drawn the ones the code draws today', () => {
    for (const r of rows) if (r.svg) assert.equal(readFileSync(join(root, 'wild/drawn', r.sample.file.replace(/\.mmd$/, '.svg')), 'utf8'), r.svg, `${r.sample.file}: run npm run wild`);
  });

  it('never crashes on what a person wrote, whatever it makes of it', () => {
    for (const r of rows) assert.match(r.result, /^(Drawn|Drawn, with notes|Refused|Left as Mermaid)$/);
    assert.equal(made('pie title Pets\n  "Dogs" : 3', 'x').result, 'Left as Mermaid');
    assert.equal(made('flowchart TD\n  A --> B', 'x').result, 'Drawn');
    assert.equal(made('sequenceDiagram\n  A->>B: Order', 'x').result, 'Drawn');
  });
});

describe('changed: a picture changed is a picture seen', async () => {
  const { changedPage, kept } = await import('../scripts/changed.mjs');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';

  it('shows each picture as it was beside as it is, and says so of one that is new or gone', () => {
    const page = changedPage([{ path: 'wild/drawn/a.svg', before: svg, after: svg }, { path: 'corpus/drawn/new.svg', before: '', after: svg }, { path: 'examples/gone.svg', before: svg, after: '' }], 'origin/main');
    assert.match(page, /3 pictures changed since origin\/main/);
    assert.equal((page.match(/<img src="data:image\/svg\+xml;base64,/g) ?? []).length, 4);
    assert.match(page, /this one is new/);
    assert.match(page, /No longer drawn/);
    assert.match(changedPage([], 'main'), /0 pictures changed since main[\s\S]*Nothing is drawn differently/);
  });

  it('looks where pictures are kept, real documents first', () => {
    assert.deepEqual(kept, ['wild/drawn', 'corpus/drawn', 'examples']);
    for (const dir of kept) assert.ok(existsSync(join(root, dir)), dir);
  });
});
