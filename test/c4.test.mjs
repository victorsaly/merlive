// Why: a C4 diagram is boxes and links too: people, systems, containers and components, the boundaries they sit
// in, and what each asks of another. These hold the reading, through parse(), and hold the corpus's own list
// (the `c4` list of corpus/index.json) to what is read today. How a box's description is placed and drawn is tested where it is
// placed and drawn.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout } from '../skills/merlive/scripts/layout.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const c4 = (/** @type {string} */ body, head = 'C4Context') => parse(`${head}\n${body}`);
/** @typedef {import('../skills/merlive/scripts/parse.mjs').Model} Model */
const boxes = (/** @type {Model} */ m) => m.nodes.map((n) => [n.id, n.label, n.over]);
const links = (/** @type {Model} */ m) => m.edges.map((e) => [e.id, e.tail, e.head, e.label]);
const told = (/** @type {Model} */ m) => m.warnings.map((w) => w.replace(/^line \d+: /, ''));

describe('c4: what it is taken for', () => {
  it('is read as boxes and links, into the model a flowchart gives', () => {
    const m = c4('Person(buyer, "Buyer", "Raises purchase orders")\nSystem(erp, "ERP")\nRel(buyer, erp, "Raises orders in")');
    assert.equal(m.type, 'flowchart');
    assert.equal(m.kindOfDiagram, 'C4Context');
    assert.equal(m.direction, 'TD');
    assert.deepEqual(boxes(m), [['buyer', 'Buyer', '«person»'], ['erp', 'ERP', '«system»']]);
    assert.deepEqual(links(m), [['buyer-erp', 'none', 'arrow', 'Raises orders in']]);
    assert.deepEqual(m.edges.map((e) => e.style), ['solid']);
    assert.deepEqual(m.warnings, []);
  });

  it('is read under each of the five names Mermaid has for it, and under no other', () => {
    for (const head of ['C4Context', 'C4Container', 'C4Component', 'C4Dynamic', 'C4Deployment']) {
      const m = c4('System(erp, "ERP")', head);
      assert.deepEqual([m.type, m.kindOfDiagram, m.nodes.length], ['flowchart', head, 1], head);
    }
    assert.equal(parse('C4Contexts\nSystem(erp, "ERP")').type, 'unsupported');
    assert.equal(parse('C4\nSystem(erp, "ERP")').type, 'unsupported');
  });

  it('leaves a class diagram and a flowchart read as they were', () => {
    assert.deepEqual(parse('classDiagram\nA --> B').edges.map((e) => e.id), ['A-B']);
    assert.deepEqual(parse('flowchart TD\nA --> B').edges.map((e) => e.id), ['A-B']);
  });
});

