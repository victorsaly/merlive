// Why: an architecture diagram is boxes and links: services, the groups they are in, and the lines between
// them. It is read into the model a flowchart gives, so these hold the reading and nothing else: what a service
// is called and what it is, which group it is in, which of two services comes first, how a line ends, and what
// is said of whatever could not be read. How it is drawn has its own tests.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout } from '../skills/merlive/scripts/layout.mjs';
import { builtIn } from '../skills/merlive/scripts/design.mjs';
import { score } from '../skills/merlive/scripts/score.mjs';
import { picture } from '../skills/merlive/scripts/render.mjs';
import { builtInIcons } from '../skills/merlive/scripts/architecture.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arch = (/** @type {string} */ body, head = 'architecture-beta') => parse(`${head}\n${body}`);
/** @typedef {import('../skills/merlive/scripts/parse.mjs').Model} Model */
const names = (/** @type {Model} */ m) => m.nodes.map((n) => [n.id, n.label]);
const ties = (/** @type {Model} */ m) => m.edges.map((e) => [e.id, e.tail, e.head, e.label]);
const two = 'service api(server)[Orders API]\nservice db(database)[Orders]';

describe('architecture: what it is taken for', () => {
  it('is read as boxes and links, into the model a flowchart gives', () => {
    const m = arch(`${two}\napi:R -- L:db`);
    assert.equal(m.type, 'flowchart');
    assert.equal(m.kindOfDiagram, 'architecture-beta');
    assert.deepEqual(names(m), [['api', 'Orders API'], ['db', 'Orders']]);
    assert.deepEqual(ties(m), [['api-db', 'none', 'none', '']]);
    assert.deepEqual(m.warnings, []);
  });

  it('is taken for one with or without "-beta", which a later Mermaid drops', () => {
    for (const head of ['architecture-beta', 'architecture']) {
      const m = arch(two, head);
      assert.deepEqual([m.type, m.kindOfDiagram, m.nodes.length], ['flowchart', 'architecture-beta', 2], head);
    }
    assert.equal(parse('architectures\n  service a(server)[A]').type, 'unsupported');
  });

  it('keeps what a flowchart keeps: front matter, a title, what it shows for readers who cannot see it, comments', () => {
    const m = parse(`---\ntitle: Orders in the cloud\n---\narchitecture-beta\n  accDescr: Where an order is kept\n  %% the two that matter\n  ${two.replace('\n', ' %% the store comes next\n  ')}`);
    assert.equal(m.title, 'Orders in the cloud');
    assert.equal(m.heading, 'Orders in the cloud');
    assert.equal(m.describes, 'Where an order is kept');
    assert.deepEqual(names(m), [['api', 'Orders API'], ['db', 'Orders']]);
    assert.deepEqual(m.warnings, []);
  });

  it('takes a title written in the diagram itself as the picture\'s title', () => {
    const m = arch(`title Orders in the cloud\n${two}`);
    assert.deepEqual([m.title, m.heading], ['Orders in the cloud', 'Orders in the cloud']);
    assert.equal(arch(`title "Orders, in the cloud"\n${two}`).title, 'Orders, in the cloud');
    assert.deepEqual(m.warnings, []);
  });
});

