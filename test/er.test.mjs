// Why: an entity diagram is boxes and links too: entities with the attributes they list, and relationships
// that say how many at each end. These hold the reading, through parse(), and hold the corpus's own list
// (the `er` list of corpus/index.json) to what is read today. How a box with rows and a crow's foot are drawn is tested where
// they are drawn.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { cardinalities } from '../skills/merlive/scripts/er.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const er = (/** @type {string} */ body) => parse(`erDiagram\n${body}`);
/** @typedef {import('../skills/merlive/scripts/parse.mjs').Model} Model */
const boxes = (/** @type {Model} */ m) => m.nodes.map((n) => [n.id, n.label]);
const links = (/** @type {Model} */ m) => m.edges.map((e) => [e.id, e.tail, e.head, e.style, e.label]);
const rows = (/** @type {Model} */ m) => Object.fromEntries(m.nodes.filter((n) => n.rows).map((n) => [n.id, n.rows]));

describe('er: what it is taken for', () => {
  it('calls an entity an entity on the page, unless its author named it', () => {
    assert.equal(er('SUPPLIER ||--o{ ORDER : receives').meanings?.step, 'Entity');
  });

  it('is read as boxes and links, into the model a flowchart gives', () => {
    const m = er('SUPPLIER ||--o{ ORDER : receives');
    assert.equal(m.type, 'flowchart');
    assert.equal(m.kindOfDiagram, 'erDiagram');
    assert.equal(m.direction, 'TD');
    assert.deepEqual(boxes(m), [['SUPPLIER', 'SUPPLIER'], ['ORDER', 'ORDER']]);
    assert.deepEqual(links(m), [['SUPPLIER-ORDER', 'one', 'zero-or-many', 'solid', 'receives']]);
    assert.deepEqual(m.nodes.map((n) => [n.shape, n.kind, n.rows]), [['box', 'step', undefined], ['box', 'step', undefined]]);
    assert.deepEqual(m.warnings, []);
  });

  it('is read with a semicolon after its first word, and is not taken for a flowchart with another', () => {
    assert.equal(parse('erDiagram;\nSUPPLIER').nodes.length, 1);
    assert.equal(parse('erDiagrams\nSUPPLIER').type, 'unsupported');
  });

  it('leaves a state diagram and a flowchart read as they were', () => {
    assert.deepEqual(parse('stateDiagram-v2\nDraft --> Sent').edges.map((e) => e.id), ['Draft-Sent']);
    assert.deepEqual(parse('flowchart TD\nA --> B').edges.map((e) => e.id), ['A-B']);
  });
});

describe('er: entities', () => {
  it('reads an entity that stands alone, and one named only in a relationship, as boxes with no rows', () => {
    const m = er('PRODUCT\nSUPPLIER ||--o{ ORDER : receives');
    assert.deepEqual(boxes(m), [['PRODUCT', 'PRODUCT'], ['SUPPLIER', 'SUPPLIER'], ['ORDER', 'ORDER']]);
    assert.deepEqual(rows(m), {});
  });

  it('names an entity with a hyphen, in quotes, or in another alphabet, and gives it an id Merlive\'s own lines can use', () => {
    const m = er('ORDER-LINE ||--|| "Delivery address" : "goes to"\n"Händler ❤"\n%% note ORDER_LINE: One product on one order.\n%% main: ORDER_LINE>Delivery_address');
    assert.deepEqual(boxes(m), [['ORDER_LINE', 'ORDER-LINE'], ['Delivery_address', 'Delivery address'], ['H_ndler__', 'Händler ❤']]);
    assert.deepEqual(m.edges.map((e) => e.id), ['ORDER_LINE-Delivery_address']);
    assert.deepEqual(m.notes, { ORDER_LINE: 'One product on one order.' });
    assert.deepEqual(m.hints.main, ['ORDER_LINE', 'Delivery_address']);
    assert.deepEqual(m.warnings, []);
  });

  it('keeps two names apart that differ only in what an id cannot hold', () => {
    const m = er('ORDER-LINE\nORDER_LINE\n"ORDER LINE"');
    assert.deepEqual(boxes(m), [['ORDER_LINE', 'ORDER-LINE'], ['ORDER_LINE_2', 'ORDER_LINE'], ['ORDER_LINE_3', 'ORDER LINE']]);
  });

  it('draws the words of a name written as Markdown plain', () => {
    assert.deepEqual(boxes(er('"A **firm** _order_"')), [['A___firm____order_', 'A firm order']]);
  });

  it('shows an alias in place of the name, wherever the entity is next named', () => {
    const m = er('s[Supplier] {\n  string name\n}\na["Supplier account"]\ns ||--o| a : has');
    assert.deepEqual(boxes(m), [['s', 'Supplier'], ['a', 'Supplier account']]);
    assert.deepEqual(links(m), [['s-a', 'one', 'zero-or-one', 'solid', 'has']]);
    assert.deepEqual(m.warnings, []);
  });
});

