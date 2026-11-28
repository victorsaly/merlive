// Why: a state diagram is boxes and links, so it is read into the model a flowchart gives and placed by the
// same rules. These hold the reading; the placement has its own tests, and is asked here only whether a real
// state diagram passes every rule.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout, measure } from '../skills/merlive/scripts/layout.mjs';
import { builtIn, designWith } from '../skills/merlive/scripts/design.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';
import { exits, help, run } from '../skills/merlive/scripts/merlive.mjs';
import { page, picture } from '../skills/merlive/scripts/render.mjs';
import { form } from '../skills/merlive/scripts/shapes.mjs';

const state = (/** @type {string} */ body, head = 'stateDiagram-v2') => parse(`${head}\n${body}`);
const boxes = (/** @type {import('../skills/merlive/scripts/parse.mjs').Model} */ m) => m.nodes.map((n) => [n.id, n.label, n.shape, n.kind]);
const links = (/** @type {import('../skills/merlive/scripts/parse.mjs').Model} */ m) => m.edges.map((e) => [e.id, e.label]);

describe('state: what it is taken for', () => {
  it('is read as boxes and links, whichever way it is declared', () => {
    for (const head of ['stateDiagram-v2', 'stateDiagram']) {
      const m = state('Draft --> Submitted', head);
      assert.equal(m.type, 'flowchart');
      assert.equal(m.kindOfDiagram, head);
      assert.deepEqual(links(m), [['Draft-Submitted', '']]);
      assert.deepEqual(m.warnings, []);
    }
  });

  it('is found behind front matter, with its title kept', () => {
    const m = parse('---\ntitle: An order\n---\nstateDiagram-v2\n  Draft --> Submitted');
    assert.equal(m.title, 'An order');
    assert.equal(m.nodes.length, 2);
  });

  it('leaves a flowchart a flowchart: "A --> B : words" is not a link there', () => {
    assert.match(parse('flowchart TD\nA --> B : words').warnings[0], /^line 2: not read/);
  });
});

describe('state: states', () => {
  it('reads a state by its id, by "state words as id", and by "id : words"', () => {
    const m = state('Draft\nstate "Waiting for a manager" as Submitted\nApproved : Approved by a manager');
    assert.deepEqual(boxes(m), [['Draft', 'Draft', 'box', 'step'], ['Submitted', 'Waiting for a manager', 'box', 'step'], ['Approved', 'Approved by a manager', 'box', 'step']]);
    assert.deepEqual(m.warnings, []);
  });

  it('gives words to a state named before or after they are written', () => {
    const m = state('Draft --> Submitted\nSubmitted : Waiting for a manager\nDraft : Being written');
    assert.deepEqual(m.nodes.map((n) => n.label), ['Being written', 'Waiting for a manager']);
  });

  it('keeps a description written over several lines as its author broke it', () => {
    const m = state('Submitted : Waiting\nSubmitted : for a manager');
    assert.deepEqual([m.nodes[0].label, m.nodes[0].breaks], ['Waiting for a manager', ['Waiting', 'for a manager']]);
  });

  it('reads entity codes in words, as a flowchart does', () => {
    assert.equal(state('Held : On hold #amp; waiting').nodes[0].label, 'On hold & waiting');
  });
});

describe('state: transitions', () => {
  it('reads a transition with and without words', () => {
    const m = state('Draft --> Submitted : submit\nSubmitted --> Approved\nSubmitted --> Draft: send back');
    assert.deepEqual(links(m), [['Draft-Submitted', 'submit'], ['Submitted-Approved', ''], ['Submitted-Draft', 'send back']]);
    assert.ok(m.edges.every((e) => e.head === 'arrow' && e.tail === 'none' && e.style === 'solid'));
  });

  it('names a second transition between the same two states apart from the first', () => {
    assert.deepEqual(links(state('A --> B : one\nA --> B : two')), [['A-B', 'one'], ['A-B#2', 'two']]);
  });

  it('reads a transition from a state to itself', () => {
    const m = state('Connecting --> Connecting : retry\nConnecting --> Open');
    assert.deepEqual(m.warnings, []);
    assert.deepEqual(links(m), [['Connecting-Connecting', 'retry'], ['Connecting-Open', '']]);
  });

  it('reads past a comment at the end of a line and on a line of its own', () => {
    const m = state('Draft --> Submitted %% sent by the buyer\n%% a manager looks next\nSubmitted --> Approved');
    assert.deepEqual(links(m), [['Draft-Submitted', ''], ['Submitted-Approved', '']]);
    assert.deepEqual(m.warnings, []);
  });
});

