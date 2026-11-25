import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { blocksOf, parse } from '../skills/merlive/scripts/parse.mjs';
import { layout } from '../skills/merlive/scripts/layout.mjs';
import { builtIn } from '../skills/merlive/scripts/design.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';
import { page, picture } from '../skills/merlive/scripts/render.mjs';
import { readingOf } from '../skills/merlive/scripts/site.mjs';

// A diagram somebody really wrote: "the paper trail" on blog.victorsaly.com, as it stands in
// site/src/pages/how-it-works.astro. Everything Merlive got wrong the first time it met it is held here.
const trail = `flowchart LR
  accTitle: What every post folder holds
  accDescr: The origin feeds the structure; the structure feeds the versions and the image; every agent run on the thought is written to its ledger.
  O["origin/<br/>your words, never edited"] --> S["structure.md<br/>the point, cut three ways"]
  S --> V["versions/<br/>short · long · LinkedIn<br/>each with its why"]
  S --> IMG["image/<br/>the print and its prompt"]
  V --> SRC["sources.md<br/>every claim, every link"]
  V --> RD["road.md<br/>who ran, in what order,<br/>told what"]
  FB["feedback/<br/>your notes on the output"] -.-> V
  O -.->|"every run on it"| LG["ledger/<br/>each run, chained,<br/>never rewritten"]`;

describe('a real diagram: read', () => {
  const m = parse(trail);

  it('reads its eight boxes and seven links and has nothing to say about what it could not', () => {
    assert.deepEqual(m.nodes.map((n) => n.id), ['O', 'S', 'V', 'IMG', 'SRC', 'RD', 'FB', 'LG']);
    assert.equal(m.edges.length, 7);
    assert.deepEqual(m.warnings, []);
  });

  it('keeps what the picture is called and what it shows, for readers who cannot see it', () => {
    assert.equal(m.title, 'What every post folder holds');
    assert.match(m.describes, /^The origin feeds the structure; the structure .* written to its ledger\.$/);
  });

  it("keeps the lines an author broke a label into, and the label as one line of words", () => {
    assert.equal(m.nodes[0].label, 'origin/ your words, never edited');
    assert.deepEqual(m.nodes[0].breaks, ['origin/', 'your words, never edited']);
    assert.deepEqual(m.nodes[2].breaks, ['versions/', 'short · long · LinkedIn', 'each with its why']);
    assert.equal(parse('flowchart TD\nA[One line] --> B').nodes[0].breaks, undefined);
  });

  it('reads the words on a link that are in quotes', () => {
    assert.equal(m.edges.find((e) => e.id === 'O-LG')?.label, 'every run on it');
  });
});

describe('parse: what a real diagram taught it', () => {
  it('leaves no box behind from a line it could not read', () => {
    const m = parse('flowchart TD\nA --> B\nsomething: that is not a link');
    assert.deepEqual(m.nodes.map((n) => n.id), ['A', 'B']);
    assert.equal(m.warnings.length, 1);
  });

  it('does not cut a label at a ; inside its quotes', () => {
    const m = parse('flowchart TD\nA["first; second"] --> B; B --> C');
    assert.equal(m.nodes[0].label, 'first; second');
    assert.deepEqual(m.edges.map((e) => e.id), ['A-B', 'B-C']);
  });

  it('reads past a description written over several lines', () => {
    const m = parse('flowchart TD\naccDescr {\n  A long one;\n  on two lines\n}\nA --> B');
    assert.deepEqual(m.nodes.map((n) => n.id), ['A', 'B']);
    assert.equal(m.describes, 'A long one; on two lines');
    assert.deepEqual(m.warnings, []);
  });
});

describe('a real diagram: placed', () => {
  const m = parse(trail);
  const lay = layout(m);

  it('passes every rule, with no line through a box and none crossing', () => {
    const result = score(m, lay, builtIn);
    assert.deepEqual(result.checks.filter((c) => !c.ok).map((c) => `${c.id} ${c.detail}`), []);
    assert.equal(result.checks.find((c) => c.id === 'P4')?.detail, '0 crossings');
  });

  it('puts what feeds the main path on one side of it, and what leaves it on the other', () => {
    const spine = lay.nodes.O.y;
    assert.ok(lay.nodes.FB.y < spine, 'feedback feeds the versions');
    for (const id of ['IMG', 'RD', 'LG']) assert.ok(lay.nodes[id].y > spine, `${id} leaves the main path`);
  });

  it('brings a box that only feeds another in beside it, not back at the start', () => {
    assert.equal(lay.nodes.FB.rank, lay.nodes.V.rank - 1);
  });

  it("gives every box the lines its author wrote, unwrapped, in one size of box", () => {
    assert.deepEqual(lay.nodes.RD.lines, ['road.md', 'who ran, in what order,', 'told what']);
    assert.equal(lay.nodes.RD.titled, true);
    assert.equal(new Set(Object.values(lay.nodes).map((n) => `${n.w}x${n.h}`)).size, 1);
  });
});

