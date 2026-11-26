// What a label says when its author wrote HTML in it, and a directive that runs over several lines. Both were
// found in real documents (wild/): a tag printed as written, and every line of a directive said to be not read.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emphasisOf, linesIn, parse, wordsOf } from '../skills/merlive/scripts/parse.mjs';
import { isSequence, parseSequence } from '../skills/merlive/scripts/sequence.mjs';

const flow = (/** @type {string} */ body) => parse(`flowchart TD\n${body}`);
const box = (/** @type {string} */ words) => flow(`  A["${words}"] --> B`).nodes[0];

describe('labels: a tag is never printed', () => {
  it('reads <b> and <strong> as bold, <i> and <em> as italic: the runs a Markdown string would give', () => {
    assert.deepEqual(box('<b>Urgent</b> order').emphasis, box('`**Urgent** order`').emphasis);
    assert.deepEqual(box('<strong>Urgent</strong> order').emphasis, [{ words: 'Urgent', strong: true }, { words: ' order' }]);
    assert.deepEqual(box('Pick <i>today</i> and <em>pack</em>').emphasis, [{ words: 'Pick ' }, { words: 'today', em: true }, { words: ' and ' }, { words: 'pack', em: true }]);
    assert.deepEqual(box('<b><i>Both</i></b> at once').emphasis, [{ words: 'Both', strong: true, em: true }, { words: ' at once' }]);
    assert.equal(box('<B>Urgent</B> order').label, 'Urgent order');
    assert.deepEqual(box('<b>Urgent</b> order').label, 'Urgent order');
    assert.deepEqual(flow('  A["<b>Urgent</b> order"] --> B').warnings, []);
  });

  it('reads the <small> lines under a name as the sentence the box says about itself', () => {
    const n = box('🔍 AI Security Scan<br/><small>Automated codebase review</small>');
    assert.deepEqual([n.label, n.breaks, n.text], ['🔍 AI Security Scan', undefined, 'Automated codebase review']);
    assert.equal(box('Name<br/><small>one</small><br/><small>two</small>').text, 'one two');
    assert.equal(box('Name<br/><small>one<br/>two</small>').text, 'one two');
    const two = box('First line<br/>second line<br/><small>and what it does</small>');
    assert.deepEqual([two.label, two.breaks, two.text], ['First line second line', ['First line', 'second line'], 'and what it does']);
    assert.deepEqual(flow('  A["Name<br/><small>what it does</small>"] --> B').warnings, []);
  });

  it('keeps the words of a <small> that is not the whole of the lines under a name, and drops the tag', () => {
    const inline = box('Big <small>little</small> words');
    assert.deepEqual([inline.label, inline.text], ['Big little words', undefined]);
    const all = box('<small>All of it</small>');
    assert.deepEqual([all.label, all.text], ['All of it', undefined]);
    const mixed = box('Name<br/><small>quiet</small> and loud');
    assert.deepEqual([mixed.label, mixed.breaks, mixed.text], ['Name quiet and loud', ['Name', 'quiet and loud'], undefined]);
    const above = box('<small>over</small><br/>Name');
    assert.deepEqual([above.label, above.text], ['over Name', undefined]);
  });

  it('keeps a left-to-right flow left to right: there the lines under a name stay lines of the label', () => {
    // A box that says a sentence is taller than the rest, and boxes of different heights are only placed top
    // to bottom. The way its author ran the flow matters more than a quieter face.
    const m = parse('flowchart LR\n  A["Name<br/><small>what it does</small>"] --> B');
    assert.deepEqual([m.direction, m.nodes[0].label, m.nodes[0].breaks, m.nodes[0].text], ['LR', 'Name what it does', ['Name', 'what it does'], undefined]);
    assert.deepEqual(m.warnings, []);
  });

  it('keeps them lines of the label in a shape with no room under its name', () => {
    const m = flow('  A{"Name<br/><small>why</small>"} --> B[("Store<br/><small>of orders</small>")]\n  B --> C["Line<br/><br/><small>s</small>"]');
    assert.deepEqual(m.nodes.map((n) => [n.shape, n.label, n.breaks, n.text]), [['diamond', 'Name why', ['Name', 'why'], undefined], ['cylinder', 'Store', undefined, 'of orders'], ['box', 'Line', undefined, 's']]);
    assert.deepEqual(m.warnings, []);
  });

  it('ends a statement at a semicolon that ends no entity code, as before', () => {
    assert.deepEqual(flow('  A --> B & C; D --> E').edges.length, 3);
    assert.deepEqual(flow('  A["x &lt;b&gt; y"]; B[c]').nodes.map((n) => n.label), ['x <b> y', 'c']);
  });

  it('forgets the sentence when the box is given new words', () => {
    const m = flow('  A["Name<br/><small>what it does</small>"] --> B\n  A[Plain]');
    assert.deepEqual([m.nodes[0].label, m.nodes[0].text], ['Plain', undefined]);
  });

  it('keeps the words of any other tag, drops the tag, and says so once for the diagram', () => {
    const m = flow('  A["<u>Under</u> <span style=\'color:red\'>red</span> <code>x</code>"] --> B["H<sub>2</sub>O <font color=red>hot</font>"]\n  B --> C["<s>gone</s>"]');
    assert.deepEqual(m.nodes.map((n) => n.label), ['Under red x', 'H2O hot', 'gone']);
    assert.deepEqual(m.warnings, ['HTML that Merlive has no drawing for is left out and its words kept as plain words: <u>, <span>, <code>, <sub>, <font>, <s>']);
  });

  it('breaks a line where a tag that makes a block begins and ends, so two paragraphs are not run together', () => {
    assert.deepEqual(box('<p>One</p><p>Two</p>').breaks, ['One', 'Two']);
    assert.deepEqual(box('<div>Top</div>under').breaks, ['Top', 'under']);
    assert.deepEqual(box('<center>Mid</center>').label, 'Mid');
    assert.deepEqual(box('Things<ul><li>one</li><li>two</li></ul>').breaks, ['Things', 'one', 'two']);
    assert.match(flow('  A["<p>One</p><p>Two</p>"] --> B').warnings[0], /: <p>$/);
  });

  it('leaves a picture out, and says so', () => {
    const m = flow('  A["<img src=\'logo.png\' width=\'20\'/> Ledger"] --> B');
    assert.equal(m.nodes[0].label, 'Ledger');
    assert.deepEqual(m.warnings, ['HTML that Merlive has no drawing for is left out and its words kept as plain words: <img> (a picture in a label is not drawn)']);
  });

  it('leaves alone what is not a tag: a comparison, an arrow, a type between angle brackets', () => {
    for (const words of ['a < b and c > d', 'x <= y', 'List<String>', 'Map<K, V>', '<<interface>>', 'a <- b -> c', '3 < 4 > 2', '<T>', '< b >']) {
      const m = flow(`  A["${words}"] --> B`);
      assert.equal(m.nodes[0].label, words, words);
      assert.deepEqual(m.warnings, [], words);
    }
  });

  it('reads an entity code after the tags, so one that spells a tag is its words', () => {
    assert.equal(box('&lt;b&gt; &amp; #quot;q#quot;').label, '<b> & "q"');
    assert.equal(box('&#60;small&#62; &#x3c;i&#x3E;').label, '<small> <i>');
    assert.equal(box('a&nbsp;b &copy; &unknown; &').label, 'a b © &unknown; &');
    assert.equal(box('&lt;b&gt;').emphasis, undefined);
    // Its semicolon ends no statement.
    const m = flow('  A[a &lt; b] --> B[c &amp; d]');
    assert.deepEqual([m.nodes.map((n) => n.label), m.warnings], [['a < b', 'c & d'], []]);
  });

  it('reads them wherever words are read: a link, a group, a Markdown string, a state, a class', () => {
    const m = flow('  subgraph g["<b>Buying</b> <u>now</u>"]\n    A -->|<i>Yes</i> <code>ok</code>| B\n  end\n  C["`**a** <small>b</small> <u>c</u>`"]');
    assert.equal(m.groups[0].title, 'Buying now');
    assert.equal(m.edges[0].label, 'Yes ok');
    assert.equal(m.nodes.find((n) => n.id === 'C')?.label, 'a b c');
    assert.equal(m.warnings.length, 1);
    assert.match(m.warnings[0], /: <u>, <code>$/);
    const state = parse('stateDiagram-v2\n  Waiting: <i>Waiting</i><br/>for <u>stock</u>\n  [*] --> Waiting');
    assert.equal(state.nodes.find((n) => n.id === 'Waiting')?.label, 'Waiting for stock');
    assert.match(state.warnings.join(), /: <u>$/);
    const cls = parse('classDiagram\n  class Order\n  note for Order "<b>Never</b> <u>deleted</u>"');
    assert.equal(cls.nodes.find((n) => n.shape === 'note')?.label, 'Never deleted');
  });

  it('is the same reading alone as in a diagram: wordsOf and emphasisOf never print a tag either', () => {
    assert.deepEqual(wordsOf('"Name<br/><small>what</small> <u>x</u>"'), ['Name', 'what x']);
    assert.deepEqual(emphasisOf('<b>a</b> b'), [{ words: 'a', strong: true }, { words: ' b' }]);
    assert.deepEqual(wordsOf('<b>never closed'), ['never closed']);
  });
});

