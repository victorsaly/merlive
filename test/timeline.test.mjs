// Why: a timeline is the one kind where what is written is an order and nothing else: periods one after
// another, and under each what happened in it. Its author places every box by writing it where it is, so these
// hold the reader to that: each period a box in the row of periods, each event a box under its period, a
// section a frame round the periods it covers, all of it marked to be placed on that grid. They also hold the
// corpus's own list (corpus/timeline.json) to what is read today.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout } from '../skills/merlive/scripts/layout.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';
import { builtIn } from '../skills/merlive/scripts/design.mjs';
import { page, picture } from '../skills/merlive/scripts/render.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const timeline = (/** @type {string} */ body, head = 'timeline') => parse(`${head}\n${body}`);
/** @typedef {import('../skills/merlive/scripts/parse.mjs').Model} Model */
const boxes = (/** @type {Model} */ m) => m.nodes.map((n) => [n.id, n.label, n.kind]);
const links = (/** @type {Model} */ m) => m.edges.map((e) => [e.id, e.style, e.head]);
const said = (/** @type {Model} */ m) => m.warnings.map((w) => w.replace(/^line \d+: /, ''));
const broken = (/** @type {Model} */ m) => score(m, layout(m), builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`);
const top = (/** @type {{y:number,h:number}} */ n) => n.y - n.h / 2, bottom = (/** @type {{y:number,h:number}} */ n) => n.y + n.h / 2;
const week = 'Monday : Raised\nTuesday : Approved : Sent\nFriday : Delivered';

describe('timeline: periods and events', () => {
  it('reads a period as a box, and what happened in it as boxes of their own, into the model a flowchart gives', () => {
    const m = timeline(week);
    assert.deepEqual([m.type, m.kindOfDiagram, m.warnings], ['flowchart', 'timeline', []]);
    assert.deepEqual(boxes(m), [
      ['period1', 'Monday', 'period'], ['event1_1', 'Raised', 'step'],
      ['period2', 'Tuesday', 'period'], ['event2_1', 'Approved', 'step'], ['event2_2', 'Sent', 'step'],
      ['period3', 'Friday', 'period'], ['event3_1', 'Delivered', 'step'],
    ]);
  });

  it('tells a period from an event by its outline, not by a colour of its own making', () => {
    const m = timeline(week);
    assert.deepEqual(m.nodes.map((n) => Boolean(n.heavy)), [true, false, true, false, false, true, false]);
    assert.equal(m.classes.period, undefined);
  });

  it('calls a plain box of a timeline an event, where a flowchart would call it a step, unless its author says otherwise', () => {
    assert.deepEqual(timeline(week).meanings, { step: 'Event' });
    assert.deepEqual(timeline(`${week}\n%% kind step: Milestone\n%% kind period: Day`).meanings, { step: 'Milestone', period: 'Day' });
    const m = timeline(week), html = page(m, layout(m), builtIn, { title: 'x', source: 'x', version: '0' });
    assert.match(html, /<\/i>Period<\/span>/);
    assert.match(html, /<\/i>Event<\/span>/);
    assert.doesNotMatch(html, /<\/i>Step<\/span>/);
  });

  it('says nothing of events where a timeline has none', () => {
    const m = timeline('Monday\nTuesday');
    assert.deepEqual([m.meanings?.step, m.warnings], [undefined, []]);
  });

  it('joins each period to the next with an arrow, as time runs, and each period to its events with a dotted line', () => {
    assert.deepEqual(links(timeline(week)), [
      ['period1-event1_1', 'dotted', 'none'],
      ['period1-period2', 'solid', 'arrow'],
      ['period2-event2_1', 'dotted', 'none'], ['event2_1-event2_2', 'dotted', 'none'],
      ['period2-period3', 'solid', 'arrow'],
      ['period3-event3_1', 'dotted', 'none'],
    ]);
  });

  it('takes events on the lines after their period, each line a colon and what happened', () => {
    const m = timeline('2004 : Facebook\n     : Google\n     : Flickr : Gmail\n2005 : YouTube');
    assert.deepEqual(m.nodes.filter((n) => n.id.startsWith('event1_')).map((n) => n.label), ['Facebook', 'Google', 'Flickr', 'Gmail']);
    assert.deepEqual(said(m), []);
  });

  it('reads a period with nothing after it as a period in which nothing is said to have happened', () => {
    const m = timeline('Monday\nTuesday : Approved');
    assert.deepEqual(boxes(m), [['period1', 'Monday', 'period'], ['period2', 'Tuesday', 'period'], ['event2_1', 'Approved', 'step']]);
    assert.deepEqual(said(m), []);
  });

  it('needs no space before a colon, and keeps a colon with none after it as part of the words, as Mermaid does', () => {
    const m = timeline('Tuesday: Approved:Sent\n10:30 : Stand-up');
    assert.deepEqual(m.nodes.map((n) => n.label), ['Tuesday', 'Approved:Sent', '10:30', 'Stand-up']);
  });

  it('keeps two periods of one name apart: each is the period its author wrote', () => {
    const m = timeline('Monday : Raised\nMonday : Again');
    assert.deepEqual(boxes(m).map((b) => b[0]), ['period1', 'event1_1', 'period2', 'event2_1']);
  });

  it('keeps the lines its author broke words into, and reads an entity code as its character', () => {
    const m = timeline('2006 : Twitter <br>launched\nNine #colon; thirty : Stand-up');
    assert.deepEqual(m.nodes[1].breaks, ['Twitter', 'launched']);
    assert.equal(m.nodes[2].label, 'Nine : thirty');
  });

  it('takes a note for a period or an event by its name, as any box takes one', () => {
    const m = timeline(`${week}\n%% note period2: The busy day\n%% note event2_2: By courier`);
    assert.deepEqual(m.notes, { period2: 'The busy day', event2_2: 'By courier' });
  });
});

describe('timeline: what is said, and nothing lost', () => {
  it('says so when an event comes before any period, and reads the rest', () => {
    const m = timeline(': Raised\nMonday : Approved');
    assert.deepEqual(said(m), ['not read: ": Raised": an event belongs to the period before it, and none has been written yet; write the period first, as in Monday : Raised']);
    assert.equal(m.nodes.length, 2);
  });

  it('says so when an event has no words, and draws the others', () => {
    const m = timeline('Monday : Raised :\nTuesday :  : Approved');
    assert.deepEqual(m.nodes.map((n) => n.label), ['Monday', 'Raised', 'Tuesday', 'Approved']);
    assert.deepEqual(said(m), ['an event of "Monday" has no words and is not drawn; take out the colon with nothing after it', 'an event of "Tuesday" has no words and is not drawn; take out the colon with nothing after it']);
  });

  it('draws a comment written after words as words, as Mermaid does, and says where a comment goes', () => {
    const m = timeline('Monday : Raised %% by the buyer');
    assert.equal(m.nodes[1].label, 'Raised %% by the buyer');
    assert.deepEqual(said(m), ['"%% by the buyer" is drawn as words, as Mermaid draws it: a comment goes on a line of its own']);
  });

  it('reads a comment on a line of its own past, and what the picture is called and shows for one who cannot see it', () => {
    const m = timeline(`%% the week\naccTitle: A week of orders\naccDescr: From raised to delivered\n${week}`);
    assert.deepEqual([m.title, m.heading, m.describes, m.nodes.length, m.warnings], ['A week of orders', '', 'From raised to delivered', 7, []]);
  });

  it('reads no period out of nothing: a timeline with no periods has no boxes', () => {
    const m = timeline('title Nothing yet');
    assert.deepEqual([m.nodes.length, m.edges.length, m.heading], [0, 0, 'Nothing yet']);
  });
});

describe('timeline: its title', () => {
  it('is what the picture is called, and is drawn above it', () => {
    const m = timeline(`title The order's week\n${week}`);
    assert.deepEqual([m.title, m.heading], ["The order's week", "The order's week"]);
    assert.match(picture(m, layout(m), builtIn, { title: 'x' }), /class="mv-title"/);
  });

  it('takes the front matter\'s title when the timeline gives none, and its own when it gives one', () => {
    assert.equal(parse(`---\ntitle: From the front\n---\ntimeline\n${week}`).heading, 'From the front');
    assert.equal(parse(`---\ntitle: From the front\n---\ntimeline\ntitle Its own\n${week}`).heading, 'Its own');
  });

  it('reads "title:" as Mermaid does: a period called title', () => {
    assert.deepEqual(timeline('title: With a colon').nodes.map((n) => n.label), ['title', 'With a colon']);
  });
});

