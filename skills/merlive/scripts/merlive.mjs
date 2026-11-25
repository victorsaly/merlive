#!/usr/bin/env node
// Why: the one command an agent runs. It reads a Markdown file's Mermaid flowcharts and sequence diagrams, places each by rule,
// checks the rules, and only then writes a diagram; and, once for a project, it reads the project's own
// colours and writes the design file, so nobody has to. This file is the only one that touches the disk and
// the network; everything it decides with is in the pure files beside it.

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { blocksOf, parse } from './parse.mjs';
import { layout } from './layout.mjs';
import { designFrom, designWith } from './design.mjs';
import { score } from './score.mjs';
import { page, picture } from './render.mjs';
import { layoutSequence, scoreSequence } from './sequence.mjs';
import { sequencePage, sequencePicture } from './sequence-render.mjs';
import { designOf, readingOf, stylesheetsOf } from './site.mjs';
import { sample, setupPage } from './setup.mjs';

export const version = '0.1.0';
export const here = dirname(fileURLToPath(import.meta.url));

// What each way of ending means, so an agent can act on the number alone.
export const exits = { drawn: 0, brokeARule: 1, missing: 2, nothingToDraw: 3 };

// How far setup looks, and how long it waits. A project's own files are small; anything past these is not them.
const looks = {
  deep: 5, // folders down from the project's own
  files: 400, // files looked at before giving up on a folder that is not a project
  bytes: 600_000, // the largest stylesheet or document read
  sheets: 6, // stylesheets followed from one page
  wait: 10_000, // ms for a site to answer
  // Folders that hold what was installed or built, not what the project is.
  skip: new Set(['node_modules', '.git', 'dist', 'build', 'out', 'coverage', 'vendor', 'diagrams', '.next', '.astro', '.cache', '.vercel', '.wrangler']),
  // A homepage on one of these is where the code lives, not the site its diagrams are read on.
  notASite: /(^|\.)(github\.com|gitlab\.com|bitbucket\.org|npmjs\.com)$/,
};

export const help = `Merlive ${version}: Mermaid flowcharts and sequence diagrams, placed by rule and made live.

  node merlive.mjs <file> [options]                   draw a file's flowcharts and sequence diagrams:
                                                      Markdown, a .mmd file, or a page or script that keeps
                                                      a flowchart in a string
  node merlive.mjs --setup [file.md] [--from <site>]  once for a project: read its colours, write its design

  --setup             read the project's colours (its own stylesheet, or the site named in package.json) and
                      write merlive.design.json and a page showing a diagram in them. Asks nothing.
  --from <site>       with --setup: the address of the site the diagrams will be read on, or the path of a
                      stylesheet or a folder of them
  --out <folder>      where the diagrams go (default: a "diagrams" folder beside the file)
  --design <file>     a design file to draw with (default: merlive.design.json in this folder if there is
                      one, else Merlive's own look, in light and dark)
  --format <html|svg|both>  a live page, a still picture for wikis, or both (default: what the design says)
  --only <n>          just the nth Mermaid block of the file
  --check             say what would be drawn and whether it passes its rules; write nothing
  --force             write a diagram even when it breaks a rule; with --setup, replace the design there is
  --help              this

Ends with 0 when every diagram was drawn, 1 when one broke a rule and was not written, 2 when something is
missing (the file, an option's value, the design, a site that does not answer), 3 when the file has nothing
Merlive draws. A state diagram is drawn as a flowchart is. Blocks of any other kind of diagram are left as they
are and named.`;

/**
 * @param {string[]} argv
 * @returns {{file:string,out:string,design:string,format:''|'html'|'svg'|'both',only:number,check:boolean,force:boolean,help:boolean,setup:boolean,from:string}}
 */