describe('er: attributes', () => {
  it('lists each attribute as its type and its name, in one compartment, in the order written', () => {
    const m = er('ORDER {\n    int number\n    string deliveryAddress\n    date placed\n}');
    assert.deepEqual(rows(m), { ORDER: [['int number', 'string deliveryAddress', 'date placed']] });
    assert.deepEqual(m.warnings, []);
  });

  it('keeps a key and several keys in the row, and puts a comment in the note on its entity', () => {
    const m = er('ORDER_LINE {\n  int orderNumber PK, FK\n  string productCode PK,FK\n  string barcode UK "printed on the label"\n  int quantity "never less than 1"\n}');
    assert.deepEqual(rows(m).ORDER_LINE, [['int orderNumber PK, FK', 'string productCode PK, FK', 'string barcode UK', 'int quantity']]);
    assert.equal(m.notes.ORDER_LINE, 'barcode: printed on the label; quantity: never less than 1');
  });

  it("adds an attribute's comment to the note its author wrote, wherever that note is", () => {
    const before = er('%% note ORDER: One for each basket.\nORDER {\n  int number "counts up from 1"\n}');
    const after = er('ORDER {\n  int number "counts up from 1"\n}\n%% note ORDER: One for each basket.');
    assert.equal(before.notes.ORDER, 'One for each basket. number: counts up from 1');
    assert.equal(after.notes.ORDER, before.notes.ORDER);
  });

  it('reads a star before a name as a primary key', () => {
    assert.deepEqual(rows(er('PRODUCT {\n  string *code\n  string *sku PK\n  string name\n}')).PRODUCT, [['string code PK', 'string sku PK', 'string name']]);
  });

  it('reads the types Mermaid allows: a length, a list, two numbers, one that may be missing', () => {
    const m = er('INVOICE {\n  string(40) reference\n  string[] lines\n  decimal(10,2) total\n  decimal(10, 2) tax\n  date? paid\n  varchar-2 note_text\n}');
    assert.deepEqual(rows(m).INVOICE, [['string(40) reference', 'string[] lines', 'decimal(10,2) total', 'decimal(10, 2) tax', 'date? paid', 'varchar-2 note_text']]);
    assert.deepEqual(m.warnings, []);
  });

  it('reads attributes in other alphabets, and entity codes in a comment', () => {
    const m = er('SUPPLIER {\n  string näme "the firm#39;s own"\n}');
    assert.deepEqual(rows(m).SUPPLIER, [['string näme']]);
    assert.equal(m.notes.SUPPLIER, "näme: the firm's own");
  });

  it('joins the attributes of an entity declared twice, and gives one declared empty no rows', () => {
    const m = er('ORDER {\n  int number PK\n}\nORDER {\n  date placed\n}\nPRODUCT {\n}\nINVOICE {}\nSUPPLIER { }');
    assert.deepEqual(rows(m), { ORDER: [['int number PK', 'date placed']] });
    assert.deepEqual(boxes(m).map(([id]) => id), ['ORDER', 'PRODUCT', 'INVOICE', 'SUPPLIER']);
    assert.deepEqual(m.warnings, []);
  });

  it('takes a class and an alias on the line that opens the attributes', () => {
    const m = er('ORDER:::urgent {\n  int number\n}\np[Product]:::stocked {\n  string code\n}');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.label, n.kind, n.rows?.[0].length]), [['ORDER', 'ORDER', 'urgent', 1], ['p', 'Product', 'stocked', 1]]);
  });

  it('says so when a line between the braces is not an attribute, and keeps the rest', () => {
    const m = er('ORDER {\n  int number\n  justoneword\n  date placed\n}');
    assert.deepEqual(rows(m).ORDER, [['int number', 'date placed']]);
    assert.match(m.warnings[0], /^line 4: not read: "justoneword" is not an attribute: write its type, then its name$/);
  });

  it('says so when attributes are all on one line, or are never closed, or a brace closes nothing', () => {
    assert.match(er('ORDER { int number }').warnings[0], /^line 2: not read: "ORDER \{ int number \}"; write each attribute on a line of its own, between \{ and \}$/);
    const open = er('SUPPLIER\nORDER {\n  int number');
    assert.match(open.warnings[0], /^line 3: the attributes of ORDER are never closed; end them with a line of \}$/);
    assert.deepEqual(rows(open).ORDER, [['int number']]);
    assert.match(er('}').warnings[0], /^line 2: not read: a "\}" with no entity open$/);
  });
});