describe('c4: elements', () => {
  it('says what each is over its name, with the technology a container or a component is made in', () => {
    const m = c4('Person(a, "A")\nPerson_Ext(b, "B")\nSystem(c, "C")\nSystem_Ext(d, "D")\nContainer(e, "E", "C#, ASP.NET")\nContainer_Ext(f, "F", "SMTP")\nComponent(g, "G", "Repository")\nComponent_Ext(h, "H")', 'C4Component');
    assert.deepEqual(m.nodes.map((n) => n.over), ['«person»', '«external person»', '«system»', '«external system»', '«container: C#, ASP.NET»', '«external container: SMTP»', '«component: Repository»', '«external component»']);
    assert.deepEqual(m.warnings, []);
  });

  it('draws a store of data as a cylinder and a queue as a pill, each of the kind that holds data, and says which over its name', () => {
    const m = c4('SystemDb(a, "A")\nSystemQueue(b, "B")\nContainerDb(c, "C", "SQL Server")\nContainerQueue(d, "D", "Service Bus")\nComponentDb(e, "E")\nComponentQueue(f, "F")', 'C4Container');
    assert.deepEqual(m.nodes.map((n) => [n.shape, n.kind]), [['cylinder', 'data'], ['pill', 'data'], ['cylinder', 'data'], ['pill', 'data'], ['cylinder', 'data'], ['pill', 'data']]);
    assert.deepEqual(m.nodes.map((n) => n.over), ['«system database»', '«system queue»', '«container database: SQL Server»', '«container queue: Service Bus»', '«component database»', '«component queue»']);
  });

  it('makes what is outside the firm of the kind the design keeps for it, whatever its shape', () => {
    const m = c4('Person_Ext(a, "A")\nSystem_Ext(b, "B")\nSystemDb_Ext(c, "C")\nSystemQueue_Ext(d, "D")\nContainerDb_Ext(e, "E")\nComponentQueue_Ext(f, "F")\nSystem(g, "G")');
    assert.deepEqual(m.nodes.map((n) => [n.shape, n.kind]), [['box', 'external'], ['box', 'external'], ['cylinder', 'external'], ['pill', 'external'], ['cylinder', 'external'], ['pill', 'external'], ['box', 'step']]);
    assert.equal(m.nodes[2].over, '«external system database»');
  });

  it('keeps what an element is said to do as its text, in one line, and gives one that says nothing none', () => {
    const m = c4('Person(buyer, "Buyer", "Raises purchase orders<br/>and chases them")\nContainer(api, "API", "C#", "Checks and saves orders")\nSystem(erp, "ERP")\nContainer(web, "Web", "", "Where orders are raised")', 'C4Container');
    assert.deepEqual(m.nodes.map((n) => n.text), ['Raises purchase orders and chases them', 'Checks and saves orders', undefined, 'Where orders are raised']);
    assert.equal(m.nodes[3].over, '«container»');
  });

  it('gives a person the drawing of a person, and nothing else one', () => {
    const m = c4('Person(a, "A")\nPerson_Ext(b, "B")\nSystem(c, "C")');
    assert.deepEqual(m.nodes.map((n) => n.icon), ['user', 'user', undefined]);
  });

  it('keeps the lines a label was broken into, and calls an element with no label by its alias', () => {
    const m = c4('Person(buyer, "Buyer<br/>in purchasing")\nSystem(erp)');
    assert.deepEqual([m.nodes[0].label, m.nodes[0].breaks], ['Buyer in purchasing', ['Buyer', 'in purchasing']]);
    assert.deepEqual(boxes(m)[1], ['erp', 'erp', '«system»']);
    assert.deepEqual(m.warnings, []);
  });

  it('takes an element declared again as the same element, said anew', () => {
    const m = c4('System(erp, "ERP", "The old one")\nPerson(buyer, "Buyer")\nSystemDb_Ext(erp, "ERP, the new one")');
    assert.deepEqual(boxes(m), [['erp', 'ERP, the new one', '«external system database»'], ['buyer', 'Buyer', '«person»']]);
    assert.deepEqual([m.nodes[0].shape, m.nodes[0].kind, m.nodes[0].text], ['cylinder', 'external', undefined]);
  });

  it('gives an alias Merlive\'s own lines cannot name an id they can, and keeps two such apart', () => {
    const m = c4('System("order api", "Order API")\nSystem("order-api", "Another")\nRel("order api", "order-api", "Calls")\n%% note order_api: The first of the two.');
    assert.deepEqual(m.nodes.map((n) => n.id), ['order_api', 'order_api_2']);
    assert.deepEqual(m.edges.map((e) => e.id), ['order_api-order_api_2']);
    assert.deepEqual(m.notes, { order_api: 'The first of the two.' });
  });
});