describe('timeline: sections', () => {
  const two = 'section Buying\nMonday : Raised\nTuesday : Approved\nsection Delivery\nFriday : Delivered : Invoiced';

  it('reads a section as a group round the periods after it and their events', () => {
    const m = timeline(two);
    assert.deepEqual(m.groups, [
      { id: 'section1', title: 'Buying', members: ['period1', 'event1_1', 'period2', 'event2_1'] },
      { id: 'section2', title: 'Delivery', members: ['period3', 'event3_1', 'event3_2'] },
    ]);
    assert.deepEqual(said(m), []);
  });

  it('carries time on from the last period of one section to the first of the next', () => {
    assert.ok(timeline(two).edges.some((e) => e.id === 'period2-period3' && e.head === 'arrow'));
  });

  it('keeps two sections of one name apart, each with the periods written under it', () => {
    const m = timeline('section Buying\nMonday : Raised\nsection Buying\nTuesday : Approved');
    assert.deepEqual(m.groups.map((g) => [g.id, g.members.join(' ')]), [['section1', 'period1 event1_1'], ['section2', 'period2 event2_1']]);
  });

  it('says so when a section has no periods, which leaves nothing to draw it round', () => {
    const m = timeline('section Planning\nsection Buying\nMonday : Raised');
    assert.deepEqual(m.groups.map((g) => g.title), ['Buying']);
    assert.deepEqual(said(m), ['the section "Planning" has no periods, so there is nothing to draw it round; write a period under it, or take it out']);
  });

  it('draws a period written before the first section too, outside any, where Mermaid leaves it out', () => {
    const m = timeline(`Before : Asked\n${two}`), lay = layout(m);
    assert.equal(m.nodes[0].label, 'Before');
    assert.ok(lay.nodes.period1 && lay.groups.every((f) => lay.nodes.period1.x + lay.nodes.period1.w / 2 <= f.x));
    assert.deepEqual(broken(m), []);
  });

  it('reads a section with no name as a group with none', () => {
    const m = timeline('section\nMonday : Raised');
    assert.deepEqual(m.groups.map((g) => [g.title, g.members.length]), [['', 2]]);
  });
});

