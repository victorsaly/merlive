#!/usr/bin/env node
// Why: "is this better than what Mermaid draws?" is answered by looking, not by counting. This draws every
// sample in the corpus with Mermaid's own command and puts each picture beside Merlive's, on one page that reads
// on a phone. A development script: the skill does not need it, and neither do the tests, which only hold the
// page to the pictures already kept.

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { coverage } from './coverage.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// What the page and the run are held to, named once.
export const show = {
  leastScale: 0.6, // the smallest a picture is shown before its pane scrolls sideways instead: below this a 13px label cannot be read
  sideBySide: 900, // px of page at which the two pictures sit beside each other: two of the narrowest three-lane flows, and their panes
  sharp: 2, // how many times its size Mermaid's picture is kept at, so it stays sharp on a phone's screen
  jobs: 4, // charts drawn at once: each starts a browser, and four keep a laptop usable
  errorLength: 200, // characters of Mermaid's error that are kept: its first line says what, the rest is a stack
};

// Where Chrome usually is, for Mermaid's command to draw with. Nothing is asked: the first that is there is used.
const usual = [
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

/**
 * @typedef {{ok:true,width:number,height:number}|{ok:false,error:string}} Drawn what Mermaid made of one sample
 * @typedef {{by:string,samples:Record<string,Drawn>}} Mermaid
 * @typedef {ReturnType<typeof coverage>['rows'][number]} Row
 */

const words = { drawn: 'Drawn', less: 'Drawn, less something', partly: 'Partly read', refused: 'Refused', left: 'Left as Mermaid' };
const esc = (/** @type {unknown} */ s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nameOf = (/** @type {string} */ file) => basename(file, '.mmd');

/** Where Chrome is: where the reader said, else the first of the usual places that is there, else nowhere. */
export function chromeAt(/** @type {Record<string,string|undefined>} */ env = process.env, exists = existsSync) {
  return [env.PUPPETEER_EXECUTABLE_PATH, env.CHROME_PATH, ...usual].find((p) => p && exists(p)) ?? '';
}

/** A picture's size in px: what it says it is, else the size of its view. Mermaid gives its width as 100%. */
export function sizeOf(/** @type {string} */ svg) {
  const tag = /<svg\b[^>]*>/.exec(svg)?.[0];
  if (!tag) return null;
  const said = [/\bwidth="([\d.]+)"/.exec(tag)?.[1], /\bheight="([\d.]+)"/.exec(tag)?.[1]];
  const view = /\bviewBox="[-\d.]+[ ,]+[-\d.]+[ ,]+([\d.]+)[ ,]+([\d.]+)"/.exec(tag);
  const [w, h] = said[0] && said[1] ? said : [view?.[1], view?.[2]];
  return w && h ? { width: Math.round(Number(w)), height: Math.round(Number(h)) } : null;
}

/** The size, in px on the page, of a picture Mermaid drew: a PNG says its own in its first bytes. */
export function pngSizeOf(/** @type {Buffer} */ png) {
  if (png.length < 24 || png.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: Math.round(png.readUInt32BE(16) / show.sharp), height: Math.round(png.readUInt32BE(20) / show.sharp) };
}

/** The first line of what Mermaid's command said went wrong. It quotes the whole sample after it; that is cut. */
export function firstLineOf(/** @type {string} */ stderr) {
  const line = stderr.split('\n').map((l) => l.trim()).find(Boolean) ?? '';
  return line.split(' for text:')[0].slice(0, show.errorLength) || 'no reason given';
}

/**
 * The page: every sample once, Mermaid's drawing and Merlive's. Pure: what was drawn in, a string out.
 * @param {{rows:Row[],pictures:Record<string,string>,mermaid:Mermaid,sources:Record<string,string>}} all
 * @returns {string}
 */
export function comparePage({ rows, pictures, mermaid, sources }) {
  const tally = (/** @type {Row['result']} */ r) => rows.filter((x) => x.result === r).length;
  const ran = Object.values(mermaid.samples), failed = ran.filter((m) => !m.ok).length;
  const img = (/** @type {string} */ src, /** @type {{width:number,height:number}} */ size, /** @type {string} */ alt) =>
    `<img loading="lazy" src="${esc(src)}" width="${size.width}" height="${size.height}" style="--w:${size.width}" alt="${esc(alt)}">`;

  const card = (/** @type {Row} */ r) => {
    const { file, covers } = r.sample, name = nameOf(file), m = mermaid.samples[file];
    const theirs = !m ? '<p class="none">Not drawn yet. Run <code>npm run compare</code>.</p>'
      : m.ok ? `<div class="pane mermaid">${img(`mermaid/${name}.png`, m, `${covers}, as Mermaid draws it`)}</div>`
        : `<p class="none">Mermaid could not draw this: ${esc(m.error)}</p>`;
    const mine = pictures[`corpus/drawn/${name}.svg`];
    const size = mine ? sizeOf(mine) : null;
    // A sample only partly read is still shown: the picture is what a reader would get today.
    const ours = mine && size ? `<div class="pane">${img(`drawn/${name}.svg`, size, `${covers}, as Merlive draws it`)}</div>` : `<p class="none">Not drawn: ${esc(r.why.join('; ') || words[r.result].toLowerCase())}</p>`;
    const missing = r.why.length && mine ? ` <span class="why">${esc(r.why.join('; '))}</span>` : '';
    return `<article class="card" data-result="${r.result}">
<h3>${esc(covers)}</h3>
<p class="result"><b>${words[r.result]}</b>${missing}</p>
<div class="pair"><figure><figcaption>Mermaid</figcaption>${theirs}</figure><figure><figcaption>Merlive</figcaption>${ours}</figure></div>
<details><summary>Source</summary><pre>${esc(sources[file] ?? '')}</pre></details>
</article>`;
  };

  const flow = rows.filter((r) => r.sample.file.startsWith('flowchart/')), kinds = rows.filter((r) => !r.sample.file.startsWith('flowchart/'));
  const families = [...new Set(kinds.map((r) => r.sample.family ?? ''))];
  const button = (/** @type {string} */ id, /** @type {string} */ text, /** @type {number} */ n) => `<button type="button" data-show="${id}" aria-pressed="${id === 'all'}">${text} <b>${n}</b></button>`;
  // With one result picked, the other cards go, and so does a heading left with none under it.
  const hide = Object.keys(words).flatMap((r) => [`body[data-show="${r}"] article:not([data-result="${r}"])`, `body[data-show="${r}"] section:not(:has(article[data-result="${r}"]))`]).join(',');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mermaid and Merlive, side by side</title>
<style>
:root{color-scheme:light dark}
body{margin:0;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;background:Canvas;color:CanvasText}
main{max-width:1280px;margin:0 auto;padding:16px}
h1{font-size:22px;margin:8px 0}h2{font-size:18px;margin:32px 0 12px}h3{font-size:15px;margin:0}
.lede,.why,figcaption,summary{color:color-mix(in srgb,CanvasText 68%,Canvas)}
.filters{display:flex;flex-wrap:wrap;gap:6px;margin:16px 0;position:sticky;top:0;background:Canvas;padding:8px 0;z-index:1}
button{font:inherit;font-size:13px;padding:4px 10px;border-radius:999px;border:1px solid color-mix(in srgb,CanvasText 30%,Canvas);background:Canvas;color:CanvasText;cursor:pointer}
button[aria-pressed="true"]{background:CanvasText;color:Canvas}
.card{border:1px solid color-mix(in srgb,CanvasText 18%,Canvas);border-radius:10px;padding:14px;margin:0 0 16px}
.result{margin:2px 0 10px;font-size:13px}
.pair{display:grid;gap:12px}
@media(min-width:${show.sideBySide}px){.pair{grid-template-columns:1fr 1fr}}
figure{margin:0;min-width:0}figcaption{font-size:12px;margin-bottom:4px}
.pane{overflow-x:auto;border-radius:8px;padding:10px;border:1px solid color-mix(in srgb,CanvasText 12%,Canvas)}
.pane.mermaid{background:#fff}
.pane img{display:block;height:auto;max-width:none;width:clamp(calc(var(--w) * ${show.leastScale}px),100%,calc(var(--w) * 1px))}
.none{margin:0;padding:10px;border-radius:8px;border:1px dashed color-mix(in srgb,CanvasText 30%,Canvas);font-size:13px;overflow-wrap:anywhere}
details{margin-top:10px;font-size:13px}pre{overflow-x:auto;margin:8px 0 0;padding:10px;border-radius:8px;background:color-mix(in srgb,CanvasText 6%,Canvas);font:12px/1.5 ui-monospace,Menlo,Consolas,monospace}
${hide}{display:none}
</style>
</head>
<body data-show="all">
<main>
<h1>Mermaid and Merlive, side by side</h1>
<p class="lede">Every sample in the corpus, drawn twice: by Mermaid's own command${mermaid.by ? ` (${esc(mermaid.by)})` : ''} and by Merlive. Of ${rows.length} samples, Merlive draws ${tally('drawn') + tally('less')} whole and ${tally('partly')} in part${ran.length ? `; Mermaid itself could not draw ${failed}` : ''}. <code>npm run coverage</code> draws Merlive's side again, <code>npm run compare</code> Mermaid's.</p>
<div class="filters">${button('all', 'All', rows.length)}${/** @type {Row['result'][]} */ (['drawn', 'less', 'partly', 'refused', 'left']).map((r) => button(r, words[r], tally(r))).join('')}</div>
<section><h2>Flowcharts, feature by feature</h2>
${flow.map(card).join('\n')}
</section>
${families.map((family) => `<section><h2>Other kinds: ${esc(family)}</h2>\n${kinds.filter((r) => (r.sample.family ?? '') === family).map(card).join('\n')}\n</section>`).join('\n')}
</main>
<script>
const show = (which) => {
  const pressed = document.querySelector('.filters button[data-show="' + which + '"]');
  if (!pressed) return;
  document.body.dataset.show = which;
  for (const b of document.querySelectorAll('.filters button')) b.setAttribute('aria-pressed', String(b === pressed));
};
document.querySelector('.filters').addEventListener('click', (e) => {
  const pressed = e.target.closest('button');
  if (!pressed) return;
  history.replaceState(null, '', '#' + pressed.dataset.show);
  show(pressed.dataset.show);
});
// A link can ask for one result: compare.html#partly opens on what is only partly read.
show(location.hash.slice(1));
</script>
</body>
</html>
`;
}

/**
 * The page as it stands today: Merlive's side from the code, Mermaid's from the pictures kept in corpus/mermaid.
 * @param {string} [corpus] the corpus folder
 */
export function compared(corpus = join(root, 'corpus')) {
  const { rows, pictures } = coverage(corpus);
  const kept = join(corpus, 'mermaid/index.json');
  /** @type {Mermaid} */
  const mermaid = existsSync(kept) ? JSON.parse(readFileSync(kept, 'utf8')) : { by: '', samples: {} };
  const sources = Object.fromEntries(rows.map((r) => [r.sample.file, readFileSync(join(corpus, r.sample.file), 'utf8')]));
  return { rows, page: comparePage({ rows, pictures, mermaid, sources }) };
}

const asCommand = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

// "--page" writes the page again from the pictures already kept, without Mermaid's command. `npm run coverage`
// ends with it, so Merlive's side of the page never falls behind the code.
if (asCommand && process.argv.includes('--page')) {
  writeFileSync(join(root, 'corpus/compare.html'), compared().page);
  console.log('wrote corpus/compare.html');
} else if (asCommand) {
  const stop = (/** @type {string} */ what) => {
    console.error(what);
    process.exit(2);
  };
  const version = spawnSync('mmdc', ['--version'], { encoding: 'utf8' });
  if (version.error || version.status !== 0) stop("Mermaid's own command is needed to draw its side: install it with \"npm install -g @mermaid-js/mermaid-cli\", then run this again.");

  const work = mkdtempSync(join(tmpdir(), 'merlive-compare-'));
  const chrome = chromeAt();
  // Mermaid is given no settings: the comparison is with what it draws as it comes. Its picture is kept as a PNG
  // because its labels are HTML inside the SVG, which an <img> on a phone does not always draw; and setting them
  // to SVG text instead lets a line show through its own words, which is not how Mermaid looks.
  // No sandbox: these are our own samples, and a container will not start Chrome with one.
  writeFileSync(join(work, 'browser.json'), JSON.stringify({ args: ['--no-sandbox', '--disable-gpu'], ...(chrome ? { executablePath: chrome } : {}) }));
  const draw = (/** @type {string} */ from, /** @type {string} */ to) => new Promise((/** @type {(r:{ok:boolean,said:string}) => void} */ done) => {
    const run = spawn('mmdc', ['-q', '-i', from, '-o', to, '-b', 'white', '-s', String(show.sharp), '-p', join(work, 'browser.json')]);
    let said = '';
    run.stderr.on('data', (d) => (said += d));
    run.on('error', (e) => done({ ok: false, said: String(e) }));
    run.on('close', (code) => done({ ok: code === 0 && existsSync(to), said }));
  });

  // One chart that cannot be wrong, first: if it is not drawn, it is the browser that is missing, not the samples.
  writeFileSync(join(work, 'try.mmd'), 'flowchart TD\n  A --> B\n');
  const tried = await draw(join(work, 'try.mmd'), join(work, 'try.png'));
  if (!tried.ok) stop(`Mermaid's command could not draw anything (${firstLineOf(tried.said)}). It draws with Chrome: install Chrome, or set PUPPETEER_EXECUTABLE_PATH to where it is, then run this again.`);

  const index = JSON.parse(readFileSync(join(root, 'corpus/index.json'), 'utf8'));
  /** @type {string[]} */
  const files = [...index.flowchart, ...index.kinds].map((s) => s.file);
  mkdirSync(join(root, 'corpus/mermaid'), { recursive: true });
  /** @type {Record<string, Drawn>} */
  const samples = {};
  const queue = [...files];
  await Promise.all(Array.from({ length: show.jobs }, async () => {
    for (let file = queue.shift(); file; file = queue.shift()) {
      const out = join(root, 'corpus/mermaid', `${nameOf(file)}.png`);
      // A picture from an earlier run must not stand in for a sample Mermaid no longer draws.
      rmSync(out, { force: true });
      const { ok, said } = await draw(join(root, 'corpus', file), out);
      const size = ok ? pngSizeOf(readFileSync(out)) : null;
      samples[file] = size ? { ok: true, ...size } : { ok: false, error: firstLineOf(said) };
    }
  }));
  /** @type {Mermaid} */
  const mermaid = { by: `mermaid-cli ${version.stdout.trim()}`, samples: Object.fromEntries(files.map((f) => [f, samples[f]])) };
  writeFileSync(join(root, 'corpus/mermaid/index.json'), `${JSON.stringify(mermaid, null, 2)}\n`);
  writeFileSync(join(root, 'corpus/compare.html'), compared().page);
  rmSync(work, { recursive: true, force: true });
  const failed = files.filter((f) => !samples[f].ok);
  console.log(`Mermaid drew ${files.length - failed.length} of ${files.length} samples into corpus/mermaid${failed.length ? `, and could not draw: ${failed.map(nameOf).join(', ')}` : ''}`);
  console.log('wrote corpus/compare.html');
}
