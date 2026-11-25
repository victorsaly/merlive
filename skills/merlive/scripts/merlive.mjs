#!/usr/bin/env node
// Why: the one command an agent runs. It reads a Markdown file's Mermaid flowcharts, places each by rule,
// checks the rules, and only then writes a diagram. This file touches the disk; everything it decides with
// is in the pure files beside it.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { blocksOf, parse } from './parse.mjs';
import { layout } from './layout.mjs';
import { designFrom, presets } from './design.mjs';
import { score } from './score.mjs';
import { page, picture } from './render.mjs';

export const version = '0.1.0';

// What each way of ending means, so an agent can act on the number alone.
export const exits = { drawn: 0, brokeARule: 1, missing: 2, nothingToDraw: 3 };

export const help = `Merlive ${version}: Mermaid flowcharts, placed by rule and made live.

  node merlive.mjs <file.md | file.mmd> [options]

  --out <folder>      where the diagrams go (default: a "diagrams" folder beside the file)
  --design <name>     ${Object.keys(presets).join(', ')}, or the path of a design file
                      (default: merlive.design.json in this folder if there is one, else quiet)
  --format <html|svg> a live page, or a still picture for wikis (default: html)
  --only <n>          just the nth Mermaid block of the file
  --check             say what would be drawn and whether it passes its rules; write nothing
  --force             write a diagram even when it breaks a placement rule
  --help              this

Ends with 0 when every flowchart was drawn, 1 when one broke a rule and was not written, 2 when something is
missing (the file, an option's value, the design), 3 when the file has no flowchart to draw.
Blocks that are not flowcharts are left as they are and named.`;

/**
 * @param {string[]} argv
 * @returns {{file:string,out:string,design:string,format:'html'|'svg',only:number,check:boolean,force:boolean,help:boolean}}
 */
export function optionsFrom(argv) {
  const o = { file: '', out: '', design: '', format: /** @type {'html'|'svg'} */ ('html'), only: 0, check: false, force: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new Error(`${a} needs a value. Run with --help to see the options.`);
      return v;
    };
    if (a === '--help' || a === '-h') o.help = true;
    else if (a === '--check') o.check = true;
    else if (a === '--force') o.force = true;
    else if (a === '--out') o.out = value();
    else if (a === '--design') o.design = value();
    else if (a === '--only') {
      o.only = Number(value());
      if (!Number.isInteger(o.only) || o.only < 1) throw new Error('--only takes the number of a block, counting from 1.');
    } else if (a === '--format') {
      const f = value();
      if (f !== 'html' && f !== 'svg') throw new Error('--format is html or svg.');
      o.format = f;
    } else if (a.startsWith('--')) throw new Error(`There is no option ${a}. Run with --help to see the options.`);
    else if (o.file) throw new Error(`One file at a time: got "${o.file}" and "${a}".`);
    else o.file = a;
  }
  return o;
}

/** The design to draw with: the one named, the folder's own, or quiet. */
function designFor(/** @type {string} */ asked, /** @type {string} */ cwd) {
  const own = join(cwd, 'merlive.design.json');
  const path = asked && !presets[asked] ? resolve(cwd, asked) : !asked && existsSync(own) ? own : '';
  if (!path) return designFrom(asked || 'quiet');
  if (!existsSync(path)) throw new Error(`No design at ${path}. Name a preset (${Object.keys(presets).join(', ')}) or a design file.`);
  let json;
  try {
    json = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new Error(`${path} is not valid JSON: ${/** @type {Error} */ (e).message}`, { cause: e });
  }
  return designFrom(basename(path, '.json'), json);
}

/**
 * @param {string[]} argv
 * @param {{cwd?:string,say?:(line:string)=>void}} [io]
 * @returns {number} how it ended: one of `exits`
 */
export function run(argv, io = {}) {
  const cwd = io.cwd ?? process.cwd();
  const say = io.say ?? ((line) => console.log(line));
  let o, design;
  try {
    o = optionsFrom(argv);
    if (o.help) return say(help), exits.drawn;
    if (!o.file) throw new Error('Which file? node merlive.mjs <file.md | file.mmd>. Run with --help to see the options.');
    if (!existsSync(resolve(cwd, o.file))) throw new Error(`No file at ${resolve(cwd, o.file)}.`);
    design = designFor(o.design, cwd);
  } catch (e) {
    return say(/** @type {Error} */ (e).message), exits.missing;
  }

  const file = resolve(cwd, o.file);
  const stem = basename(file, extname(file));
  const outDir = o.out ? resolve(cwd, o.out) : join(dirname(file), 'diagrams');
  const blocks = blocksOf(readFileSync(file, 'utf8'), extname(file) === '.mmd');
  let drawn = 0, broke = 0;

  blocks.forEach((block, i) => {
    const number = i + 1;
    if (o.only && o.only !== number) return;
    const model = parse(block.source);
    if (model.type !== 'flowchart') return say(`left as Mermaid: block ${number} (line ${block.line}) is a ${model.kindOfDiagram || 'blank block'}, and Merlive draws flowcharts for now`);
    if (!model.nodes.length) return say(`left as Mermaid: block ${number} (line ${block.line}) has no boxes`);

    const lay = layout(model);
    const result = score(model, lay, design);
    const name = `${stem}-${number}.${o.format}`;
    const crossings = result.checks.find((c) => c.id === 'P4')?.detail ?? '';
    const facts = `${model.nodes.length} boxes, ${model.edges.length} links, ${crossings}, ${design.name} design`;
    for (const w of [...model.warnings, ...lay.warnings]) say(`  note, block ${number}: ${w}`);

    if (!result.pass) {
      broke++;
      say(`${o.force && !o.check ? 'drawn anyway' : 'not drawn'}: block ${number} (line ${block.line}) breaks ${result.checks.filter((c) => !c.ok).length} of its rules`);
      for (const c of result.checks.filter((x) => !x.ok)) say(`  ${c.id} ${c.rule}: ${c.detail}`);
      if (!o.force || o.check) return;
    }
    if (o.check) return void (say(`would draw ${name} (${facts})`), drawn++);

    const about = { title: block.title || stem, source: block.source, version };
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, name), o.format === 'svg' ? picture(model, lay, design, about) : page(model, lay, design, about));
    say(`drew ${join(outDir, name)} (${facts})`);
    drawn++;
  });

  if (broke && !o.force) return exits.brokeARule;
  if (!drawn) return say(`Nothing to draw: ${o.file} has no Mermaid flowchart${o.only ? ` at block ${o.only}` : ''}.`), exits.nothingToDraw;
  return exits.drawn;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = run(process.argv.slice(2));

export const here = dirname(fileURLToPath(import.meta.url));