describe('layout: branching, which most real flows do', () => {
  const draw = (/** @type {string} */ src) => {
    const m = parse(src);
    const lay = layout(m);
    return { lay, result: score(m, lay, builtIn) };
  };

  it('fans three ways out of one box, and on again, with nothing crossing or passing through a box', () => {
    const { result } = draw('flowchart TD\nA[Start] --> B[One]\nA --> C[Two]\nA --> D[Three]\nB --> E[Four]\nC --> F[Five]\nD --> G[Six]\nB --> H[Seven]');
    assert.deepEqual(result.checks.filter((c) => !c.ok).map((c) => `${c.id} ${c.detail}`), []);
    assert.equal(result.checks.find((c) => c.id === 'P4')?.detail, '0 crossings');
  });

  it('brings several branches back into one box', () => {
    const { result } = draw('flowchart TD\nA{Which?} -->|a| B[One]\nA -->|b| C[Two]\nA -->|c| D[Three]\nB --> E[Together]\nC --> E\nD --> E\nE --> F[End]');
    assert.deepEqual(result.checks.filter((c) => !c.ok).map((c) => `${c.id} ${c.detail}`), []);
  });

  it('gives two lines that share the room between two ranks a track each', () => {
    const { lay } = draw('flowchart TD\nA --> B\nA --> C\nA --> D\nB --> E');
    const turns = ['A-C', 'A-D'].map((id) => lay.edges[id].points.find((p, i, all) => i > 0 && p.y === all[i - 1].y)?.y);
    assert.notEqual(turns[0], turns[1]);
  });
});

describe('a real diagram: drawn', () => {
  const m = parse(trail);
  const lay = layout(m);

  it("sets a box's first line apart from the lines under it when its author broke it", () => {
    const svg = picture(m, lay, builtIn, { title: m.title });
    assert.match(svg, /<tspan class="mv-first"[^>]*>origin\/<\/tspan><tspan class="mv-rest"[^>]*>your words, never edited<\/tspan>/);
    assert.doesNotMatch(picture(parse('flowchart TD\nA[Plain] --> B'), layout(parse('flowchart TD\nA[Plain] --> B')), builtIn, { title: '' }), /class="mv-first"/);
  });

  it('says what it is called and what it shows to a reader who cannot see it', () => {
    const svg = picture(m, lay, builtIn, { title: m.title });
    assert.ok(svg.includes('<title>What every post folder holds</title>'));
    assert.match(svg, /<desc>The origin feeds the structure; .*<\/desc>/);
    assert.match(page(m, lay, builtIn, { title: m.title, source: trail, version: '0' }), /<desc>The origin feeds/);
  });
});

describe('blocksOf: Mermaid kept in code', () => {
  it('finds a flowchart written as a string in a page or a script, with the line it starts on', () => {
    const astro = `---\nimport X from './X.astro';\nconst other = \`not a diagram\`;\nconst trail = \`flowchart LR\n  A --> B\`;\nconst second = \`graph TD\n  C --> D\`;\nconst made = \`flowchart TD\n  \${a} --> B\`;\n---\n<X source={trail} />`;
    assert.deepEqual(blocksOf(astro, 'code'), [
      { source: 'flowchart LR\n  A --> B', title: '', line: 4 },
      { source: 'graph TD\n  C --> D', title: '', line: 6 },
    ]);
  });
});

describe('readingOf: what a real site taught it', () => {
  it('takes a dark page written as :root:not([data-theme=light]) for the page it is', () => {
    const r = readingOf([":root{--paper:#ffffff;--ink:#000000} @media (prefers-color-scheme: dark){:root:not([data-theme='light']){--paper:#1c1c1c;--ink:#e6e6e6}} body{background:var(--paper);color:var(--ink)}"]);
    assert.equal(r.dark?.bg, '#1c1c1c');
  });

  it('does not take a switch that is not a theme (a second face, a density) for the page as it starts out', () => {
    const r = readingOf([":root{--paper:#fff;--ink:#000;--font:'Atkinson Hyperlegible', sans-serif} :root[data-face='switch']{--font:'Lexend', sans-serif} :root[data-theme='light']{--ink:#111111} body{background:var(--paper);color:var(--ink);font-family:var(--font)}"]);
    assert.equal(r.font, "'Atkinson Hyperlegible', sans-serif");
    assert.equal(r.light?.text, '#111111');
  });

  it('reads a face set through two tokens, one naming the other, from stylesheets read together', () => {
    const tokens = ":root{--paper:#fff;--ink:#000;--font-read:'Atkinson Hyperlegible', system-ui, sans-serif;--font:var(--font-read)}";
    const base = 'body{background:var(--paper);color:var(--ink);font-family:var(--font)}';
    assert.equal(readingOf([base, tokens]).font, "'Atkinson Hyperlegible', system-ui, sans-serif");
  });
});