describe('timeline: which way it runs', () => {
  it('runs left to right unless it says top to bottom', () => {
    assert.equal(timeline(week).direction, 'LR');
    assert.equal(timeline(week, 'timeline LR').direction, 'LR');
    assert.equal(timeline(week, 'timeline TD').direction, 'TD');
    assert.deepEqual(timeline(week, 'timeline TD').warnings, []);
  });

  it('reads anything else after "timeline" as Mermaid does, as a period, and says what was probably meant', () => {
    const m = timeline(week, 'timeline BT');
    assert.equal(m.nodes[0].label, 'BT');
    assert.equal(m.direction, 'LR');
    assert.deepEqual(m.warnings, ['line 1: "BT" after "timeline" is drawn as a period, as Mermaid draws it: a timeline runs LR (left to right) or TD (top to bottom), and anything else goes on a line of its own']);
  });
});

describe('timeline: placed on the grid it was written as', () => {
  it('is marked to be placed where its author put each box, and says nothing against it', () => {
    const m = timeline(week), lay = layout(m);
    assert.deepEqual([m.placedBy, m.left], ['grid', undefined]);
    assert.match(m.placedWhy ?? '', /period/);
    assert.ok(lay.grids?.length === 1);
    assert.deepEqual(broken(m), []);
  });

  it('puts the periods side by side in the order written, and each event under its period', () => {
    const m = timeline(week), at = layout(m).nodes;
    assert.ok(at.period1.x < at.period2.x && at.period2.x < at.period3.x);
    assert.ok(at.period1.y === at.period2.y && at.period2.y === at.period3.y);
    for (const [period, events] of [['period1', ['event1_1']], ['period2', ['event2_1', 'event2_2']], ['period3', ['event3_1']]]) {
      let above = at[/** @type {string} */ (period)];
      for (const id of /** @type {string[]} */ (events)) {
        assert.equal(at[id].x, above.x, `${id} is under ${period}`);
        assert.ok(top(at[id]) > bottom(above));
        above = at[id];
      }
    }
    // The first events of every period are in one row, as the periods are.
    assert.ok(at.event1_1.y === at.event2_1.y && at.event2_1.y === at.event3_1.y);
  });

  it('draws the arrow of time straight across, and the line to an event straight down', () => {
    const m = timeline(week), lay = layout(m);
    for (const e of m.edges) {
      const pts = lay.edges[e.id].points;
      assert.equal(pts.length, 2, e.id);
      if (e.head === 'arrow') assert.ok(pts[0].y === pts[1].y && pts[0].x < pts[1].x, e.id);
      else assert.ok(pts[0].x === pts[1].x && pts[0].y < pts[1].y, e.id);
    }
  });

  it('draws a section as a frame round its periods and events, the sections side by side', () => {
    const m = timeline('section Buying\nMonday : Raised\nTuesday : Approved\nsection Delivery\nFriday : Delivered : Invoiced'), lay = layout(m);
    const [buying, delivery] = lay.groups;
    assert.deepEqual(lay.groups.map((f) => f.title), ['Buying', 'Delivery']);
    assert.ok(buying.x + buying.w < delivery.x);
    assert.deepEqual([buying.y, buying.h], [delivery.y, delivery.h], 'in one row, one height');
    for (const g of m.groups) {
      const f = /** @type {typeof buying} */ (lay.groups.find((x) => x.id === g.id));
      for (const id of g.members) {
        const n = lay.nodes[id];
        assert.ok(n.x - n.w / 2 > f.x && n.x + n.w / 2 < f.x + f.w && top(n) > f.y && bottom(n) < f.y + f.h, `${id} is inside ${g.title}`);
      }
    }
    // The periods of both sections are in one line, so the arrow from one section to the next is straight.
    assert.equal(lay.nodes.period2.y, lay.nodes.period3.y);
    assert.equal(lay.edges['period2-period3'].points.length, 2);
    assert.deepEqual(broken(m), []);
  });

  it('keeps the periods in one line where one section has a name and the next has none', () => {
    const m = timeline('section Buying\nMonday : Raised\nsection\nFriday : Delivered'), lay = layout(m);
    assert.equal(lay.nodes.period1.y, lay.nodes.period2.y);
    assert.deepEqual(broken(m), []);
  });

  it('top to bottom, puts the periods one under another and each period\'s events beside it', () => {
    const m = timeline(week, 'timeline TD'), at = layout(m).nodes;
    assert.ok(at.period1.x === at.period2.x && at.period2.x === at.period3.x);
    assert.ok(bottom(at.period1) < top(at.period2) && bottom(at.period2) < top(at.period3));
    assert.equal(at.event1_1.y, at.period1.y);
    assert.ok(at.event1_1.x > at.period1.x);
    assert.equal(at.event2_2.x, at.event2_1.x);
    assert.ok(top(at.event2_2) > bottom(at.event2_1) && bottom(at.event2_2) < top(at.period3));
    assert.deepEqual(broken(m), []);
  });

  it('top to bottom, draws the sections one under another, their periods in one column', () => {
    const m = timeline('section Buying\nMonday : Raised\n : Checked\nsection Delivery\nFriday : Delivered', 'timeline TD'), lay = layout(m);
    const [buying, delivery] = lay.groups;
    assert.ok(buying.y + buying.h < delivery.y);
    assert.deepEqual([buying.x, buying.w], [delivery.x, delivery.w]);
    assert.equal(lay.nodes.period1.x, lay.nodes.period2.x);
    assert.equal(lay.nodes.event1_1.x, lay.nodes.event2_1.x);
    assert.deepEqual(broken(m), []);
  });

  it('draws a long timeline as it was written, every rule kept', () => {
    const m = timeline(Array.from({ length: 9 }, (_, i) => `200${i} : Something that happened in the year 200${i} : And another thing`).join('\n'));
    assert.deepEqual(broken(m), []);
  });
});

