import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout, roomFor } from '../skills/merlive/scripts/layout.mjs';
import { builtIn, designFrom, designWith } from '../skills/merlive/scripts/design.mjs';
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
    assert.equal(html.match(/class="mv-edge[ "]/g)?.length, 3);
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

  it('draws each shape as its author chose it, and what their own style said of a box and a link', () => {
    const shaped = parse('flowchart TD\nA{Ask} --> B[(Orders)] --> C[[Sub]]\nC --> D[/In/] --> E(((End)))\nstyle C stroke:#c00,stroke-width:3px,stroke-dasharray: 5 5\nlinkStyle 0 stroke:#00c,stroke-width:4px');
    const svg = picture(shaped, layout(shaped), designWith(builtIn, shaped), { title: 'Shapes' });
    const box = (/** @type {string} */ id) => svg.match(new RegExp(`<g class="mv-node" data-node="${id}"[^]*?</g>`))?.[0] ?? '';
    assert.match(box('A'), /<polygon class="mv-shape" points="(\S+ ){3}\S+"\/>/, 'a rhombus has four corners');
    assert.match(box('B'), /<path class="mv-shape" d="M[^"]*A[^"]*"\/><path class="mv-shape mv-detail"/, 'a cylinder has a curved top and a rim');
    assert.match(box('C'), /data-kind="red" data-outline="dashed heavy"/);
    assert.match(box('C'), /<rect class="mv-shape"[^>]*\/><path class="mv-shape mv-detail"/, 'a subroutine has its two rails');
    assert.equal(box('E').match(/mv-pill/g)?.length, 2, 'a double circle has two lines');
    assert.match(svg, /<g class="mv-edge[^"]*" data-edge="A-B" data-style="thick" data-kind="blue">/);
    assert.match(svg, /\[data-kind="blue"\] \.mv-line,/);
    assert.match(svg, /--mv-k-red:#[0-9a-f]{6}/, 'the red is the design\'s own');
  });

  it('brings every line to the outline of the shape it meets', () => {
    const m = parse('flowchart TD\nA{Ask} -->|Yes| B[One]\nA -->|No| C[Two]\nA -->|Maybe| D[Three]\nB & C & D --> E{End?}');
    const lay = layout(m);
    for (const e of m.edges) {
      for (const [p, id] of /** @type {const} */ ([[lay.edges[e.id].points[0], e.from], [lay.edges[e.id].points.at(-1), e.to]])) {
        if (m.nodes.find((n) => n.id === id)?.shape !== 'diamond' || !p) continue;
        const b = lay.nodes[id];
        // On a rhombus, how far a point is from the middle, across and up, adds to one.
        assert.ok(Math.abs(Math.abs(p.x - b.x) / (b.w / 2) + Math.abs(p.y - b.y) / (b.h / 2) - 1) < 0.02, `${e.id} at ${id}: ${p.x},${p.y}`);
      }
    }
  });

  it('draws an icon beside the words of its box, and gives the words less room for it', () => {
    const iconed = parse('flowchart LR\nA["fa:fa-truck Shipped to the customer"] --> B[Shipped to the customer]');
    const lay = layout(iconed), svg = picture(iconed, lay, builtIn, { title: 'Icons' });
    const box = (/** @type {string} */ id) => svg.match(new RegExp(`<g class="mv-node" data-node="${id}"[^]*?</g>`))?.[0] ?? '';
    assert.match(box('A'), /<path class="mv-icon" transform="translate\([\d.]+,[\d.]+\)" d="M[^"]+"\/>/);
    assert.doesNotMatch(box('B'), /mv-icon/);
    assert.match(svg, /\.mv-icon\{fill:none;stroke:var\(--mv-text\)/);
    const x = (/** @type {string} */ id) => Number(box(id).match(/<tspan x="([\d.]+)"/)?.[1]);
    assert.ok(x('A') - lay.nodes.A.x > 5 && x('B') === lay.nodes.B.x, 'the words move over to make room, and only where there is an icon');
    assert.ok(roomFor(iconed.nodes[0], 192) < roomFor(iconed.nodes[1], 192));
  });

  it('draws what is at each end of a link: an arrowhead, a circle or a cross, at either end or both', () => {
    const ends = parse('flowchart LR\nA <--> B\nB --o C\nC x--x D\nD --- E');
    const svg = picture(ends, layout(ends), builtIn, { title: 'Ends' });
    const link = (/** @type {string} */ id) => svg.match(new RegExp(`<g class="mv-edge[^"]*" data-edge="${id}"[^]*?</g>`))?.[0] ?? '';
    assert.equal(link('A-B').match(/<polygon class="mv-head"/g)?.length, 2);
    assert.equal(link('B-C').match(/<circle class="mv-head"/g)?.length, 1);
    assert.equal(link('C-D').match(/class="mv-cross"/g)?.length, 2);
    assert.ok(link('D-E') && !/mv-head|mv-cross/.test(link('D-E')));
    assert.match(svg, /\.mv-cross\{/);
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
    for (const name of ['modes', 'motion', 'format', 'depth', 'ground']) assert.ok(html.includes(`name="${name}"`), name);
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
