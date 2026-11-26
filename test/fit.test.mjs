import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout, measure, wrap } from '../skills/merlive/scripts/layout.mjs';
import { builtIn, designFrom } from '../skills/merlive/scripts/design.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';
import { draw, page } from '../skills/merlive/scripts/render.mjs';
import { designOf, readingOf } from '../skills/merlive/scripts/site.mjs';

// Diagrams somebody really wrote: docs/index.md and docs/running-the-app.md of a business analyst demo, drawn
// in that project's own design (a narrow hand-lettered face). What they showed was wrong is held here.
const where = `flowchart TB
  accTitle: What lives where
  NB["Course notebook<br/>where it was built"] -. "same tools and rulebook" .-> PK
  subgraph app["Demo app, on your laptop"]
    direction LR
    BR["Screens in<br/>your browser"] --> SV["Local server"] --> PK["analyst package<br/>tools · agent · cases"]
  end
  PK --> DB[("AdventureWorks<br/>read-only")]
  PK --> LLM["Groq or OpenAI<br/>(Live AI only)"]
  PK --> REC[("recordings")]
  REC --> WEB["Website on GitHub Pages<br/>(scripts/build_site.py)"]
  WEB -- "Ask chat only" --> CW["Cloudflare Worker"] --> OAI["OpenAI<br/>(the online Ask chat)"]
  classDef red stroke:#c62828,stroke-width:2px,color:#b71c1c
  class DB,REC red`;

const how = `flowchart LR
  accTitle: How the agent answers a question
  Q(["A manager's question"]) --> AI["The AI plans<br/>and picks a tool"]
  AI -- "calls" --> T["The tools<br/>get_schema · run_sql · run_python<br/>make_chart · detect_anomalies<br/>+ explain_change (stretch)"]
  T -- "reads only" --> DB[("AdventureWorks<br/>read-only")]
  T -- "result, or error + hint" --> AI
  AI --> A["Answer + chart"]
  T -- "tool log" --> S["The exact queries,<br/>under the answer"]
  classDef red stroke:#c62828,stroke-width:2px,color:#b71c1c
  class DB,S red`;

const modes = `flowchart LR
  accTitle: Which mode to use
  Q{"Showing it<br/>to people?"} -- "no, testing<br/>the screens" --> D["Dry run"]
  Q -- yes --> K{"AI key and<br/>wifi working?"}
  K -- yes --> L["Live AI"]
  K -- "no, or too slow" --> R["Replay"]
  L -. "every run is saved<br/>for Replay" .-> R
  classDef red stroke:#c62828,stroke-width:2px,color:#b71c1c
  class D red`;

const small = `flowchart TD
  A[Start] --> B[Check] --> C[Done]`;

const about = (/** @type {string} */ source) => ({ title: 'A diagram', source, version: '0' });
const drawn = (/** @type {string} */ src, design = builtIn) => {
  const m = parse(src);
  const lay = layout(m);
  return { m, lay, html: page(m, lay, design, about(src)), result: score(m, lay, design) };
};

describe('a drawing wider than the column beside the panel', () => {
  it('drops the panel above it, so no box hides behind the panel', () => {
    const { lay, html } = drawn(where);
    // Even shrunk as far as it may be, it does not fit beside a panel.
    assert.ok(lay.width * draw.leastScale > draw.column, `${lay.width} wide`);
    assert.match(html, /<div class="mv-layout mv-wide">/);
    assert.ok(html.indexOf('class="mv-side"') < html.indexOf('class="mv-stage"'), 'the panel comes first');
  });

  it('keeps the panel beside a drawing that fits', () => {
    const { lay, html } = drawn(small);
    assert.ok(lay.width * draw.leastScale <= draw.column);
    assert.match(html, /<div class="mv-layout">/);
    assert.ok(html.indexOf('class="mv-stage"') < html.indexOf('class="mv-side"'), 'the drawing comes first');
  });

  it('measures the column from the page it is on: the page less its padding, the panel and the gap', () => {
    assert.equal(draw.column, draw.page - 2 * draw.pagePad - draw.panel - draw.gap);
  });
});

describe("a link's words beside a line that runs along the flow", () => {
  it('are anchored at the side next to their line, so a narrow face does not leave them adrift', () => {
    const { lay, html } = drawn(how);
    const loop = Object.values(lay.edges).find((e) => e.label?.text === 'result, or error + hint');
    assert.ok(loop?.label?.align, 'the words beside the loop say which side holds them to the line');
    const l = /** @type {NonNullable<typeof loop.label>} */ (loop.label);
    const x = l.align === 'end' ? l.x + l.w / 2 : l.x - l.w / 2;
    assert.match(html, new RegExp(`<text class="mv-label" style="text-anchor:${l.align}"><tspan class="mv-label-line" x="${Math.round(x * 10) / 10}"`));
  });

  it('are still centred above or below a line that goes across', () => {
    const { lay } = drawn(how);
    const across = Object.values(lay.edges).find((e) => e.label && e.points.length === 2 && e.points[0].y === e.points[1].y);
    if (across) assert.equal(across.label?.align, undefined);
  });
});

