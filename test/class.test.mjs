// Why: a class diagram is boxes and links, with rows in the boxes and more ways for a link to end. It is read
// into the model a flowchart gives, so these hold the reading and nothing else: what a class is called, what it
// lists, how it is tied to the next, and what is said of whatever could not be read. How it is drawn has its
// own tests.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout } from '../skills/merlive/scripts/layout.mjs';
import { shown } from '../skills/merlive/scripts/class.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cls = (/** @type {string} */ body, head = 'classDiagram') => parse(`${head}\n${body}`);
/** @typedef {import('../skills/merlive/scripts/parse.mjs').Model} Model */
const names = (/** @type {Model} */ m) => m.nodes.map((n) => [n.id, n.label]);
const ties = (/** @type {Model} */ m) => m.edges.map((e) => [e.id, e.tail, e.head, e.style]);
const rows = (/** @type {Model} */ m, /** @type {string} */ id) => m.nodes.find((n) => n.id === id)?.rows;

describe('class: what it is taken for', () => {
  it('is read as boxes and links, whichever way it is declared', () => {
    for (const head of ['classDiagram', 'classDiagram-v2']) {
      const m = cls('Vehicle <|-- Car', head);
      assert.equal(m.type, 'flowchart');
      assert.equal(m.kindOfDiagram, 'classDiagram');
      assert.deepEqual(names(m), [['Vehicle', 'Vehicle'], ['Car', 'Car']]);
      assert.deepEqual(m.warnings, []);
    }
  });

  it('is drawn top to bottom, and says once when another way was asked for', () => {
    assert.deepEqual(cls('direction TB\nA --> B').warnings, []);
    const m = cls('direction RL\nA --> B\ndirection LR');
    assert.equal(m.direction, 'TD');
    assert.deepEqual(m.warnings, ['line 2: a class diagram is drawn top to bottom for now: "direction RL" is read past']);
  });

  it('keeps what a flowchart keeps: front matter, a title for readers who cannot see it, comments', () => {
    const m = parse('---\ntitle: Ordering\n---\nclassDiagram\n  accDescr: Who holds what\n  %% the two that matter\n  Order --> Supplier');
    assert.equal(m.title, 'Ordering');
    assert.equal(m.describes, 'Who holds what');
    assert.deepEqual(ties(m), [['Order-Supplier', 'none', 'arrow', 'solid']]);
  });
});

describe('class: a class', () => {
  it('is a box named by its name, made by declaring it or by tying it to another', () => {
    const m = cls('class Order\nOrder --> Supplier\nclass Order');
    assert.deepEqual(names(m), [['Order', 'Order'], ['Supplier', 'Supplier']]);
    assert.deepEqual(m.nodes.map((n) => [n.shape, n.rows, n.over]), [['box', undefined, undefined], ['box', undefined, undefined]]);
  });

  it('takes a label, and a name between backticks that no bare name could be', () => {
    const m = cls('class Order["A purchase order"]\nclass `Order line!`\nOrder --> `Order line!`\nclass Größe-1');
    assert.deepEqual(names(m), [['Order', 'A purchase order'], ['Order line!', 'Order line!'], ['Größe-1', 'Größe-1']]);
    assert.deepEqual(m.edges.map((e) => [e.from, e.to]), [['Order', 'Order line!']]);
    assert.deepEqual(m.warnings, []);
  });

  it('shows what it is generic over, which is no part of its name', () => {
    const m = cls('class Basket~Item~{\n  +List~Item~ items\n}\nBasket --> Item');
    assert.deepEqual(names(m), [['Basket', 'Basket<Item>'], ['Item', 'Item']]);
  });

  it('carries its annotation over its name, written any of the three ways', () => {
    const m = cls('class Shape <<interface>>\nclass Colour\n<<Enumeration>> Colour\nclass Carrier{\n  <<service>>\n  +send()\n}');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.over]), [['Shape', '«interface»'], ['Colour', '«Enumeration»'], ['Carrier', '«service»']]);
    assert.deepEqual(rows(m, 'Carrier'), [['+send()']]);
    assert.deepEqual(m.warnings, []);
  });
});

