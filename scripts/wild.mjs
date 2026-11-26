#!/usr/bin/env node
// Real Mermaid, held to: every block in wild/ is one a person wrote in a real document, not a sample written to
// show a feature. This draws each, says what the rules made of it, and writes docs/WILD.md and wild/drawn/.
// What is refused here is the list of what to mend next; what is drawn is to be looked at beside Mermaid's own.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
  return { rows, markdown };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { rows, markdown } = wild();
  mkdirSync(join(root, 'wild/drawn'), { recursive: true });
  for (const r of rows) if (r.svg) writeFileSync(join(root, 'wild/drawn', r.sample.file.replace(/\.mmd$/, '.svg')), r.svg);
  writeFileSync(join(root, 'docs/WILD.md'), markdown);
  console.log(`wrote docs/WILD.md and ${rows.filter((r) => r.svg).length} pictures in wild/drawn`);
}