describe('c4: arguments', () => {
  it('reads an argument given by name wherever it stands, in the place of one given by position', () => {
    const m = c4('Person(buyer, "Buyer", $descr="Raises orders")\nContainer(api, "API", $descr="Checks orders", $techn="C#")\nRel(buyer, api, "Uses", $techn="HTTPS")', 'C4Container');
    assert.deepEqual(m.nodes.map((n) => [n.over, n.text]), [['«person»', 'Raises orders'], ['«container: C#»', 'Checks orders']]);
    assert.deepEqual(m.edges.map((e) => e.label), ['Uses [HTTPS]']);
  });

  it('passes an argument left empty, written as "" or as nothing between two commas', () => {
    const m = c4('Container(web, "Web", "", "Raises orders")\nContainer(api, "API",, "Checks orders")\nContainer( , "Nameless")\nRel(web, api, "Calls", "")', 'C4Container');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.over, n.text]), [['web', '«container»', 'Raises orders'], ['api', '«container»', 'Checks orders']]);
    assert.deepEqual(m.edges.map((e) => e.label), ['Calls']);
    assert.deepEqual(told(m), ['not read: "Container( , "Nameless")" has no alias: write it as Container(alias, "label")']);
  });

  it('keeps commas, brackets and a comment\'s own signs inside quotes as words', () => {
    const m = c4('Person(buyer, "Buyer (purchasing)", "Raises orders, chases them, and closes them")\nSystem(erp, "ERP [live]", "Says %% nothing of stock")\nRel(buyer, erp, "Raises orders in (daily, mostly)")');
    assert.deepEqual(m.nodes.map((n) => [n.label, n.text]), [['Buyer (purchasing)', 'Raises orders, chases them, and closes them'], ['ERP [live]', 'Says %% nothing of stock']]);
    assert.deepEqual(m.edges.map((e) => e.label), ['Raises orders in (daily, mostly)']);
    assert.deepEqual(m.warnings, []);
  });

  it('reads a last argument written bare, and a comment after a line, though Mermaid takes neither', () => {
    const m = c4('Person(buyer, "Buyer") %% who orders\nSystem(erp)\nRel(buyer, erp)');
    assert.deepEqual(boxes(m), [['buyer', 'Buyer', '«person»'], ['erp', 'erp', '«system»']]);
    assert.deepEqual(links(m), [['buyer-erp', 'none', 'arrow', '']]);
    assert.deepEqual(m.warnings, []);
  });

  it('reads words in quotes that run on down the lines as one line of words', () => {
    const m = c4('Person(buyer, "Buyer", "Raises purchase orders\n    and chases them")\nSystem(erp, "ERP")');
    assert.equal(m.nodes[0].text, 'Raises purchase orders and chases them');
    assert.equal(m.nodes.length, 2);
    assert.deepEqual(m.warnings, []);
  });

  it('says so when quotes or brackets are never closed, and reads the rest', () => {
    assert.deepEqual(told(c4('System(erp, "ERP"\nPerson(buyer, "Buyer")')), ['not read: "System(erp, "ERP"": close its brackets, and put a comma between its arguments']);
    const m = c4('Person(buyer, "Buyer")\nSystem(erp, "ERP');
    assert.deepEqual(told(m), ['not read: quotes that are never closed, and everything after them: "System(erp, "ERP"']);
    assert.equal(m.nodes.length, 1);
  });

  it('passes a link, a tag and a sprite: a page runs nothing of an author\'s, and Mermaid draws none of the three', () => {
    const m = c4('Person(buyer, "Buyer", "Raises orders", $sprite="users", $tags="v1", $link="https://example.com")\nSystem(erp, "ERP", "Holds orders", "server", "v1+core", "https://example.com/erp")\nRel(buyer, erp, "Uses", "HTTPS", "Every day", "sprite", "tag", "https://example.com/how")');
    assert.deepEqual(m.nodes.map((n) => [n.label, n.text]), [['Buyer', 'Raises orders'], ['ERP', 'Holds orders']]);
    assert.deepEqual(m.edges.map((e) => e.label), ['Uses [HTTPS]']);
    assert.deepEqual(m.warnings, []);
  });
});