describe('architecture: a service', () => {
  it('is a box with its title for its words and its icon beside them', () => {
    const m = arch(two);
    assert.deepEqual(m.nodes.map((n) => [n.label, n.shape, n.icon]), [['Orders API', 'box', 'server'], ['Orders', 'box', 'database']]);
  });

  it('has a drawing for each icon Mermaid is born with', () => {
    assert.deepEqual(Object.keys(builtInIcons), ['cloud', 'database', 'disk', 'internet', 'server']);
    const m = arch(Object.keys(builtInIcons).map((icon) => `service s_${icon}(${icon})[A ${icon}]`).join('\n'));
    assert.deepEqual(m.warnings, []);
    for (const n of m.nodes) assert.ok(n.icon, `${n.label} has no drawing`);
    assert.deepEqual(m.nodes.map((n) => n.icon), ['cloud', 'database', 'database', 'globe', 'server']);
  });

  it('is of the kind that holds data when its icon says it is a database or a disk', () => {
    const m = arch('service a(database)[Orders]\nservice b(disk)[Files]\nservice c(server)[API]\nservice d(cloud)[Azure]\nservice e(internet)[Web]');
    assert.deepEqual(m.nodes.map((n) => n.kind), ['data', 'data', 'step', 'step', 'step']);
  });

  it('may have no icon, and then is a box with its words alone', () => {
    const m = arch('service api[Orders API]');
    assert.deepEqual(m.nodes.map((n) => [n.label, n.icon]), [['Orders API', undefined]]);
    assert.deepEqual(m.warnings, []);
  });

  it('takes its id for its words when it has no title: a box says something', () => {
    assert.deepEqual(names(arch('service api(server)\nservice store')), [['api', 'api'], ['store', 'store']]);
  });

  it('keeps a title in quotes with what no bare title may hold, and one a bare title could not be', () => {
    const m = arch('service api(server)["Orders API, v2"]\nservice db(database)[Händler &amp; Lager #9829;]\nservice c(server)[ Spaced  out ]');
    assert.deepEqual(m.nodes.map((n) => n.label), ['Orders API, v2', 'Händler &amp; Lager ♥', 'Spaced out']);
    assert.deepEqual(m.warnings, []);
  });

  it('says once when an icon is from a pack Merlive cannot fetch, and keeps the words', () => {
    const m = arch('service fn(logos:aws-lambda)[Function]\nservice other(logos:aws-lambda)[Another]\nservice s3(logos:aws-s3)[Files]');
    assert.deepEqual(m.nodes.map((n) => [n.label, n.icon]), [['Function', undefined], ['Another', undefined], ['Files', undefined]]);
    assert.deepEqual(m.warnings, [
      'line 2: the icon "logos:aws-lambda" is not one Merlive has a drawing for; it is left out and its words kept',
      'line 4: the icon "logos:aws-s3" is not one Merlive has a drawing for; it is left out and its words kept',
    ]);
  });

  it('finds a drawing for an icon from a set Merlive knows the names of, and says so for words written as an icon', () => {
    assert.deepEqual(arch('service u(mdi:account)[Buyer]\nservice k(fa:fa-key)[Vault]').nodes.map((n) => n.icon), [undefined, 'key']);
    const m = arch('service api("API")[Orders API]');
    assert.deepEqual(names(m), [['api', 'Orders API']]);
    assert.match(m.warnings[0], /^line 2: the icon ""API"" is not one Merlive has a drawing for/);
  });

  it('has an id Merlive\'s own lines can name, whatever its author wrote', () => {
    const m = arch('service order-api(server)[API]\nservice order_api(server)[Other]\norder-api:R -- L:order_api\n%% note order_api: The first of the two.');
    assert.deepEqual(names(m), [['order_api', 'API'], ['order_api_2', 'Other']]);
    assert.deepEqual(ties(m), [['order_api-order_api_2', 'none', 'none', '']]);
    assert.equal(m.notes.order_api, 'The first of the two.');
    assert.deepEqual(m.warnings, []);
  });

  it('is not made twice: an id used again is said, and the first kept', () => {
    const m = arch('service a(server)[A]\nservice a(database)[A again]\njunction a\ngroup a(cloud)[A group]');
    assert.deepEqual(m.nodes.map((n) => [n.label, n.icon]), [['A', 'server']]);
    assert.deepEqual(m.groups, []);
    assert.deepEqual(m.warnings, [
      'line 3: not read: the id "a" is already a service; give this service an id of its own',
      'line 4: not read: the id "a" is already a service; give this junction an id of its own',
      'line 5: not read: the id "a" is already a service; give this group an id of its own',
    ]);
  });
});