describe('class: what a class lists', () => {
  it('reads members from a block and from lines of their own, what it holds before what it does', () => {
    const m = cls('class Order{\n  +total() Money\n  +String number\n}\nOrder : +Date placed\nOrder: +cancel()');
    assert.deepEqual(rows(m, 'Order'), [['+String number', '+Date placed'], ['+total() Money', '+cancel()']]);
    assert.deepEqual(m.warnings, []);
  });

  it('gives one compartment to a class that only holds, or only does', () => {
    const m = cls('class Colour{\n  <<enumeration>>\n  RED\n  GREEN\n}\nclass Printer{\n  print()\n}\nclass Empty{\n}\nclass Bare{}');
    assert.deepEqual(rows(m, 'Colour'), [['RED', 'GREEN']]);
    assert.deepEqual(rows(m, 'Printer'), [['print()']]);
    assert.equal(rows(m, 'Empty'), undefined);
    assert.equal(rows(m, 'Bare'), undefined);
    assert.deepEqual(m.warnings, []);
  });

  it('keeps who may see a member, its types and what it gives back, as they were written', () => {
    const m = cls('class Account{\n  +String owner\n  -BigDecimal balance\n  #int   pin\n  ~Ledger ledger\n  -id : int\n  +deposit(amount) bool\n  +withdrawal( amount,  note ) int\n}');
    assert.deepEqual(rows(m, 'Account'), [
      ['+String owner', '-BigDecimal balance', '#int pin', '~Ledger ledger', '-id : int'],
      ['+deposit(amount) bool', '+withdrawal( amount, note ) int'],
    ]);
  });

  it('writes a generic type the way a reader knows it, inside another too', () => {
    assert.equal(shown('List~int~ position'), 'List<int> position');
    assert.equal(shown('setPoints(List~int~ points)'), 'setPoints(List<int> points)');
    assert.equal(shown('+getDistanceMatrix() List~List~int~~'), '+getDistanceMatrix() List<List<int>>');
    assert.equal(shown('~Ledger ledger'), '~Ledger ledger', 'a ~ in front is who may see it, not a generic');
    assert.equal(shown('~List~Entry~ entries'), '~List<Entry> entries');
    assert.equal(shown('odd~one'), 'odd~one', 'one that is never closed is left as it was typed');
  });

  it('says in words what Mermaid marks with a sign: abstract and static', () => {
    assert.equal(shown('+total()*'), '+total() {abstract}');
    assert.equal(shown('+total() Money*'), '+total() Money {abstract}');
    assert.equal(shown('+count()$'), '+count() {static}');
    assert.equal(shown('+count() int$'), '+count() int {static}');
    assert.equal(shown('+String prefix$'), '+String prefix {static}');
    assert.equal(shown('+int* pointer'), '+int* pointer', 'only at the end does it mean anything');
  });
});