describe('c4: boundaries', () => {
  it('reads a boundary as a group of what is declared in it, called by its label', () => {
    const m = c4('Person(buyer, "Buyer")\nBoundary(firm, "The firm") {\n  System(erp, "ERP")\n  System(stock, "Stock")\n}\nRel(buyer, erp, "Uses")');
    assert.deepEqual(m.groups, [{ id: 'firm', title: 'The firm', members: ['erp', 'stock'] }]);
    assert.deepEqual(m.warnings, []);
  });

  it('adds the type a boundary or a node was given to what it is called, and not the one its name implies', () => {
    const m = c4('Boundary(a, "Buying", "department") {\n  System(s1, "S1")\n}\nEnterprise_Boundary(b, "The firm") {\n  System(s2, "S2")\n}\nSystem_Boundary(c, "Core") {\n  System(s3, "S3")\n}\nContainer_Boundary(d, "Shop") {\n  System(s4, "S4")\n}\nDeployment_Node(e, "Azure", "West Europe") {\n  System(s5, "S5")\n}\nNode(f, "Rack") {\n  System(s6, "S6")\n}\nNode_L(g, "Left", "nginx") {\n  System(s7, "S7")\n}\nNode_R(h, "Right", $type="IIS") {\n  System(s8, "S8")\n}', 'C4Deployment');
    assert.deepEqual(m.groups.map((g) => g.title), ['Buying [department]', 'The firm', 'Core', 'Shop', 'Azure [West Europe]', 'Rack', 'Left [nginx]', 'Right [IIS]']);
    assert.deepEqual(m.warnings, []);
  });

  it('puts a boundary inside another inside it, however deep', () => {
    const m = c4('Enterprise_Boundary(firm, "The firm") {\n  System_Boundary(erp, "ERP") {\n    Container_Boundary(orders, "Ordering") {\n      Container(api, "API", "C#")\n    }\n    Container(stock, "Stock", "C#")\n  }\n}', 'C4Container');
    assert.deepEqual(m.groups, [
      { id: 'firm', title: 'The firm', members: ['api', 'stock'] },
      { id: 'erp', title: 'ERP', members: ['api', 'stock'], parent: 'firm' },
      { id: 'orders', title: 'Ordering', members: ['api'], parent: 'erp' },
    ]);
  });

  it('opens a boundary whose { is on the line below it', () => {
    const m = c4('System_Boundary(firm, "The firm")\n{\n  System(erp, "ERP")\n}\nSystem(bank, "Bank")');
    assert.deepEqual(m.groups, [{ id: 'firm', title: 'The firm', members: ['erp'] }]);
    assert.deepEqual(m.warnings, []);
  });

  it('draws a boundary with nothing in it as a box of its name, where it stands: a group of nothing cannot be drawn', () => {
    const m = c4('Deployment_Node(dc, "Data centre", "Leeds") {\n  Node(web, "Web server", "nginx", "Serves the shop") {\n  }\n  Node(spare, "Spare")\n}\nPerson(buyer, "Buyer")\nRel(buyer, web, "Reaches")', 'C4Deployment');
    assert.deepEqual(m.groups, [{ id: 'dc', title: 'Data centre [Leeds]', members: ['web', 'spare'] }]);
    assert.deepEqual(m.nodes.map((n) => [n.id, n.label, n.over, n.text]), [['buyer', 'Buyer', '«person»', undefined], ['web', 'Web server', '«node: nginx»', 'Serves the shop'], ['spare', 'Spare', '«node»', undefined]]);
    assert.deepEqual(links(m), [['buyer-web', 'none', 'arrow', 'Reaches']]);
    assert.deepEqual(m.warnings, []);
    assert.deepEqual(boxes(c4('Boundary(b, "Empty") {\n}\nSystem(s, "S")')), [['s', 'S', '«system»'], ['b', 'Empty', '«boundary»']]);
  });

  it('says that what a node with elements in it is described as is not drawn', () => {
    const m = c4('Deployment_Node(phone, "Phone", "iOS", "Whatever the buyer carries") {\n  Container(app, "App", "Swift")\n}', 'C4Deployment');
    assert.deepEqual(told(m), ['the node "Phone" is described as "Whatever the buyer carries", which is not drawn: a group has a name and nothing more']);
    assert.equal(m.groups[0].title, 'Phone [iOS]');
  });

  it('says so when a boundary is never closed, when a } closes nothing, and when a { opens nothing', () => {
    assert.deepEqual(told(c4('Boundary(firm, "The firm") {\n  System(erp, "ERP")')), ['the boundary firm is never closed; end it with a line of }']);
    assert.deepEqual(told(c4('System(erp, "ERP")\n}')), ['not read: a "}" with no boundary open']);
    assert.deepEqual(told(c4('System(erp, "ERP")\n{')), ['not read: a "{" with no boundary before it']);
    assert.deepEqual(told(c4('System(erp, "ERP") {\n}')), ['not read: "System(erp, "ERP") {": only a boundary or a node is followed by {', 'not read: a "}" with no boundary open']);
  });
});