describe('er: relationships', () => {
  it('reads how many at each end, in crow\'s foot marks, either way round', () => {
    const m = er('A |o--o| B : a\nA ||--|| B : b\nA }o--o{ B : c\nA }|--|{ B : d\nA o|--|o B : e\nA o{--}o B : f\nA |{--}| B : g');
    assert.deepEqual(m.edges.map((e) => [e.tail, e.head]), [
      ['zero-or-one', 'zero-or-one'], ['one', 'one'], ['zero-or-many', 'zero-or-many'], ['one-or-many', 'one-or-many'],
      ['zero-or-one', 'zero-or-one'], ['zero-or-many', 'zero-or-many'], ['one-or-many', 'one-or-many'],
    ]);
    assert.deepEqual(m.warnings, []);
  });

  it('reads how many in every word Mermaid has for it', () => {
    for (const [words, mark] of Object.entries(cardinalities)) {
      const m = er(`SUPPLIER ${words} to ${words} ORDER : receives`);
      assert.deepEqual(links(m), [['SUPPLIER-ORDER', mark, mark, 'solid', 'receives']], words);
      assert.deepEqual(m.warnings, [], words);
    }
    assert.deepEqual(new Set(Object.values(cardinalities)), new Set(['one', 'zero-or-one', 'one-or-many', 'zero-or-many']));
    for (const words of ['one or zero', 'zero or one', 'one or more', 'one or many', 'many(1)', '1+', 'zero or more', 'zero or many', 'many(0)', '0+', 'only one', '1']) assert.ok(words in cardinalities, words);
  });

  it('reads a relationship that identifies as a solid line, and one that does not as a dotted one, in marks or in words', () => {
    const m = er('ORDER ||--|{ ORDER_LINE : contains\nSUPPLIER }o..o{ PRODUCT : stocks\nINVOICE 1 to 1 ORDER : bills\nSUPPLIER many(0) optionally to 0+ INVOICE : sends\nPRODUCT ||  to  zero or more ORDER_LINE : "is on"\nORDER only one .. 1+ INVOICE : "is billed by"');
    assert.deepEqual(links(m).map(([id, tail, head, style]) => [id, tail, head, style]), [
      ['ORDER-ORDER_LINE', 'one', 'one-or-many', 'solid'], ['SUPPLIER-PRODUCT', 'zero-or-many', 'zero-or-many', 'dotted'],
      ['INVOICE-ORDER', 'one', 'one', 'solid'], ['SUPPLIER-INVOICE', 'zero-or-many', 'zero-or-many', 'dotted'],
      ['PRODUCT-ORDER_LINE', 'one', 'zero-or-many', 'solid'], ['ORDER-INVOICE', 'one', 'one-or-many', 'dotted'],
    ]);
    assert.deepEqual(m.warnings, []);
  });

  it('reads its words: plain, quoted, empty, and with a character written as a code', () => {
    const m = er('A ||--o{ B : places\nA ||--o{ C : "is placed by"\nA ||--o{ D : ""\nA ||--o{ E : "costs #gt; 100"\nA ||--o{ F');
    assert.deepEqual(m.edges.map((e) => e.label), ['places', 'is placed by', '', 'costs > 100', '']);
    assert.deepEqual(m.warnings, []);
  });

  it('reads one written with no spaces, and one from an entity to itself', () => {
    const m = er('id1||--||id2 : label\nSUPPLIER}o..o{SUPPLIER:"buys from"');
    assert.deepEqual(links(m), [['id1-id2', 'one', 'one', 'solid', 'label'], ['SUPPLIER-SUPPLIER', 'zero-or-many', 'zero-or-many', 'dotted', 'buys from']]);
  });

  it('gives a second relationship between the same two a name of its own', () => {
    assert.deepEqual(er('A ||--o{ B : one\nA }o--|| B : two').edges.map((e) => e.id), ['A-B', 'A-B#2']);
  });

  it('takes a class on either entity of a relationship', () => {
    const m = er('SUPPLIER:::trusted ||--o{ ORDER:::urgent,late : receives');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.kind]), [['SUPPLIER', 'trusted'], ['ORDER', 'urgent']]);
  });

  it('says so when a relationship is half written, and leaves no box behind', () => {
    const m = er('SUPPLIER ||--o{\nSUPPLIER ||-- ORDER : receives\nSUPPLIER --> ORDER\nPRODUCT');
    assert.equal(m.warnings.length, 3);
    for (const w of m.warnings) assert.match(w, /^line \d: not read: "/);
    assert.deepEqual(boxes(m), [['PRODUCT', 'PRODUCT']]);
  });
});

