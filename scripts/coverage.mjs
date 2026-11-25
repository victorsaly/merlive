#!/usr/bin/env node
// Why: "what of Mermaid does Merlive draw?" has an answer that can be looked up, not remembered. The corpus
// holds one sample of every kind of diagram Mermaid documents and of every feature of its flowcharts, with what
// each should be read as. This runs Merlive over all of it and writes the answer down: docs/COVERAGE.md and a
// picture of each sample it draws. A development script: the skill does not need it.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout } from '../skills/merlive/scripts/layout.mjs';
import { builtIn, designWith } from '../skills/merlive/scripts/design.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';
import { picture } from '../skills/merlive/scripts/render.mjs';
import { layoutSequence, scoreSequence } from '../skills/merlive/scripts/sequence.mjs';
import { sequencePicture } from '../skills/merlive/scripts/sequence-render.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @typedef {{file:string,covers:string,boxes?:number,links?:number,groups?:number,has?:string[],kinds?:string[],title?:string,ends?:string[][],shapes?:string[],notes?:number,direction?:string,rows?:number[],says?:string,loses?:string,family?:string}} Sample
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
  if (/** @type {string} */ (model.type) === 'sequence') return judgeSequence(sample, /** @type {any} */ (model));
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
  count('notes', sample.notes, Object.keys(model.notes).length);
  if (sample.direction !== undefined && model.direction !== sample.direction) why.push(`drawn ${model.direction}, not ${sample.direction}`);
  const said = [...model.nodes.flatMap((n) => [n.label, n.over ?? '', ...(n.rows ?? []).flat()]), ...model.edges.flatMap((e) => [e.label, e.near ?? '', e.far ?? '']), ...model.groups.map((g) => g.title), ...Object.values(model.notes)];
  for (const text of sample.has ?? []) if (!said.includes(text)) why.push(`"${text}" is not among its words`);
  for (const kind of sample.kinds ?? []) if (!model.nodes.some((n) => n.kind === kind)) why.push(`no box is of the kind ${kind}`);
  if (sample.title !== undefined && model.title !== sample.title) why.push('its title is not kept');
  if (sample.ends && JSON.stringify(model.edges.map((e) => [e.tail, e.head])) !== JSON.stringify(sample.ends)) why.push('what is at the ends of its links is not kept');
  const listed = model.nodes.map((n) => (n.rows ?? []).flat().length);
  if (sample.rows && JSON.stringify(listed) !== JSON.stringify(sample.rows)) why.push(`its boxes list ${listed.join(', ')} rows, not ${sample.rows.join(', ')}`);
  // What a sample is meant to be told (that it is drawn top to bottom, say) is not something left unread; not
  // being told it would be.
  const told = (/** @type {string} */ w) => sample.says !== undefined && w.includes(sample.says);
  if (sample.says !== undefined && !model.warnings.some(told)) why.push(`it is not told: ${sample.says}`);
  if (sample.shapes && JSON.stringify(model.nodes.map((n) => n.shape)) !== JSON.stringify(sample.shapes)) why.push(`its shapes are read as ${model.nodes.map((n) => n.shape).join(', ')}`);
  // That a flow is wide is true of the sample, not a thing Merlive failed to read.
  why.push(...model.warnings.filter((w) => !told(w)), ...lay.warnings.filter((w) => !w.includes('will scroll on most screens') && !w.startsWith('written left to right, drawn top to bottom')));
  const broken = score(model, lay, design).checks.filter((c) => !c.ok);
  const svg = model.nodes.length ? picture(model, lay, design, { title: sample.covers }) : '';
  if (broken.length) return { sample, result: 'refused', why: [...broken.map((c) => `${c.id} ${c.rule}: ${c.detail}`), ...why], svg };
  if (why.length) return { sample, result: 'partly', why, svg };
  return { sample, result: sample.loses ? 'less' : 'drawn', why: sample.loses ? [sample.loses] : [], svg };
}

/**
 * A sequence diagram, held to what the corpus says it should be read as: who is in it, in what order and as
 * what; its messages and what is at their ends; its notes, frames, groups and bars; its words.
 * @param {Sample & {participants?:number,messages?:number,notes?:number,blocks?:number,bars?:number,order?:string[],roles?:string[],made?:string[],ended?:string[],numbers?:number[],lines?:number}} sample
 * @param {import('../skills/merlive/scripts/sequence.mjs').SequenceModel} model
 * @returns {Row}
 */
