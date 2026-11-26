#!/usr/bin/env node
// Real Mermaid, held to: every block in wild/ is one a person wrote in a real document, not a sample written to
// show a feature. This draws each, says what the rules made of it, and writes docs/WILD.md and wild/drawn/.
// What is refused here is the list of what to mend next; what is drawn is to be looked at beside Mermaid's own.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout } from '../skills/merlive/scripts/layout.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';
import { picture } from '../skills/merlive/scripts/render.mjs';
import { builtIn } from '../skills/merlive/scripts/design.mjs';
import { isSequence, layoutSequence, parseSequence, scoreSequence } from '../skills/merlive/scripts/sequence.mjs';
import { sequencePicture } from '../skills/merlive/scripts/sequence-render.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * What Merlive makes of one block: drawn, drawn with notes, refused by a rule, or left as Mermaid.
 * @param {string} src
 * @param {string} title
 * @returns {{result:'Drawn'|'Drawn, with notes'|'Refused'|'Left as Mermaid',why:string[],svg:string,width:number}}
 */
export function made(src, title) {
  const told = (/** @type {{checks:{id:string,ok:boolean,detail:string}[]}} */ s, /** @type {string[]} */ notes, /** @type {string} */ svg, /** @type {number} */ width) => {
    const broken = s.checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`);
    return { result: /** @type {const} */ (broken.length ? 'Refused' : notes.length ? 'Drawn, with notes' : 'Drawn'), why: [...broken, ...notes], svg, width };
  };
  if (isSequence(src)) {
    const m = parseSequence(src), lay = layoutSequence(m);
    return told(scoreSequence(m, lay, builtIn), m.warnings, sequencePicture(m, lay, builtIn, { title, source: src, version: '' }), lay.width);
  }
  const m = parse(src);
  if (m.type !== 'flowchart') return { result: 'Left as Mermaid', why: m.warnings.slice(0, 2), svg: '', width: 0 };
  const lay = layout(m);
  return told(score(m, lay, builtIn), [...m.warnings, ...lay.warnings], picture(m, lay, builtIn, { title, source: src, version: '' }), lay.width);
}

/** Every sample of wild/index.json, drawn, and the page that says what became of each. */
export function wild() {
  const index = JSON.parse(readFileSync(join(root, 'wild/index.json'), 'utf8'));
  /** @type {{sample:any,result:string,why:string[],svg:string,width:number}[]} */
  const rows = index.samples.map((/** @type {any} */ sample) => ({ sample, ...made(readFileSync(join(root, 'wild', sample.file), 'utf8'), sample.file) }));
  const count = (/** @type {string} */ r) => rows.filter((row) => row.result === r).length;
  const was = index.measured, cell = (/** @type {string} */ s) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const markdown = `# Real documents

Written by \`npm run wild\`. Do not edit by hand.

${index.about}

## The measure taken on ${was.on}, at ${was.version}

Every Mermaid block of ${was.from.map((/** @type {any} */ f) => `[${f.repo}](https://github.com/${f.repo}) at \`${f.commit}\``).join(' and ')}: **${was.blocks} blocks**.

| | Blocks |
|---|---|
| Drawn, no rule broken | ${was.drawn} |
| Refused, a rule broken (${Object.entries(was.refusedBy).map(([rule, n]) => `${rule}: ${n}`).join(', ')}) | ${was.refused} |
| Left as Mermaid, a kind not drawn (${Object.entries(was.leftKinds).map(([kind, n]) => `${kind}: ${n}`).join(', ')}) | ${was.left} |

Of ${was.flowcharts.blocks} flowcharts, ${was.flowcharts.drawn} are drawn and ${was.flowcharts.refused} refused. ${was.widerThan1100} drawings are wider than 1100px.

## The ${rows.length} held here, as the code draws them today

${count('Drawn')} drawn, ${count('Drawn, with notes')} drawn with notes, ${count('Refused')} refused, ${count('Left as Mermaid')} left as Mermaid.

| Sample | From | Today | What is said |
|---|---|---|---|
${rows.map((r) => `| [${r.sample.file}](../wild/${r.sample.file}) | [${r.sample.repo.split('/')[1]}](https://github.com/${r.sample.repo}/blob/${r.sample.commit}/${r.sample.path}), block ${r.sample.block} | ${r.result}${r.width ? `, ${r.width}px wide` : ''} | ${cell(r.why.slice(0, 2).join('; ')) || ' '} |`).join('\n')}
`;
  return { rows, markdown, page: pageOf(index, rows, was) };
}

/**
 * The page to look at: every sample, Mermaid's own drawing beside Merlive's, with what the rules said and what
 * Victor said. One file beside its pictures; nothing is fetched.
 * @param {any} index
 * @param {{sample:any,result:string,why:string[],svg:string,width:number}[]} rows
 * @param {any} was
 */
function pageOf(index, rows, was) {
  const esc = (/** @type {unknown} */ s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const name = (/** @type {string} */ file) => file.replace(/\.mmd$/, '');
  const card = (/** @type {typeof rows[number]} */ r) => {
    const n = name(r.sample.file), said = r.sample.verdict || 'not looked at yet';
    const mermaid = existsSync(join(root, 'wild/mermaid', `${n}.png`)) ? `<img src="mermaid/${n}.png" alt="Mermaid's drawing of ${esc(n)}" loading="lazy">` : '<p class="none">Mermaid could not draw this one.</p>';
    return `<section id="${esc(n)}"><h2>${esc(n.replace(/-/g, ' '))} <span class="${r.result.startsWith('Drawn') ? 'ok' : 'no'}">${esc(r.result)}</span> <span class="said ${esc(r.sample.verdict || 'unseen')}">${esc(said)}</span></h2>
<p class="src"><a href="https://github.com/${esc(r.sample.repo)}/blob/${esc(r.sample.commit)}/${esc(r.sample.path)}">${esc(r.sample.repo.split('/')[1])} / ${esc(r.sample.path.split('/').pop())}</a>, block ${r.sample.block}${r.width ? ` · ${r.width}px wide` : ''}</p>
${r.sample.note ? `<p class="note">${esc(r.sample.note)}</p>` : ''}${r.why.length ? `<ul>${r.why.slice(0, 4).map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
<div class="pair"><figure><figcaption>Mermaid</figcaption>${mermaid}</figure><figure><figcaption>Merlive${r.result === 'Refused' ? ' (refused; drawn anyway, to look at)' : ''}</figcaption>${r.svg ? `<img src="drawn/${n}.svg" alt="Merlive's drawing of ${esc(n)}" loading="lazy">` : '<p class="none">Not drawn.</p>'}</figure></div></section>`;
  };
  const seen = rows.filter((r) => r.sample.verdict).length, fine = rows.filter((r) => r.sample.verdict === 'fine').length;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Merlive on real documents</title>
<style>body{margin:0;font:15px/1.5 system-ui,sans-serif;background:#f6f7f7;color:#1c2422}main{max-width:1100px;margin:0 auto;padding:16px}h1{font-size:22px;margin:8px 0}h2{font-size:17px;margin:0 0 2px;text-transform:capitalize}section{background:#fff;border:1px solid #dfe4e3;border-radius:10px;padding:14px;margin:14px 0}.src{margin:0 0 6px;color:#55615e;font-size:13px}.ok,.no,.said{font-size:12px;font-weight:600;padding:2px 8px;border-radius:99px;text-transform:none;vertical-align:middle}.ok{background:#dff3e8;color:#14532d}.no{background:#fde8e4;color:#7f1d1d}.said{background:#eceff0;color:#3b4744}.said.fine{background:#dff3e8;color:#14532d}.said.worse{background:#fde8e4;color:#7f1d1d}.note{margin:4px 0;font-size:14px}ul{margin:4px 0 8px;padding-left:18px;font-size:13px;color:#3b4744}.pair{display:grid;grid-template-columns:1fr;gap:10px}@media(min-width:800px){.pair{grid-template-columns:1fr 1fr}}figure{margin:0;border:1px solid #e6eae9;border-radius:8px;padding:8px;overflow:auto;background:#fff}figcaption{font-size:12px;color:#55615e;margin-bottom:6px}img{max-width:100%;height:auto;display:block;margin:0 auto}.none{color:#7a8683;font-size:13px}table{border-collapse:collapse;font-size:14px;margin:8px 0}td,th{padding:4px 10px;border-bottom:1px solid #dfe4e3;text-align:left}td.n{text-align:right;font-variant-numeric:tabular-nums}</style></head>
<body><main><h1>Merlive on real documents</h1>
<p>${esc(index.about)}</p>
<p><strong>${rows.length} held here.</strong> Looked at by Victor: ${seen} of ${rows.length}; fine: ${fine}.</p>
<table><tr><th>The measure on ${esc(was.on)}, at ${esc(was.version)}: ${was.blocks} real blocks</th><th></th></tr><tr><td>Drawn, no rule broken</td><td class="n">${was.drawn}</td></tr><tr><td>Refused, a rule broken</td><td class="n">${was.refused}</td></tr><tr><td>Left as Mermaid, a kind not drawn</td><td class="n">${was.left}</td></tr></table>
${rows.map(card).join('\n')}
</main></body></html>
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // `npm run wild -- --mermaid` also has Mermaid draw each sample again (it needs mmdc and Chrome, as
  // `npm run compare` does). Without it the pictures kept in wild/mermaid are used as they are.
  if (process.argv.includes('--mermaid')) {
    const browser = join(tmpdir(), 'merlive-wild-browser.json');
    writeFileSync(browser, JSON.stringify({ args: ['--no-sandbox', '--disable-gpu'], executablePath: process.env.CHROME ?? '/usr/bin/google-chrome' }));
    mkdirSync(join(root, 'wild/mermaid'), { recursive: true });
    for (const sample of JSON.parse(readFileSync(join(root, 'wild/index.json'), 'utf8')).samples) {
      const to = join(root, 'wild/mermaid', sample.file.replace(/\.mmd$/, '.png'));
      const ran = spawnSync('mmdc', ['-q', '-i', join(root, 'wild', sample.file), '-o', to, '-b', 'white', '-s', '2', '-p', browser], { encoding: 'utf8' });
      if (ran.status !== 0) console.log(`Mermaid could not draw ${sample.file}`);
    }
  }
  const { rows, markdown, page } = wild();
  mkdirSync(join(root, 'wild/drawn'), { recursive: true });
  writeFileSync(join(root, 'wild/compare.html'), page);
  for (const r of rows) if (r.svg) writeFileSync(join(root, 'wild/drawn', r.sample.file.replace(/\.mmd$/, '.svg')), r.svg);
  writeFileSync(join(root, 'docs/WILD.md'), markdown);
  console.log(`wrote docs/WILD.md, wild/compare.html and ${rows.filter((r) => r.svg).length} pictures in wild/drawn`);
}