describe('architecture: a group', () => {
  it('is a group with its title, holding the services said to be in it', () => {
    const m = arch('group cloud(cloud)[Azure]\nservice api(server)[API] in cloud\nservice db(database)[Store] in cloud\nservice user(internet)[Buyer]');
    assert.deepEqual(m.groups, [{ id: 'cloud', title: 'Azure', members: ['api', 'db'] }]);
    assert.deepEqual(m.nodes.map((n) => n.id), ['api', 'db', 'user']);
    assert.deepEqual(m.warnings, []);
  });

  it('may be inside another, to any depth', () => {
    const m = arch('group az(cloud)[Azure]\ngroup net(server)[Network] in az\ngroup sub(server)[Subnet] in net\nservice api(server)[API] in sub\nservice gw(internet)[Gateway] in net\nservice dns(internet)[Names] in az');
    assert.deepEqual(m.groups, [
      { id: 'az', title: 'Azure', members: ['api', 'gw', 'dns'] },
      { id: 'net', title: 'Network', members: ['api', 'gw'], parent: 'az' },
      { id: 'sub', title: 'Subnet', members: ['api'], parent: 'net' },
    ]);
    assert.deepEqual(m.warnings, []);
  });

  it('may be declared after what is in it, as Mermaid allows', () => {
    const m = arch('service api(server)[API] in inner\ngroup inner(server)[Orders] in outer\ngroup outer(cloud)[Azure]');
    assert.deepEqual(m.groups, [
      { id: 'outer', title: 'Azure', members: ['api'] },
      { id: 'inner', title: 'Orders', members: ['api'], parent: 'outer' },
    ]);
    assert.deepEqual(m.warnings, []);
  });

  it('takes its id for its title when it has none, and needs no icon', () => {
    const m = arch('group g\ngroup h[Second group]\nservice a(server)[A] in g\nservice b(server)[B] in h');
    assert.deepEqual(m.groups.map((g) => [g.id, g.title]), [['g', 'g'], ['h', 'Second group']]);
    assert.deepEqual(m.warnings, []);
  });

  it('has its icon read past: a frame is named by its title', () => {
    assert.deepEqual(arch('group g(logos:aws)[Cloud]\nservice a(server)[A] in g').warnings, []);
  });

  it('says so when a group is named that is never declared, and draws what was in it outside', () => {
    const m = arch('service a(server)[A] in nowhere\ngroup g(cloud)[G] in nowhere\nservice b(server)[B] in g');
    assert.deepEqual(m.groups, [{ id: 'g', title: 'G', members: ['b'] }]);
    assert.deepEqual(m.warnings, [
      'line 2: the group "nowhere" that a is said to be in is never declared; a is drawn in no group. Declare it with a line like: group nowhere[Title]',
      'line 3: the group "nowhere" that g is said to be in is never declared; g is drawn in no group. Declare it with a line like: group nowhere[Title]',
    ]);
  });

  it('says so when a group has nothing in it, since a frame goes round boxes', () => {
    const m = arch('group empty(cloud)[Nothing yet]\nservice a(server)[A]');
    assert.deepEqual(m.groups, []);
    assert.deepEqual(m.warnings, ['line 2: the group "Nothing yet" has nothing in it, so it is not drawn; put a service in it with "in empty"']);
  });

  it('says so when groups are said to be inside each other, and draws each outside the other', () => {
    const m = arch('group a(cloud)[A] in b\ngroup b(cloud)[B] in a\nservice s(server)[S] in a\nservice t(server)[T] in b');
    assert.deepEqual(m.groups.map((g) => [g.id, g.parent, g.members]), [['a', undefined, ['s']], ['b', undefined, ['t']]]);
    assert.match(m.warnings[0], /^line 2: the group "a" is said to be inside "b", which is inside it/);
  });

  it('says so when a service is said to be in a service', () => {
    const m = arch('service a(server)[A]\nservice b(server)[B] in a');
    assert.deepEqual(m.warnings, ['line 3: "a" is a service, not a group, so b cannot be in it; b is drawn in no group']);
    assert.deepEqual(m.groups, []);
  });
});