describe('c4: relations', () => {
  it('puts the technology of a relation after its words, in brackets, and passes what else is said of it, as Mermaid does', () => {
    const m = c4('Container(web, "Web", "React")\nContainerDb(db, "Orders", "SQL")\nRel(web, db, "Reads and writes", "TDS", "Through a pool")', 'C4Container');
    assert.deepEqual(links(m), [['web-db', 'none', 'arrow', 'Reads and writes [TDS]']]);
    assert.deepEqual(m.warnings, []);
  });

  it('draws BiRel with an arrowhead at both ends, and Rel_Back from the second to the first', () => {
    const m = c4('System(a, "A")\nSystem(b, "B")\nSystem(c, "C")\nBiRel(a, b, "Trades with")\nRel_Back(a, c, "Is told by")');
    assert.deepEqual(links(m), [['a-b', 'arrow', 'arrow', 'Trades with'], ['c-a', 'none', 'arrow', 'Is told by']]);
  });

  it('reads a relation that says which way to draw it as a relation: where a box goes is Merlive\'s to say', () => {
    const m = c4('System(a, "A")\nSystem(b, "B")\n' + ['Rel_U', 'Rel_Up', 'Rel_D', 'Rel_Down', 'Rel_L', 'Rel_Left', 'Rel_R', 'Rel_Right'].map((r) => `${r}(a, b, "${r}")`).join('\n'));
    assert.deepEqual(m.edges.map((e) => [e.from, e.to, e.tail, e.head, e.label]), ['Rel_U', 'Rel_Up', 'Rel_D', 'Rel_Down', 'Rel_L', 'Rel_Left', 'Rel_R', 'Rel_Right'].map((r) => ['a', 'b', 'none', 'arrow', r]));
    assert.deepEqual(m.warnings, []);
  });

  it('numbers the relations of a dynamic diagram in the order they were written, as Mermaid does, whatever index one was given', () => {
    const m = c4('Container(web, "Web", "React")\nContainer(api, "API", "C#")\nRel(web, api, "Sends the order", "HTTPS")\nRelIndex(7, api, web, "Answers")\nRel(web, api, "Asks again")', 'C4Dynamic');
    assert.deepEqual(m.edges.map((e) => [e.id, e.label]), [['web-api', '1: Sends the order [HTTPS]'], ['api-web', '2: Answers'], ['web-api#2', '3: Asks again']]);
    assert.deepEqual(c4('System(a, "A")\nSystem(b, "B")\nRelIndex(1, a, b, "Asks")').edges.map((e) => e.label), ['Asks']);
  });

  it('keeps every relation between the same two, where Mermaid keeps only the last', () => {
    assert.deepEqual(c4('System(a, "A")\nSystem(b, "B")\nRel(a, b, "Asks")\nRel(a, b, "Asks again")').edges.map((e) => [e.id, e.label]), [['a-b', 'Asks'], ['a-b#2', 'Asks again']]);
  });

  it('reads a relation written before what it joins, and puts each in the boundary it was declared in', () => {
    const m = c4('Boundary(firm, "The firm") {\n  Rel(buyer, erp, "Uses")\n  System(erp, "ERP")\n}\nPerson(buyer, "Buyer")');
    assert.deepEqual(m.groups[0].members, ['erp']);
    assert.deepEqual(links(m), [['buyer-erp', 'none', 'arrow', 'Uses']]);
    assert.deepEqual(m.warnings, []);
  });

  it('takes a relation with a boundary to where the boundary begins or ends, as a link to any group is', () => {
    const m = c4('Person(buyer, "Buyer")\nSystem_Boundary(firm, "The firm") {\n  System(erp, "ERP")\n  System(stock, "Stock")\n  Rel(erp, stock, "Checks")\n}\nSystem_Ext(bank, "Bank")\nRel(buyer, firm, "Works for")\nRel(firm, bank, "Pays through")');
    assert.deepEqual(m.edges.map((e) => e.id), ['erp-stock', 'buyer-erp', 'stock-bank']);
    assert.deepEqual(m.nodes.map((n) => n.id), ['buyer', 'erp', 'stock', 'bank']);
    assert.deepEqual(m.warnings, []);
  });

  it('draws what a relation names and nothing declares as a box of that name, and says so once', () => {
    const m = c4('Person(buyer, "Buyer")\nRel(buyer, ghost, "Uses")\nRel(ghost, buyer, "Answers")');
    assert.deepEqual(boxes(m), [['buyer', 'Buyer', '«person»'], ['ghost', 'ghost', undefined]]);
    assert.deepEqual(told(m), ['a relation names "ghost", which nothing declares: it is drawn as a box of that name; declare it with Person, System, Container or Component']);
    assert.equal(m.edges.length, 2);
  });

  it('says so when a relation does not say what it joins', () => {
    assert.deepEqual(told(c4('System(a, "A")\nRel(a)')), ['not read: "Rel(a)" does not say what it joins: write it as Rel(from, to, "label")']);
    assert.deepEqual(told(c4('System(a, "A")\nSystem(b, "B")\nRelIndex(1, a)')), ['not read: "RelIndex(1, a)" does not say what it joins: write it as RelIndex(index, from, to, "label")']);
  });
});