describe('state: where it starts and ends', () => {
  it('draws [*] as a start when it is left of the arrow and an end when it is right, one of each', () => {
    const m = state('[*] --> Draft\nDraft --> Sent\n[*] --> Sent\nSent --> [*]\nDraft --> [*]');
    assert.deepEqual(boxes(m), [['start', 'Start', 'pill', 'terminal'], ['Draft', 'Draft', 'box', 'step'], ['Sent', 'Sent', 'box', 'step'], ['end', 'End', 'pill', 'terminal']]);
    assert.deepEqual(links(m).map(([id]) => id), ['start-Draft', 'Draft-Sent', 'start-Sent', 'Sent-end', 'Draft-end']);
  });
});

describe('state: composite states', () => {
  const review = '[*] --> Draft\nDraft --> Review : submit\nstate Review {\n  [*] --> Screening\n  Screening --> Decision\n  Decision --> [*]\n}\nReview --> Published : approved\nReview --> Draft : rejected';

  it('draws a composite state as a group, with a start and an end of its own inside it', () => {
    const m = parse(`stateDiagram-v2\n${review}`);
    assert.deepEqual(m.groups, [{ id: 'Review', title: 'Review', members: ['Review_start', 'Screening', 'Decision', 'Review_end'] }]);
    assert.deepEqual(m.nodes.filter((n) => n.shape === 'pill').map((n) => [n.id, n.label]), [['start', 'Start'], ['Review_start', 'Start'], ['Review_end', 'End']]);
    assert.deepEqual(m.warnings, []);
  });

  it('joins a transition to a composite state to where it starts, and one from it to where it ends', () => {
    const m = parse(`stateDiagram-v2\n${review}`);
    assert.ok(!m.nodes.some((n) => n.id === 'Review'), 'the composite state is a frame, not a box');
    assert.deepEqual(links(m), [
      ['start-Draft', ''], ['Draft-Review_start', 'submit'], ['Review_start-Screening', ''], ['Screening-Decision', ''], ['Decision-Review_end', ''],
      ['Review_end-Published', 'approved'], ['Review_end-Draft', 'rejected'],
    ]);
  });

  it('calls a composite state by its words, wherever they are written', () => {
    assert.equal(state('Review : In review\nstate Review {\n  a --> b\n}').groups[0].title, 'In review');
    assert.equal(state('state Review {\n  a --> b\n}\nReview : In review').groups[0].title, 'In review');
    assert.equal(state('state "In review" as Review {\n  a --> b\n}').groups[0].title, 'In review');
  });

  it('reads a composite state inside another as a group inside a group, and joins what leads to it', () => {
    const m = state('[*] --> Outer\nstate Outer {\n  [*] --> Inner\n  state Inner {\n    [*] --> deep\n    deep --> [*]\n  }\n  Inner --> last\n}');
    assert.deepEqual(m.groups.map((g) => [g.id, g.parent ?? '']), [['Outer', ''], ['Inner', 'Outer']]);
    assert.deepEqual(m.warnings, []);
    assert.ok(!m.nodes.some((n) => n.id === 'Inner'));
    assert.deepEqual(links(m).map(([id]) => id), ['start-Outer_start', 'Outer_start-Inner_start', 'Inner_start-deep', 'deep-Inner_end', 'Inner_end-last']);
    assert.deepEqual(m.groups.map((g) => g.members), [['Outer_start', 'Inner_start', 'deep', 'Inner_end', 'last'], ['Inner_start', 'deep', 'Inner_end']]);
  });

  it('says so when a composite state is closed that was never opened, or never closed', () => {
    assert.match(state('a --> b\n}').warnings[0], /^line 3: not read: a "}" with no composite state open/);
    assert.match(state('state Review {\n  a --> b').warnings[0], /^line 2: the composite state Review is never closed; end it with a line of }/);
  });

});

