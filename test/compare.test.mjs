// Why: the comparison page puts Mermaid's own drawing beside Merlive's, sample by sample. Half of it changes
// whenever the code does, so the page is held to what the code draws today. None of this needs Mermaid's
// command: its pictures are kept in corpus/mermaid, and only `npm run compare` draws them again.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromeAt, comparePage, compared, firstLineOf, pngSizeOf, show, sizeOf } from '../scripts/compare.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const index = JSON.parse(readFileSync(join(root, 'corpus/index.json'), 'utf8'));
const samples = [...index.flowchart, ...index.state, ...index.kinds].map((s) => s.file);
const again = 'Run "npm run coverage" and commit what it writes.';

/** A row as coverage gives it, and what Mermaid made of the same sample. */
const row = (/** @type {Record<string,unknown>} */ over = {}) => ({ sample: { file: 'flowchart/one.mmd', covers: 'A box', boxes: 1, links: 0 }, result: 'drawn', why: [], svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="100"></svg>', ...over });
const page = (/** @type {Record<string,unknown>} */ r = {}, /** @type {Record<string,unknown>} */ m = { ok: true, width: 300, height: 120 }, source = 'flowchart TD\n  A[One]') => {
  const one = row(r);
  return comparePage({ rows: [/** @type {any} */ (one)], pictures: one.svg && one.result !== 'refused' ? { 'corpus/drawn/one.svg': String(one.svg) } : {}, mermaid: { by: 'mermaid-cli 11.0.0', samples: { 'flowchart/one.mmd': /** @type {any} */ (m) } }, sources: { 'flowchart/one.mmd': source } });
};

test('corpus/compare.html says what the code draws today', () => {
  assert.equal(readFileSync(join(root, 'corpus/compare.html'), 'utf8'), compared().page, again);
});

test('every picture the page shows is there', () => {
  const shown = [...compared().page.matchAll(/<img[^>]* src="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(shown.length > samples.length, `${shown.length} pictures`);
  for (const src of shown) assert.ok(existsSync(join(root, 'corpus', src)), src);
});

test("Mermaid's side says of every sample whether it drew it, and no two samples share a picture", () => {
  const mermaid = JSON.parse(readFileSync(join(root, 'corpus/mermaid/index.json'), 'utf8'));
  assert.deepEqual(Object.keys(mermaid.samples).sort(), [...samples].sort(), 'Run "npm run compare" and commit what it writes.');
  assert.equal(new Set(samples.map((f) => basename(f, '.mmd'))).size, samples.length);
  for (const [file, m] of Object.entries(mermaid.samples)) {
    if (m.ok) assert.ok(existsSync(join(root, 'corpus/mermaid', `${basename(file, '.mmd')}.png`)) && m.width > 0 && m.height > 0, file);
    else assert.ok(m.error, file);
  }
});

test('a sample both draw is shown twice, each picture at its own size', () => {
  const html = page();
  assert.match(html, /<img[^>]* src="mermaid\/one\.png"[^>]* width="300" height="120"/);
  assert.match(html, /<img[^>]* src="drawn\/one\.svg"[^>]* width="200" height="100"/);
  assert.match(html, /data-result="drawn"/);
  assert.ok(!html.includes('http://') || !/(src|href)="https?:/.test(html), 'nothing is fetched');
});

test('what Merlive left, refused or only partly read is said in its pane', () => {
  assert.match(page({ result: 'left', why: ['a pie is not drawn yet'], svg: '' }), /Not drawn: a pie is not drawn yet/);
  assert.match(page({ result: 'refused', why: ['P5 No two lines share a path: A-D and B-C run along each other'] }), /Not drawn: P5 No two lines share a path/);
  const partly = page({ result: 'partly', why: ['read 1 of 2 boxes'] });
  assert.match(partly, /Partly read/);
  assert.match(partly, /read 1 of 2 boxes/);
  assert.match(partly, /src="drawn\/one\.svg"/, 'what it did draw is still shown');
});

test('what Mermaid could not draw is said, with its own words for why', () => {
  const html = page({}, { ok: false, error: 'UnknownDiagramError: No diagram type detected' });
  assert.match(html, /Mermaid could not draw this: UnknownDiagramError: No diagram type detected/);
  assert.ok(!html.includes('src="mermaid/one.png"'));
});

test('a sample Mermaid has not been run on says how to run it', () => {
  const one = row();
  const html = comparePage({ rows: [/** @type {any} */ (one)], pictures: {}, mermaid: { by: '', samples: {} }, sources: {} });
  assert.match(html, /npm run compare/);
});

test('words from a sample cannot become markup', () => {
  const html = page({ sample: { file: 'flowchart/one.mmd', covers: 'A <b>box</b> & "more"', boxes: 1, links: 0 }, why: [], result: 'less', svg: row().svg }, { ok: false, error: '<script>alert(1)</script>' }, 'flowchart TD\n  A["</pre><script>x</script>"]');
  assert.ok(!html.includes('<script>alert') && !html.includes('<script>x') && !html.includes('<b>box'));
  assert.match(html, /A &lt;b&gt;box&lt;\/b&gt; &amp; &quot;more&quot;/);
});

test('the counts at the top are the counts of the cards', () => {
  const { page: html, rows } = compared();
  assert.equal([...html.matchAll(/<article /g)].length, rows.length);
  for (const result of ['drawn', 'less', 'partly', 'refused', 'left']) {
    const n = rows.filter((r) => r.result === result).length;
    assert.equal([...html.matchAll(new RegExp(`<article [^>]*data-result="${result}"`, 'g'))].length, n);
    assert.match(html, new RegExp(`data-show="${result}"[^>]*>[^<]*<b>${n}</b>`));
  }
});

test('the size of a picture is read from the picture', () => {
  assert.deepEqual(sizeOf('<svg id="my-svg" width="100%" style="max-width: 354.852px;" viewBox="0 0 354.8515625 81.5999984741211">'), { width: 355, height: 82 });
  assert.deepEqual(sizeOf('<svg viewBox="90 -310 630 93">'), { width: 630, height: 93 });
  assert.deepEqual(sizeOf('<svg viewBox="0 0 376 192" width="376" height="192">'), { width: 376, height: 192 });
  assert.equal(sizeOf('<p>not a picture</p>'), null);
});

test("the size of Mermaid's picture is read from the picture, and halved: it is kept at twice its size to stay sharp", () => {
  const png = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png);
  png.writeUInt32BE(600, 16);
  png.writeUInt32BE(241, 20);
  assert.deepEqual(pngSizeOf(png), { width: 600 / show.sharp, height: Math.round(241 / show.sharp) });
  assert.equal(pngSizeOf(Buffer.from('not a picture at all, only words')), null);
});

test("Mermaid's error is cut to its first line, without the sample it was given", () => {
  assert.equal(firstLineOf('\nUnknownDiagramError: No diagram type detected matching given configuration for text: agentflow-beta TB\n  flow buyer\n    at x (y)'), 'UnknownDiagramError: No diagram type detected matching given configuration');
  assert.equal(firstLineOf('Error: Parse error on line 2:\n...'), 'Error: Parse error on line 2:');
  assert.equal(firstLineOf(''), 'no reason given');
});

test('Chrome is looked for where it is told to, then where it usually is', () => {
  assert.equal(chromeAt({ PUPPETEER_EXECUTABLE_PATH: '/x/chrome' }, () => true), '/x/chrome');
  assert.equal(chromeAt({}, (p) => p === '/usr/bin/chromium'), '/usr/bin/chromium');
  assert.equal(chromeAt({}, () => false), '');
});