describe('labels: a sequence diagram reads them the same way', () => {
  it('prints no tag in a name, a message, a note or a block, and says once what it left out', () => {
    const m = parseSequence('sequenceDiagram\n  participant A as <b>Buyer</b>\n  participant B as <small>the</small> ERP\n  A->>B: <i>Raise</i> order<br/><u>today</u>\n  Note over A,B: <span class="x">Checked</span> <code>twice</code>\n  alt <b>Approved</b>\n    B-->>A: &lt;ok&gt;\n  end');
    assert.deepEqual(m.participants.map((p) => p.label), ['Buyer', 'the ERP']);
    const said = m.items.filter((i) => i.type === 'message').map((i) => /** @type {any} */ (i).lines);
    assert.deepEqual(said, [['Raise order', 'today'], ['<ok>']]);
    assert.deepEqual(/** @type {any} */ (m.items.find((i) => i.type === 'note')).lines, ['Checked twice']);
    assert.equal(m.blocks[0].label, 'Approved');
    assert.deepEqual(m.warnings, ['HTML that Merlive has no drawing for is left out and its words kept as plain words: <u>, <span>, <code>']);
  });

  it('ends no statement at the semicolon of an entity code', () => {
    const m = parseSequence('sequenceDiagram\n  A->>B: a &lt; b &amp; c');
    assert.deepEqual([/** @type {any} */ (m.items[0]).lines, m.warnings], [['a < b & c'], []]);
  });
});