describe('state: regions that run side by side', () => {
  const keys = 'state Active {\n  [*] --> NumOff\n  NumOff --> NumOn\n  --\n  [*] --> CapsOff\n  CapsOff --> CapsOn\n}';

  it('reads what "--" parts as regions: groups with no name inside the composite state, each with a start of its own', () => {
    const m = state(keys);
    assert.deepEqual(m.warnings, []);
    assert.deepEqual(m.groups, [
      { id: 'Active', title: 'Active', members: ['Active_start', 'NumOff', 'NumOn', 'Active_2_start', 'CapsOff', 'CapsOn'] },
      { id: 'Active/1', title: '', members: ['Active_start', 'NumOff', 'NumOn'], parent: 'Active' },
      { id: 'Active/2', title: '', members: ['Active_2_start', 'CapsOff', 'CapsOn'], parent: 'Active' },
    ]);
    assert.deepEqual(m.nodes.filter((n) => n.label === 'Start').map((n) => n.id), ['Active_start', 'Active_2_start']);
    assert.deepEqual(m.edges.map((e) => e.id), ['Active_start-NumOff', 'NumOff-NumOn', 'Active_2_start-CapsOff', 'CapsOff-CapsOn']);
  });

  it('reads any number of regions, and passes one with nothing in it', () => {
    const m = state('state S {\n  a --> b\n  --\n  --\n  c --> d\n  --\n  e --> f\n}');
    assert.deepEqual(m.groups.map((g) => [g.id, g.members.join(' ')]), [['S', 'a b c d e f'], ['S/1', 'a b'], ['S/3', 'c d'], ['S/4', 'e f']]);
  });

  it('puts a composite state written inside a region in that region', () => {
    const m = state('state S {\n  state In {\n    a --> b\n  }\n  --\n  state Out {\n    c --> d\n  }\n}');
    assert.deepEqual(m.groups.map((g) => [g.id, g.parent]), [['S', undefined], ['S/1', 'S'], ['In', 'S/1'], ['S/2', 'S'], ['Out', 'S/2']]);
  });

  it('takes a link into the composite state into every region: going in starts them all', () => {
    const m = state(`[*] --> Active\n${keys}\nActive --> [*]`);
    assert.deepEqual(m.edges.filter((e) => e.from === 'start').map((e) => e.to), ['Active_start', 'Active_2_start']);
    assert.deepEqual(m.warnings, []);
  });

  it('says so when "--" parts nothing', () => {
    assert.deepEqual(state('A --> B\n--\nB --> C').warnings, ['line 3: not read: "--" parts the regions of a composite state, and none is open here']);
  });

  it('draws each region in a frame of its own inside the composite state, side by side or one above the other, never across each other', () => {
    const m = state(`[*] --> Active\n${keys}`), lay = layout(m);
    assert.deepEqual(lay.warnings, []);
    assert.deepEqual(lay.groups.map((f) => f.id), ['Active', 'Active/1', 'Active/2']);
    const [whole, one, two] = lay.groups;
    for (const f of [one, two]) assert.ok(f.x > whole.x && f.y > whole.y && f.x + f.w < whole.x + whole.w && f.y + f.h < whole.y + whole.h, f.id);
    assert.ok(one.x + one.w <= two.x || two.x + two.w <= one.x || one.y + one.h <= two.y || two.y + two.h <= one.y, 'the two regions are apart');
    assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), []);
  });

  it('gives a frame with no name no room for one', () => {
    const m = state(keys), lay = layout(m), one = lay.groups[1];
    const top = Math.min(...['Active_start', 'NumOff', 'NumOn'].map((id) => lay.nodes[id].y - lay.nodes[id].h / 2));
    assert.equal(one.y, top - measure.framePad);
    assert.deepEqual([one.name.w, one.name.h], [0, 0]);
  });
});

describe('state: choices, forks and joins', () => {
  it('draws a choice as a decision', () => {
    const m = state('state enough <<choice>>\nChecked --> enough\nenough --> Approved : in budget\nenough --> Held : over budget');
    assert.deepEqual(boxes(m)[0], ['enough', 'enough', 'diamond', 'decision']);
    assert.deepEqual(links(m).map(([, words]) => words), ['', 'in budget', 'over budget']);
  });

  it('gives a choice, a fork and a join their words when they have some', () => {
    const m = state('state "In budget?" as enough <<choice>>\nstate "Both at once" as split <<fork>>\nstate together <<join>>');
    assert.deepEqual(boxes(m), [['enough', 'In budget?', 'diamond', 'decision'], ['split', 'Both at once', 'bar', 'fork'], ['together', 'together', 'bar', 'join']]);
    assert.deepEqual(m.warnings, []);
  });
});