function judgeSequence(sample, model) {
  const lay = layoutSequence(model);
  const sent = /** @type {import('../skills/merlive/scripts/sequence.mjs').Message[]} */ (model.items.filter((i) => i.type === 'message'));
  const noted = /** @type {import('../skills/merlive/scripts/sequence.mjs').Note[]} */ (model.items.filter((i) => i.type === 'note'));
  /** @type {string[]} */
  const why = [];
  const count = (/** @type {string} */ what, /** @type {number|undefined} */ want, /** @type {number} */ got) => {
    if (want !== undefined && want !== got) why.push(`read ${got} of ${want} ${what}`);
  };
  const same = (/** @type {string} */ what, /** @type {unknown} */ want, /** @type {unknown} */ got) => {
    if (want !== undefined && JSON.stringify(want) !== JSON.stringify(got)) why.push(what);
  };
  count('participants', sample.participants, model.participants.length);
  count('messages', sample.messages, sent.length);
  count('notes', sample.notes, noted.length);
  count('blocks', sample.blocks, lay.frames.length);
  count('groups', sample.groups, lay.groups.length);
  count('bars', sample.bars, lay.bars.length);
  const said = [...model.participants.map((p) => p.label), ...sent.map((m) => m.label), ...noted.map((n) => n.label), ...model.blocks.flatMap((b) => [b.label, ...b.sections]), ...model.groups.map((g) => g.title)];
  for (const text of sample.has ?? []) if (!said.includes(text)) why.push(`"${text}" is not among its words`);
  same('its participants do not stand in the order they were given', sample.order, model.participants.map((p) => p.id));
  same('what each participant is is not kept', sample.roles, model.participants.map((p) => p.role));
  same('what is at the ends of its messages is not kept', sample.ends, sent.map((m) => [m.style, m.tail, m.head]));
  same('its numbers are not kept', sample.numbers, sent.map((m) => m.number));
  same('the participants made part way down are not kept', sample.made, model.participants.filter((p) => p.created !== undefined).map((p) => p.id));
  same('the participants ended part way down are not kept', sample.ended, model.participants.filter((p) => p.destroyed !== undefined).map((p) => p.id));
  if (sample.lines !== undefined && ![...model.participants, ...sent, ...noted].some((x) => ('breaks' in x ? x.breaks?.length ?? 0 : 'lines' in x ? x.lines.length : 0) >= 2)) why.push('its line breaks are not kept');
  if (sample.title !== undefined && model.title !== sample.title) why.push('its title is not kept');
  why.push(...model.warnings, ...lay.warnings);
  const broken = scoreSequence(model, lay, builtIn).checks.filter((c) => !c.ok);
  const svg = model.participants.length ? sequencePicture(model, lay, builtIn, { title: sample.covers }) : '';
  if (broken.length) return { sample, result: 'refused', why: [...broken.map((c) => `${c.id} ${c.rule}: ${c.detail}`), ...why], svg };
  if (why.length) return { sample, result: 'partly', why, svg };
  return { sample, result: sample.loses ? 'less' : 'drawn', why: sample.loses ? [sample.loses] : [], svg };
}

/**
 * Every sample judged, and the page that says so.
 * @param {string} [corpus] the corpus folder
 * @returns {{rows:Row[],markdown:string,pictures:Record<string,string>}}
 */
/** The lists of samples in corpus/index.json, in the order they are shown: each is a folder of the corpus too. */
export const lists = /** @type {const} */ (['flowchart', 'state', 'class', 'er', 'sequence', 'kinds']);

/** Every sample of an index, list after list. */
export const samplesOf = (/** @type {Record<string, any>} */ index) => lists.flatMap((l) => /** @type {Sample[]} */ (index[l] ?? []));