describe('c4: what Mermaid is told about the look', () => {
  it('keeps a colour an element is given as a flowchart keeps a style: as the kind named for its hue', () => {
    const m = c4('System(old, "Old stock system")\nSystem_Ext(bank, "Bank")\nUpdateElementStyle(old, $fontColor="#ffffff", $bgColor="#b3261e", $borderColor="#7a1f12")\nUpdateElementStyle(bank, $borderColor="#0a5cc2")');
    assert.deepEqual(m.nodes.map((n) => n.kind), ['red', 'external']);
    assert.equal(m.classes.red, '#b3261e');
    assert.deepEqual(m.warnings, []);
  });

  it('says once that a colour given by name is not read', () => {
    const m = c4('Person(buyer, "Buyer")\nSystem(erp, "ERP")\nUpdateElementStyle(buyer, $fontColor="red", $bgColor="grey", $borderColor="red")\nUpdateElementStyle(erp, $bgColor="navy")');
    assert.deepEqual(told(m), ['UpdateElementStyle gives "buyer" a colour by name ("grey"): only a colour written as #rrggbb is read; it is then drawn as the nearest colour of the design']);
    assert.deepEqual(m.nodes.map((n) => n.kind), ['step', 'step']);
  });

  it('says once that a boundary is not coloured, and passes a style for nothing that is there', () => {
    const m = c4('Boundary(firm, "The firm") {\n  System(erp, "ERP")\n}\nUpdateElementStyle(firm, $bgColor="#ffeeee")\nUpdateElementStyle(firm, $borderColor="#ff0000")\nUpdateElementStyle(nobody, $bgColor="#ffeeee")\nUpdateElementStyle(erp, $shadowing="true", $legendText="core")');
    assert.deepEqual(told(m), ['UpdateElementStyle colours the boundary "firm": how a group looks is the design\'s, so it is read past']);
    assert.deepEqual(m.nodes.map((n) => n.id), ['erp']);
  });

  it('says once that a link is not coloured, and nothing when a link\'s words are only moved', () => {
    const body = 'Person(buyer, "Buyer")\nSystem(erp, "ERP")\nRel(buyer, erp, "Uses")\n';
    assert.deepEqual(told(c4(`${body}UpdateRelStyle(buyer, erp, $textColor="blue", $lineColor="blue", $offsetY="-10")\nUpdateRelStyle(buyer, erp, "red")`)), ['UpdateRelStyle colours a link: a link\'s colour is the design\'s here, so it is read past']);
    assert.deepEqual(told(c4(`${body}UpdateRelStyle(buyer, erp, $offsetX="5", $offsetY="-10")\nUpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")\nUpdateLayoutConfig("3", "1")`)), []);
  });
});

