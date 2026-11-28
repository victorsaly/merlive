// Why: a packet says which bits each field takes. These hold the reader to that: every field a box with its
// bits over its name, in a grid whose columns are as many bits as every field is a whole number of, a field cut
// where a row ends, and whatever Mermaid would not draw said in a sentence that tells its author what to
// change. They also hold the corpus's own list (corpus/packet.json) to what is read and drawn today.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { layout, measure } from '../skills/merlive/scripts/layout.mjs';
import { limits, score } from '../skills/merlive/scripts/score.mjs';
import { builtIn } from '../skills/merlive/scripts/design.mjs';
import { picture } from '../skills/merlive/scripts/render.mjs';
import { packetMeasure } from '../skills/merlive/scripts/packet.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const packet = (/** @type {string} */ body, head = 'packet-beta') => parse(`${head}\n${body}`);
/** @typedef {import('../skills/merlive/scripts/parse.mjs').Model} Model */
const fields = (/** @type {Model} */ m) => m.nodes.map((n) => [n.id, n.label, n.over]);
const cells = (/** @type {Model} */ m) => /** @type {{columns:number,cells:{is:string,id?:string,span:number}[]}} */ (m.grid).cells.map((c) => (c.is === 'space' ? `space:${c.span}` : `${c.id}:${c.span}`));
const said = (/** @type {Model} */ m) => m.warnings.map((w) => w.replace(/^line \d+: /, ''));
const broken = (/** @type {Model} */ m) => score(m, layout(m), builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`);
const left = (/** @type {{x:number,w:number}} */ n) => n.x - n.w / 2, right = (/** @type {{x:number,w:number}} */ n) => n.x + n.w / 2;

const udp = '0-15: "Source Port"\n16-31: "Destination Port"\n32-47: "Length"\n48-63: "Checksum"\n64-95: "Data"';
const tcp = '0-15: "Source Port"\n16-31: "Destination Port"\n32-63: "Sequence Number"\n64-95: "Acknowledgment Number"\n96-99: "Data Offset"\n100-105: "Reserved"\n106: "URG"\n107: "ACK"\n108: "PSH"\n109: "RST"\n110: "SYN"\n111: "FIN"\n112-127: "Window"\n128-143: "Checksum"\n144-159: "Urgent Pointer"\n160-191: "(Options and Padding)"\n192-255: "Data (variable length)"';

describe('packet: fields', () => {
  it('calls a field a field on the page', () => {
    assert.equal(packet('0-15: "Source port"\n16-31: "Destination port"').meanings?.step, 'Field');
  });

  it('reads a field as a box, with the bits it takes over its name', () => {
    const m = packet(udp);
    assert.deepEqual(fields(m), [['bits0', 'Source Port', '0–15'], ['bits16', 'Destination Port', '16–31'], ['bits32', 'Length', '32–47'], ['bits48', 'Checksum', '48–63'], ['bits64', 'Data', '64–95']]);
    assert.deepEqual([m.type, m.kindOfDiagram, m.edges.length, m.groups.length, m.warnings], ['flowchart', 'packet-beta', 0, 0, []]);
  });

  it('is read the same whether it opens "packet" or "packet-beta"', () => {
    assert.deepEqual(fields(packet(udp, 'packet')), fields(packet(udp)));
    assert.equal(packet(udp, 'packet').kindOfDiagram, 'packet');
  });

  it('reads one bit, and a field given by how many bits it takes, which starts where the last one ended', () => {
    const m = packet('+16: "Source Port"\n16-31: "Destination Port"\n+1: "URG"\n33: "ACK"\n34-34: "PSH"\n+29: "Rest"');
    assert.deepEqual(fields(m), [['bits0', 'Source Port', '0–15'], ['bits16', 'Destination Port', '16–31'], ['bits32', 'URG', '32'], ['bits33', 'ACK', '33'], ['bits34', 'PSH', '34'], ['bits35', 'Rest', '35–63']]);
    assert.deepEqual(m.warnings, []);
  });

  it('takes a name as it is written, in double quotes or single, with nothing made of what is in it', () => {
    const m = packet('0-7: "A [b] {c} <br> **d**"\n8-15: \'single\'\n16-23: ""\n24 - 31 : "Spaced"');
    assert.deepEqual(m.nodes.map((n) => n.label), ['A [b] {c} <br> **d**', 'single', '', 'Spaced']);
    assert.deepEqual(m.warnings, []);
  });

  it('reads past a comment after a field, and takes Merlive\'s own lines as a flowchart does', () => {
    const m = packet('%% the header\n0-7: "Kind" %% what it is\n8-15: "Flags"\n%% note bits0: Says which message this is');
    assert.deepEqual(fields(m), [['bits0', 'Kind', '0–7'], ['bits8', 'Flags', '8–15']]);
    assert.equal(m.notes.bits0, 'Says which message this is');
    assert.deepEqual(m.warnings, []);
  });
});

describe('packet: what it is called', () => {
  it('takes its title from a line of its own, as it is written, the last one said', () => {
    assert.deepEqual([packet(`title UDP Packet\n${udp}`).title, packet(`title UDP Packet\n${udp}`).heading], ['UDP Packet', 'UDP Packet']);
    assert.equal(packet(`title One\n${udp}\ntitle Two`).heading, 'Two');
    assert.equal(packet(`title "In quotes"\n${udp}`).heading, '"In quotes"');
  });

  it('takes it from front matter too, and keeps it when a bare "title" says nothing', () => {
    const m = parse(`---\ntitle: A packet\n---\npacket-beta\ntitle\n${udp}`);
    assert.deepEqual([m.title, m.heading, m.warnings], ['A packet', 'A packet', []]);
  });

  it('keeps what is written for a reader who cannot see it apart from the title that is drawn', () => {
    const m = packet(`accTitle: A header\naccDescr: What a datagram starts with\n${udp}`);
    assert.deepEqual([m.title, m.heading, m.describes, m.warnings], ['A header', '', 'What a datagram starts with', []]);
  });
});

describe('packet: the grid its bits make', () => {
  it('has a column for as many bits as every field is a whole number of, so bytes are not drawn bit by bit', () => {
    const m = packet(udp), g = /** @type {any} */ (m.grid);
    assert.equal(g.columns, 2);
    assert.deepEqual(cells(m), ['bits0:1', 'bits16:1', 'bits32:1', 'bits48:1', 'bits64:2']);
    assert.equal(/** @type {any} */ (packet('0-15: "Order number"\n16-23: "Lines"\n24-31: "Status"\n32-63: "Total"').grid).columns, 4);
  });

  it('has a column a bit when a field is one bit', () => {
    const m = packet(tcp), g = /** @type {any} */ (m.grid);
    assert.equal(g.columns, 32);
    assert.deepEqual(cells(m).slice(4, 12), ['bits96:4', 'bits100:6', 'bits106:1', 'bits107:1', 'bits108:1', 'bits109:1', 'bits110:1', 'bits111:1']);
  });

  it('is marked to be placed on that grid, and says why', () => {
    const m = packet(udp);
    assert.equal(m.placedBy, 'grid');
    assert.match(m.placedWhy ?? '', /rows of 32 bits, and each field is as wide as the bits it takes/);
  });

  it('cuts a field that runs past the end of a row, each part with the bits it has there, and says they are one', () => {
    const m = packet('0-15: "Kind"\n16-79: "Data"\n80-95: "Check"');
    assert.deepEqual(fields(m), [['bits0', 'Kind', '0–15'], ['bits16', 'Data', '16–31'], ['bits32', 'Data', '32–63'], ['bits64', 'Data', '64–79'], ['bits80', 'Check', '80–95']]);
    assert.deepEqual(cells(m), ['bits0:1', 'bits16:1', 'bits32:2', 'bits64:1', 'bits80:1']);
    assert.equal(m.notes.bits16, 'Part 1 of 3 of one field, bits 16 to 79: it runs past the end of a row of 32 bits.');
    assert.equal(m.notes.bits64, 'Part 3 of 3 of one field, bits 16 to 79: it runs past the end of a row of 32 bits.');
    assert.equal(m.notes.bits0, undefined);
  });

  it('leaves what its author said of a part as it is', () => {
    const m = packet('%% note bits32: The rest of the body\n0-63: "Body"');
    assert.equal(m.notes.bits32, 'The rest of the body');
    assert.match(m.notes.bits0, /^Part 1 of 2/);
  });

  it('has as many bits in a row as front matter says', () => {
    const m = parse('---\nconfig:\n  packet:\n    bitsPerRow: 16\n    bitWidth: 20\n---\npacket-beta\n0-7: "Kind"\n8-15: "Flags"\n16-39: "Body"\n40-47: "Tail"');
    assert.deepEqual(fields(m), [['bits0', 'Kind', '0–7'], ['bits8', 'Flags', '8–15'], ['bits16', 'Body', '16–31'], ['bits32', 'Body', '32–39'], ['bits40', 'Tail', '40–47']]);
    assert.deepEqual([/** @type {any} */ (m.grid).columns, m.warnings], [2, []]);
    assert.match(m.placedWhy ?? '', /rows of 16 bits/);
  });

  it('or as a directive says, wherever it is written', () => {
    const first = parse('%%{init: {"packet": {"bitsPerRow": 8}}}%%\npacket-beta\n0-3: "A"\n4-7: "B"\n8-15: "C"');
    assert.deepEqual([/** @type {any} */ (first.grid).columns, cells(first)], [2, ['bits0:1', 'bits4:1', 'bits8:2']]);
    const after = parse('packet-beta\n%%{init: {"packet": {"bitsPerRow": 8}}}%%\n0-3: "A"\n4-7: "B"\n8-15: "C"');
    assert.deepEqual(cells(after), cells(first));
  });

  it('leaves the bits off the picture when its author asked for that', () => {
    const m = parse('%%{init: {"packet": {"showBits": false}}}%%\npacket-beta\n0-7: "Kind"\n8-15: "Flags"');
    assert.deepEqual(fields(m), [['bits0', 'Kind', undefined], ['bits8', 'Flags', undefined]]);
    assert.deepEqual(broken(m), []);
  });
});

describe('packet: what Mermaid would not draw', () => {
  it('leaves bits no field has empty, where they are, and says how to fill them', () => {
    const m = packet('0-7: "Kind"\n12-15: "Flags"\n16-31: "Length"');
    assert.deepEqual(cells(m), ['bits0:2', 'space:1', 'bits12:1', 'bits16:4']);
    assert.deepEqual(m.warnings, ['line 3: bits 8 to 11 are in no field, and Mermaid draws no packet with bits left out: start "Flags" at bit 8, or give the bits before it a field of their own (8-11: "Reserved")']);
    assert.deepEqual(said(packet('0-7: "Kind"\n9-15: "Flags"')), ['bit 8 is in no field, and Mermaid draws no packet with bits left out: start "Flags" at bit 8, or give the bits before it a field of their own (8: "Reserved")']);
    assert.deepEqual(broken(m), []);
  });

  it('says so of a packet that does not start at its first bit', () => {
    assert.match(said(packet('4-7: "Late"'))[0], /^bits 0 to 3 are in no field/);
  });

  it('does not read a field that starts in one already there, and says where it should start', () => {
    const m = packet('0-7: "Kind"\n4-11: "Overlap"\n8-15: "Flags"');
    assert.deepEqual(fields(m).map((f) => f[1]), ['Kind', 'Flags']);
    assert.deepEqual(said(m), ['not read: "4-11: "Overlap"": bit 4 is already in "Kind", and a field starts where the last one ended; start it at bit 8']);
  });

  it('does not read a field written backwards, or one of no bits, and says how to write each', () => {
    assert.deepEqual(said(packet('15-0: "Backwards"')), ['not read: "15-0: "Backwards"": a field ends at or after the bit it starts at; write it as 0-15', 'a packet with no fields has nothing to draw; write one, as in 0-15: "Source port"']);
    assert.deepEqual(said(packet('0-7: "Kind"\n+0: "Nothing" %% none')), ['not read: "+0: "Nothing"": a field takes one bit at the least; write +1, or leave the line out']);
  });

  it('says what to do with a name not in quotes, two fields on a line, and a style', () => {
    assert.deepEqual(said(packet('0-7: Kind\n0-7: "Kind"; 8-15: "Flags"\nclassDef late fill:#fee\nstyle bits0 fill:#fee\nsomething else\n0-7: "Kind"')), [
      'not read: "0-7: Kind": put the name of a field in quotes, as in 0-15: "Source port"',
      'not read: "0-7: "Kind"; 8-15: "Flags"": write each field on a line of its own, with no ";"',
      'not read: "classDef late fill:#fee": a packet has no classes or styles of its own; its fields are drawn in the design\'s colours',
      'not read: "style bits0 fill:#fee": a packet has no classes or styles of its own; its fields are drawn in the design\'s colours',
      'not read: "something else"',
    ]);
  });

  it('says how to write a name with a quote mark in it', () => {
    assert.deepEqual(said(packet('0-7: "Say "hi" twice"\n0-7: \'Say "hi" twice\'')), ['not read: "0-7: "Say "hi" twice"": a name ends at the first quote mark like the one it starts with; use the other kind inside it, as in \'Say "hi"\'']);
  });

  it('says a packet with no fields has nothing to draw, and marks nothing to be placed', () => {
    const m = packet('title Empty');
    assert.deepEqual([m.nodes.length, m.placedBy, m.grid], [0, undefined, undefined]);
    assert.match(m.warnings[0], /^line 1: a packet with no fields has nothing to draw/);
  });
});

describe('packet: placed and drawn', () => {
  it('draws a field as wide as its bits: sixteen as two of eight and the gap between them', () => {
    const m = packet('0-15: "Order number"\n16-23: "Lines"\n24-31: "Status"\n32-63: "Total, in pence"'), lay = layout(m), at = lay.nodes;
    assert.equal(at.bits0.w, 2 * at.bits16.w + packetMeasure.gap);
    assert.equal(at.bits32.w, 4 * at.bits16.w + 3 * packetMeasure.gap);
    assert.equal(at.bits16.w, at.bits24.w);
    assert.equal(left(at.bits16) - right(at.bits0), packetMeasure.gap);
    assert.ok(at.bits0.y === at.bits16.y && at.bits32.y > at.bits0.y, 'a row of 32 bits, then the next');
    assert.equal(left(at.bits32), left(at.bits0));
    assert.deepEqual(broken(m), []);
  });

  it('gives a row its least width, so a short packet is not a strip', () => {
    const m = packet(udp), lay = layout(m), at = lay.nodes;
    assert.ok(right(at.bits16) - left(at.bits0) >= packetMeasure.row, `${right(at.bits16) - left(at.bits0)}px`);
    assert.deepEqual([at.bits0.lines, at.bits16.lines], [['Source Port'], ['Destination Port']]);
  });

  it('draws a header with fields of one bit: every name whole, on a page not many times wider than it need be', () => {
    const m = packet(tcp), lay = layout(m), at = lay.nodes;
    for (const flag of ['bits106', 'bits107', 'bits108', 'bits109', 'bits110', 'bits111']) assert.equal(at[flag].lines.length, 1, flag);
    assert.ok(at.bits106.w < 64 && at.bits106.w * 3 < at.bits96.w, `a bit is ${at.bits106.w}px`);
    // Thirty-two boxes of a flow's narrowest size, with a flow's room between them, would be 5584px.
    assert.ok(lay.width < (32 * measure.widths[0] + 31 * 48) / 2, `${lay.width}px`);
    assert.deepEqual(new Set(['bits0', 'bits32', 'bits64', 'bits96', 'bits128', 'bits160', 'bits192', 'bits224'].map((id) => left(at[id]))).size, 1, 'every row starts at one edge');
    assert.deepEqual(broken(m), []);
  });

  it('says the bits over each name on the picture, and its title above', () => {
    const m = packet(`title UDP Packet\n${udp}`), svg = picture(m, layout(m), builtIn, { title: 't' });
    assert.match(svg, /class="mv-title"[^>]*><tspan[^>]*>UDP Packet</);
    assert.match(svg, /<g class="mv-node" data-node="bits0".*?class="mv-over"[^>]*>0–15<\/text><text><tspan[^>]*>Source Port</s);
    assert.doesNotMatch(svg, /data-edge=/);
  });

  it('puts every part of a field that was cut on a row of its own bits', () => {
    const m = packet('0-15: "Kind"\n16-79: "Data"\n80-95: "Check"'), at = layout(m).nodes;
    assert.ok(at.bits16.y === at.bits0.y && at.bits32.y > at.bits16.y && at.bits64.y > at.bits32.y && at.bits80.y === at.bits64.y);
    assert.equal(at.bits32.w, right(at.bits16) - left(at.bits0));
  });
});

describe('packet: near the width Mermaid gives it', () => {
  // Mermaid draws a row of 32 bits 1024px wide; a field of one bit is 32px with its name in it.
  const rule = (/** @type {Model} */ m, /** @type {any} */ lay, /** @type {string} */ id) => /** @type {any} */ (score(m, lay, builtIn).checks.find((c) => c.id === id));

  it('draws a TCP header no wider than a page shows at once, every flag whole', () => {
    const m = packet(tcp), lay = layout(m), at = lay.nodes;
    assert.ok(lay.width <= 1200, `${lay.width}px`);
    for (const flag of ['bits106', 'bits107', 'bits108', 'bits109', 'bits110', 'bits111']) assert.deepEqual(at[flag].lines.length, 1, flag);
    assert.ok(at.bits106.w < 40, `a bit is ${at.bits106.w}px`);
    assert.deepEqual(broken(m), []);
  });

  it('draws a field as a cell, which keeps less room round its words than a box of a flow', () => {
    assert.ok(packet(tcp).nodes.every((n) => n.shape === 'cell'));
  });

  it('sets fields closer than two boxes of a flow, as Mermaid\'s all but touch, and never on each other', () => {
    const m = packet(udp), at = layout(m).nodes;
    assert.ok(packetMeasure.gap > 0 && packetMeasure.gap < limits.boxGap, `${packetMeasure.gap}px`);
    assert.equal(left(at.bits16) - right(at.bits0), packetMeasure.gap);
    assert.equal(rule(m, layout(m), 'P2').ok, true);
  });

  it('is still held to its cells: a field moved onto the next breaks P2', () => {
    const m = packet(udp), lay = layout(m);
    lay.nodes.bits16.x -= packetMeasure.gap + 4;
    const p2 = rule(m, lay, 'P2');
    assert.equal(p2.ok, false);
    assert.match(p2.detail, /"Source Port" and "Destination Port" overlap/);
  });

  it('holds the line over a name to the field it is over, not to one column (P6)', () => {
    const m = packet(tcp), lay = layout(m);
    assert.ok(lay.box.w < '192–255'.length * measure.overGlyph + 2 * measure.overIn, `a column is ${lay.box.w}px`);
    assert.equal(rule(m, lay, 'P6').ok, true);
    lay.nodes.bits106.w = 12;
    assert.match(rule(m, lay, 'P6').detail, /"URG" has a line over its name too long for a 12px box: "106"/);
  });
});

describe('packet: the corpus', () => {
  /** @type {{file:string,covers:string,boxes:number,links:number,placedBy?:string,has?:string[],over?:string[],columns?:number,title?:string,says?:string,loses?:string}[]} */
  const list = JSON.parse(readFileSync(join(root, 'corpus/index.json'), 'utf8')).packet;

  it('lists every sample that is there, and every sample listed is there', () => {
    assert.deepEqual(list.map((s) => s.file).sort(), readdirSync(join(root, 'corpus/packet')).filter((f) => f.endsWith('.mmd')).map((f) => `packet/${f}`).sort());
    for (const s of list) assert.ok(s.covers && Number.isInteger(s.boxes) && Number.isInteger(s.links), s.file);
  });

  it('is read as its list says: fields, their names and bits, its columns, its title', () => {
    for (const s of list) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8'));
      assert.match(m.kindOfDiagram, /^packet(-beta)?$/, s.file);
      assert.equal(m.nodes.length, s.boxes, `${s.file}: boxes`);
      assert.equal(m.edges.length, s.links, `${s.file}: links`);
      const words = m.nodes.map((n) => n.label);
      for (const w of s.has ?? []) assert.ok(words.includes(w), `${s.file}: "${w}" is not among its words: ${words.join(' | ')}`);
      if (s.over) assert.deepEqual(m.nodes.map((n) => n.over ?? ''), s.over, `${s.file}: bits`);
      if (s.columns) assert.equal(/** @type {any} */ (m.grid).columns, s.columns, `${s.file}: columns`);
      if (s.title !== undefined) assert.equal(m.heading, s.title, s.file);
      assert.equal(m.type, 'flowchart', s.file);
      assert.equal(m.placedBy, s.placedBy, s.file);
      assert.deepEqual(m.warnings.filter((w) => !(s.says && w.includes(s.says))), [], s.file);
      if (s.says) assert.ok(m.warnings.some((w) => w.includes(/** @type {string} */ (s.says))), `${s.file}: not told "${s.says}"`);
    }
  });

  it('is drawn with no rule broken, every field in the picture', () => {
    for (const s of list) {
      const m = parse(readFileSync(join(root, 'corpus', s.file), 'utf8')), lay = layout(m);
      assert.deepEqual(score(m, lay, builtIn).checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`), [], s.file);
      assert.deepEqual(lay.warnings, [], s.file);
      for (const n of m.nodes) assert.ok(lay.nodes[n.id] && right(lay.nodes[n.id]) <= lay.width, `${s.file}: ${n.id}`);
    }
  });
});