describe('architecture: a junction', () => {
  it('is where lines meet: a small round box with no words, of a kind of its own', () => {
    const m = arch('service a(server)[A]\nservice b(server)[B]\nservice c(server)[C]\njunction j\na:R -- L:j\nj:R -- L:b\nj:B -- T:c');
    assert.deepEqual(m.nodes.map((n) => [n.id, n.label, n.shape, n.kind]).at(-1), ['j', '', 'pill', 'junction']);
    assert.deepEqual(ties(m).map((t) => t[0]), ['a-j', 'j-b', 'j-c']);
    assert.deepEqual(m.warnings, []);
  });

  it('may be in a group', () => {
    const m = arch('group g(cloud)[G]\nservice a(server)[A] in g\njunction j in g\na:R -- L:j');
    assert.deepEqual(m.groups[0].members, ['a', 'j']);
  });

  it('is placed and drawn with no words, and passes every rule', () => {
    const m = arch('service a(server)[A]\nservice b(server)[B]\nservice c(server)[C]\njunction j\na:R -- L:j\nj:R -- L:b\nj:B -- T:c'), lay = layout(m);
    assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), []);
    assert.match(picture(m, lay, builtIn, { title: 't' }), /data-node="j" data-kind="junction"/);
  });
});

describe('architecture: an edge', () => {
  const four = 'service a(server)[A]\nservice b(server)[B]\nservice c(server)[C]\nservice d(server)[D]';

  it('is a link with the arrowheads its author wrote, at the ends they wrote them', () => {
    const m = arch(`${four}\na:R -- L:b\nb:R --> L:c\nc:R <-- L:d\na:B <--> T:d`);
    assert.deepEqual(ties(m), [['a-b', 'none', 'none', ''], ['b-c', 'none', 'arrow', ''], ['c-d', 'arrow', 'none', ''], ['a-d', 'arrow', 'arrow', '']]);
    assert.deepEqual(m.edges.map((e) => e.style), ['solid', 'solid', 'solid', 'solid']);
    assert.deepEqual(m.warnings, []);
  });

  it('carries the words written into it', () => {
    const m = arch(`${four}\na:R -[reads from]- L:b\nb:R <-["writes, then reads"]-> L:c`);
    assert.deepEqual(ties(m), [['a-b', 'none', 'none', 'reads from'], ['b-c', 'arrow', 'arrow', 'writes, then reads']]);
  });

  it('runs from whichever of the two its sides put first: the one whose right or bottom it leaves by', () => {
    const m = arch(`${four}\na:R -- L:b\nb:L -- R:c\nc:B -- T:d\nd:T -- B:a`);
    assert.deepEqual(m.edges.map((e) => [e.from, e.to]), [['a', 'b'], ['c', 'b'], ['c', 'd'], ['a', 'd']]);
  });

  it('keeps each arrowhead on the service it points into, whichever way the link runs', () => {
    // "b:L --> R:c": c is to the left of b, and the arrow goes into c.
    const m = arch(`${four}\nb:L --> R:c\nb:T <-- B:a\nc:L <--> R:d`);
    assert.deepEqual(m.edges.map((e) => [e.from, e.to, e.tail, e.head]), [['c', 'b', 'arrow', 'none'], ['a', 'b', 'none', 'arrow'], ['d', 'c', 'arrow', 'arrow']]);
  });

  it('is read with or without spaces round it', () => {
    assert.deepEqual(ties(arch(`${four}\na:R--L:b\nb : R  -->  L : c\nc:R<-[ asks ]->L:d`)), [['a-b', 'none', 'none', ''], ['b-c', 'none', 'arrow', ''], ['c-d', 'arrow', 'arrow', 'asks']]);
  });

  it('may join a service to itself, and two services twice', () => {
    const m = arch(`${four}\na:R -- L:a\na:R -- L:b\na:B --> T:b`);
    assert.deepEqual(ties(m).map((t) => t[0]), ['a-a', 'a-b', 'a-b#2']);
    assert.deepEqual(m.warnings, []);
  });

  it('says so when it names something never declared, and draws that as a box named by its id', () => {
    const m = arch('service a(server)[A]\na:R -- L:bee');
    assert.deepEqual(names(m), [['a', 'A'], ['bee', 'bee']]);
    assert.deepEqual(m.warnings, ['line 3: "bee" is linked but never declared; it is drawn as a box named bee. Declare it with a line like: service bee(server)[Title]']);
  });

  it('out of a group is drawn from the service it names, and that is said once', () => {
    const m = arch('group one(cloud)[One]\ngroup two(cloud)[Two]\nservice a(server)[A] in one\nservice b(server)[B] in two\nservice c(server)[C] in two\na{group}:R --> L:b{group}\nc{group}:L <-- R:a');
    assert.deepEqual(m.edges.map((e) => [e.from, e.to, e.tail, e.head]), [['a', 'b', 'none', 'arrow'], ['a', 'c', 'none', 'arrow']]);
    assert.deepEqual(m.warnings, ['line 7: a link out of a group ("a{group}") is drawn from the service it names: Merlive draws a line to a box, not to a frame']);
  });

  it('to a group by its id, which Mermaid cannot draw, is joined as a flowchart\'s link to a group is', () => {
    const m = arch('group one(cloud)[One]\ngroup two(cloud)[Two]\nservice a(server)[A] in one\nservice b(server)[B] in two\none:R --> L:two');
    assert.deepEqual(ties(m), [['a-b', 'none', 'arrow', '']]);
    assert.deepEqual(m.nodes.map((n) => n.id), ['a', 'b']);
    assert.deepEqual(m.warnings, []);
  });
});

