import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { blocksOf, parse } from '../skills/merlive/scripts/parse.mjs';
import { layout } from '../skills/merlive/scripts/layout.mjs';
import { builtIn, designFrom, designWith } from '../skills/merlive/scripts/design.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';
import { page, picture } from '../skills/merlive/scripts/render.mjs';
import { designOf, readingOf } from '../skills/merlive/scripts/site.mjs';

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
    // Left to right this flow is wider than a screen, so it is drawn top to bottom, and "beside" is left and right.
    assert.equal(lay.direction, 'TD');
    const spine = lay.nodes.O.x;
    assert.ok(lay.nodes.FB.x < spine, 'feedback feeds the versions');
    for (const id of ['IMG', 'RD', 'LG']) assert.ok(lay.nodes[id].x > spine, `${id} leaves the main path`);
  });

  it('brings a box that only feeds another in beside it, not back at the start', () => {
    assert.equal(lay.nodes.FB.rank, lay.nodes.V.rank - 1);
  });

  it("gives every box the lines its author wrote, unwrapped, in one size of box", () => {
    assert.deepEqual(lay.nodes.RD.lines, ['road.md', 'who ran, in what order,', 'told what']);
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

  it("draws a box's lines as its author broke them, none louder than another", () => {
    const svg = picture(m, lay, builtIn, { title: m.title });
    assert.match(svg, /<tspan x="[\d.]+" y="[\d.]+">origin\/<\/tspan><tspan x="[\d.]+" y="[\d.]+">your words, never edited<\/tspan>/);
    assert.doesNotMatch(svg, /mv-first|mv-rest/);
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

// More diagrams somebody really wrote: the docs of victorsaly/business-analyst-agent-demo, as they stand.
const answers = `flowchart LR
  accTitle: How the agent answers a question
  Q(["A manager's question"]) --> AI["The AI plans<br/>and picks a tool"]
  AI -- "calls" --> T["The tools<br/>get_schema · run_sql · run_python<br/>make_chart · detect_anomalies<br/>+ explain_change (stretch)"]
  T -- "reads only" --> DB[("AdventureWorks<br/>read-only")]
  T -- "result, or error + hint" --> AI
  AI --> A["Answer + chart"]
  T -- "tool log" --> S["The exact queries,<br/>under the answer"]
  classDef red stroke:#c62828,stroke-width:2px,color:#b71c1c
  class DB,S red`;

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

const modes = `flowchart LR
  accTitle: Who sees what on the day
  T["Presenting team"] --> M{"Mode"}
  M -- "AI and wifi working" --> L["Live AI<br/>Groq, then OpenAI"]
  M -- "AI or wifi fails" --> R["Replay of a<br/>recorded live run"]
  M -- "testing only" --> D["Dry run<br/>labelled in red"]
  L --> J["Judges, on the projector<br/>(6 min demo, 2 min Q&A)"]
  R --> J
  R --> V["Narrated video"] --> J
  classDef red stroke:#c62828,stroke-width:2px,color:#b71c1c
  class D red`;

const service = `flowchart LR
  accTitle: Which AI service answers
  A["A question"] --> P{"LLM_PROVIDER<br/>set to openai?"}
  P -- yes --> O["OpenAI"]
  P -- no --> G["Groq"]
  G -- "daily limit<br/>or credit gone" --> O
  G --> ANS["Answer, with the model<br/>named in the footer"]
  O --> ANS
  G -- "no key at all" --> N["Live AI stops;<br/>Replay and Dry run still work"]
  classDef red stroke:#c62828,stroke-width:2px,color:#b71c1c
  class N red`;

const steps = `flowchart TB
  accTitle: The 13 steps in order
  subgraph g1["Get ready"]
    direction LR
    S0["0 · Get set up"] --> S1["1 · Stop old cells<br/>wasting the allowance"] --> S2["2 · Load<br/>AdventureWorks"]
  end
  subgraph g2["Build the agent"]
    direction LR
    S3["3 · Five tools"] --> S4["4 · Volume / price / mix<br/>(stretch)"] --> S5["5 · Tool menu cards"] --> S6["6 · Rulebook"]
  end
  subgraph g3["Show it works"]
    S7["7 · Switch over,<br/>show its working"] --> S8["8 · New scorecard"]
  end
  g1 --> g2 --> g3
  classDef red stroke:#c62828,stroke-width:2px,color:#b71c1c
  class S6 red`;

const passes = (/** @type {string} */ src, design = builtIn) => {
  const m = parse(src);
  const lay = layout(m);
  return { m, lay, broken: score(m, lay, designWith(design, m)).checks.filter((c) => !c.ok).map((c) => `${c.id} ${c.detail}`) };
};

describe('more real diagrams: read', () => {
  it('reads the words on a link written between its dashes, in quotes or not, with a line break or not', () => {
    const m = parse(service);
    assert.deepEqual(m.warnings, ['the kind "red" says only its colour, so the legend says "red" too: "%% kind red: what it means" names it there']); // its author named the kind for its colour
    assert.deepEqual(m.edges.map((e) => [e.id, e.label]), [
      ['A-P', ''], ['P-O', 'yes'], ['P-G', 'no'], ['G-O', 'daily limit or credit gone'], ['G-ANS', ''], ['O-ANS', ''], ['G-N', 'no key at all'],
    ]);
  });

  it('reads a dotted link with words, a thick one, and arrows drawn longer', () => {
    const m = parse('flowchart TD\nA -. "saved for later" .-> B\nB == "must" ==> C\nC ---> D\nD -..-> E\nE -. maybe .-> F');
    assert.deepEqual(m.warnings, []);
    assert.deepEqual(m.edges.map((e) => [e.style, e.label]), [['dotted', 'saved for later'], ['thick', 'must'], ['solid', ''], ['dotted', ''], ['dotted', 'maybe']]);
  });

  it('reads a store of data, the cylinder, as a cylinder of the data kind', () => {
    const m = parse('flowchart TD\nA --> DB[("AdventureWorks<br/>read-only")]');
    assert.deepEqual([m.nodes[1].label, m.nodes[1].shape, m.nodes[1].kind], ['AdventureWorks read-only', 'cylinder', 'data']);
  });

  it("keeps the colour an author gave a class, to find what it means", () => {
    assert.deepEqual(parse(answers).classes, { red: '#c62828' });
    assert.deepEqual(parse('flowchart TD\nA --> B\nclassDef warm fill:#f96\nclassDef plain stroke-width:2px').classes, { warm: '#ff9966' });
  });

  it('reads groups: what each is called, the boxes in it, and a link between two groups as a link from the end of one to the start of the next', () => {
    const m = parse(steps);
    assert.deepEqual(m.warnings, ['the kind "red" says only its colour, so the legend says "red" too: "%% kind red: what it means" names it there']); // its author named the kind for its colour
    assert.deepEqual(m.groups, [
      { id: 'g1', title: 'Get ready', members: ['S0', 'S1', 'S2'] },
      { id: 'g2', title: 'Build the agent', members: ['S3', 'S4', 'S5', 'S6'] },
      { id: 'g3', title: 'Show it works', members: ['S7', 'S8'] },
    ]);
    assert.equal(m.nodes.length, 9, 'a group is not a box');
    assert.ok(m.edges.some((e) => e.id === 'S2-S3') && m.edges.some((e) => e.id === 'S6-S7'));
  });

  it('puts a box named before its group opens in the group that then uses it', () => {
    const m = parse(where);
    assert.deepEqual(m.groups, [{ id: 'app', title: 'Demo app, on your laptop', members: ['BR', 'SV', 'PK'] }]);
    assert.deepEqual(m.warnings, ['the kind "red" says only its colour, so the legend says "red" too: "%% kind red: what it means" names it there']); // its author named the kind for its colour
  });

  it('reads a group named by its title alone, and a group inside another as its own, held by the outer one', () => {
    assert.deepEqual(parse('flowchart TD\nsubgraph Back office\nA --> B\nend').groups, [{ id: 'Back office', title: 'Back office', members: ['A', 'B'] }]);
    const nested = parse('flowchart TD\nsubgraph one\nA --> B\nsubgraph two\nC --> D\nsubgraph three\nE\nend\nend\nB --> two\nend\nX --> one');
    assert.deepEqual(nested.groups, [
      { id: 'one', title: 'one', members: ['A', 'B', 'C', 'D', 'E'] },
      { id: 'two', title: 'two', members: ['C', 'D', 'E'], parent: 'one' },
      { id: 'three', title: 'three', members: ['E'], parent: 'two' },
    ]);
    assert.deepEqual(nested.edges.map((e) => e.id), ['A-B', 'C-D', 'B-C', 'X-A'], 'a link to a group goes to where it starts, inner or outer');
    assert.deepEqual(nested.warnings, []);
  });

  it('leaves nothing in any group of a line inside two groups that it could not read', () => {
    const m = parse('flowchart TD\nsubgraph one\nsubgraph two\nA --> B\nC ~~> D\nend\nend');
    assert.deepEqual(m.groups.map((g) => g.members), [['A', 'B'], ['A', 'B']]);
  });
});

describe('more real diagrams: placed', () => {
  it('passes every rule for each of them', () => {
    for (const [name, src] of Object.entries({ answers, where, modes, service, steps })) assert.deepEqual(passes(src).broken, [], name);
  });

  it('gives a box up to four lines when its author wrote four, in a box wide enough for each', () => {
    const { lay } = passes(answers);
    assert.deepEqual(lay.nodes.T.lines, ['The tools', 'get_schema · run_sql · run_python', 'make_chart · detect_anomalies', '+ explain_change (stretch)']);
  });

  it("puts a link's words where they sit on no box and on no other words, wrapped when they are long", () => {
    const { lay } = passes(modes);
    const labels = Object.values(lay.edges).flatMap((e) => (e.label ? [e.label] : []));
    assert.equal(labels.length, 3);
    assert.deepEqual(lay.edges['M-L'].label?.lines, ['AI and wifi working']);
    assert.deepEqual(passes('flowchart TD\nA -->|a label that goes on for rather a while| B').lay.edges['A-B'].label?.lines.length, 2);
  });

  it('draws a frame round a group that holds its own boxes and no others, with its title', () => {
    const { lay } = passes(steps);
    assert.deepEqual(lay.groups.map((g) => g.title), ['Get ready', 'Build the agent', 'Show it works']);
    for (const g of lay.groups) {
      const inside = (/** @type {{x:number,y:number,w:number,h:number}} */ n) => n.x - n.w / 2 >= g.x && n.x + n.w / 2 <= g.x + g.w && n.y - n.h / 2 >= g.y && n.y + n.h / 2 <= g.y + g.h;
      const members = new Set(parse(steps).groups.find((x) => x.id === g.id)?.members);
      for (const n of Object.values(lay.nodes)) assert.equal(inside(n), members.has(n.id), `${n.id} and ${g.id}`);
    }
    assert.deepEqual(lay.warnings, []);
  });

  it('leaves a frame out, and says so, when a box that is not in the group would fall inside it', () => {
    const { lay } = passes('flowchart TD\nsubgraph g[Group]\nA --> C\nend\nA --> B\nB --> C');
    assert.deepEqual(lay.groups, []);
    assert.match(lay.warnings[0], /the frame of "Group" is left out: "B" is not in it and would fall inside/);
  });
});

describe('more real diagrams: drawn', () => {
  it("gives a class the design does not know the design's nearest colour to the one its author chose", () => {
    const m = parse(answers);
    const d = designWith(builtIn, m);
    assert.equal(d.light.kinds.red, builtIn.light.kinds.risk);
    assert.equal(d.dark?.kinds.red, builtIn.dark?.kinds.risk);
    assert.equal(designWith(builtIn, parse('flowchart TD\nA --> B')), builtIn);
    assert.match(picture(m, layout(m), d, { title: m.title }), /--mv-k-red:#7a1f12/);
  });

  it("draws a group's frame behind its boxes, with its title, and a link's words in the lines they were wrapped to", () => {
    const m = parse(steps);
    const svg = picture(m, layout(m), builtIn, { title: m.title });
    assert.equal(svg.match(/class="mv-group"/g)?.length, 3);
    assert.ok(svg.indexOf('class="mv-group"') < svg.indexOf('class="mv-node"'));
    assert.ok(svg.includes('>Build the agent</text>'));
    const long = parse('flowchart TD\nA -->|a label that goes on for rather a while| B');
    assert.equal(picture(long, layout(long), builtIn, { title: '' }).match(/<tspan class="mv-label-line"/g)?.length, 2);
  });
});

describe('character: what a diagram looks like says something', () => {
  const m = parse(trail);
  const lay = layout(m);
  const svg = picture(m, lay, builtIn, { title: m.title });
  const quiet = picture(m, lay, designFrom({ depth: 'flat', ground: 'plain' }), { title: m.title });

  it('draws the main path heavier than what branches off it, so it is read first', () => {
    assert.equal(svg.match(/class="mv-edge mv-main"/g)?.length, lay.spine.length - 1);
    assert.equal(svg.match(/class="mv-edge"/g)?.length, m.edges.length - (lay.spine.length - 1));
    assert.match(svg, /\.mv-main \.mv-line\{[^}]*stroke-width:2\.4/);
  });

  it("sets the boxes on a ground of dots, the grid they are placed on, and lifts them off it with a shadow, in Merlive's own look", () => {
    assert.match(svg, /<pattern id="mv-dots"/);
    assert.match(svg, /class="mv-ground"[^>]*fill="url\(#mv-dots\)"/);
    assert.match(svg, /\.mv-node\{filter:drop-shadow\(/);
    assert.match(svg, /--mv-dot:#[0-9a-f]{6}/);
  });

  it('spreads the dots over the whole stage of a live page, not only behind the drawing', () => {
    const html = page(m, lay, builtIn, { title: m.title, source: trail, version: '0' });
    assert.match(html, /\.mv-stage\{[^}]*radial-gradient\(var\(--mv-dot\)/);
    assert.doesNotMatch(html, /mv-dots/);
    assert.doesNotMatch(page(m, lay, designFrom({ ground: 'plain' }), { title: m.title, source: trail, version: '0' }), /radial-gradient/);
  });

  it('leaves the ground plain and the boxes flat when the design says so', () => {
    assert.doesNotMatch(quiet, /mv-dots|drop-shadow/);
  });

  it('marks a box of a kind with a stripe of its colour down its edge, and leaves a plain box, a decision and a start or end without one', () => {
    const kinds = parse('flowchart TD\nA([Start]) --> B{Ready?}\nB --> C[Fix it]:::rework\nB --> D[Plain]');
    const drawn = picture(kinds, layout(kinds), builtIn, { title: '' });
    assert.equal(drawn.match(/class="mv-stripe"/g)?.length, 1);
    assert.match(drawn, /data-kind="rework"[^>]*>.*?class="mv-stripe"/);
  });

  it("gives a group's frame a faint fill, so it reads as a place", () => {
    const g = parse(steps);
    assert.match(picture(g, layout(g), builtIn, { title: '' }), /\.mv-group rect\{fill:var\(--mv-group\)/);
  });
});

describe('character: a design says how much', () => {
  it("is dots and a soft shadow in Merlive's own look, and refuses what is neither", () => {
    assert.deepEqual([builtIn.ground, builtIn.depth], ['dots', 'soft']);
    assert.throws(() => designFrom({ depth: 'huge' }), /depth must be flat or soft/);
    assert.throws(() => designFrom({ ground: 'stripes' }), /ground must be plain or dots/);
  });

  it('follows the site: a shadow where the site has shadows, flat where it has none, and a plain ground either way', () => {
    const flat = designFrom(designOf(readingOf(['body{background:#fff;color:#000} .card{border:1px solid}']), { name: 'ink', from: 'x' }).file);
    const soft = designFrom(designOf(readingOf(['body{background:#fff;color:#000} .card{box-shadow:0 2px 8px rgba(0,0,0,.1)} .x{box-shadow:none}']), { name: 'soft', from: 'x' }).file);
    assert.deepEqual([flat.depth, flat.ground], ['flat', 'plain']);
    assert.deepEqual([soft.depth, soft.ground], ['soft', 'plain']);
  });
});
