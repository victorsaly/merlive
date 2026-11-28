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
import { layout, measure } from '../skills/merlive/scripts/layout.mjs';
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

describe('timeline: a section with a long name', () => {
  const long = 'section Everything the buyer does before the supplier hears of it\nMonday : Raised\nsection Delivery\nFriday : Delivered';

  it('wraps the name to its frame, and does not widen every column for it', () => {
    const m = timeline(long), lay = layout(m), f = /** @type {any} */ (lay.groups.find((g) => g.id === 'section1'));
    // It was 469px: the name on one line. Three lines of it need a little more than a period does.
    assert.ok(lay.box.w <= measure.widths[2], `a column is ${lay.box.w}px`);
    assert.ok(f.lines.length > 1 && f.lines.length <= 3, `${f.lines.length} lines`);
    assert.equal(f.lines.join(' '), 'Everything the buyer does before the supplier hears of it');
    for (const line of f.lines) assert.ok(line.length * measure.nameGlyph + 2 * measure.nameIn <= f.w, `"${line}" is wider than its frame`);
    assert.deepEqual(broken(m), []);
  });

  it('keeps what each frame of a row holds starting on one line, under the longest name, and clear of it', () => {
    const m = timeline(long), lay = layout(m), f = /** @type {any} */ (lay.groups.find((g) => g.id === 'section1'));
    assert.equal(lay.nodes.period1.y, lay.nodes.period2.y);
    assert.ok(top(lay.nodes.period1) >= f.name.y + f.name.h / 2, 'the first period starts under the name');
    assert.equal(f.name.h, f.lines.length * measure.nameLine);
  });

  it('draws each line of the name under the one before', () => {
    const m = timeline(long), svg = picture(m, layout(m), builtIn, { title: 't' });
    assert.match(svg, /<text class="mv-name"[^>]*><tspan[^>]*>Everything the buyer[^<]*<\/tspan><tspan[^>]*dy="12"[^>]*>/);
  });

  it('starts every line of the name at the left of its frame, where a name of one line starts', () => {
    const m = timeline(long), lay = layout(m), f = /** @type {any} */ (lay.groups.find((g) => g.id === 'section1'));
    const svg = picture(m, lay, builtIn, { title: 't' }), left = String(Math.round(f.x + measure.nameIn));
    const text = /<text class="mv-name"([^>]*)>(<tspan[^]*?)<\/text>/.exec(svg);
    // An inline style: the class's own text-anchor would win over an attribute.
    assert.match(text?.[1] ?? '', /style="text-anchor:start"/);
    assert.deepEqual([...(text?.[2] ?? '').matchAll(/<tspan x="([\d.]+)"/g)].map((t) => String(Math.round(Number(t[1])))), [left, left, left]);
  });

  it('leaves a short name on one line, its frame as it was', () => {
    const lay = layout(timeline('section Buying\nMonday : Raised\nsection Delivery\nFriday : Delivered'));
    for (const f of /** @type {any[]} */ (lay.groups)) assert.deepEqual([f.lines, f.name.h], [[f.title], measure.nameLine]);
  });
});