describe('timeline: the corpus', () => {
  /** @type {{file:string,covers:string,boxes:number,links:number,groups?:number,has?:string[],title?:string,direction?:string,placedBy?:string,notes?:number,says?:string}[]} */
  const list = existsSync(join(root, 'corpus/timeline.json')) ? JSON.parse(readFileSync(join(root, 'corpus/timeline.json'), 'utf8')) : JSON.parse(readFileSync(join(root, 'corpus/index.json'), 'utf8')).timeline;

  it('lists every sample there is, once', () => {
    assert.deepEqual(list.map((s) => s.file).sort(), readdirSync(join(root, 'corpus/timeline')).filter((f) => f.endsWith('.mmd')).map((f) => `timeline/${f}`).sort());
  });

  it('reads each sample as its entry says', () => {
    for (const s of list) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8'));
      assert.equal(m.type, 'flowchart', s.file);
      assert.equal(m.nodes.length, s.boxes, `${s.file}: boxes`);
      assert.equal(m.edges.length, s.links, `${s.file}: links`);
      assert.equal(m.groups.length, s.groups ?? 0, `${s.file}: groups`);
      assert.equal(m.placedBy, s.placedBy, `${s.file}: placed by`);
      if (s.direction) assert.equal(m.direction, s.direction, `${s.file}: direction`);
      if (s.title !== undefined) assert.equal(m.title, s.title, `${s.file}: title`);
      if (s.notes !== undefined) assert.equal(Object.keys(m.notes).length, s.notes, `${s.file}: notes`);
      const words = [...m.nodes.map((n) => n.label), ...m.groups.map((g) => g.title)];
      for (const text of s.has ?? []) assert.ok(words.includes(text), `${s.file}: has "${text}"`);
      if (s.says) assert.ok(m.warnings.some((w) => w.includes(/** @type {string} */ (s.says))), `${s.file}: says "${s.says}", said ${JSON.stringify(m.warnings)}`);
      else assert.deepEqual(m.warnings, [], s.file);
    }
  });

  it('draws each sample with no rule broken', () => {
    for (const s of list) assert.deepEqual(broken(parse(readFileSync(join(root, 'corpus', s.file), 'utf8'))), [], s.file);
  });
});