describe('architecture: which way it runs', () => {
  it('runs left to right when more of its edges leave by a left or a right side than by a top or a bottom', () => {
    const three = 'service a(server)[A]\nservice b(server)[B]\nservice c(server)[C]';
    assert.equal(arch(`${three}\na:R -- L:b\nb:R -- L:c`).direction, 'LR');
    assert.equal(arch(`${three}\na:L -- R:b\nb:R -- L:c\na:B -- T:c`).direction, 'LR');
    assert.equal(arch(`${three}\na:B -- T:b\nb:B -- T:c`).direction, 'TD');
    assert.equal(arch(`${three}\na:R -- L:b\na:B -- T:c`).direction, 'TD');
    assert.equal(arch(three).direction, 'TD');
  });

  it('reads past where its author lined things up: placing is by rule', () => {
    const m = arch('service a(database)[A]\nservice b(database)[B]\nservice c(server)[C]\na:R --> L:c\nb:R --> L:c\nalign column a b\nalign row a c');
    assert.deepEqual(m.warnings, []);
    assert.equal(m.edges.length, 2);
  });
});

describe('architecture: what it does not read', () => {
  it('says which line, and reads the rest', () => {
    const m = arch(`${two}\nserver api\napi -> db\napi:X -- L:db\napi:R -- L:db\nstyle api fill:#f00\nsubgraph one`);
    assert.deepEqual(m.warnings, [
      'line 4: not read: "server api"',
      'line 5: not read: "api -> db"; an edge is written with the side it leaves and the side it meets, like api:R -- L:db',
      'line 6: not read: "api:X -- L:db"; an edge is written with the side it leaves and the side it meets, like api:R -- L:db',
      'line 8: not read: "style api fill:#f00"',
      'line 9: not read: "subgraph one"',
    ]);
    assert.deepEqual(ties(m), [['api-db', 'none', 'none', '']]);
  });

  it('says so when a service or a group is written with something it cannot read after it', () => {
    const m = arch('service api(server)[Orders API] inside cloud\ngroup g(cloud)[G] on top\njunction j k');
    assert.deepEqual(m.warnings, [
      'line 2: not read: "service api(server)[Orders API] inside cloud"; a service is written like: service api(server)[Title] in group',
      'line 3: not read: "group g(cloud)[G] on top"; a group is written like: group g(cloud)[Title] in group',
      'line 4: not read: "junction j k"; a junction is written like: junction j in group',
    ]);
    assert.deepEqual(m.nodes, []);
  });

  it("takes Merlive's own lines as a flowchart does", () => {
    const m = arch(`${two}\nservice q(disk)[Queue]\napi:R --> L:db\napi:B --> T:q\n%% note db: Every order ever placed.\n%% step: To the store | api>db | The API writes each order.\n%% main: api>db`);
    assert.equal(m.notes.db, 'Every order ever placed.');
    assert.deepEqual(m.steps.map((s) => s.seq), [['api-db']]);
    assert.deepEqual(m.hints.main, ['api', 'db']);
    assert.deepEqual(m.warnings, []);
  });
});