export function optionsFrom(argv) {
  const o = { file: '', out: '', design: '', format: /** @type {''|'html'|'svg'|'both'} */ (''), only: 0, check: false, force: false, help: false, setup: false, from: '' };
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
    else if (a === '--setup') o.setup = true;
    else if (a === '--from') o.from = value();
    else if (a === '--out') o.out = value();
    else if (a === '--design') o.design = value();
    else if (a === '--only') {
      o.only = Number(value());
      if (!Number.isInteger(o.only) || o.only < 1) throw new Error('--only takes the number of a block, counting from 1.');
    } else if (a === '--format') {
      const f = value();
      if (f !== 'html' && f !== 'svg' && f !== 'both') throw new Error('--format is html, svg or both.');
      o.format = f;
    } else if (a.startsWith('--')) throw new Error(`There is no option ${a}. Run with --help to see the options.`);
    else if (o.file) throw new Error(`One file at a time: got "${o.file}" and "${a}".`);
    else o.file = a;
  }
  return o;
}

/** How a file keeps its Mermaid: fenced in Markdown, as the whole of a .mmd file, or in a string in code. */
const kindOf = (/** @type {string} */ path) => (extname(path) === '.mmd' ? 'mmd' : ['.md', '.mdx', '.markdown'].includes(extname(path)) ? 'md' : 'code');

/** The design to draw with: the file named, the folder's own, or Merlive's. */
function designFor(/** @type {string} */ asked, /** @type {string} */ cwd) {
  const own = join(cwd, 'merlive.design.json');
  const path = asked ? resolve(cwd, asked) : existsSync(own) ? own : '';
  if (!path) return designFrom();
  if (!existsSync(path)) throw new Error(`No design file at ${path}. Leave --design out to draw in Merlive's own look.`);
  let json;
  try {
    json = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new Error(`${path} is not valid JSON: ${/** @type {Error} */ (e).message}`, { cause: e });
  }
  return designFrom(json);
}

/** The project's own files with one of these endings, nearest first, leaving out what was installed or built. */
function filesOf(/** @type {string} */ cwd, /** @type {string[]} */ endings) {
  /** @type {string[]} */
  const found = [];
  let seen = 0;
  const walk = (/** @type {string} */ dir, /** @type {number} */ depth) => {
    /** @type {string[]} */
    const folders = [];
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (seen++ > looks.files) return;
      const path = join(dir, entry.name);
      if (entry.isDirectory() && !looks.skip.has(entry.name) && depth < looks.deep) folders.push(path);
      else if (entry.isFile() && endings.includes(extname(entry.name)) && statSync(path).size <= looks.bytes) found.push(path);
    }
    for (const f of folders) walk(f, depth + 1);
  };
  walk(cwd, 0);
  return found;
}

/** One address read as text, or an error that says what to do. */
async function fetched(/** @type {string} */ url) {
  const tell = (/** @type {string} */ why) => new Error(`Could not read ${url}: ${why}. Save the site's stylesheet to a file and name it with --from, or leave --from out to use this project's own.`);
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(looks.wait), redirect: 'follow' });
  } catch (e) {
    throw tell(/** @type {Error} */ (e).name === 'TimeoutError' ? 'it did not answer in time' : 'it could not be reached from here');
  }
  if (!res.ok) throw tell(`it answered ${res.status}`);
  return { text: (await res.text()).slice(0, looks.bytes), css: /\bcss\b/.test(res.headers.get('content-type') ?? '') };
}

/** The stylesheets of a site by its address, or of a file by its path. */
async function sheetsFrom(/** @type {string} */ from, /** @type {string} */ cwd) {
  if (/^https?:\/\//i.test(from)) {
    const first = await fetched(from);
    if (first.css) return [first.text];
    const { links, inline } = stylesheetsOf(first.text, from);
    // A stylesheet that does not answer is left out; the page's others may still say enough.
    const linked = await Promise.all(links.slice(0, looks.sheets).map((l) => fetched(l).then((r) => r.text, () => '')));
    return [...linked, ...inline];
  }
  const path = resolve(cwd, from);
  if (!existsSync(path)) throw new Error(`No file at ${path}. --from takes a site's address, or the path of a stylesheet or of a folder of them.`);
  if (statSync(path).isDirectory()) return readdirSync(path).filter((f) => extname(f) === '.css').sort().map((f) => readFileSync(join(path, f), 'utf8').slice(0, looks.bytes));
  const text = readFileSync(path, 'utf8');
  return extname(path) === '.css' ? [text] : stylesheetsOf(text, pathToFileURL(path).href).inline;
}