describe('a directive that runs over several lines', () => {
  const init = "%%{init: {'theme':'base', 'themeVariables': {\n    'primaryColor': '#e3f2fd',\n    'lineColor': '#1565c0'\n}}}%%";

  it('is brought on to the line it began on, every other line keeping its number', () => {
    assert.deepEqual(linesIn(`a\n${init}\nb`), ['a', "%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#e3f2fd', 'lineColor': '#1565c0' }}}%%", '', '', '', 'b']);
    assert.deepEqual(linesIn('%%{init: {"a": 1}}%%\nx'), ['%%{init: {"a": 1}}%%', 'x']);
    assert.deepEqual(linesIn('  %%{init: {\r\n  "a": 1\r\n  }}%%  \r\nx'), ['%%{init: { "a": 1 }}%%', '', '', 'x']);
    // One never closed is left as it was written, to be said where it is read.
    assert.deepEqual(linesIn('%%{init: {\n"a": 1\nx'), ['%%{init: {', '"a": 1', 'x']);
  });

  it('is read past in a flowchart, before its first line, in the middle or at the end, with nothing said', () => {
    for (const src of [`${init}\nflowchart TD\n  A --> B`, `flowchart TD\n  A --> B\n${init}\n  B --> C`, `flowchart TD\n  A --> B\n    ${init.replace(/\n/g, '\n    ')}`]) {
      const m = parse(src);
      assert.deepEqual([m.type, m.kindOfDiagram, m.warnings], ['flowchart', 'flowchart', []], src);
      assert.ok(m.nodes.length >= 2);
    }
  });

  it('keeps the number of every line after it, for what is said of them', () => {
    const m = parse(`flowchart TD\n${init}\n  A --> B\n  wibble wobble`);
    assert.match(m.warnings[0], /^line 7: /);
  });

  it('still lends a reader the setting it holds', () => {
    const m = parse('%%{init: {"packet": {\n  "bitsPerRow": 8\n}}}%%\npacket-beta\n0-3: "A"\n4-7: "B"\n8-15: "C"');
    const one = parse('%%{init: {"packet": {"bitsPerRow": 8}}}%%\npacket-beta\n0-3: "A"\n4-7: "B"\n8-15: "C"');
    assert.deepEqual([/** @type {any} */ (m.grid).columns, m.nodes.map((n) => n.label)], [2, one.nodes.map((n) => n.label)]);
    assert.equal(/** @type {any} */ (one.grid).columns, 2);
    assert.deepEqual(m.warnings, []);
  });

  it('is read past in a sequence diagram, which is still known for one when the directive comes first', () => {
    for (const src of [`${init}\nsequenceDiagram\n  A->>B: Order`, `sequenceDiagram\n  A->>B: Order\n    ${init.replace(/\n/g, '\n    ')}`]) {
      assert.equal(isSequence(src), true, src);
      const m = parseSequence(src);
      assert.deepEqual([m.warnings, m.participants.length, m.items.length], [[], 2, 1], src);
      assert.equal(/** @type {any} */ (parse(src)).type, 'sequence');
    }
  });

  it('still turns the feet of a sequence diagram off when it says so over several lines', () => {
    assert.equal(parseSequence('%%{init: {"sequence": {\n  "mirrorActors": false\n}}}%%\nsequenceDiagram\nA->>B: hi').mirror, false);
    assert.equal(parseSequence('%%{init: {"sequence": {\n  "mirrorActors": true\n}}}%%\nsequenceDiagram\nA->>B: hi').mirror, true);
  });

  it('says so when one is never closed, in words that tell its author what to do', () => {
    assert.match(parse('flowchart TD\n%%{init: {\n  A --> B').warnings[0], /^line 2: this directive is never closed; end it with "\}%%"/);
    assert.match(parseSequence('sequenceDiagram\n%%{init: {\n  A->>B: hi').warnings[0], /^line 2: this directive is never closed; end it with "\}%%"/);
  });
});
