#!/usr/bin/env node
// Why: "what of Mermaid does Merlive draw?" has an answer that can be looked up, not remembered. The corpus
// holds one sample of every kind of diagram Mermaid documents and of every feature of its flowcharts, with what
// each should be read as. This runs Merlive over all of it and writes the answer down: docs/COVERAGE.md and a
// picture of each sample it draws. A development script: the skill does not need it.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout } from '../skills/merlive/scripts/layout.mjs';
import { builtIn, designWith } from '../skills/merlive/scripts/design.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';
import { picture } from '../skills/merlive/scripts/render.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @typedef {{file:string,covers:string,boxes?:number,links?:number,groups?:number,has?:string[],kinds?:string[],title?:string,loses?:string,family?:string}} Sample
 * @typedef {{sample:Sample,result:'drawn'|'less'|'partly'|'refused'|'left',why:string[],svg:string}} Row
 */

const words = { drawn: 'Drawn', less: 'Drawn, less something', partly: 'Partly read', refused: 'Refused', left: 'Left as Mermaid' };

/**
 * One sample, run as the command would run it, and held to what the corpus says it should be read as.
 * @param {Sample} sample
 * @param {string} source
 * @returns {Row}
 */
export function judge(sample, source) {
  const model = parse(source);
  if (model.type !== 'flowchart') {
    // A flowchart Merlive does not take for one is the worst miss there is, so it is not filed with the kinds it never claimed.
    if (sample.boxes !== undefined) return { sample, result: 'partly', why: [`not taken for a flowchart: it is read as "${model.kindOfDiagram}" and left as Mermaid`], svg: '' };
    return { sample, result: 'left', why: [`a ${model.kindOfDiagram} is not drawn yet`], svg: '' };
  }
  const lay = layout(model);
  const design = designWith(builtIn, model);
  /** @type {string[]} */
  const why = [];
  const count = (/** @type {string} */ what, /** @type {number|undefined} */ want, /** @type {number} */ got) => {
    if (want !== undefined && want !== got) why.push(`read ${got} of ${want} ${what}`);
  };
  count('boxes', sample.boxes, model.nodes.length);
  count('links', sample.links, model.edges.length);
  count('groups', sample.groups, lay.groups.length);
  const said = [...model.nodes.map((n) => n.label), ...model.edges.map((e) => e.label), ...model.groups.map((g) => g.title)];
  for (const text of sample.has ?? []) if (!said.includes(text)) why.push(`"${text}" is not among its words`);
  for (const kind of sample.kinds ?? []) if (!model.nodes.some((n) => n.kind === kind)) why.push(`no box is of the kind ${kind}`);
  if (sample.title !== undefined && model.title !== sample.title) why.push('its title is not kept');
  // That a flow is wide is true of the sample, not a thing Merlive failed to read.
  why.push(...model.warnings, ...lay.warnings.filter((w) => !w.includes('will scroll on most screens')));
  const broken = score(model, lay, design).checks.filter((c) => !c.ok);
  const svg = model.nodes.length ? picture(model, lay, design, { title: sample.covers }) : '';
  if (broken.length) return { sample, result: 'refused', why: [...broken.map((c) => `${c.id} ${c.rule}: ${c.detail}`), ...why], svg };
  if (why.length) return { sample, result: 'partly', why, svg };
  return { sample, result: sample.loses ? 'less' : 'drawn', why: sample.loses ? [sample.loses] : [], svg };
}

/**
 * Every sample judged, and the page that says so.
 * @param {string} [corpus] the corpus folder
 * @returns {{rows:Row[],markdown:string,pictures:Record<string,string>}}
 */
export function coverage(corpus = join(root, 'corpus')) {
  /** @type {{from:string,flowchart:Sample[],kinds:Sample[]}} */
  const index = JSON.parse(readFileSync(join(corpus, 'index.json'), 'utf8'));
  const run = (/** @type {Sample[]} */ list) => list.map((s) => judge(s, readFileSync(join(corpus, s.file), 'utf8')));
  const flow = run(index.flowchart), kinds = run(index.kinds);
  const tally = (/** @type {Row[]} */ rows, /** @type {Row['result']} */ r) => rows.filter((x) => x.result === r).length;
  const cell = (/** @type {string} */ s) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const pic = (/** @type {Row} */ r) => `corpus/drawn/${basename(r.sample.file, '.mmd')}.svg`;
  /** @type {Record<string,string>} */
  const pictures = {};
  for (const r of flow) if (r.svg && r.result !== 'refused') pictures[pic(r)] = r.svg;
  const families = [...new Set(kinds.map((r) => r.sample.family ?? ''))];

  const markdown = `# What Merlive draws of Mermaid

Written by \`npm run coverage\`. Do not edit it by hand: change the code or the corpus and run it again.

${index.from}

## In short

- **Flowcharts:** of ${flow.length} features, ${tally(flow, 'drawn')} are drawn as written, ${tally(flow, 'less')} are drawn less something Merlive leaves out on purpose or does not have yet, ${tally(flow, 'partly')} are only partly read, and ${tally(flow, 'refused')} are refused.
- **Other kinds of diagram:** of ${kinds.length}, ${kinds.length - tally(kinds, 'left')} are drawn and ${tally(kinds, 'left')} are left as Mermaid and named.

## Flowcharts, feature by feature

A sample is **drawn** when every box, link, group and word the corpus says it has is read, nothing is said about
what could not be read, and every rule passes. **Drawn, less something** is the same, with one thing known to be
missing, named beside it. **Partly read** and **refused** are what there is to fix.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
${flow.map((r) => `| ${cell(r.sample.covers)} | ${words[r.result]} | ${cell(r.why.join('; '))} | [source](../corpus/${r.sample.file}) | ${pictures[pic(r)] ? `[picture](../${pic(r)})` : ''} |`).join('\n')}

## Other kinds of diagram

Each is left exactly as it was written, and the command names it. The family says what it would take: a diagram
of boxes and links could be placed by the rules Merlive already has; the others need a way of drawing of their own.

${families.map((family) => `### ${family.charAt(0).toUpperCase() + family.slice(1)}

| Kind | Result | Sample |
|---|---|---|
${kinds.filter((r) => r.sample.family === family).map((r) => `| ${cell(r.sample.covers)} | ${words[r.result]} | [source](../corpus/${r.sample.file}) |`).join('\n')}`).join('\n\n')}
`;
  return { rows: [...flow, ...kinds], markdown, pictures };
}

/** The samples on disk, to hold the index to: every one is listed, and every one listed is there. */
export const samplesOnDisk = (corpus = join(root, 'corpus')) =>
  ['flowchart', 'kinds'].flatMap((folder) => readdirSync(join(corpus, folder)).filter((f) => f.endsWith('.mmd')).map((f) => `${folder}/${f}`)).sort();

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { rows, markdown, pictures } = coverage();
  writeFileSync(join(root, 'docs/COVERAGE.md'), markdown);
  mkdirSync(join(root, 'corpus/drawn'), { recursive: true });
  for (const [path, svg] of Object.entries(pictures)) writeFileSync(join(root, path), svg);
  for (const result of /** @type {Row['result'][]} */ (['drawn', 'less', 'partly', 'refused', 'left'])) console.log(`${String(rows.filter((r) => r.result === result).length).padStart(3)}  ${words[result]}`);
  console.log(`wrote docs/COVERAGE.md and ${Object.keys(pictures).length} pictures in corpus/drawn`);
}
