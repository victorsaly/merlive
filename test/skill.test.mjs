import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout } from '../skills/merlive/scripts/layout.mjs';
import { builtIn, designFrom } from '../skills/merlive/scripts/design.mjs';
import { page, picture } from '../skills/merlive/scripts/render.mjs';
import { setupPage } from '../skills/merlive/scripts/setup.mjs';
import { runtime } from '../skills/merlive/scripts/runtime.mjs';
import { run, version } from '../skills/merlive/scripts/merlive.mjs';

// The skill as an agent reads it, the version as people read it, and the examples as they are kept: all checked
// as files.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (/** @type {string} */ path) => readFileSync(join(root, path), 'utf8');
const skill = 'skills/merlive';

const [, front, body] = read(`${skill}/SKILL.md`).match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
const field = (/** @type {string} */ key) => front?.match(new RegExp(`^${key}: (.*)$`, 'm'))?.[1];
const linksOf = (/** @type {string} */ text) => [...text.matchAll(/\]\(([^)#\s]+)/g)].map((m) => m[1]).filter((to) => !/^[a-z]+:/i.test(to));

describe('SKILL.md', () => {
  it('has a name the agents take: the folder, lowercase, digits and dashes, at most 64', () => {
    const name = field('name') ?? '';
    assert.equal(name, 'merlive');
    assert.match(name, /^[a-z0-9-]{1,64}$/);
    assert.doesNotMatch(name, /anthropic|claude/);
  });

  it('says what it does and when to use it, in at most 1024 characters and no tags', () => {
    const description = field('description') ?? '';
    assert.ok(description.length > 0 && description.length <= 1024, `${description.length} characters`);
    assert.doesNotMatch(description, /<[^>]+>/);
    assert.match(description, /\bUse when\b/);
  });

  it('is short enough to read whole: under 500 lines and 20,000 bytes', () => {
    assert.ok(body.split('\n').length < 500);
    assert.ok(Buffer.byteLength(read(`${skill}/SKILL.md`)) <= 20_000);
  });

  it('links only to files that are there, each one step from SKILL.md', () => {
    for (const to of linksOf(body)) {
      assert.ok(existsSync(join(root, skill, to)), `${to} is in ${skill}/`);
      if (to.endsWith('.md')) assert.deepEqual(linksOf(read(`${skill}/${to}`)), [], `${to} links on`);
    }
  });

  it('runs only its own scripts, and has no dependencies', () => {
    assert.equal(field('allowed-tools'), 'Bash(node ${CLAUDE_SKILL_DIR}/scripts/*)');
    assert.equal(existsSync(join(root, skill, 'package.json')), false);
    assert.equal(JSON.parse(read('package.json')).dependencies, undefined);
  });

  it('names every option the command has', () => {
    for (const option of ['--setup', '--from', '--check', '--out', '--only', '--format svg', '--design', '--force']) assert.ok(body.includes(option), option);
  });
});

describe('one version everywhere', () => {
  it('is the same in the command, the plugin, SKILL.md, the README badge and the top of the changelog', () => {
    assert.equal(JSON.parse(read('.claude-plugin/plugin.json')).version, version);
    assert.equal(read(`${skill}/SKILL.md`).match(/^ {2}version: (.*)$/m)?.[1], version);
    assert.ok(read('README.md').includes(`badge/version-${version}-`));
    assert.equal(read('CHANGELOG.md').match(/^## (\S+)/m)?.[1], version);
  });
});

describe('the rules, in the docs and in the code', () => {
  it('has a heading in docs/PLACEMENT.md for every check, and names each in reference.md', () => {
    const rules = read('docs/PLACEMENT.md'), reference = read(`${skill}/reference.md`);
    for (const id of ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'D1', 'D2']) {
      assert.match(rules, new RegExp(`^## ${id}\\. `, 'm'), id);
      assert.ok(reference.includes(`${id} `), id);
    }
  });
});

describe('what is drawn', () => {
  const src = 'flowchart TD\nA([Start]) --> B{Ready?}\nB -->|Yes| C[Go <now>]\nB -.->|No| A\n%% note C: Say "go" & leave.\n%% step: All | A>B>C | The way through.';
  const model = parse(src);
  const lay = layout(model);

  it('is a page with every box and link, words made safe, and the steps', () => {
    const html = page(model, lay, builtIn, { title: 'A <test>', source: src, version });
    assert.match(html, /^<!doctype html>/);
    assert.ok(html.includes('<title>A &lt;test&gt;</title>'));
    assert.equal(html.match(/class="mv-node"/g)?.length, 3);
    assert.equal(html.match(/class="mv-edge"/g)?.length, 3);
    assert.ok(html.includes('Go &lt;now&gt;'));
    assert.ok(html.includes('data-style="dotted"'));
    assert.ok(html.includes('id="mv-next"'));
    assert.ok(html.includes('"kindName":"Start or end"'), 'a box says its kind in words, not only in colour');
    assert.ok(html.includes('prefers-color-scheme:dark'));
    assert.ok(html.includes(`content="Merlive ${version}"`));
    assert.doesNotMatch(html.slice(html.indexOf('<script>')), /<\/script>[\s\S]*<\/script>/, 'nothing in the data ends the script early');
  });

  it('has no step buttons when there are no steps, and no dark look when the design has none', () => {
    const plain = parse('flowchart TD\nA --> B');
    const html = page(plain, layout(plain), designFrom({ light: { accent: '#0a5cc2' } }), { title: 'Plain', source: '', version });
    assert.equal(html.includes('id="mv-next"'), false);
    assert.equal(html.includes('prefers-color-scheme:dark'), false);
  });

  it('is a picture with the same boxes and no script', () => {
    const svg = picture(model, lay, designFrom({ radius: 22 }), { title: 'A <test>' });
    assert.equal(svg.match(/class="mv-node"/g)?.length, 3);
    assert.doesNotMatch(svg, /<script|tabindex/);
    assert.ok(svg.includes('rx="22"'), 'the corner the design asks for');
  });

  it('hands the page a function that needs nothing from outside itself', () => {
    const source = runtime.toString();
    assert.doesNotMatch(source, /\bimport\b|\brequire\(/);
    // It must parse on its own, as the page will read it.
    assert.doesNotThrow(() => new Function(`return (${source})`));
  });
});

describe('the setup page', () => {
  const model = parse('flowchart TD\nA([Start]) --> B{Ready?}\nB -->|Yes| C[Go]:::rework');
  const html = setupPage({ model, lay: layout(model), design: builtIn, said: { found: ['page <#fff>'], changed: [], made: ['lines'] }, sums: read(`${skill}/scripts/design.mjs`), wrote: true });

  it('shows the diagram in light and in dark, with what was read made safe', () => {
    assert.equal(html.match(/class="mv-look"/g)?.length, 2);
    assert.equal(html.match(/class="mv-node"/g)?.length, 6);
    assert.ok(html.includes('page &lt;#fff&gt;'));
    assert.doesNotMatch(html, /(src|href)="https?:/);
  });

  it('offers every choice a project has: modes, motion, what is written, what a page carries, corner and colours', () => {
    for (const name of ['modes', 'motion', 'format']) assert.ok(html.includes(`name="${name}"`), name);
    for (const id of ['steps', 'legend', 'source', 'radius', 'settings', 'copy']) assert.ok(html.includes(`id="${id}"`), id);
    assert.ok(html.includes('type="color"'));
  });

  it("carries the colour rules themselves, so the page and the command say the same", () => {
    const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
    assert.ok(script.includes('function colourChecks'));
    assert.doesNotMatch(script, /^export /m);
    assert.doesNotThrow(() => new Function(script));
  });
});

describe('the examples', () => {
  it('are what the command draws today from examples/order-approval.md', async () => {
    for (const format of ['html', 'svg']) {
      /** @type {string[]} */
      const said = [];
      // --check proves they still pass; the kept files are compared with a fresh drawing below.
      assert.equal(await run(['examples/order-approval.md', '--check', '--format', format], { cwd: root, say: (l) => said.push(l) }), 0);
    }
    const md = read('examples/order-approval.md');
    const block = md.split('```mermaid\n')[1].split('\n```')[0];
    const model = parse(block);
    assert.equal(read('examples/diagrams/order-approval-1.svg'), picture(model, layout(model), builtIn, { title: 'Purchase order approval' }));
    assert.equal(read('examples/diagrams/order-approval-1.html'), page(model, layout(model), builtIn, { title: 'Purchase order approval', source: block, version }));
  });
});