describe('c4: what it is called, and Merlive\'s own lines', () => {
  it('keeps its title, to be seen on the picture, from the diagram or from its front matter', () => {
    const m = c4('title Ordering, in context\nSystem(erp, "ERP")');
    assert.deepEqual([m.title, m.heading], ['Ordering, in context', 'Ordering, in context']);
    const front = parse('---\ntitle: From the front matter\n---\nC4Context\nSystem(erp, "ERP")');
    assert.deepEqual([front.title, front.heading], ['From the front matter', 'From the front matter']);
    assert.equal(c4('title\nSystem(erp, "ERP")').warnings.length, 1);
  });

  it('keeps what it is called and what it shows for a reader who cannot see it, and reads past comments', () => {
    const m = c4('accTitle: Who orders\naccDescr: A buyer raises orders\n%% a comment\nSystem(erp, "ERP")');
    assert.deepEqual([m.title, m.heading, m.describes, m.nodes.length], ['Who orders', '', 'A buyer raises orders', 1]);
    assert.deepEqual(m.warnings, []);
  });

  it('takes Merlive\'s own lines as a flowchart does', () => {
    const m = c4('Person(buyer, "Buyer")\nSystem(erp, "ERP")\nSystem(stock, "Stock")\nRel(buyer, erp, "Uses")\nRel(erp, stock, "Checks")\n%% note erp: Where every order lives.\n%% step: An order | buyer>erp>stock | From the buyer to the shelf.\n%% main: buyer>erp>stock');
    assert.equal(m.notes.erp, 'Where every order lives.');
    assert.deepEqual(m.steps.map((s) => [s.title, s.seq]), [['An order', ['buyer-erp', 'erp-stock']]]);
    assert.deepEqual(m.hints.main, ['buyer', 'erp', 'stock']);
    assert.deepEqual(m.warnings, []);
  });

  it('says what it does not read, by its line, and reads the rest', () => {
    const m = c4('System(erp, "ERP")\nSHOW_LEGEND()\nerp --> stock\ndirection LR\nSystem(stock, "Stock")');
    assert.deepEqual(m.warnings, ['line 3: not read: "SHOW_LEGEND()": Mermaid\'s C4 has no SHOW_LEGEND', 'line 4: not read: "erp --> stock"', 'line 5: not read: "direction LR"']);
    assert.deepEqual(m.nodes.map((n) => n.id), ['erp', 'stock']);
  });
});