describe('class: how two classes are tied', () => {
  it('reads each of the eight, with what is at each end and whether the line is dotted', () => {
    const m = cls('A *-- B\nC o-- D\nE --> F\nG -- H\nI ..> J\nK .. L\nM <|-- N\nO <|.. P');
    assert.deepEqual(ties(m), [
      ['A-B', 'diamond', 'none', 'solid'], ['C-D', 'diamond-open', 'none', 'solid'], ['E-F', 'none', 'arrow', 'solid'], ['G-H', 'none', 'none', 'solid'],
      ['I-J', 'none', 'arrow', 'dotted'], ['K-L', 'none', 'none', 'dotted'], ['M-N', 'triangle', 'none', 'solid'], ['O-P', 'triangle', 'none', 'dotted'],
    ]);
    assert.deepEqual(m.warnings, []);
  });

  it('reads them written the other way round, and with no spaces', () => {
    const m = cls('A --* B\nC --o D\nE <-- F\nG <.. H\nI*--J\nK<|--L');
    assert.deepEqual(ties(m), [
      ['A-B', 'none', 'diamond', 'solid'], ['C-D', 'none', 'diamond-open', 'solid'], ['E-F', 'arrow', 'none', 'solid'], ['G-H', 'arrow', 'none', 'dotted'],
      ['I-J', 'diamond', 'none', 'solid'], ['K-L', 'triangle', 'none', 'solid'],
    ]);
  });

  it('runs "is a" from the parent down to the child, whichever way it was written', () => {
    const m = cls('Animal <|-- Duck\nFish --|> Animal\nShape <|.. Square\nCircle ..|> Shape : draws as');
    assert.deepEqual(ties(m), [
      ['Animal-Duck', 'triangle', 'none', 'solid'], ['Animal-Fish', 'triangle', 'none', 'solid'],
      ['Shape-Square', 'triangle', 'none', 'dotted'], ['Shape-Circle', 'triangle', 'none', 'dotted'],
    ]);
    assert.equal(m.edges[3].label, 'draws as');
    assert.deepEqual(names(m).map(([id]) => id), ['Animal', 'Duck', 'Fish', 'Shape', 'Square', 'Circle']);
  });

  it('reads a relation that says something at both ends', () => {
    const m = cls('Animal <|--|> Zebra\nA *--o B\nC <--> D\nE o..> F');
    assert.deepEqual(ties(m), [
      ['Animal-Zebra', 'triangle', 'triangle', 'solid'], ['A-B', 'diamond', 'diamond-open', 'solid'], ['C-D', 'arrow', 'arrow', 'solid'], ['E-F', 'diamond-open', 'arrow', 'dotted'],
    ]);
  });

  it('keeps a class whose name starts with o, when a space comes before it', () => {
    const m = cls('Depot -- office\nDepot --o Order');
    assert.deepEqual(ties(m), [['Depot-office', 'none', 'none', 'solid'], ['Depot-Order', 'none', 'diamond-open', 'solid']]);
  });

  it('keeps the words on a relation, and how many at each end', () => {
    const m = cls('Order "1" *-- "many" OrderLine : holds\nCustomer "1" --> "*" Ticket\nGalaxy --> "many" Star : Contains\nStudent "1..*" --|> "1" Person');
    assert.deepEqual(m.edges.map((e) => [e.id, e.near ?? '', e.far ?? '', e.label]), [
      ['Order-OrderLine', '1', 'many', 'holds'], ['Customer-Ticket', '1', '*', ''], ['Galaxy-Star', '', 'many', 'Contains'],
      ['Person-Student', '1', '1..*', ''],
    ], 'turned round, each count stays with its own class');
  });

  it('reads a class tied to itself, and two ties between the same two', () => {
    const m = cls('Part o-- Part : made of\nOrder --> Supplier\nOrder ..> Supplier');
    assert.deepEqual(m.edges.map((e) => e.id), ['Part-Part', 'Order-Supplier', 'Order-Supplier#2']);
  });

  it('gives a lollipop a box of its own for each class that offers it, with a circle on its line', () => {
    const m = cls('class Order\nPayable ()-- Order\nInvoice --() Payable');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.label, n.over ?? '']), [['Order', 'Order', ''], ['Order_Payable', 'Payable', '«interface»'], ['Invoice', 'Invoice', ''], ['Invoice_Payable', 'Payable', '«interface»']]);
    assert.deepEqual(ties(m), [['Order_Payable-Order', 'circle', 'none', 'solid'], ['Invoice-Invoice_Payable', 'none', 'circle', 'solid']]);
    assert.deepEqual(m.warnings, []);
  });
});