describe('architecture: the corpus', () => {
  /** @type {{file:string,covers:string,boxes:number,links:number,groups?:number,has?:string[],kinds?:string[],ends?:string[][],shapes?:string[],direction?:string,title?:string,says?:string,loses?:string}[]} */
  const samples = JSON.parse(readFileSync(join(root, 'corpus/architecture.json'), 'utf8'));

  it('has a sample for each thing Mermaid\'s page on architecture diagrams shows, each read as its list says', () => {
    assert.ok(samples.length >= 20);
    assert.deepEqual(samples.map((s) => s.file).sort(), readdirSync(join(root, 'corpus/architecture')).map((f) => `architecture/${f}`).sort(), 'every sample is listed, and every listed sample is there');
    for (const s of samples) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8'));
      assert.equal(m.kindOfDiagram, 'architecture-beta', s.file);
      assert.equal(m.nodes.length, s.boxes, `${s.file}: boxes`);
      assert.equal(m.edges.length, s.links, `${s.file}: links`);
      if (s.groups !== undefined) assert.equal(m.groups.length, s.groups, `${s.file}: groups`);
      if (s.ends) assert.deepEqual(m.edges.map((e) => [e.tail, e.head]), s.ends, `${s.file}: ends`);
      if (s.shapes) assert.deepEqual(m.nodes.map((n) => n.shape), s.shapes, `${s.file}: shapes`);
      if (s.direction) assert.equal(m.direction, s.direction, `${s.file}: direction`);
      if (s.title !== undefined) assert.equal(m.title, s.title, `${s.file}: title`);
      for (const kind of s.kinds ?? []) assert.ok(m.nodes.some((n) => n.kind === kind), `${s.file}: no box is of the kind ${kind}`);
      const said = [...m.nodes.map((n) => n.label), ...m.edges.map((e) => e.label), ...m.groups.map((g) => g.title), ...Object.values(m.notes)];
      for (const words of s.has ?? []) assert.ok(said.includes(words), `${s.file}: "${words}" is not among its words`);
      if (s.says) assert.ok(m.warnings.some((w) => w.includes(/** @type {string} */ (s.says))), `${s.file}: it is not told: ${s.says}`);
      assert.deepEqual(m.warnings.filter((w) => !s.says || !w.includes(s.says)), [], s.file);
    }
  });

  it('is placed without a fault and passes every rule, every link with a line of its own', () => {
    for (const s of samples) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8')), lay = layout(m);
      for (const e of m.edges) assert.ok(lay.edges[e.id].points.length >= 2, `${s.file}: ${e.id}`);
      assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), [], s.file);
      if (s.groups !== undefined) assert.equal(lay.groups.length, s.groups, `${s.file}: frames drawn`);
    }
  });
});