describe('c4: the corpus', () => {
  /** @type {{file:string,covers:string,boxes:number,links:number,groups?:number,has?:string[],ends:string[][],shapes?:string[],kinds?:string[],title?:string,loses?:string,says?:string}[]} */
  const list = JSON.parse(readFileSync(join(root, 'corpus/index.json'), 'utf8')).c4;

  it('lists every sample that is there, and every sample listed is there', () => {
    assert.deepEqual(list.map((s) => s.file).sort(), readdirSync(join(root, 'corpus/c4')).filter((f) => f.endsWith('.mmd')).map((f) => `c4/${f}`).sort());
    for (const s of list) assert.ok(s.covers && Number.isInteger(s.boxes) && Number.isInteger(s.links) && Array.isArray(s.ends), s.file);
  });

  it('is read as its list says: boxes, links, groups, what each link ends in, words, and nothing left unread', () => {
    for (const s of list) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8'));
      assert.match(m.kindOfDiagram, /^C4(Context|Container|Component|Dynamic|Deployment)$/, s.file);
      assert.equal(m.nodes.length, s.boxes, `${s.file}: boxes`);
      assert.equal(m.edges.length, s.links, `${s.file}: links`);
      assert.equal(m.groups.length, s.groups ?? 0, `${s.file}: groups`);
      assert.deepEqual(m.edges.map((e) => [e.tail, e.head]), s.ends, `${s.file}: ends`);
      if (s.shapes) assert.deepEqual(m.nodes.map((n) => n.shape), s.shapes, `${s.file}: shapes`);
      const said = [...m.nodes.flatMap((n) => [n.label, n.over ?? '']), ...m.edges.map((e) => e.label), ...m.groups.map((g) => g.title)];
      for (const words of s.has ?? []) assert.ok(said.includes(words), `${s.file}: "${words}" is not among its words: ${said.join(' | ')}`);
      for (const kind of s.kinds ?? []) assert.ok(m.nodes.some((n) => n.kind === kind), `${s.file}: no box of the kind ${kind}`);
      if (s.title !== undefined) assert.equal(m.title, s.title, s.file);
      // What a sample is known to be told is in its list; anything else said means something was not read.
      const heard = m.warnings.map((w) => w.replace(/^line \d+: /, ''));
      assert.ok(s.says ? heard.length === 1 && heard[0].includes(s.says) : heard.length === 0, `${s.file}: ${heard.join(' | ')}`);
    }
  });

  it('is placed, every sample: each box somewhere, each link a line, each group a frame or a reason why not', () => {
    // Whether a placing breaks a rule is held by the corpus's own list (docs/COVERAGE.md), with every other kind.
    for (const s of list) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8')), lay = layout(m);
      for (const n of m.nodes) assert.ok(lay.nodes[n.id].w > 0 && lay.nodes[n.id].h > 0, `${s.file}: ${n.id}`);
      for (const e of m.edges) assert.ok(lay.edges[e.id].points.length >= 2, `${s.file}: ${e.id}`);
      assert.equal(lay.groups.length + lay.warnings.filter((w) => w.startsWith('the frame of')).length, m.groups.length, s.file);
    }
  });

  it('covers every element, every boundary and every relation Mermaid has', () => {
    const all = list.map((s) => readFileSync(join(root, 'corpus', s.file), 'utf8')).join('\n');
    const words = ['Person', 'System', 'SystemDb', 'SystemQueue', 'Container', 'ContainerDb', 'ContainerQueue', 'Component', 'ComponentDb', 'ComponentQueue'].flatMap((w) => [w, `${w}_Ext`]).filter((w) => !/^Person(Db|Queue)/.test(w));
    for (const w of [...words, 'Boundary', 'Enterprise_Boundary', 'System_Boundary', 'Container_Boundary', 'Deployment_Node', 'Node', 'Node_L', 'Node_R', 'Rel', 'BiRel', 'Rel_U', 'Rel_Up', 'Rel_D', 'Rel_Down', 'Rel_L', 'Rel_Left', 'Rel_R', 'Rel_Right', 'Rel_Back', 'RelIndex', 'UpdateElementStyle', 'UpdateRelStyle', 'UpdateLayoutConfig']) {
      assert.match(all, new RegExp(`(^|\\n)\\s*${w}\\(`), w);
    }
    for (const head of ['C4Context', 'C4Container', 'C4Component', 'C4Dynamic', 'C4Deployment']) assert.match(all, new RegExp(`(^|\\n)${head}\\n`), head);
  });
});