describe("a link's words between two boxes of a left-to-right flow", () => {
  it('get the room to keep the lines they would wrap to anyway', () => {
    const { lay, result } = drawn(modes);
    const saved = /** @type {NonNullable<import('../skills/merlive/scripts/layout.mjs').Routed['label']>} */ (Object.values(lay.edges).find((e) => e.label?.text.startsWith('every run'))?.label);
    assert.ok(saved.lines.length <= wrap(saved.text, measure.labelWrap).length, `wrapped to ${saved.lines.length} lines: ${saved.lines.join(' / ')}`);
    assert.equal(result.checks.find((c) => c.id === 'P7')?.ok, true);
  });

  it('are held to it by P7: words squeezed into more lines than they wrap to break the rule', () => {
    const { m, lay } = drawn(modes);
    const e = /** @type {any} */ (Object.values(lay.edges).find((x) => x.label?.text.startsWith('every run')));
    e.label = { ...e.label, lines: ['every', 'run is', 'saved', 'for', 'Replay'] };
    const p7 = score(m, lay, builtIn).checks.find((c) => c.id === 'P7');
    assert.equal(p7?.ok, false);
    assert.match(p7?.detail ?? '', /"every run is saved for Replay" is squeezed into 5 lines/);
  });
});

describe('what a kind of box means, said by its author', () => {
  it('names the kind in the legend and when a box is picked', () => {
    const m = parse(`${where}\n  %% kind red: Read-only data`);
    assert.equal(m.meanings?.red, 'Read-only data');
    const html = page(m, layout(m), builtIn, about(where));
    assert.match(html, /<\/i>Read-only data<\/span>/);
    assert.doesNotMatch(html, /<\/i>Red<\/span>/);
    assert.match(html, /"kindName":"Read-only data"/);
  });

  it('says when a kind is named only for its colour, and how to say what it means', () => {
    const m = parse(where);
    assert.ok(m.warnings.some((w) => /the kind "red" says only its colour/.test(w) && /%% kind red: /.test(w)), m.warnings.join('\n'));
  });

  it('says nothing of a kind named for what it is', () => {
    const m = parse('flowchart TD\n  A --> B\n  classDef risky stroke:#c62828\n  class B risky');
    assert.deepEqual(m.warnings, []);
  });

  it('says when a meaning is given for a kind no box has', () => {
    const m = parse(`${small}\n  %% kind red: Read-only data`);
    assert.ok(m.warnings.some((w) => /kind red: no box is of that kind/.test(w)));
  });
});

describe("a site's face for code", () => {
  const sheet = `:root { --typed: "Courier Prime", "Courier New", monospace; --paper: #fcfbf7; --ink: #1e3a8a; }
body { background: var(--paper); color: var(--ink); font-family: "Patrick Hand", cursive; }
code { font-family: var(--typed); }`;

  it('is read from what code and pre are set in', () => {
    assert.equal(readingOf([sheet]).mono, '"Courier Prime", "Courier New", monospace');
  });

  it('goes into the design file, ending in a face every reader has', () => {
    const { file, said } = designOf(readingOf([sheet]), { name: 'demo', from: 'app/web' });
    assert.equal(file.mono, '"Courier Prime", "Courier New", monospace');
    assert.ok(said.found.some((s) => /code in "Courier Prime"/.test(s)), said.found.join('\n'));
    const bare = designOf(readingOf([sheet.replace(', monospace', '')]), { name: 'demo', from: 'app/web' }).file;
    assert.match(String(bare.mono), /, ui-monospace, monospace$/);
  });

  it('sets the Mermaid source and the rows a box lists', () => {
    const design = designFrom({ mono: '"Courier Prime", monospace' });
    const html = drawn(small, design).html;
    assert.match(html, /pre\{margin:8px 0 0;font:12px\/1\.55 "Courier Prime", monospace;/);
    assert.match(html, /\.mv-node \.mv-rows\{font-family:"Courier Prime", monospace;/);
    assert.doesNotMatch(html, /SFMono/);
  });

  it("is Merlive's own when the design names none", () => {
    assert.match(builtIn.mono, /monospace$/);
    assert.match(drawn(small).html, new RegExp(`font:12px/1\\.55 ${builtIn.mono.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')};`));
  });

  it('is held to what a list of faces can hold', () => {
    assert.throws(() => designFrom({ mono: 'x;}body{color:red' }), /mono must be a list of faces/);
  });
});