describe('er: what a flowchart has too', () => {
  it('reads comments, a title, and what the picture is called and shows', () => {
    const m = parse('---\ntitle: Orders\nconfig:\n  layout: dagre\n---\nerDiagram\n  accTitle: Who orders what\n  accDescr: A supplier receives orders\n  %% the heart of it\n  SUPPLIER ||--o{ ORDER : receives %% said from the supplier\'s side\n  ORDER {\n    int number %% what a buyer quotes\n  }');
    assert.equal(m.title, 'Who orders what');
    assert.equal(m.describes, 'A supplier receives orders');
    assert.deepEqual(links(m), [['SUPPLIER-ORDER', 'one', 'zero-or-many', 'solid', 'receives']]);
    assert.deepEqual(rows(m).ORDER, [['int number']]);
    assert.deepEqual(m.warnings, []);
  });

  it('keeps a %% that is inside quotes', () => {
    assert.equal(er('A ||--o{ B : "100%% sure"').edges[0].label, '100%% sure');
  });

  it('is drawn top to bottom: that direction is read, and any other is read past and said once', () => {
    assert.deepEqual(er('direction TB\nA ||--o{ B : has').warnings, []);
    const m = er('direction LR\nA ||--o{ B : has\ndirection RL');
    assert.equal(m.direction, 'TD');
    assert.deepEqual(m.warnings, ['line 2: an entity diagram is drawn top to bottom for now: "direction LR" is read past']);
  });

  it('reads groups, one inside another, named by a word, by words in quotes, or by an id and a title', () => {
    const m = er('subgraph Buying\n  SUPPLIER ||--o{ ORDER : receives\n  subgraph "Order lines"\n    direction LR\n    ORDER_LINE\n  end\nend\nsubgraph pay [Paying up]\n  INVOICE\nend');
    assert.deepEqual(m.groups, [
      { id: 'Buying', title: 'Buying', members: ['SUPPLIER', 'ORDER', 'ORDER_LINE'] },
      { id: 'Order lines', title: 'Order lines', members: ['ORDER_LINE'], parent: 'Buying' },
      { id: 'pay', title: 'Paying up', members: ['INVOICE'] },
    ]);
    assert.deepEqual(m.warnings, []);
  });

  it('joins a relationship with a group to where the group starts and ends', () => {
    const m = er('subgraph Buying\n  SUPPLIER ||--o{ ORDER : receives\nend\nsubgraph "Paying up"\n  INVOICE ||--|| PAYMENT : "is settled by"\nend\nBuying ||--|| "Paying up" : "leads to"\n"Paying up" ||--o{ RECEIPT : gives');
    assert.deepEqual(m.edges.map((e) => [e.id, e.label]), [['SUPPLIER-ORDER', 'receives'], ['INVOICE-PAYMENT', 'is settled by'], ['ORDER-INVOICE', 'leads to'], ['PAYMENT-RECEIPT', 'gives']]);
    assert.deepEqual(boxes(m).map(([id]) => id), ['SUPPLIER', 'ORDER', 'INVOICE', 'PAYMENT', 'RECEIPT']);
    assert.deepEqual(m.warnings, []);
  });

  it('takes a kind from a class, given inline, to one entity or to several, and the first of several classes', () => {
    const m = er('SUPPLIER:::trusted\nORDER\nORDER-LINE\nPRODUCT\nclass ORDER,ORDER-LINE urgent,late\nclass PRODUCT stocked\nclass NOBODY stocked\nclassDef urgent,late stroke:#c62828,stroke-dasharray: 4 2\nclassDef default fill:#f9f');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.kind, n.dashed ?? false]), [['SUPPLIER', 'trusted', false], ['ORDER', 'urgent', true], ['ORDER_LINE', 'urgent', true], ['PRODUCT', 'stocked', false]]);
    assert.deepEqual(m.classes, { urgent: '#c62828', late: '#c62828', default: '#ff99ff' });
    assert.deepEqual(m.warnings, []);
  });

  it('gives a class named before its entity, and leaves a class for an entity that never comes', () => {
    const m = er('class ORDER urgent\nORDER');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.kind]), [['ORDER', 'urgent']]);
  });

  it('keeps what a style says of an entity\'s outline, for one or for several, whatever their names hold', () => {
    const m = er('ORDER\nORDER-LINE\n"Delivery address"\nstyle ORDER fill:#f9f,stroke:#333,stroke-width:4px\nstyle ORDER-LINE,"Delivery address" stroke:#c00,stroke-dasharray: 5 5');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.kind, n.heavy ?? false, n.dashed ?? false]), [['ORDER', 'grey', true, false], ['ORDER_LINE', 'red', false, true], ['Delivery_address', 'red', false, true]]);
    assert.deepEqual(m.warnings, []);
  });

  it('takes Merlive\'s own lines, as a flowchart does', () => {
    const m = er('SUPPLIER ||--o{ ORDER : receives\nORDER ||--|{ ORDER_LINE : contains\n%% note ORDER: Raised by a buyer.\n%% step: An order | SUPPLIER>ORDER>ORDER_LINE | From the supplier to its lines.\n%% side: left\n%% turn: no');
    assert.deepEqual(m.notes, { ORDER: 'Raised by a buyer.' });
    assert.deepEqual(m.steps[0].seq, ['SUPPLIER-ORDER', 'ORDER-ORDER_LINE']);
    assert.deepEqual(m.hints, { side: 'left', turn: false });
    assert.deepEqual(m.warnings, []);
  });

  it('says what it cannot read, with its line, and makes no box of it', () => {
    const m = er('SUPPLIER\nthis is not a statement\nA --> B\nclass\nstyle');
    assert.deepEqual(m.warnings, ['line 3: not read: "this is not a statement"', 'line 4: not read: "A --> B"', 'line 5: not read: "class"', 'line 6: not read: "style"']);
    assert.deepEqual(boxes(m), [['SUPPLIER', 'SUPPLIER']]);
  });
});