/** Where a project's colours are, found without asking: its own best stylesheet, or the site it names. */
function sourceIn(/** @type {string} */ cwd) {
  const weigh = (/** @type {string} */ path) => {
    const r = readingOf([readFileSync(path, 'utf8')]);
    return (r.light?.bg ? 2 : 0) + (r.light?.text ? 2 : 0) + (r.light?.accent ? 1 : 0) + (r.dark ? 1 : 0);
  };
  // The folder of the stylesheet with the most to say, nearest the project's own folder as filesOf lists them.
  // The whole folder, because a site keeps its colours in one sheet and says what body uses them for in another.
  const best = filesOf(cwd, ['.css']).map((path) => ({ path, weight: weigh(path) })).filter((s) => s.weight > 0).sort((a, b) => b.weight - a.weight)[0];
  if (best) return relative(cwd, dirname(best.path)).split('\\').join('/') || '.';
  try {
    const home = new URL(JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')).homepage);
    if (/^https?:$/.test(home.protocol) && !looks.notASite.test(home.hostname)) return home.href;
  } catch {
    // No package.json, or no homepage in it that is an address: nothing to go by.
  }
  return '';
}

/** The first flowchart there is to show: in the file named, else anywhere in the project, else Merlive's sample. */
function flowchartFor(/** @type {string} */ file, /** @type {string} */ cwd) {
  const paths = file ? [resolve(cwd, file)] : filesOf(cwd, ['.md', '.mdx', '.mmd', '.astro']);
  for (const path of paths) {
    for (const block of blocksOf(readFileSync(path, 'utf8'), kindOf(path))) {
      const model = parse(block.source);
      if (model.type === 'flowchart' && model.nodes.length) return model;
    }
  }
  return parse(sample);
}

/** Once for a project: read its colours, write its design, and a page to look at. Asks nothing. */
async function setup(/** @type {ReturnType<typeof optionsFrom>} */ o, /** @type {string} */ cwd, /** @type {(line:string)=>void} */ say) {
  const own = join(cwd, 'merlive.design.json');
  let said = { found: /** @type {string[]} */ ([]), changed: /** @type {string[]} */ ([]), made: /** @type {string[]} */ ([]) };
  let wrote = false;
  if (existsSync(own) && !o.force) {
    say('This project already has merlive.design.json, so it was left as it is. Add --force to make it again from the site\'s colours.');
  } else {
    const from = o.from || sourceIn(cwd);
    if (!from) {
      say('Found no stylesheet with colours in this folder, and no site named in package.json, so diagrams are drawn in Merlive\'s own look. To use a site\'s colours, name it: --setup --from https://your.site');
    } else {
      const made = designOf(readingOf(await sheetsFrom(from, cwd)), { name: basename(cwd), from });
      said = made.said;
      say(`read ${from}`);
      for (const [label, lines] of /** @type {[string, string[]][]} */ ([['found', said.found], ['changed', said.changed], ['made by Merlive', said.made]])) for (const line of lines) say(`  ${label}: ${line}`);
      if (made.file.light) {
        writeFileSync(own, `${JSON.stringify(made.file, null, 2)}\n`);
        wrote = true;
        say('wrote merlive.design.json');
      }
    }
  }
  const design = designFor('', cwd);
  const model = flowchartFor(o.file, cwd);
  const outDir = o.out ? resolve(cwd, o.out) : join(cwd, 'diagrams');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'merlive-setup.html'), setupPage({ model, lay: layout(model), design, said, sums: readFileSync(join(here, 'design.mjs'), 'utf8'), wrote }));
  say(`wrote ${join(outDir, 'merlive-setup.html')}: a diagram in these colours, and every choice there is, already made`);
  return exits.drawn;
}

/**
 * @param {string[]} argv
 * @param {{cwd?:string,say?:(line:string)=>void}} [io]
 * @returns {Promise<number>} how it ended: one of `exits`
 */