export function coverage(corpus = join(root, 'corpus')) {
  /** @type {{from:string} & Partial<Record<typeof lists[number], Sample[]>>} */
  const index = JSON.parse(readFileSync(join(corpus, 'index.json'), 'utf8'));
  const run = (/** @type {Sample[]} */ list) => list.map((s) => judge(s, readFileSync(join(corpus, s.file), 'utf8')));
  const flow = run(index.flowchart ?? []), state = run(index.state ?? []), cls = run(index.class ?? []), er = run(index.er ?? []), seq = run(index.sequence ?? []), kinds = run(index.kinds ?? []);
  const tally = (/** @type {Row[]} */ rows, /** @type {Row['result']} */ r) => rows.filter((x) => x.result === r).length;
  const cell = (/** @type {string} */ s) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const pic = (/** @type {Row} */ r) => `corpus/drawn/${basename(r.sample.file, '.mmd')}.svg`;
  /** @type {Record<string,string>} */
  const pictures = {};
  for (const r of [...flow, ...state, ...cls, ...er, ...seq, ...kinds]) if (r.svg && r.result !== 'refused') pictures[pic(r)] = r.svg;
  const table = (/** @type {Row[]} */ rows) => rows.map((r) => `| ${cell(r.sample.covers)} | ${words[r.result]} | ${cell(r.why.join('; '))} | [source](../corpus/${r.sample.file}) | ${pictures[pic(r)] ? `[picture](../${pic(r)})` : ''} |`).join('\n');
  const families = [...new Set(kinds.map((r) => r.sample.family ?? ''))];

  const markdown = `# What Merlive draws of Mermaid

Written by \`npm run coverage\`. Do not edit it by hand: change the code or the corpus and run it again.

${index.from}

## In short

- **Flowcharts:** of ${flow.length} features, ${tally(flow, 'drawn')} are drawn as written, ${tally(flow, 'less')} are drawn less something Merlive leaves out on purpose or does not have yet, ${tally(flow, 'partly')} are only partly read, and ${tally(flow, 'refused')} are refused.
- **State diagrams:** of ${state.length} features, ${tally(state, 'drawn')} are drawn as written, ${tally(state, 'less')} are drawn less something, ${tally(state, 'partly')} are only partly read, and ${tally(state, 'refused')} are refused.
${cls.length ? `- **Class diagrams:** of ${cls.length} features, ${tally(cls, 'drawn')} are drawn as written, ${tally(cls, 'less')} are drawn less something, ${tally(cls, 'partly')} are only partly read, and ${tally(cls, 'refused')} are refused.\n` : ''}${er.length ? `- **Entity diagrams:** of ${er.length} features, ${tally(er, 'drawn')} are drawn as written, ${tally(er, 'less')} are drawn less something, ${tally(er, 'partly')} are only partly read, and ${tally(er, 'refused')} are refused.\n` : ''}- **Sequence diagrams:** of ${seq.length} features, ${tally(seq, 'drawn')} are drawn as written, ${tally(seq, 'less')} are drawn less something, ${tally(seq, 'partly')} are only partly read, and ${tally(seq, 'refused')} are refused.
- **Every kind of diagram:** of ${kinds.length}, ${kinds.length - tally(kinds, 'left')} drawn (those with their own lists above), and ${tally(kinds, 'left')} left as Mermaid and named.

## Flowcharts, feature by feature

A sample is **drawn** when every box, link, group and word the corpus says it has is read, nothing is said about
what could not be read, and every rule passes. **Drawn, less something** is the same, with one thing known to be
missing, named beside it. **Partly read** and **refused** are what there is to fix.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
${table(flow)}

## State diagrams, feature by feature

A state diagram is boxes and links, so it is read into what a flowchart is read into and placed by the same
rules. Held to the same measure as the flowcharts above.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
${table(state)}

${cls.length ? `## Class diagrams, feature by feature

A class is a box that lists its attributes and its methods under its name. Held to the same measure, and to
the rows each box lists and what each link ends in.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
${table(cls)}

` : ''}${er.length ? `## Entity diagrams, feature by feature

An entity is a box that lists its attributes under its name, and a relationship ends in how many. Held to the
same measure, and to the rows each box lists and what each link ends in.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
${table(er)}

` : ''}## Sequence diagrams, feature by feature

Held to the same measure: every participant, message, note, frame and word the corpus says a sample has is read,
and every rule in [SEQUENCE.md](SEQUENCE.md) passes.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
${table(seq)}

## Other kinds of diagram

One that is not drawn is left exactly as it was written, and the command names it. The family says what it would
take: a diagram of boxes and links could be placed by the rules Merlive already has; the others need a way of
drawing of their own.

${families.map((family) => `### ${family.charAt(0).toUpperCase() + family.slice(1)}

| Kind | Result | Sample | Picture |
|---|---|---|---|
${kinds.filter((r) => r.sample.family === family).map((r) => `| ${cell(r.sample.covers)} | ${words[r.result]} | [source](../corpus/${r.sample.file}) | ${pictures[pic(r)] ? `[picture](../${pic(r)})` : ''} |`).join('\n')}`).join('\n\n')}
`;
  return { rows: [...flow, ...state, ...cls, ...er, ...seq, ...kinds], markdown, pictures };
}

/** The samples on disk, to hold the index to: every one is listed, and every one listed is there. */
export const samplesOnDisk = (corpus = join(root, 'corpus')) =>
  lists.filter((folder) => existsSync(join(corpus, folder))).flatMap((folder) => readdirSync(join(corpus, folder)).filter((f) => f.endsWith('.mmd')).map((f) => `${folder}/${f}`)).sort();

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { rows, markdown, pictures } = coverage();
  writeFileSync(join(root, 'docs/COVERAGE.md'), markdown);
  mkdirSync(join(root, 'corpus/drawn'), { recursive: true });
  for (const [path, svg] of Object.entries(pictures)) writeFileSync(join(root, path), svg);
  for (const result of /** @type {Row['result'][]} */ (['drawn', 'less', 'partly', 'refused', 'left'])) console.log(`${String(rows.filter((r) => r.result === result).length).padStart(3)}  ${words[result]}`);
  console.log(`wrote docs/COVERAGE.md and ${Object.keys(pictures).length} pictures in corpus/drawn`);
}