describe('er: the corpus', () => {
  /** @type {{file:string,covers:string,boxes:number,links:number,groups?:number,has?:string[],rows:number[],ends:string[][],kinds?:string[],title?:string,loses?:string,says?:string}[]} */
  const list = JSON.parse(readFileSync(join(root, 'corpus/index.json'), 'utf8')).er;

  it('lists every sample that is there, and every sample listed is there', () => {
    assert.deepEqual(list.map((s) => s.file).sort(), readdirSync(join(root, 'corpus/er')).filter((f) => f.endsWith('.mmd')).map((f) => `er/${f}`).sort());
    for (const s of list) assert.ok(s.covers && Number.isInteger(s.boxes) && Number.isInteger(s.links) && Array.isArray(s.rows) && Array.isArray(s.ends), s.file);
  });

  it('is read as its list says: boxes, links, rows, what each link ends in, words, and nothing left unread', () => {
    for (const s of list) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8'));
      assert.equal(m.kindOfDiagram, 'erDiagram', s.file);
      assert.equal(m.nodes.length, s.boxes, `${s.file}: boxes`);
      assert.equal(m.edges.length, s.links, `${s.file}: links`);
      assert.equal(m.groups.length, s.groups ?? 0, `${s.file}: groups`);
      assert.deepEqual(m.nodes.map((n) => n.rows?.[0].length ?? 0), s.rows, `${s.file}: rows`);
      assert.deepEqual(m.edges.map((e) => [e.tail, e.head]), s.ends, `${s.file}: ends`);
      const said = [...m.nodes.flatMap((n) => [n.label, ...(n.rows ?? []).flat()]), ...m.edges.map((e) => e.label), ...m.groups.map((g) => g.title)];
      for (const words of s.has ?? []) assert.ok(said.includes(words), `${s.file}: "${words}" is not among its words: ${said.join(' | ')}`);
      for (const kind of s.kinds ?? []) assert.ok(m.nodes.some((n) => n.kind === kind), `${s.file}: no box of the kind ${kind}`);
      if (s.title !== undefined) assert.equal(m.title, s.title, s.file);
      // What a sample is known to be told is in its list; anything else said means something was not read.
      assert.deepEqual(m.warnings.map((w) => w.replace(/^line \d+: /, '')), s.says ? [s.says] : [], s.file);
    }
  });

  it('covers every mark a relationship can end in, and a line of each kind', () => {
    const models = list.map((s) => parse(readFileSync(join(root, 'corpus', s.file), 'utf8')));
    const ends = new Set(models.flatMap((m) => m.edges.flatMap((e) => [e.tail, e.head])));
    assert.deepEqual([...ends].sort(), ['one', 'one-or-many', 'zero-or-many', 'zero-or-one']);
    assert.deepEqual([...new Set(models.flatMap((m) => m.edges.map((e) => e.style)))].sort(), ['dotted', 'solid']);
  });
});

describe('er: an entity is a table', () => {
  it('keeps each attribute cell by cell beside its row: its type, its name, its keys', () => {
    const m = er('ORDER_LINE {\n  int orderNumber PK, FK\n  string *productCode\n  int quantity\n}');
    assert.deepEqual(m.nodes[0].table, [['int', 'orderNumber', 'PK, FK'], ['string', 'productCode', 'PK'], ['int', 'quantity', '']]);
    assert.deepEqual(m.nodes[0].rows, [['int orderNumber PK, FK', 'string productCode PK', 'int quantity']]);
  });

  it('gives an entity with no attributes no table', () => {
    assert.equal(er('SUPPLIER ||--o{ ORDER : receives').nodes[0].table, undefined);
  });
});
