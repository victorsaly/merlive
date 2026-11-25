// Why: docs/COVERAGE.md is a claim about what Merlive draws of Mermaid. A claim nobody checks goes stale the
// day the parser changes, so the page and the pictures are held to what the code does now.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { coverage, judge, lists, samplesOf, samplesOnDisk } from '../scripts/coverage.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const index = JSON.parse(readFileSync(join(root, 'corpus/index.json'), 'utf8'));
const again = 'Run "npm run coverage" and commit what it writes.';

test('every sample is listed, and every sample listed is there', () => {
  const listed = samplesOf(index).map((s) => s.file).sort();
  assert.deepEqual(listed, samplesOnDisk());
});

test('every flowchart sample says what it should be read as, and every other kind its family', () => {
  for (const s of lists.filter((l) => l !== 'kinds' && l !== 'sequence').flatMap((l) => index[l] ?? [])) assert.ok(s.covers && Number.isInteger(s.boxes) && Number.isInteger(s.links), s.file);
  for (const s of index.kinds) assert.ok(s.covers && s.family, s.file);
  for (const s of index.sequence) assert.ok(s.covers && Number.isInteger(s.participants) && Number.isInteger(s.messages), s.file);
});

test('docs/COVERAGE.md says what the code does today', () => {
  assert.equal(readFileSync(join(root, 'docs/COVERAGE.md'), 'utf8'), coverage().markdown, again);
});

test('the pictures in corpus/drawn are the ones the code draws today', () => {
  const { pictures } = coverage();
  const kept = readdirSync(join(root, 'corpus/drawn')).map((f) => `corpus/drawn/${f}`).sort();
  assert.deepEqual(kept, Object.keys(pictures).sort(), again);
  for (const [path, svg] of Object.entries(pictures)) assert.equal(readFileSync(join(root, path), 'utf8'), svg, `${path}: ${again}`);
});

test('every picture is well formed: each attribute has a value, so it opens on its own and inside a page', () => {
  for (const [path, svg] of Object.entries(coverage().pictures)) {
    for (const tag of svg.match(/<[a-zA-Z][^>]*>/g) ?? []) assert.match(tag, /^<[\w:-]+(\s+[\w:-]+="[^"]*")*\s*\/?>$/, `${path}: ${tag.slice(0, 80)}`);
  }
});

test('every link on the page leads somewhere', () => {
  for (const [, to] of coverage().markdown.matchAll(/\]\((\.\.\/[^)]+)\)/g)) assert.ok(existsSync(join(root, 'docs', to)), to);
});

test('nothing in the corpus is drawn with a rule broken', () => {
  assert.deepEqual(coverage().rows.filter((r) => r.result === 'refused').map((r) => r.sample.file), []);
});

test('a sample read whole is drawn', () => {
  const row = judge({ file: 'x.mmd', covers: 'x', boxes: 2, links: 1, has: ['Order'] }, 'flowchart LR\n  A[Order] --> B[Pick]\n');
  assert.equal(row.result, 'drawn');
  assert.match(row.svg, /^<svg/);
});

test('a sample drawn with something known to be missing says what', () => {
  const row = judge({ file: 'x.mmd', covers: 'x', boxes: 2, links: 1, loses: 'The style is read past' }, 'flowchart LR\n  A[Order] --> B[Pick]\n');
  assert.equal(row.result, 'less');
  assert.deepEqual(row.why, ['The style is read past']);
});

test('a box, a word or a line that is not read makes a sample partly read', () => {
  const source = 'flowchart LR\n  A[Order] --> B[Pick]\n  B ~~~ C[Pack]\n';
  assert.equal(judge({ file: 'x.mmd', covers: 'x', boxes: 3, links: 2 }, source).result, 'partly');
  const row = judge({ file: 'x.mmd', covers: 'x', boxes: 2, links: 1, has: ['Ship'] }, 'flowchart LR\n  A[Order] --> B[Pick]\n');
  assert.equal(row.result, 'partly');
  assert.deepEqual(row.why, ['"Ship" is not among its words']);
});

test('a flowchart that is not taken for one is partly read, not filed with the other kinds', () => {
  const row = judge({ file: 'x.mmd', covers: 'x', boxes: 1, links: 0 }, 'gantt\n  title Rolling out\n');
  assert.equal(row.result, 'partly');
});

test('a sequence diagram is drawn, and held to its participants, its messages and their ends', () => {
  const source = 'sequenceDiagram\n  Buyer->>ERP: Raise order\n  ERP--xBuyer: No\n';
  const row = judge({ file: 'x.mmd', covers: 'x', participants: 2, messages: 2, ends: [['solid', 'none', 'arrow'], ['dotted', 'none', 'cross']], has: ['Raise order'] }, source);
  assert.equal(row.result, 'drawn');
  assert.match(row.svg, /^<svg/);
  assert.deepEqual(judge({ file: 'x.mmd', covers: 'x', participants: 3, messages: 2, ends: [['solid', 'none', 'arrow'], ['solid', 'none', 'cross']] }, source).why, ['read 2 of 3 participants', 'what is at the ends of its messages is not kept']);
  assert.equal(judge({ file: 'x.mmd', covers: 'x', participants: 2, messages: 2 }, `${source}  ERP-|\\Buyer: half\n`).result, 'partly');
});

test('another kind of diagram is left as Mermaid and named', () => {
  const row = judge({ file: 'x.mmd', covers: 'x', family: 'chart' }, 'pie title Orders\n  "UK" : 46\n');
  assert.equal(row.result, 'left');
  assert.match(row.why[0], /pie/);
});
