// Why: a kanban board is columns side by side and cards down each, and where a card is says what state its
// work is in. These hold that a board is read into the model a flowchart gives (a column is a group, a card is
// a box that lists its ticket, who has it and how pressing it is), that it is placed on the grid its author
// wrote and never by rank, and that what Mermaid 11.16 does with each odd line is what Merlive does or says.
// They also hold the corpus's own list (the `kanban` list of corpus/index.json, or corpus/kanban.json until it
// is folded in) to what is read today.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout, measure } from '../skills/merlive/scripts/layout.mjs';
import { gridMeasure } from '../skills/merlive/scripts/grid.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';
import { builtIn } from '../skills/merlive/scripts/design.mjs';
import { page, picture } from '../skills/merlive/scripts/render.mjs';
import { priorities } from '../skills/merlive/scripts/kanban.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const board = (/** @type {string} */ body) => parse(`kanban\n${body}`);
/** @typedef {import('../skills/merlive/scripts/parse.mjs').Model} Model */
const cards = (/** @type {Model} */ m) => m.nodes.map((n) => [n.id, n.label]);
const columns = (/** @type {Model} */ m) => m.groups.map((g) => [g.id, g.title, g.members.join(' ')]);
const said = (/** @type {Model} */ m) => m.warnings.map((w) => w.replace(/^line \d+: /, ''));
const broken = (/** @type {Model} */ m) => score(m, layout(m), builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`);
const three = '  todo[To do]\n    t1[Raise the order]\n    t2[Chase the supplier]\n  doing[Doing]\n    t3[Check the stock]\n  done[Done]\n    t4[Pay the invoice]';

describe('kanban: a board', () => {
  it('is read as columns that are groups and cards that are boxes, with no links', () => {
    const m = board(three);
    assert.equal(m.type, 'flowchart');
    assert.equal(m.kindOfDiagram, 'kanban');
    assert.deepEqual(columns(m), [['todo', 'To do', 't1 t2'], ['doing', 'Doing', 't3'], ['done', 'Done', 't4']]);
    assert.deepEqual(cards(m), [['t1', 'Raise the order'], ['t2', 'Chase the supplier'], ['t3', 'Check the stock'], ['t4', 'Pay the invoice']]);
    assert.deepEqual(m.edges, []);
    assert.deepEqual(m.warnings, []);
  });

  it('is only a board when it opens with the one word', () => {
    assert.equal(parse('kanban\n  a[A]').type, 'flowchart');
    // Mermaid reads the ";" as a column of its own, so this is not the kind.
    assert.equal(parse('kanban;\n  a[A]').type, 'unsupported');
    assert.equal(parse('kanbans\n  a[A]').type, 'unsupported');
  });

  it('is placed on the grid its author wrote: a column for each column, a row for each card', () => {
    const m = board(three);
    assert.equal(m.placedBy, 'grid');
    assert.match(m.placedWhy ?? '', /columns side by side/);
    assert.equal(m.grid?.columns, 3);
    assert.deepEqual(m.grid?.cells.map((c) => [c.is, /** @type {any} */ (c).id, c.span, /** @type {any} */ (c).grid.columns, /** @type {any} */ (c).grid.cells.map((/** @type {any} */ x) => `${x.is} ${x.id}`).join(', ')]), [
      ['group', 'todo', 1, 1, 'block t1, block t2'],
      ['group', 'doing', 1, 1, 'block t3'],
      ['group', 'done', 1, 1, 'block t4'],
    ]);
  });

  it('with no columns is nothing, and says nothing', () => {
    const m = parse('kanban');
    assert.deepEqual([m.nodes.length, m.groups.length, m.warnings], [0, 0, []]);
    assert.doesNotThrow(() => layout(m));
  });
});

describe('kanban: what is a column and what is a card', () => {
  it('goes by how far in a line is: as far as the first is a column, further is a card of the column above', () => {
    const m = board('todo[To do]\n  t1[Raise]\n      t2[Far in]\n   t3[A little in]\ndone[Done]\n  t4[Pay]');
    assert.deepEqual(columns(m), [['todo', 'To do', 't1 t2 t3'], ['done', 'Done', 't4']]);
    assert.deepEqual(m.warnings, []);
  });

  it('counts a tab as it counts a space', () => {
    assert.deepEqual(columns(board('\ttodo[To do]\n\t\tt1[Raise]\n\tdone[Done]\n\t\tt2[Pay]')), [['todo', 'To do', 't1'], ['done', 'Done', 't2']]);
  });

  it('reads lines that are all as far in as each other as columns, as Mermaid does', () => {
    const m = board('todo[To do]\nt1[Raise]\ndone[Done]');
    // A column with nothing in it is not a group in the model, but it is still a cell of the grid, with its name.
    assert.deepEqual(m.groups, []);
    assert.deepEqual(m.grid?.cells.map((c) => /** @type {any} */ (c).title), ['To do', 'Raise', 'Done']);
  });

  it('reads a line less far in than the first as a column, and says Mermaid will not', () => {
    const m = board('    todo[To do]\n      t1[Raise]\n  late[Late]\n      t2[Pay]');
    assert.deepEqual(columns(m), [['todo', 'To do', 't1'], ['late', 'Late', 't2']]);
    assert.deepEqual(m.warnings, ['line 4: "Late" is less far in than the first column, which Mermaid refuses; start every column as far in as the first']);
  });
});

describe('kanban: words', () => {
  it('calls a column or a card by its words, or by what was written when it has no brackets', () => {
    const m = board('  Todo\n    Raise the order\n    t2\n  done[Done]');
    assert.deepEqual(m.groups.map((g) => [g.id, g.title]), [['Todo', 'Todo']]);
    assert.deepEqual(cards(m), [['Raise_the_order', 'Raise the order'], ['t2', 't2']]);
    assert.deepEqual(m.warnings, []);
  });

  it('takes quotes off, keeps what is inside them whatever it is, and reads a Markdown string as one', () => {
    const m = board('  todo["To do, soon"]\n    t1["Raise the order [urgent]"]\n    t2["`**Bold** and *slanted*`"]');
    assert.equal(m.groups[0].title, 'To do, soon');
    assert.deepEqual(m.nodes.map((n) => n.label), ['Raise the order [urgent]', 'Bold and slanted']);
    assert.deepEqual(m.nodes[1].emphasis, [{ words: 'Bold', strong: true }, { words: ' and ' }, { words: 'slanted', em: true }]);
    assert.deepEqual(m.warnings, []);
  });

  it('keeps a line its author broke, with <br/> or by going on to the next line inside quotes', () => {
    const m = board('  todo[To do]\n    t1[Raise the<br/>order now]\n    t2["Line one\nLine two"]\n    t3[After]');
    assert.deepEqual(m.nodes.map((n) => n.breaks), [['Raise the', 'order now'], ['Line one', 'Line two'], undefined]);
    assert.deepEqual(columns(m), [['todo', 'To do', 't1 t2 t3']]);
    assert.deepEqual(m.warnings, []);
  });

  it('says so when words in quotes are never closed', () => {
    const m = board('  todo[To do]\n    t1["Never closed\n    t2[After]');
    assert.deepEqual(said(m), ['not read: words in quotes that are never closed, and everything after them: "t1["Never closed"; close them with "]']);
  });

  it('reads an entity code as its character', () => {
    const m = board('  todo[To do #amp; then]\n    t1[5 #lt; 6]');
    assert.deepEqual([m.groups[0].title, m.nodes[0].label], ['To do & then', '5 < 6']);
  });

  it('reads the words out of every shape Mermaid lets a card be written in, and draws a card as a card', () => {
    const m = board('  todo(To do)\n    a(Round)\n    b((Circle))\n    c{{Hex}}\n    d))Bang((\n    e)Cloud(\n    [No id]');
    assert.equal(m.groups[0].title, 'To do');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.label, n.shape]), [['a', 'Round', 'box'], ['b', 'Circle', 'box'], ['c', 'Hex', 'box'], ['d', 'Bang', 'box'], ['e', 'Cloud', 'box'], ['No_id', 'No id', 'box']]);
    assert.deepEqual(m.warnings, []);
  });

  it('gives a card with empty brackets its id for words, as any box with none', () => {
    assert.deepEqual(cards(board('  todo[To do]\n    t1[]\n    t2[ ]')), [['t1', 't1'], ['t2', 't2']]);
  });

  it('drops a comment after a card, and keeps one that is part of bare words, as Mermaid does', () => {
    const m = board('  todo[To do] %% the first\n    t1[Raise] %% after\n    Chase the supplier %% why');
    assert.deepEqual([m.groups[0].title, ...m.nodes.map((n) => n.label)], ['To do', 'Raise', 'Chase the supplier %% why']);
    assert.deepEqual(m.warnings, []);
  });

  it('says what it does not read after a card, and still reads the card', () => {
    const m = board('  todo[To do]\n    t1[Raise] extra words\n    t2[Pay]:::urgent');
    assert.deepEqual(cards(m), [['t1', 'Raise'], ['t2', 'Pay']]);
    assert.deepEqual(said(m), ['not read: "extra words" after "t1[Raise]": a card is its id, its words in brackets, and what is set on it in @{ … }', 'not read: ":::urgent" after "t2[Pay]": a card is its id, its words in brackets, and what is set on it in @{ … }']);
  });
});

describe('kanban: ids', () => {
  it('makes an id Merlive\'s own lines can name out of whatever was written', () => {
    const m = board('  to-do[To do]\n    t.1[Raise]\n    2nd[Second]\n    Ünï[Words]\n  %% note t_1: Why this one matters');
    assert.deepEqual([m.groups[0].id, ...m.nodes.map((n) => n.id)], ['to_do', 't_1', '2nd', '_n_']);
    assert.deepEqual(m.notes, { t_1: 'Why this one matters' });
  });

  it('draws two cards written with one id as two cards, as Mermaid does, and never takes a column\'s id for a card', () => {
    const m = board('  todo[To do]\n    t1[Raise]\n    todo[A card called todo]\n  done[Done]\n    t1[Again]');
    assert.deepEqual(columns(m), [['todo', 'To do', 't1 todo_2'], ['done', 'Done', 't1_2']]);
    assert.deepEqual(cards(m), [['t1', 'Raise'], ['todo_2', 'A card called todo'], ['t1_2', 'Again']]);
    assert.deepEqual(m.warnings, []);
  });
});

describe('kanban: what is set on a card', () => {
  it('lists its ticket, who has it and how pressing it is under its words, in that order however written', () => {
    const m = board("  todo[To do]\n    t1[Raise]@{ priority: 'Very High', assigned: 'K. Sveidqvist', ticket: MC-2038 }\n    t2[Chase]@{ assigned: knsv }\n    t3[Pay]");
    assert.deepEqual(m.nodes.map((n) => n.rows), [[['ticket: MC-2038', 'assigned: K. Sveidqvist', 'priority: very high']], [['assigned: knsv']], undefined]);
    assert.deepEqual(m.warnings, []);
  });

  it('reads it in single quotes, double quotes or none, on one line or over several', () => {
    const m = board('  todo[To do]\n    t1[Raise]@{\n      assigned: "knsv"\n      ticket: ABC-1\n    }\n    t2[After]@{ ticket: "A, B" }');
    assert.deepEqual(m.nodes.map((n) => n.rows), [[['ticket: ABC-1', 'assigned: knsv']], [['ticket: A, B']]]);
    assert.deepEqual(columns(m), [['todo', 'To do', 't1 t2']]);
  });

  it('knows the four priorities Mermaid draws, in any case, and keeps another as written and says so', () => {
    assert.deepEqual(priorities, ['very high', 'high', 'low', 'very low']);
    const m = board('  todo[To do]\n    a[A]@{ priority: HIGH }\n    b[B]@{ priority: "Medium" }');
    assert.deepEqual(m.nodes.map((n) => n.rows), [[['priority: high']], [['priority: Medium']]]);
    assert.deepEqual(said(m), ['the priority "Medium" of "B" is not one Mermaid draws (Very High, High, Low, Very Low); it is kept as written']);
  });

  it('takes a label set there for the card\'s words', () => {
    const m = board('  todo[To do]\n    t1[Raise]@{ label: "Raise the order", ticket: 7 }');
    assert.deepEqual([m.nodes[0].label, m.nodes[0].rows], ['Raise the order', [['ticket: 7']]]);
  });

  it('says what else is set there and is not kept, and what is written with no space after its colon', () => {
    const m = board('  todo[To do]\n    t1[Raise]@{ icon: "x", due: tomorrow, ticket: 7 }\n    t2[Pay]@{assigned:knsv}');
    assert.deepEqual(m.nodes.map((n) => n.rows), [[['ticket: 7']], undefined]);
    assert.deepEqual(said(m), [
      'not read: "icon", "due" in what is set on "Raise": a card keeps its label, ticket, assigned and priority',
      'not read: "assigned:knsv" in what is set on "Pay": write each as a name, a colon, a space and its value, as in assigned: knsv',
    ]);
  });

  it('says what it cannot read as something set, and still reads the card', () => {
    // A } inside single quotes closes nothing, so this "@{" is never closed.
    const m = board("  todo[To do]\n    t1[Raise]@{ assigned: '}'");
    assert.deepEqual(cards(m), [['t1', 'Raise']]);
    assert.deepEqual(said(m), ['not read: "@{ assigned: \'}\'" after "t1[Raise]": a card is its id, its words in brackets, and what is set on it in @{ … }']);
  });

  it('keeps nothing set on a column but its label, and says so', () => {
    const m = board('  todo[To do]@{ assigned: "x", priority: "High" }\n    t1[Raise]\n  done[Done]@{ label: "Finished" }');
    assert.equal(m.groups[0].title, 'To do');
    assert.equal(/** @type {any} */ (m.grid?.cells[1]).title, 'Finished');
    assert.deepEqual(said(m), ['not read: "assigned", "priority" in what is set on the column "To do": a column keeps only its label']);
  });
});

describe('kanban: what parse reads for every kind', () => {
  it('takes the title from front matter, passes Mermaid\'s own settings, and reads Merlive\'s own lines', () => {
    const m = parse('---\ntitle: Orders this week\nconfig:\n  kanban:\n    ticketBaseUrl: "https://example.com/browse/#TICKET#"\n---\nkanban\n  %% a comment\n  todo[To do]\n    t1[Raise]@{ ticket: ABC-1 }\n  %% note t1: Waiting on the buyer');
    assert.deepEqual([m.title, m.heading], ['Orders this week', 'Orders this week']);
    assert.deepEqual(m.notes, { t1: 'Waiting on the buyer' });
    assert.deepEqual(columns(m), [['todo', 'To do', 't1']]);
    assert.deepEqual(m.warnings, []);
  });

  it('reads accTitle and accDescr as what they are, though Mermaid draws each as a column', () => {
    const m = board('  accTitle: The board\n  accDescr: What is where\n  todo[To do]\n    t1[Raise]');
    assert.deepEqual([m.title, m.describes, m.heading], ['The board', 'What is where', '']);
    assert.deepEqual(columns(m), [['todo', 'To do', 't1']]);
  });
});

describe('kanban: placed and drawn', () => {
  const at = (/** @type {Model} */ m) => layout(m);
  const left = (/** @type {{x:number,w:number}} */ n) => n.x - n.w / 2, top = (/** @type {{y:number,h:number}} */ n) => n.y - n.h / 2, bottom = (/** @type {{y:number,h:number}} */ n) => n.y + n.h / 2;

  it('puts the columns side by side, each a frame with its name, and the cards of each down it in the order written', () => {
    const m = board(three), lay = at(m);
    assert.deepEqual(broken(m), []);
    assert.deepEqual(lay.groups.map((f) => f.title), ['To do', 'Doing', 'Done']);
    const [a, b, c] = lay.groups;
    assert.ok(a.x + a.w <= b.x && b.x + b.w <= c.x, 'side by side');
    assert.ok(a.y === b.y && b.y === c.y && a.h === b.h && b.h === c.h && a.w === b.w && b.w === c.w, 'one size, in one row');
    assert.ok(lay.nodes.t1.x === lay.nodes.t2.x && bottom(lay.nodes.t1) < top(lay.nodes.t2), 'cards down a column');
    assert.ok(top(lay.nodes.t1) === top(lay.nodes.t3) && top(lay.nodes.t3) === top(lay.nodes.t4), 'the first card of each at the top');
    assert.ok(left(lay.nodes.t3) >= b.x + measure.framePad && left(lay.nodes.t4) >= c.x + measure.framePad);
    assert.deepEqual(lay.warnings, []);
  });

  it('keeps cards close: nothing runs between them, so they need no room for a line', () => {
    const m = board(three), lay = at(m);
    assert.equal(top(lay.nodes.t2) - bottom(lay.nodes.t1), gridMeasure.close);
    assert.equal(lay.groups[1].x - (lay.groups[0].x + lay.groups[0].w), gridMeasure.close);
  });

  it('makes a card as tall as what it lists, and wide enough for its longest line', () => {
    const m = board("  todo[To do]\n    t1[Create the parsing tests]@{ ticket: MC-2038, assigned: 'K. Sveidqvist', priority: 'High' }\n    t2[Pay]\n  done[Done]\n    t3[Ship]@{ ticket: MC-1 }"), lay = at(m);
    assert.deepEqual(broken(m), []);
    assert.equal(lay.nodes.t1.h, lay.box.h + 2 * measure.rowPad + 3 * measure.rowLine);
    assert.equal(lay.nodes.t3.h, lay.box.h + 2 * measure.rowPad + measure.rowLine);
    assert.ok(lay.nodes.t2.h < lay.nodes.t3.h, 'a card that lists nothing is no taller for the ones that do');
    assert.ok('assigned: K. Sveidqvist'.length * measure.rowGlyph + 2 * measure.rowIn <= lay.nodes.t1.w, `${lay.nodes.t1.w}px`);
    const svg = picture(m, lay, builtIn, { title: 't' });
    for (const row of ['ticket: MC-2038', 'assigned: K. Sveidqvist', 'priority: high']) assert.ok(svg.includes(`>${row}<`), row);
  });

  it('draws a column with nothing in it as a frame with its name, as wide and as tall as the others', () => {
    const m = board('  todo[To do]\n    t1[Raise]\n    t2[Chase]\n  done[Done]\n  gone[Cannot reproduce]'), lay = at(m);
    assert.deepEqual(broken(m), []);
    assert.deepEqual(lay.groups.map((f) => [f.id, f.title]), [['todo', 'To do'], ['done', 'Done'], ['gone', 'Cannot reproduce']]);
    assert.ok(lay.groups.every((f) => f.w === lay.groups[0].w && f.h === lay.groups[0].h && f.name.w > 0));
    assert.match(picture(m, lay, builtIn, { title: 't' }), />Cannot reproduce</);
  });

  it('makes every column wide enough for the longest name of a column', () => {
    const m = board('  a[A column with a very long name indeed]\n    t1[X]\n  b[B]\n    t2[Y]'), lay = at(m);
    assert.deepEqual(broken(m), []);
    assert.ok(lay.groups[0].name.w + 2 * measure.nameIn <= lay.groups[0].w + 1);
  });
});

describe('kanban: the corpus', () => {
  /** @type {{file:string,covers:string,boxes?:number,links?:number,groups?:number,has?:string[],placedBy?:string,rows?:number[],shapes?:string[],notes?:number,title?:string,says?:string,loses?:string}[]} */
  const folded = JSON.parse(readFileSync(join(root, 'corpus/index.json'), 'utf8')).kanban;
  const list = folded ?? (existsSync(join(root, 'corpus/kanban.json')) ? JSON.parse(readFileSync(join(root, 'corpus/kanban.json'), 'utf8')) : []);

  it('lists every sample there is, and every sample it lists is there', () => {
    const files = readdirSync(join(root, 'corpus/kanban')).filter((f) => f.endsWith('.mmd')).map((f) => `kanban/${f}`).sort();
    assert.deepEqual(list.map((s) => s.file).sort(), files);
    assert.ok(files.length >= 12, `${files.length} samples`);
  });

  it('reads each as the list says, places it on its grid and breaks no rule', () => {
    for (const s of list) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8')), lay = layout(m);
      assert.equal(m.type, 'flowchart', s.file);
      assert.equal(m.placedBy, s.placedBy, s.file);
      assert.equal(m.nodes.length, s.boxes, `${s.file}: boxes`);
      assert.equal(m.edges.length, s.links, `${s.file}: links`);
      // A column with no cards is a frame on the picture, though no group in the model: the picture is what is counted.
      assert.equal(lay.groups.length, s.groups, `${s.file}: groups`);
      const words = [...m.nodes.flatMap((n) => [n.label, ...(n.rows ?? []).flat()]), ...m.groups.map((g) => g.title)];
      for (const has of s.has ?? []) assert.ok(words.includes(has), `${s.file}: "${has}"`);
      if (s.rows) assert.deepEqual(m.nodes.map((n) => (n.rows ?? []).flat().length), s.rows, `${s.file}: rows`);
      if (s.shapes) assert.deepEqual(m.nodes.map((n) => n.shape), s.shapes, `${s.file}: shapes`);
      if (s.notes !== undefined) assert.equal(Object.keys(m.notes).length, s.notes, `${s.file}: notes`);
      if (s.title !== undefined) assert.equal(m.title, s.title, `${s.file}: title`);
      // What a sample is meant to be told is the only thing it may be told.
      assert.deepEqual(m.warnings.filter((w) => !(s.says && w.includes(s.says))), [], s.file);
      if (s.says) assert.ok(m.warnings.some((w) => w.includes(/** @type {string} */ (s.says))) && s.loses, `${s.file}: says`);
      assert.deepEqual(broken(m), [], s.file);
      assert.deepEqual(lay.warnings, [], s.file);
      assert.doesNotThrow(() => picture(m, lay, builtIn, { title: s.file }), s.file);
    }
  });
});

describe("kanban: the page's words", () => {
  const about = { title: 'A board', source: 'x', version: '0' };
  it('calls a card a card, in the legend and when it is picked, unless its author named it', () => {
    assert.deepEqual(board(three).meanings, { step: 'Card' });
    assert.deepEqual(board(`${three}\n%% kind step: Task`).meanings, { step: 'Task' });
    const m = board(three);
    assert.match(page(m, layout(m), builtIn, about), /<\/i>Card<\/span>/);
  });

  it('says nothing of a flow where nothing is linked: no lines to pick, nothing that comes from or goes to', () => {
    const m = board(three), html = page(m, layout(m), builtIn, about);
    assert.match(html, /id="mv-none">Pick a box to read all it says\.</);
    assert.doesNotMatch(html, /Pick a box or a line/);
    assert.match(html, /"linked":false/);
    const f = parse('flowchart TD\n  A --> B');
    assert.match(page(f, layout(f), builtIn, about), /"linked":true/);
  });
});