export async function run(argv, io = {}) {
  const cwd = io.cwd ?? process.cwd();
  const say = io.say ?? ((line) => console.log(line));
  let o, design;
  try {
    o = optionsFrom(argv);
    if (o.help) return say(help), exits.drawn;
    if (o.file && !existsSync(resolve(cwd, o.file))) throw new Error(`No file at ${resolve(cwd, o.file)}.`);
    if (o.setup) return await setup(o, cwd, say);
    if (!o.file) throw new Error('Which file? node merlive.mjs <file>. Run with --help to see the options.');
    design = designFor(o.design, cwd);
  } catch (e) {
    return say(/** @type {Error} */ (e).message), exits.missing;
  }

  const file = resolve(cwd, o.file);
  const stem = basename(file, extname(file));
  const outDir = o.out ? resolve(cwd, o.out) : join(dirname(file), 'diagrams');
  const asked = o.format || design.output.format;
  const formats = /** @type {('html'|'svg')[]} */ (asked === 'both' ? ['html', 'svg'] : [asked]);
  const blocks = blocksOf(readFileSync(file, 'utf8'), kindOf(file));
  let drawn = 0, broke = 0;

  blocks.forEach((block, i) => {
    const number = i + 1;
    if (o.only && o.only !== number) return;
    const model = parse(block.source);
    // A sequence diagram is read, placed, checked and drawn by sequence.mjs; from here on it goes the same way.
    const seq = /** @type {string} */ (model.type) === 'sequence' ? /** @type {import('./sequence.mjs').SequenceModel} */ (/** @type {unknown} */ (model)) : null;
    if (!seq && model.type !== 'flowchart') return say(`left as Mermaid: block ${number} (line ${block.line}) is a ${model.kindOfDiagram || 'blank block'}, and Merlive draws flowcharts, state diagrams and sequence diagrams for now`);
    if (seq ? !seq.participants.length : !model.nodes.length) return say(`left as Mermaid: block ${number} (line ${block.line}) has no ${seq ? 'participants' : 'boxes'}`);

    const lay = seq ? /** @type {any} */ (layoutSequence(seq)) : layout(model);
    // The project's design, and the nearest of its colours for any class this diagram's author made up.
    const drawnIn = seq ? design : designWith(design, model);
    const result = seq ? scoreSequence(seq, lay, drawnIn) : score(model, lay, drawnIn);
    const crossings = result.checks.find((c) => c.id === 'P4')?.detail ?? '';
    const facts = seq
      ? `${seq.participants.length} participants, ${seq.items.filter((i) => i.type === 'message').length} messages, ${design.name} design`
      : `${model.nodes.length} boxes, ${model.edges.length} links, ${crossings}, ${design.name} design`;
    for (const w of [...model.warnings, ...lay.warnings]) say(`  note, block ${number}: ${w}`);

    if (!result.pass) {
      broke++;
      say(`${o.force && !o.check ? 'drawn anyway' : 'not drawn'}: block ${number} (line ${block.line}) breaks ${result.checks.filter((c) => !c.ok).length} of its rules`);
      for (const c of result.checks.filter((x) => !x.ok)) say(`  ${c.id} ${c.rule}: ${c.detail}`);
      if (!o.force || o.check) return;
    }
    const about = { title: block.title || model.title || stem, source: block.source, version };
    for (const format of formats) {
      const name = `${stem}-${number}.${format}`;
      if (o.check) {
        say(`would draw ${name} (${facts})`);
        continue;
      }
      mkdirSync(outDir, { recursive: true });
      const made = seq ? (format === 'svg' ? sequencePicture : sequencePage)(seq, lay, drawnIn, about) : format === 'svg' ? picture(model, lay, drawnIn, about) : page(model, lay, drawnIn, about);
      writeFileSync(join(outDir, name), made);
      say(`drew ${join(outDir, name)} (${facts})`);
    }
    drawn++;
  });

  if (broke && !o.force) return exits.brokeARule;
  if (!drawn) return say(`Nothing to draw: ${o.file} has no Mermaid flowchart or sequence diagram${o.only ? ` at block ${o.only}` : ''}.`), exits.nothingToDraw;
  return exits.drawn;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = await run(process.argv.slice(2));