describe('state: a fork and a join drawn', () => {
  const src = 'state split <<fork>>\nstate together <<join>>\nApproved --> split\nsplit --> Picking\nsplit --> Invoicing\nPicking --> together\nInvoicing --> together\ntogether --> Sent';

  it('draws each as a bar across the flow, with no words on it, its name kept for a reader', () => {
    const m = state(src), lay = layout(m);
    const svg = picture(m, lay, builtIn, { title: '' });
    assert.equal(svg.match(/class="mv-shape mv-bar"/g)?.length, 2);
    assert.doesNotMatch(svg, />split</);
    assert.doesNotMatch(svg, />together</);
    const live = page(m, lay, builtIn, { title: '' });
    assert.match(live, /aria-label="split, Fork"/);
    assert.match(live, /aria-label="together, Join"/);
  });

  it('lies across the flow whichever way it runs: flat top to bottom, upright left to right', () => {
    const bars = (/** @type {string} */ head) => {
      const m = state(`${head}\n${src}`), svg = picture(m, layout(m), builtIn, { title: '' });
      return [...svg.matchAll(/<rect class="mv-shape mv-bar"[^>]*width="([\d.]+)" height="([\d.]+)"/g)].map(([, w, h]) => Number(w) > Number(h));
    };
    assert.deepEqual(bars(''), [true, true]);
    assert.deepEqual(bars('direction LR'), [false, false]);
  });

  it('is met by its lines at the bar, and passes every rule', () => {
    const m = state(src), lay = layout(m), bar = lay.nodes.split;
    const into = lay.edges['Approved-split'].points.at(-1);
    assert.ok(into && Math.abs(into.y - (bar.y - form.bar / 2)) < 0.5, 'the line into the fork ends on the bar');
    assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id} ${c.detail}`), []);
  });
});

describe('state: notes', () => {
  it('keeps a note on a state as that box\'s note, on one line or several, from either side', () => {
    const m = state('Draft --> Sent\nnote right of Draft : Only its author sees it.\nnote left of Sent\n  Sent to the supplier\n  by email.\nend note');
    assert.deepEqual(m.notes, { Draft: 'Only its author sees it.', Sent: 'Sent to the supplier by email.' });
    assert.deepEqual(m.nodes.map((n) => n.id), ['Draft', 'Sent'], 'a note makes no box');
    assert.deepEqual(m.warnings, []);
  });

  it('says so when a note is on a state that is not there, or is never ended', () => {
    assert.match(state('Draft --> Sent\nnote right of Lost : words').warnings[0], /^note for Lost: no such node/);
    assert.match(state('Draft --> Sent\nnote right of Draft\n  words').warnings[0], /^line 3: the note on Draft is never ended; end it with a line of "end note"/);
  });
});

describe('state: direction, kinds and what Mermaid sets', () => {
  it('follows the direction it is given, the last one said', () => {
    assert.equal(state('direction LR\nA --> B').direction, 'LR');
    assert.equal(state('direction TB\nA --> B').direction, 'TD');
    const m = state('direction RL\nA --> B');
    assert.deepEqual([m.direction, m.reversed, m.warnings], ['LR', true, []]);
    assert.ok(!state('direction BT\ndirection TB\nA --> B').reversed);
  });

  it('reads past the direction of a composite state, which runs the way the rest does', () => {
    const m = state('direction LR\nstate B {\n  direction TB\n  a --> b\n}');
    assert.equal(m.direction, 'LR');
    assert.deepEqual(m.warnings, []);
  });

  it('takes a kind from classDef and class, and from ::: where a state is used', () => {
    const m = state('classDef stopped stroke:#c62828\nclassDef fresh fill:#e8f5e9,stroke:#2e7d32;\n[*] --> Draft:::fresh\nDraft --> Held\nHeld:::stopped --> Cancelled\nclass Cancelled, Lost stopped');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.kind]), [['start', 'terminal'], ['Draft', 'fresh'], ['Held', 'stopped'], ['Cancelled', 'stopped']]);
    assert.deepEqual(m.classes, { stopped: '#c62828', fresh: '#2e7d32' });
    assert.deepEqual(m.warnings, []);
  });

  it('names a kind in its author\'s words, hyphen and all', () => {
    const m = state('classDef on-hold stroke:#c62828\n[*] --> Draft\nDraft --> Held:::on-hold\n%% kind on-hold: Waiting on the buyer');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.kind]), [['start', 'terminal'], ['Draft', 'step'], ['Held', 'on-hold']]);
    assert.deepEqual(m.meanings, { 'on-hold': 'Waiting on the buyer' });
    assert.deepEqual(m.warnings, []);
  });

  it('reads past what only sets how Mermaid draws', () => {
    const m = state('hide empty description\nscale 350 width\nA --> B;');
    assert.deepEqual(links(m), [['A-B', '']]);
    assert.deepEqual(m.warnings, []);
  });

  it('keeps accTitle and accDescr', () => {
    const m = state('accTitle: An order\naccDescr: From draft to delivered\nA --> B');
    assert.deepEqual([m.title, m.describes], ['An order', 'From draft to delivered']);
  });
});

describe("state: Merlive's own lines", () => {
  it('reads notes, steps, the main path and the side as it does in a flowchart', () => {
    const m = state('[*] --> Draft\nDraft --> Submitted\nSubmitted --> Draft : send back\nSubmitted --> [*]\n%% note Draft: Being written.\n%% step: Round again | loop 1 | Sent back to be changed.\n%% main: start>Draft>Submitted>end\n%% side: left');
    assert.equal(m.notes.Draft, 'Being written.');
    assert.deepEqual(m.steps[0].seq, ['Draft-Submitted', 'Submitted-Draft']);
    assert.deepEqual(m.hints, { main: ['start', 'Draft', 'Submitted', 'end'], side: 'left' });
    assert.deepEqual(m.warnings, []);
  });
});

describe('state: what it does not read, it says', () => {
  it('names a line it cannot read with its line, and leaves nothing of it behind', () => {
    const m = state('Draft --> Submitted\nDraft ==> Lost\nstate "no id"\nSubmitted --> Approved');
    assert.deepEqual(m.warnings, ['line 3: not read: "Draft ==> Lost"', 'line 4: not read: "state "no id""']);
    assert.deepEqual(m.nodes.map((n) => n.id), ['Draft', 'Submitted', 'Approved']);
  });
});

describe('state: drawn by the rules a flowchart is', () => {
  const pictures = {
    order: '[*] --> Draft\nDraft --> Submitted : submit\nSubmitted --> Approved : approve\nSubmitted --> Draft : send back\nApproved --> Sent : send\nSent --> Delivered : receive\nSent --> Cancelled : cancel\nDelivered --> [*]\nCancelled --> [*]',
    document: '[*] --> Draft\nDraft --> Review : submit\nstate Review {\n  [*] --> Screening\n  Screening --> Decision\n  Decision --> [*]\n}\nReview --> Published : approved\nReview --> Draft : rejected\nPublished --> [*]',
    connection: 'state ok <<choice>>\n[*] --> Closed\nClosed --> Connecting : open\nConnecting --> ok\nok --> Open : answered\nok --> Waiting : refused\nWaiting --> Connecting : try again\nOpen --> Closed : close\nWaiting --> Closed : give up',
  };
  for (const [name, body] of Object.entries(pictures)) {
    it(`passes every rule for ${name}, top to bottom and left to right`, () => {
      for (const way of ['TB', 'LR']) {
        const m = state(`direction ${way}\n${body}`);
        const result = score(m, layout(m), designWith(builtIn, m));
        assert.deepEqual(result.checks.filter((c) => !c.ok).map((c) => `${c.id} ${c.detail}`), [], way);
        assert.deepEqual(m.warnings, []);
      }
    });
  }

  it('puts the states of a composite state inside its frame', () => {
    const m = state(pictures.document);
    const lay = layout(m);
    const frame = lay.groups[0];
    for (const id of m.groups[0].members) {
      const n = lay.nodes[id];
      assert.ok(n.x - n.w / 2 >= frame.x && n.x + n.w / 2 <= frame.x + frame.w && n.y - n.h / 2 >= frame.y && n.y + n.h / 2 <= frame.y + frame.h, id);
    }
  });
});

describe('state: the command', () => {
  it('draws the state diagram in a Markdown file as it draws a flowchart, into a temporary folder', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'merlive-state-'));
    writeFileSync(join(cwd, 'order.md'), '# An order\n\n```mermaid\nstateDiagram-v2\n  [*] --> Draft\n  Draft --> Sent : send\n  note right of Draft : Only its author sees it.\n  Sent --> [*]\n```\n\n```mermaid\npie title Orders\n  "UK" : 46\n```\n');
    /** @type {string[]} */
    const said = [];
    const code = await run(['order.md'], { cwd, say: (line) => said.push(line) });
    assert.equal(code, exits.drawn);
    assert.match(said.join('\n'), /drew .*order-1\.html \(4 boxes, 3 links/);
    assert.match(said.join('\n'), /left as Mermaid: block 2 \(line \d+\) is a pie, and Merlive draws flowcharts, state, class, entity, requirement, C4, architecture, block and sequence diagrams, mindmaps, kanban boards, timelines and packets for now/);
    const page = readFileSync(join(cwd, 'diagrams/order-1.html'), 'utf8');
    assert.ok(page.includes('Only its author sees it.') && page.includes('>Start<') && page.includes('>send<'));
    assert.ok(!existsSync(join(cwd, 'diagrams/order-2.html')));
  });

  it('says in its help that a state diagram is drawn', () => {
    assert.match(help, /A state diagram is drawn as a flowchart is\./);
  });
});