describe('class: a namespace', () => {
  it('is a group of the classes declared in it', () => {
    const m = cls('namespace Buying {\n  class Order\n  class OrderLine {\n    +int quantity\n  }\n}\nOrder *-- OrderLine\nOrder --> Supplier');
    assert.deepEqual(m.groups, [{ id: 'Buying', title: 'Buying', members: ['Order', 'OrderLine'] }]);
    assert.deepEqual(rows(m, 'OrderLine'), [['+int quantity']]);
    assert.deepEqual(m.warnings, []);
  });

  it('is called by its label when it has one', () => {
    assert.deepEqual(cls('namespace Auth["Signing in"] {\n  class User\n}').groups, [{ id: 'Auth', title: 'Signing in', members: ['User'] }]);
  });

  it('holds a namespace written inside it', () => {
    const m = cls('namespace Platform {\n  namespace Auth {\n    class User\n  }\n  class Gateway\n}\nGateway --> User');
    assert.deepEqual(m.groups, [
      { id: 'Platform', title: 'Platform', members: ['User', 'Gateway'] },
      { id: 'Platform.Auth', title: 'Auth', members: ['User'], parent: 'Platform' },
    ]);
  });

  it('holds the namespaces a dotted name spells out, each made once', () => {
    const m = cls('namespace Co.Eng.Back {\n  class Dev\n}\nnamespace Co.Eng.Front {\n  class Designer\n}\nnamespace Co.Eng {\n  class Lead\n}');
    assert.deepEqual(m.groups, [
      { id: 'Co', title: 'Co', members: ['Dev', 'Designer', 'Lead'] },
      { id: 'Co.Eng', title: 'Eng', members: ['Dev', 'Designer', 'Lead'], parent: 'Co' },
      { id: 'Co.Eng.Back', title: 'Back', members: ['Dev'], parent: 'Co.Eng' },
      { id: 'Co.Eng.Front', title: 'Front', members: ['Designer'], parent: 'Co.Eng' },
    ]);
    assert.deepEqual(m.warnings, []);
  });
});

describe('class: notes', () => {
  it('draws a note for a class as a box of its own, joined to the class by a dotted line with nothing at its ends', () => {
    const m = cls('class Order\nnote for Order "Raised by a buyer\\nApproved by a manager"\nnote for Order "Never deleted<br>only closed"');
    const notes = m.nodes.filter((n) => n.shape === 'note');
    assert.deepEqual(notes.map((n) => [n.label, n.breaks, n.kind]), [
      ['Raised by a buyer Approved by a manager', ['Raised by a buyer', 'Approved by a manager'], 'note'],
      ['Never deleted only closed', ['Never deleted', 'only closed'], 'note'],
    ]);
    assert.deepEqual(m.edges.map((e) => [e.from, e.to, e.style, e.tail, e.head]), notes.map((n) => [n.id, 'Order', 'dotted', 'none', 'none']));
    // What is drawn on the picture is not said again beside it.
    assert.equal(m.notes.Order, undefined);
    assert.deepEqual(m.warnings, []);
  });

  it('draws a note for no class in particular as a box joined to nothing', () => {
    const m = cls('note "From order to invoice"\nA --> B');
    assert.deepEqual(m.nodes.filter((n) => n.shape === 'note').map((n) => n.label), ['From order to invoice']);
    assert.equal(m.edges.length, 1);
    assert.deepEqual(m.warnings, []);
  });

  it('gives a note a name no class has, even one that looks like it', () => {
    const m = cls('class note1\nnote for note1 "Kept"');
    assert.equal(new Set(m.nodes.map((n) => n.id)).size, 2);
  });

  it("takes Merlive's own lines as a flowchart does", () => {
    const m = cls('Order *-- OrderLine\nOrderLine --> Product\n%% note Product: What was bought.\n%% step: Down the order | Order>OrderLine>Product | From the order to the thing.\n%% main: Order>OrderLine>Product');
    assert.equal(m.notes.Product, 'What was bought.');
    assert.deepEqual(m.steps[0].seq, ['Order-OrderLine', 'OrderLine-Product']);
    assert.deepEqual(m.hints.main, ['Order', 'OrderLine', 'Product']);
    assert.deepEqual(m.warnings, []);
  });
});

