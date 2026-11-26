// Real documents: what docs/WILD.md says is what the code does today, and nothing that was drawn stops being.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { made, wild } from '../scripts/wild.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('wild: real Mermaid, held to', () => {
  const { rows, markdown } = wild();

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