describe('timeline: wrapped into bands when too wide for a screen', () => {
  const year = 'January : Budget set\nFebruary : Raised\nMarch : Approved\nApril : Sent\nMay : Chased\nJune : Delivered\nJuly : Checked\nAugust : Invoiced\nSeptember : Paid';
  const y = (/** @type {any} */ lay, /** @type {number} */ i) => lay.nodes[`period${i}`].y, x = (/** @type {any} */ lay, /** @type {number} */ i) => lay.nodes[`period${i}`].x;

  it('runs on in a second band, as a line of words does, with as many periods in each as it can', () => {
    const m = timeline(year), lay = layout(m);
    assert.ok(lay.width <= measure.wide, `${lay.width}px`);
    // Five and four, not eight and one.
    assert.deepEqual([1, 2, 3, 4, 5].map((i) => y(lay, i)), Array(5).fill(y(lay, 1)));
    assert.deepEqual([6, 7, 8, 9].map((i) => y(lay, i)), Array(4).fill(y(lay, 6)));
    assert.ok(y(lay, 6) > lay.nodes.event1_1.y, 'the second band is under the first, events and all');
    assert.equal(x(lay, 6), x(lay, 1), 'and starts at the same edge');
    assert.ok(lay.nodes.event6_1.y > y(lay, 6) && lay.nodes.event6_1.x === x(lay, 6));
    assert.deepEqual(broken(m), []);
  });

  it('says so, and how wide it would be in one row', () => {
    const lay = layout(timeline(year));
    assert.match(lay.warnings.join('\n'), /in 2 bands: in one row it would be 1592px wide, wider than most screens\. "%% wrap: no" keeps it in one/);
  });

  it('takes time on from the end of one band to the start of the next, round everything and through nothing', () => {
    const m = timeline(year), lay = layout(m), on = m.edges.find((e) => e.from === 'period5' && e.to === 'period6');
    const pts = lay.edges[/** @type {any} */ (on).id].points, last = pts[pts.length - 1];
    assert.ok(Math.abs(last.x - x(lay, 6)) < lay.nodes.period6.w / 2 && last.y <= top(lay.nodes.period6), 'into the top of the first period of the next band');
    assert.equal(score(m, lay, builtIn).checks.find((c) => c.id === 'P3')?.ok, true);
  });

  it('stays in one row when its author says so, or when it fits', () => {
    assert.equal(layout(timeline(`${year}\n%% wrap: no`)).width, 1592);
    const lay = layout(timeline(week));
    assert.equal(new Set([1, 2, 3].map((i) => y(lay, i))).size, 1);
    assert.deepEqual(lay.warnings, []);
  });

  it('is not wrapped top to bottom, where it is tall and not wide', () => {
    const lay = layout(timeline(year, 'timeline TD'));
    assert.equal(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => x(lay, i))).size, 1);
  });

  it('takes time on between sections through the gap between their frames, not along the edge of one (P5)', () => {
    const m = timeline('title From order to invoice\nsection Buying\nMonday : Raised by the buyer : Checked against the budget\nTuesday : Approved : Sent to the supplier\nsection Waiting\nWednesday\nsection Delivery\nFriday : Delivered to the warehouse\nNext Monday : Invoiced : Paid');
    const lay = layout(m), on = /** @type {any} */ (m.edges.find((e) => e.from === 'period3' && e.to === 'period4')), pts = lay.edges[on.id].points;
    const delivery = /** @type {any} */ (lay.groups.find((g) => g.title === 'Delivery')), above = Math.max(...lay.groups.filter((g) => g.y < delivery.y).map((g) => g.y + g.h));
    const across = pts.find((p, i) => i > 0 && p.y === pts[i - 1].y);
    assert.ok(across && across.y > above && across.y < delivery.y, `along y ${across?.y}, between ${above} and ${delivery.y}`);
    assert.equal(score(m, lay, builtIn).checks.find((c) => c.id === 'P5')?.ok, true);
  });

  it('breaks between sections, never inside one, with each frame round its own periods', () => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => `section ${q}\n${[1, 2, 3].map((d) => `Month ${i * 3 + d} : Done`).join('\n')}`).join('\n');
    const m = timeline(quarters), lay = layout(m);
    assert.ok(lay.width <= measure.wide, `${lay.width}px`);
    const rows = [...new Set(lay.groups.map((g) => g.y))];
    assert.ok(rows.length >= 2, `${rows.length} band`);
    for (const g of lay.groups) {
      const inside = /** @type {any} */ (m.groups.find((f) => f.id === g.id)).members.filter((/** @type {string} */ id) => id.startsWith('period')).map((/** @type {string} */ id) => lay.nodes[id]);
      for (const n of inside) assert.ok(n.x > g.x && n.x < g.x + g.w && n.y > g.y && n.y < g.y + g.h, `${n.id} is outside ${g.id}`);
    }
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