describe('class: how a class is styled', () => {
  it('reads a kind from :::, from cssClass and from a style, as a flowchart does', () => {
    const m = cls('class Order:::open\nclass Invoice:::late {\n  +pay()\n}\nclass Refund\nclass Supplier\ncssClass "Refund,Supplier" held;\nclassDef late stroke:#c62828,stroke-dasharray: 4 3\nstyle Supplier stroke-width:4px\nstyle Order fill:#f9f,stroke:#333');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.kind, n.dashed ?? false, n.heavy ?? false]), [['Order', 'open', false, false], ['Invoice', 'late', true, false], ['Refund', 'held', false, false], ['Supplier', 'held', false, true]]);
    assert.equal(m.classes.late, '#c62828');
    assert.deepEqual(rows(m, 'Invoice'), [['+pay()']]);
    assert.deepEqual(m.warnings, []);
  });

  it('reads past what a page of Merlive cannot do: a click, a link, a callback', () => {
    const m = cls('class Order\nlink Order "https://example.com" "Open"\ncallback Order "show" "Tip"\nclick Order href "https://example.com"\nclick Order call show() "Tip"');
    assert.deepEqual(names(m), [['Order', 'Order']]);
    assert.deepEqual(m.warnings, []);
    assert.ok(!JSON.stringify(m).includes('example.com'));
  });
});

describe('class: what it does not read, it says', () => {
  it('names a line it cannot read, with its line, and makes nothing of it', () => {
    const m = cls('class Order\nOrder ==> Supplier\nSupplier\nclass Invoice extends Order\nIface ()--() Order');
    assert.deepEqual(m.warnings, [
      'line 3: not read: "Order ==> Supplier"', 'line 4: not read: "Supplier"', 'line 5: not read: "class Invoice extends Order"',
      'line 6: not read: a lollipop at both ends of "Iface ()--() Order"',
    ]);
    assert.deepEqual(names(m), [['Order', 'Order']]);
  });

  it('says so when a class or a namespace is never closed, or a } closes nothing', () => {
    assert.deepEqual(cls('class Order {\n  +total()').warnings, ['line 2: the class Order is never closed; end it with a line of }']);
    assert.deepEqual(cls('namespace Buying {\n  class Order').warnings, ['line 2: the namespace Buying is never closed; end it with a line of }']);
    assert.deepEqual(cls('class Order\n}').warnings, ['line 3: not read: a "}" with nothing open']);
  });

  it('says so when a cssClass names a class that is not there', () => {
    assert.deepEqual(cls('class Order\ncssClass "Order,Ghost" held').warnings, ['line 3: cssClass names "Ghost", which is not a class here']);
  });
});

describe('class: the corpus', () => {
  /** @type {{file:string,covers:string,boxes:number,links:number,groups?:number,has?:string[],rows?:number[],ends?:string[][],loses?:string}[]} */
  const samples = JSON.parse(readFileSync(join(root, 'corpus/index.json'), 'utf8')).class;

  it('has a sample for each thing on the class page, each read as its list says', () => {
    assert.ok(samples.length >= 25);
    for (const s of samples) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8'));
      assert.equal(m.kindOfDiagram, 'classDiagram', s.file);
      assert.equal(m.nodes.length, s.boxes, `${s.file}: boxes`);
      assert.equal(m.edges.length, s.links, `${s.file}: links`);
      if (s.groups !== undefined) assert.equal(m.groups.length, s.groups, `${s.file}: groups`);
      if (s.rows) assert.deepEqual(m.nodes.map((n) => (n.rows ?? []).reduce((sum, part) => sum + part.length, 0)), s.rows, `${s.file}: rows`);
      if (s.ends) assert.deepEqual(m.edges.map((e) => [e.tail, e.head]), s.ends, `${s.file}: ends`);
      const said = [...m.nodes.flatMap((n) => [n.label, n.over ?? '', ...(n.rows ?? []).flat()]), ...m.edges.flatMap((e) => [e.label, e.near ?? '', e.far ?? '']), ...m.groups.map((g) => g.title), ...Object.values(m.notes)];
      for (const words of s.has ?? []) assert.ok(said.includes(words), `${s.file}: "${words}" is not among its words`);
      if (!s.loses) assert.deepEqual(m.warnings, [], s.file);
    }
  });

  it('is placed without a fault, every link with a line of its own', () => {
    for (const s of samples) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8')), lay = layout(m);
      for (const e of m.edges) assert.ok(lay.edges[e.id].points.length >= 2, `${s.file}: ${e.id}`);
    }
  });
});
