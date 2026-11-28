// Why: a sequence diagram is read, placed, checked and drawn by rules of its own (docs/SEQUENCE.md). Each is
// held here the way the flowchart's are: what is read, where it goes, and that a broken rule is named.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parse } from '../skills/merlive/scripts/parse.mjs';
import { across, isSequence, layoutSequence, parseSequence, scoreSequence } from '../skills/merlive/scripts/sequence.mjs';
import { sequencePage, sequencePicture } from '../skills/merlive/scripts/sequence-render.mjs';
import { builtIn, designFrom } from '../skills/merlive/scripts/design.mjs';

const seq = (/** @type {string} */ body) => parseSequence(`sequenceDiagram\n${body}`);
const order = `participant B as Buyer
participant E as ERP
participant S as Supplier
B->>E: Raise order
E->>S: Send order
S-->>E: Confirm
E-->>B: Order confirmed`;
const failed = (/** @type {{checks:{id:string,ok:boolean}[]}} */ r) => r.checks.filter((c) => !c.ok).map((c) => c.id);
const messages = (/** @type {ReturnType<typeof parseSequence>} */ m) => m.items.filter((i) => i.type === 'message');

describe('sequence: what is one', () => {
  it('knows a sequence diagram by its first line, past front matter and comments', () => {
    assert.ok(isSequence('sequenceDiagram\nA->>B: hi'));
    assert.ok(isSequence('---\ntitle: Calls\n---\n%% a comment\n  sequenceDiagram\nA->>B: hi'));
    assert.ok(!isSequence('flowchart TD\nA --> B'));
    assert.ok(!isSequence('%% sequenceDiagram\nflowchart TD\nA --> B'));
  });

  it('is what parse gives for one, and a flowchart is still a flowchart', () => {
    assert.equal(parse(`sequenceDiagram\n${order}`).type, 'sequence');
    assert.equal(parse('flowchart TD\nA --> B').type, 'flowchart');
  });
});

describe('sequence: participants', () => {
  it('reads them in the order they are named, with what each is called', () => {
    const m = seq(order);
    assert.deepEqual(m.participants.map((p) => [p.id, p.label, p.role, p.shape]), [['B', 'Buyer', 'participant', 'box'], ['E', 'ERP', 'participant', 'box'], ['S', 'Supplier', 'participant', 'box']]);
    assert.deepEqual(m.warnings, []);
  });

  it('takes one that is never named from the first message it is in', () => {
    assert.deepEqual(seq('Buyer->>ERP: Raise order\nERP->>Supplier: Send').participants.map((p) => p.id), ['Buyer', 'ERP', 'Supplier']);
  });

  it('reads an actor as a person from outside, and a database as a store of data', () => {
    const m = seq('actor B as Buyer\nparticipant D@{ "type": "database" } as Orders\nparticipant Q@{ "type": "queue", "alias": "Jobs" }\nB->>D: Save');
    assert.deepEqual(m.participants.map((p) => [p.label, p.role, p.kind, p.shape]), [['Buyer', 'actor', 'external', 'person'], ['Orders', 'database', 'data', 'database'], ['Jobs', 'queue', 'step', 'queue']]);
  });

  it('lets the name after "as" win over the one inside the braces, and keeps a line break', () => {
    const m = seq('participant A@{ "type": "boundary", "alias": "Inside" } as Outside\nparticipant W as Main<br/>warehouse\nA->>W: Go');
    assert.equal(m.participants[0].label, 'Outside');
    assert.deepEqual(m.participants[1].breaks, ['Main', 'warehouse']);
  });

  it('reads groups of participants, the colour of a group left to the design', () => {
    const m = seq('box Aqua Buying\nparticipant B as Buyer\nparticipant E as ERP\nend\nbox rgb(33,66,99)\nparticipant S as Supplier\nend\nbox Outside the firm\nparticipant C as Carrier\nend\nB->>S: Order');
    assert.deepEqual(m.groups.map((g) => [g.title, g.members]), [['Buying', ['B', 'E']], ['', ['S']], ['Outside the firm', ['C']]]);
  });

  it('reads one made and one ended part way down', () => {
    const m = seq('Buyer->>ERP: Raise order\ncreate participant Job\nERP->>Job: Start\ndestroy Job\nJob->>ERP: Done');
    const job = m.participants.find((p) => p.id === 'Job');
    assert.deepEqual([job?.created, job?.destroyed], [1, 2]);
    assert.deepEqual(m.warnings, []);
  });
});

describe('sequence: messages', () => {
  it('reads every arrow Mermaid has: its line, and what is at each end', () => {
    const m = seq('A->B: one\nA-->B: two\nA->>B: three\nA-->>B: four\nA<<->>B: five\nA<<-->>B: six\nA-xB: seven\nA--xB: eight\nA-)B: nine\nA--)B: ten');
    assert.deepEqual(messages(m).map((x) => [x.style, x.tail, x.head]), [
      ['solid', 'none', 'none'], ['dotted', 'none', 'none'], ['solid', 'none', 'arrow'], ['dotted', 'none', 'arrow'], ['solid', 'arrow', 'arrow'],
      ['dotted', 'arrow', 'arrow'], ['solid', 'none', 'cross'], ['dotted', 'none', 'cross'], ['solid', 'none', 'open'], ['dotted', 'none', 'open'],
    ]);
    assert.deepEqual(messages(m).map((x) => x.label), ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']);
    assert.deepEqual(m.warnings, []);
  });

  it('reads the words as a reader should see them: line breaks, entity codes, spaces round the arrow', () => {
    const m = seq('Buyer ->> ERP : Raise order<br/>for 40 units\nERP-->>Buyer: I #9829; it #59; thanks');
    assert.deepEqual(messages(m)[0].lines, ['Raise order', 'for 40 units']);
    assert.equal(messages(m)[1].label, 'I ♥ it ; thanks');
  });

  it('reads a message from a participant to itself', () => {
    const m = seq('ERP->>ERP: Check stock');
    assert.deepEqual(messages(m).map((x) => [x.from, x.to]), [['ERP', 'ERP']]);
  });

  it('numbers them when asked, from where and by how much it is told', () => {
    assert.deepEqual(messages(seq(`autonumber\n${order}`)).map((x) => x.number), [1, 2, 3, 4]);
    assert.deepEqual(messages(seq(`autonumber 10 5\n${order}`)).map((x) => x.number), [10, 15, 20, 25]);
    assert.deepEqual(messages(seq(order)).map((x) => x.number), [0, 0, 0, 0]);
  });

  it('finds the arrow in a name that has a dash and an x in it, once the name is known', () => {
    const m = seq('participant Fed-ex\nparticipant Buyer\nFed-ex->>Buyer: Delivered');
    assert.deepEqual(messages(m).map((x) => [x.from, x.to, x.head]), [['Fed-ex', 'Buyer', 'arrow']]);
  });

  it('reads statements parted by semicolons', () => {
    assert.equal(messages(seq('A->>B: one; B-->>A: two')).length, 2);
  });
});

describe('sequence: activations, notes and blocks', () => {
  it('reads activations written out and written short, stacked on one participant', () => {
    const long = seq('B->>E: Raise\nactivate E\nE-->>B: Done\ndeactivate E');
    assert.deepEqual(long.activations, [{ of: 'E', from: 0, to: 1, depth: 0 }]);
    const short = seq('B->>+E: Raise\nB->>+E: Hurry\nE-->>-B: Wait\nE-->>-B: Done');
    assert.deepEqual(short.activations.map((a) => [a.of, a.from, a.to, a.depth]), [['E', 0, 3, 0], ['E', 1, 2, 1]]);
  });

  it('says so when one is ended that never began, and runs one never ended to the foot', () => {
    const m = seq('B->>E: Raise\ndeactivate E\nB->>+E: Again');
    assert.match(m.warnings[0], /^line 3: E is not active, so there is nothing to deactivate/);
    assert.deepEqual(m.activations, [{ of: 'E', from: 1, to: null, depth: 0 }]);
  });

  it('reads notes beside one participant and over one or two', () => {
    const m = seq('participant B\nparticipant E\nNote right of B: Needs approval\nnote left of B: Buyer<br/>side\nNote over E: Checks stock\nNote over B,E: Both agree');
    assert.deepEqual(m.items.map((i) => i.type === 'note' && [i.place, i.over, i.label]), [['right', ['B'], 'Needs approval'], ['left', ['B'], 'Buyer side'], ['over', ['E'], 'Checks stock'], ['over', ['B', 'E'], 'Both agree']]);
  });

  it('reads every block, with its sections, inside one another', () => {
    const m = seq('B->>E: Ask\nloop Every minute\nE->>E: Poll\nend\nalt In stock\nE->>B: Yes\nelse Out of stock\nE->>B: No\nend\nopt Rush\nB->>E: Hurry\nend\npar To supplier\nE->>S: Order\nand To buyer\nE->>B: Receipt\npar Inner\nE->>S: Chase\nend\nend\ncritical Reserve stock\nE->>S: Reserve\noption Timeout\nE->>E: Log\nend\nbreak Order cancelled\nE->>B: Stop\nend\nrect rgb(191, 223, 255)\nE->>B: Done\nend');
    assert.deepEqual(m.blocks.map((b) => [b.kind, b.label, b.sections, b.parent]), [
      ['loop', 'Every minute', [], -1], ['alt', 'In stock', ['Out of stock'], -1], ['opt', 'Rush', [], -1], ['par', 'To supplier', ['To buyer'], -1],
      ['par', 'Inner', [], 3], ['critical', 'Reserve stock', ['Timeout'], -1], ['break', 'Order cancelled', [], -1], ['rect', '', [], -1],
    ]);
    assert.deepEqual(m.warnings, []);
  });

  it('says so when a block is never closed, or an end closes nothing', () => {
    assert.match(seq('loop Forever\nA->>B: hi').warnings[0], /^line 2: this loop is never closed; end it with a line of "end"/);
    assert.match(seq('A->>B: hi\nend').warnings[0], /^line 3: this "end" closes nothing/);
  });
});

describe('sequence: what is around it, and what is not read', () => {
  it('keeps a title, from front matter, a title line or accTitle, and what it shows', () => {
    assert.equal(parseSequence('---\ntitle: Ordering\n---\nsequenceDiagram\nA->>B: hi').title, 'Ordering');
    assert.equal(seq('title: Ordering calls\nA->>B: hi').title, 'Ordering calls');
    const m = seq('accTitle: Ordering\naccDescr {\n  Who calls whom\n  to place an order\n}\nA->>B: hi');
    assert.deepEqual([m.title, m.describes], ['Ordering', 'Who calls whom to place an order']);
  });

  it('reads past comments and the menus Mermaid hangs on a participant', () => {
    const m = seq('%% the happy path\nA->>B: hi\nlink A: Dashboard @ https://example.com\nlinks B: {"Wiki": "https://example.com/wiki"}');
    assert.deepEqual(m.warnings, []);
    assert.ok(!JSON.stringify(m).includes('example.com'));
  });

  it('says what it could not read, with its line, and leaves nothing of that line behind', () => {
    const m = seq('A->>B: hi\nwibble wobble\nB-->>A: bye');
    assert.match(m.warnings[0], /^line 3: not read: "wibble wobble"/);
    assert.equal(messages(m).length, 2);
    assert.deepEqual(m.participants.map((p) => p.id), ['A', 'B']);
  });
});

describe('sequence: what an author got wrong is said, and the rest is drawn', () => {
  it('names a section outside any block, and a participant that nothing makes or ends', () => {
    const m = seq('else Otherwise\nA->>B: hi\ncreate participant C\nA->>B: not to C\ndestroy B\nA->>A: not B\ncreate participant D\ndestroy A');
    assert.match(m.warnings[0], /^line 2: this "else" is in no block/);
    assert.match(m.warnings[1], /^line 4: nothing makes C: the message after "create" must go to it/);
    assert.match(m.warnings[2], /^line 6: nothing ends B: the message after "destroy" must be to or from it/);
    assert.match(m.warnings[3], /^line 8: nothing makes D/);
    assert.match(m.warnings[4], /^line 9: nothing ends A/);
    assert.equal(messages(m).length, 3);
  });

  it('names a group that is never closed, and leaves out one whose participants do not stand together', () => {
    assert.match(seq('box Buying\nparticipant B\nB->>B: hi').warnings[0], /^line 2: this box is never closed/);
    const apart = seq('participant A\nparticipant B\nbox Ends\nparticipant C\nend\nA->>C: hi');
    apart.groups[0].members.push('A');
    const lay = layoutSequence(apart);
    assert.deepEqual(lay.groups, []);
    assert.match(lay.warnings[0], /^the group "Ends" is not drawn: its participants do not stand side by side/);
  });

  it('leaves out a block that holds nothing, and says so', () => {
    const lay = layoutSequence(seq('A->>B: hi\nloop Nothing\nend'));
    assert.deepEqual(lay.frames, []);
    assert.match(lay.warnings[0], /^line 3: this loop holds nothing, and is left out/);
  });

  it('turns numbering off part way down', () => {
    assert.deepEqual(messages(seq('autonumber\nA->>B: one\nautonumber off\nA->>B: two')).map((x) => x.number), [1, 0]);
  });
});

describe('sequence: placement', () => {
  const lay = layoutSequence(seq(order));

  it('stands participants in one row, one size, one step apart', () => {
    const heads = Object.values(lay.participants);
    assert.equal(new Set(heads.map((h) => `${h.w}x${h.h}`)).size, 1);
    assert.equal(new Set(heads.map((h) => h.y)).size, 1);
    assert.deepEqual(heads.slice(1).map((h, i) => h.x - heads[i].x), [lay.step, lay.step]);
    assert.ok(lay.step >= lay.head.w + across.gap);
  });

  it('makes the heads as narrow as their names allow, and the step wide enough for the longest words', () => {
    assert.equal(lay.head.w, across.widths[0]);
    const wide = layoutSequence(seq('A->>B: A much longer message here'));
    assert.ok(wide.step > lay.step);
    const words = wide.messages.m1.words;
    assert.ok(words && words.w <= wide.step - 2 * across.clear);
  });

  it('puts each message on a row of its own, evenly down the page, and its words above its line', () => {
    const rows = ['m1', 'm2', 'm3', 'm4'].map((id) => lay.messages[id]);
    const gaps = rows.slice(1).map((r, i) => r.y - rows[i].y);
    assert.equal(new Set(gaps).size, 1);
    for (const r of rows) assert.ok(r.words && r.words.y + r.words.h / 2 < r.y);
  });

  it('draws a message from its sender to its receiver, and one to itself as a loop to the right', () => {
    const { B, E } = lay.participants;
    assert.deepEqual([lay.messages.m1.points[0].x, lay.messages.m1.points[1].x], [B.x, E.x]);
    assert.deepEqual([lay.messages.m4.points[0].x, lay.messages.m4.points[1].x], [E.x, B.x]);
    const self = layoutSequence(seq('ERP->>ERP: Check stock')).messages.m1;
    assert.equal(self.points.length, 4);
    assert.ok(self.points[1].x > self.points[0].x && self.points[3].y > self.points[0].y);
  });

  it('keeps the words of a long message in the gap beside its sender, off every lifeline', () => {
    const far = layoutSequence(seq('participant B\nparticipant E\nparticipant S\nB->>S: Order direct\nS-->>B: Confirmed'));
    const { B, E, S } = far.participants;
    const out = far.messages.m1.words, back = far.messages.m2.words;
    assert.ok(out && out.x > B.x && out.x + out.w / 2 < E.x);
    assert.ok(back && back.x < S.x && back.x - back.w / 2 > E.x);
  });

  it('stops a line at the bar of an active participant, and stacks a second bar beside the first', () => {
    const l = layoutSequence(seq('B->>+E: Raise\nB->>+E: Hurry\nE-->>-B: Wait\nE-->>-B: Done'));
    const [outer, inner] = l.bars;
    assert.ok(inner.x > outer.x && inner.y > outer.y && inner.y + inner.h < outer.y + outer.h);
    assert.equal(l.messages.m1.points[1].x, outer.x - outer.w / 2);
  });

  it('gives a note a row of its own, beside or over what it is about', () => {
    const l = layoutSequence(seq('participant B\nparticipant E\nB->>E: Raise\nNote right of E: Checks stock\nNote over B,E: Both agree\nNote left of B: Waits'));
    const { B, E } = l.participants;
    assert.ok(l.notes.n1.x - l.notes.n1.w / 2 > E.x);
    assert.ok(l.notes.n2.x - l.notes.n2.w / 2 < B.x && l.notes.n2.x + l.notes.n2.w / 2 > E.x);
    assert.ok(l.notes.n3.x + l.notes.n3.w / 2 < B.x && l.notes.n3.x - l.notes.n3.w / 2 >= across.pad);
    assert.ok(l.notes.n1.y > l.messages.m1.y && l.notes.n2.y > l.notes.n1.y + l.notes.n1.h / 2);
  });

  it('covers the bars a note over a participant lies on wholly, never ending on one', () => {
    // Three bars on Bob reach 15px past his lifeline, past where a note over two stops when he has one.
    const l = layoutSequence(seq('participant A\nparticipant B\nparticipant C\nA->>+B: one\nA->>+B: two\nA->>+B: three\nA->>+B: four\nA->>+B: five\nNote over A,B: Over two\nNote over B: Hi\nNote over B,C: Over Bob and Carol'));
    const outer = Math.max(...l.bars.map((b) => b.x + b.w / 2)), inner = Math.min(...l.bars.map((b) => b.x - b.w / 2));
    const past = across.noteOver - across.bar / 2;
    for (const id of ['n1', 'n2']) assert.ok(l.notes[id].x + l.notes[id].w / 2 >= outer + past, `${id} reaches past the outermost bar`);
    for (const id of ['n2', 'n3']) assert.ok(l.notes[id].x - l.notes[id].w / 2 <= inner - past, `${id} begins before the innermost bar`);
    assert.equal(l.notes.n2.x, l.participants.B.x, 'a note over one is still centred on its lifeline');
  });

  it('frames a block round exactly what is in it, a frame inside a frame clear of it', () => {
    const l = layoutSequence(seq('B->>E: Ask\npar To supplier\nE->>S: Order\nand To buyer\nE->>B: Receipt\nloop Daily\nE->>S: Chase\nend\nend\nB->>E: Thanks'));
    const [par, loop] = l.frames;
    assert.ok(par.y > l.messages.m1.y && par.y + par.h < l.messages.m5.y - 8);
    for (const id of ['m2', 'm3', 'm4']) assert.ok(l.messages[id].y > par.y && l.messages[id].y < par.y + par.h);
    assert.ok(loop.x > par.x && loop.y > par.y && loop.x + loop.w < par.x + par.w && loop.y + loop.h < par.y + par.h);
    assert.equal(par.dividers.length, 1);
    assert.equal(par.dividers[0].label, 'To buyer');
  });

  it('starts a participant made part way down at the message that makes it, and ends one where it is destroyed', () => {
    const l = layoutSequence(seq('Buyer->>ERP: Raise order\ncreate participant Job\nERP->>Job: Start\ndestroy Job\nJob->>ERP: Done\nERP-->>Buyer: Ok'));
    const { Job, ERP } = l.participants;
    assert.equal(Job.y, l.messages.m2.y);
    assert.equal(l.messages.m2.points[1].x, Job.x - Job.w / 2);
    assert.ok(Job.to < ERP.to && Job.to >= l.messages.m3.y);
  });

  it('repeats every participant at the foot of its lifeline, however short the diagram, as Mermaid does', () => {
    const long = layoutSequence(seq(Array.from({ length: 14 }, (_, i) => `A->>B: Message ${i}`).join('\n')));
    assert.equal(long.feet, true);
    assert.equal(lay.feet, true);
    for (const stood of Object.values(lay.participants)) {
      assert.equal(stood.foot, stood.to + stood.h / 2, 'its foot begins where its lifeline ends');
      assert.ok(/** @type {number} */ (stood.foot) + stood.h / 2 <= lay.height - across.pad + 0.5, 'and is inside the picture');
    }
  });

  it('leaves the foot off when the author turned it off, in front matter or in a directive', () => {
    for (const src of ['---\nconfig:\n  sequence:\n    mirrorActors: false\n---\nsequenceDiagram\nA->>B: hi', '%%{init: {"sequence": {"mirrorActors": false}}}%%\nsequenceDiagram\nA->>B: hi']) {
      const m = parseSequence(src), l = layoutSequence(m);
      assert.equal(m.mirror, false, src);
      assert.equal(l.feet, false);
      assert.equal(l.participants.A.foot, null);
    }
    assert.equal(parseSequence('---\nconfig:\n  sequence:\n    mirrorActors: true\n---\nsequenceDiagram\nA->>B: hi').mirror, true);
  });

  it('gives a participant that is ended no foot: its line stopped at the cross', () => {
    const l = layoutSequence(seq('A->>B: Start\ndestroy B\nA-xB: Stop\nA->>A: Carry on'));
    assert.equal(l.participants.B.foot, null);
    assert.notEqual(l.participants.A.foot, null);
  });

  it('leaves room all round, and sizes the drawing to what is in it', () => {
    const l = layoutSequence(seq('participant B\nNote left of B: Waits a long while\nB->>B: Thinks about it at length'));
    const xs = [l.notes.n1.x - l.notes.n1.w / 2, l.messages.m1.words ? l.messages.m1.words.x + l.messages.m1.words.w / 2 : 0];
    assert.ok(xs[0] >= across.pad && xs[1] <= l.width - across.pad);
  });
});

describe('sequence: the rules', () => {
  const check = (/** @type {string} */ body, design = builtIn) => {
    const model = seq(body), lay = layoutSequence(model);
    return { model, lay, result: scoreSequence(model, lay, design) };
  };

  it('passes every rule for what Merlive places itself, in every shape of diagram', () => {
    for (const body of [order, 'B->>+E: Raise\nNote over B,E: Both agree\nloop Daily\nE->>E: Poll\nend\nE-->>-B: Done', 'actor B\nbox Inside\nparticipant E\nparticipant S\nend\nB->>S: Far\nalt Yes\nS-->>B: Ok\nelse No\nS--xB: No\nend']) {
      const { result } = check(body);
      assert.deepEqual(failed(result), [], body);
      assert.deepEqual(result.checks.map((c) => c.id), ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'D1', 'D2']);
    }
  });

  it('S1 when a participant is out of step', () => {
    const { model, lay } = check(order);
    lay.participants.S.x += 30;
    assert.match(scoreSequence(model, lay, builtIn).checks.find((c) => c.id === 'S1')?.detail ?? '', /Supplier stands 30px out of step/);
  });

  it('S2 when two rows share the page or the rhythm breaks', () => {
    const { model, lay } = check(order);
    lay.rows[2].y = lay.rows[1].y + 2;
    assert.ok(failed(scoreSequence(model, lay, builtIn)).includes('S2'));
  });

  it('S3 when words sit on a lifeline or on other words', () => {
    const { model, lay } = check(order);
    const w = lay.messages.m1.words;
    assert.ok(w);
    w.x = lay.participants.E.x;
    assert.match(scoreSequence(model, lay, builtIn).checks.find((c) => c.id === 'S3')?.detail ?? '', /the words "Raise order" sit on the lifeline of ERP/);
  });

  it('S1 when a participant is not the size of the others or out of the row', () => {
    const { model, lay } = check(order);
    lay.participants.E.w += 10;
    lay.participants.S.y += 20;
    const detail = scoreSequence(model, lay, builtIn).checks.find((c) => c.id === 'S1')?.detail ?? '';
    assert.match(detail, /ERP is not the size of the others/);
    assert.match(detail, /Supplier does not stand in the row/);
  });

  it('S3 when the words of two messages overlap, or run off the drawing', () => {
    const { model, lay } = check(order);
    const one = lay.messages.m1.words, two = lay.messages.m2.words;
    assert.ok(one && two);
    Object.assign(two, { x: one.x + one.w / 2 - 4, y: one.y });
    Object.assign(lay.messages.m4.words ?? {}, { x: -40 });
    const detail = scoreSequence(model, lay, builtIn).checks.find((c) => c.id === 'S3')?.detail ?? '';
    assert.match(detail, /the words "Raise order" and "Send order" overlap/);
    assert.match(detail, /the words "Order confirmed" run off the drawing/);
  });

  it('S4 when a frame is not inside the one it belongs to, two frames overlap, or a name sits on a lifeline', () => {
    const { model, lay } = check('A->>B: hi\npar One\nA->>B: a\nloop Inner\nA->>B: b\nend\nend\nopt Later\nA->>B: c\nend');
    const [par, loop, opt] = lay.frames;
    loop.x = par.x - 5;
    opt.y = par.y + 10;
    par.x = lay.participants.A.x - 4;
    const detail = scoreSequence(model, lay, builtIn).checks.find((c) => c.id === 'S4')?.detail ?? '';
    assert.match(detail, /the loop "Inner" is not inside the par "One"/);
    assert.match(detail, /the par "One" and the opt "Later" overlap/);
    assert.match(detail, /the name of the par "One" sits on the lifeline of A/);
  });

  it('S5 when two notes overlap or one runs off the drawing, and S6 when a bar has no length', () => {
    const { model, lay } = check('A->>+B: hi\nNote over A: one\nNote over A: two\nB-->>-A: bye');
    lay.notes.n2.y = lay.notes.n1.y;
    lay.notes.n1.x = -30;
    lay.bars[0].h = 0;
    const result = scoreSequence(model, lay, builtIn);
    const s5 = result.checks.find((c) => c.id === 'S5')?.detail ?? '';
    assert.match(s5, /the note "one" runs off the drawing/);
    lay.notes.n1.x = lay.notes.n2.x;
    assert.match(scoreSequence(model, lay, builtIn).checks.find((c) => c.id === 'S5')?.detail ?? '', /the notes "one" and "two" overlap/);
    assert.match(result.checks.find((c) => c.id === 'S6')?.detail ?? '', /a bar on B has no length/);
  });

  it('S7 when a message has a word too long for its gap, or a name needs too many lines', () => {
    const word = check(`A->>B: ${'x'.repeat(60)}`).result.checks.find((c) => c.id === 'S7');
    assert.match(word?.detail ?? '', /the message ".*" has a word too long for the gap it sits in; break it with <br\/> or shorten it/);
    const name = check('participant A as one<br/>two<br/>three<br/>four<br/>five\nA->>B: hi').result.checks.find((c) => c.id === 'S7');
    assert.match(name?.detail ?? '', /"one two three four five" needs 5 lines/);
  });

  it('S4 when a frame does not hold what is in it', () => {
    const { model, lay } = check('B->>E: Ask\nloop Daily\nE->>B: Tell\nend');
    lay.frames[0].h = 10;
    assert.match(scoreSequence(model, lay, builtIn).checks.find((c) => c.id === 'S4')?.detail ?? '', /the loop "Daily" does not hold "Tell"/);
  });

  it('S5 when a note sits on a message', () => {
    const { model, lay } = check('B->>E: Ask\nNote over B,E: Both agree');
    lay.notes.n1.y = lay.messages.m1.y;
    assert.ok(failed(scoreSequence(model, lay, builtIn)).includes('S5'));
  });

  it('S5 when a note ends on a bar, half covering it', () => {
    const { model, lay, result } = check('A->>+B: one\nA->>+B: two\nA->>+B: three\nNote over A,B: Over two\nB-->>-A: a\nB-->>-A: b\nB-->>-A: c');
    assert.deepEqual(failed(result), []);
    const note = lay.notes.n1, bar = lay.bars[2];
    note.w = 2 * (bar.x - note.x);
    assert.match(scoreSequence(model, lay, builtIn).checks.find((c) => c.id === 'S5')?.detail ?? '', /the note "Over two" ends on a bar of B/);
  });

  it('passes S5 for notes beside and over a participant whose neighbour carries a stack of bars', () => {
    // The gap is wide enough for a note and for the bars it faces: a neighbour's stack reaches toward it.
    const five = (/** @type {string} */ m) => Array(5).fill(m).join('\n');
    for (const body of [
      `participant A\nparticipant B\n${five('B->>+A: x')}\nNote left of B: Needs stock approval today`,
      `participant A\nparticipant B\nparticipant C\n${five('A->>+B: x')}\nNote right of B: Needs stock approval today`,
      `participant A\nparticipant B\n${five('B->>+A: x')}\n${five('B->>+A: x')}\nNote over B: Needs stock approval today`,
      `participant A\nparticipant B\nparticipant C\n${five('B->>+C: x')}\n${five('C->>+B: x')}\nNote over B: Needs stock approval today`,
      `participant A\nparticipant B\nparticipant C\n${Array(12).fill('A->>+B: x').join('\n')}\nC->>+C: y\nNote over A,B: Both`,
    ]) assert.deepEqual(failed(check(body).result), [], body);
    // Beside a participant at work, the note starts past its stack and still ends clear of the next lifeline.
    const { lay } = check(`participant A\nparticipant B\nparticipant C\n${five('A->>+B: x')}\nNote right of B: Needs stock approval today`);
    assert.ok(lay.notes.n1.x + lay.notes.n1.w / 2 <= lay.participants.C.x - across.clear, 'clear of C');
  });

  it('S6 when two bars of one participant lie on each other', () => {
    const { model, lay } = check('B->>+E: Raise\nB->>+E: Hurry\nE-->>-B: Wait\nE-->>-B: Done');
    lay.bars[1].x = lay.bars[0].x;
    assert.ok(failed(scoreSequence(model, lay, builtIn)).includes('S6'));
  });

  it('S7 when a name or a word is too long for its place, and says what to do', () => {
    const name = check('participant A as Pneumonoultramicroscopicsilicovolcanoconiosis\nA->>B: hi').result.checks.find((c) => c.id === 'S7');
    assert.match(name?.detail ?? '', /has a word too long for a participant/);
    const note = check(`Note over A: ${'several words that go on '.repeat(12)}\nA->>B: hi`).result.checks.find((c) => c.id === 'S7');
    assert.match(note?.detail ?? '', /the note ".*" needs \d+ lines; shorten it/);
  });

  it('D1 when the design cannot be read', () => {
    const faint = designFrom({ name: 'faint', light: { muted: '#e3e6ea', edge: '#eef0f2' } });
    assert.equal(check(order, faint).result.checks.find((c) => c.id === 'D1')?.ok, false);
  });
});

describe('sequence: the drawing', () => {
  const model = seq(`autonumber\nactor B as Buyer\nparticipant E as ERP <test>\nB->>+E: Raise & send\nNote right of E: Checks "stock"\nloop Daily\nE-xE: Poll\nend\nE--)-B: Done`);
  const lay = layoutSequence(model);

  it('is one SVG that reads on its own, every word escaped', () => {
    const svg = sequencePicture(model, lay, builtIn, { title: 'Ordering <calls>' });
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" class="mv-svg"/);
    assert.match(svg, /<title>Ordering &lt;calls&gt;<\/title>/);
    assert.ok(svg.includes('ERP &lt;test&gt;') && svg.includes('Raise &amp; send') && svg.includes('Checks &quot;stock&quot;'));
    assert.ok(!svg.includes('<script') && !/url\((?!#)/.test(svg));
    assert.equal(svg.match(/class="mv-life"/g)?.length, 2);
    assert.equal(svg.match(/data-edge="m\d"/g)?.length, 3);
    assert.equal(svg.match(/class="mv-bar"/g)?.length, 1);
    assert.match(svg, /class="mv-frame" data-kind="loop"/);
    assert.match(svg, /class="mv-note"/);
    assert.equal(svg.match(/class="mv-num"/g)?.length, 3);
  });

  it('draws each end of a message as it was written: an arrowhead, an open one, a cross', () => {
    const svg = sequencePicture(model, lay, builtIn, { title: 'Ends' });
    const one = (/** @type {string} */ id) => svg.match(new RegExp(`<g class="mv-edge[^"]*" data-edge="${id}"[^]*?</g>`))?.[0] ?? '';
    assert.match(one('m1'), /<polygon class="mv-head"/);
    assert.match(one('m2'), /class="mv-cross"/);
    assert.match(one('m3'), /class="mv-open"/);
    assert.match(one('m3'), /data-style="dotted"/);
  });

  it('is a page a reader can step through, with nothing fetched', () => {
    const html = sequencePage(model, lay, builtIn, { title: 'Ordering', source: 'sequenceDiagram\n  A->>B: </script>', version: '0.1.0' });
    assert.match(html, /^<!doctype html>/);
    assert.ok(html.includes('id="mv-next"') && html.includes('id="mv-prev"') && html.includes('id="mv-clear"'));
    assert.ok(html.includes('id="mermaid-source"') && html.includes('&lt;/script&gt;'));
    assert.ok(!/<link|src=|url\((?!#)|@import/.test(html));
    assert.equal(html.match(/<\/script>/g)?.length, 1);
    assert.match(html, /role="button" aria-label="Message 1, Buyer to ERP &lt;test&gt;: Raise &amp; send"/);
  });

  it('leaves the steps and the legend out when the design says so, and draws dark alone when asked', () => {
    const plain = sequencePage(model, lay, designFrom({ output: { steps: false, legend: false, source: false }, modes: 'dark' }), { title: 'Plain', source: '', version: '0.1.0' });
    assert.ok(!plain.includes('id="mv-next"') && !plain.includes('class="mv-legend"') && !plain.includes('id="mermaid-source"'));
    assert.ok(!plain.includes('prefers-color-scheme:dark'));
  });
});

describe('sequence: a title its author gave the picture', () => {
  it('is drawn above the still picture, from the diagram or from its front matter', () => {
    for (const src of ['sequenceDiagram\n  title Placing an order\n  A->>B: Order', '---\ntitle: Placing an order\n---\nsequenceDiagram\n  A->>B: Order']) {
      const m = parseSequence(src), lay = layoutSequence(m);
      assert.equal(m.title, 'Placing an order');
      const svg = sequencePicture(m, lay, builtIn, { title: 'x' });
      assert.match(svg, /<text class="mv-title"[^>]*><tspan[^>]*>Placing an order<\/tspan><\/text>/);
      assert.ok(Number(/viewBox="0 0 \d+ (\d+)"/.exec(svg)?.[1]) > lay.height);
    }
  });
});

describe('sequence: who a participant is, drawn', () => {
  const types = 'participant Shop@{ "type": "boundary" }\nparticipant Rules@{ "type": "control" }\nparticipant Order@{ "type": "entity" }\nparticipant Orders@{ "type": "database" }\nparticipant Lines@{ "type": "collections" }\nparticipant Jobs@{ "type": "queue" }\nactor Buyer\nparticipant ERP\nBuyer->>Shop: Order\nShop->>ERP: Pass on';

  it('reads each kind of participant as a shape of its own', () => {
    assert.deepEqual(seq(types).participants.map((p) => p.shape), ['boundary', 'control', 'entity', 'database', 'collections', 'queue', 'person', 'box']);
  });

  it('keeps one footprint for all of them, tall enough for a mark with its name under it', () => {
    const m = seq(types), l = layoutSequence(m);
    assert.ok(l.head.h >= across.mark + across.markGap + across.headLine + across.markFoot);
    for (const p of m.participants) assert.deepEqual([l.participants[p.id].w, l.participants[p.id].h], [l.head.w, l.head.h], p.id);
    // A plain diagram is no taller for marks it does not have.
    assert.equal(layoutSequence(seq(order)).head.h, across.headPad + across.headLine);
  });

  it('draws a person as a figure with the name beneath, not as a box', () => {
    const m = seq('actor Buyer\nparticipant ERP\nBuyer->>ERP: Order'), l = layoutSequence(m);
    const svg = sequencePicture(m, l, builtIn, { title: 't' });
    const buyer = /<g class="mv-node" data-node="Buyer"[^>]*data-mark="person"[^>]*>(.*?)<\/g>/.exec(svg)?.[1] ?? '';
    assert.match(buyer, /<circle class="mv-shape"/);
    assert.match(buyer, /<path class="mv-mark"/);
    assert.doesNotMatch(buyer, /<rect/);
    // The name is under the figure: below the middle of the footprint, and above its foot, where the lifeline starts.
    const stood = l.participants.Buyer, y = Number(/<tspan x="[\d.]+" y="([\d.]+)">Buyer</.exec(buyer)?.[1]);
    assert.ok(y > stood.y && y < stood.y + stood.h / 2, `${y} in ${stood.y}..${stood.y + stood.h / 2}`);
    assert.equal(stood.from, stood.y + stood.h / 2);
  });

  it('gives every typed participant a drawing no other has', () => {
    const m = seq(types), svg = sequencePicture(m, layoutSequence(m), builtIn, { title: 't' });
    const drawn = m.participants.map((p) => (new RegExp(`<g class="mv-node" data-node="${p.id}"[^>]*>(.*?)<text>`).exec(svg)?.[1] ?? '').replace(/[\d.]+/g, '#'));
    assert.equal(new Set(drawn).size, drawn.length, 'eight participants, eight outlines');
    for (const id of ['Shop', 'Rules', 'Order', 'Orders']) assert.match(svg, new RegExp(`data-node="${id}"[^>]*data-mark=`), `${id} has its name under its mark`);
    for (const id of ['Lines', 'Jobs', 'ERP']) assert.doesNotMatch(svg, new RegExp(`data-node="${id}"[^>]*data-mark=`), `${id} has its name inside`);
  });

  it('draws each again at the foot, the same drawing, and says what each is to a reader who cannot see it', () => {
    const m = seq(types), l = layoutSequence(m);
    const svg = sequencePicture(m, l, builtIn, { title: 't' });
    for (const p of m.participants) assert.equal(svg.split(`data-node="${p.id}"`).length - 1, 2, p.id);
    const page = sequencePage(m, l, builtIn, { title: 't', source: 's', version: '0' });
    for (const [name, what] of [['Buyer', 'a person'], ['Shop', 'a boundary'], ['Rules', 'a control'], ['Order', 'an entity'], ['Orders', 'a database'], ['Lines', 'a collection'], ['Jobs', 'a queue'], ['ERP', 'a participant']]) assert.match(page, new RegExp(`aria-label="${name}, ${what}"`));
    // One of the two is what the keyboard reaches; a pointer may pick either.
    assert.equal(page.split('aria-label="Buyer, a person"').length - 1, 1);
    // The foot is the same participant again: a screen reader hears it once, at its head.
    for (const p of m.participants) {
      const drawn = [...page.matchAll(new RegExp(`<g class="mv-node" data-node="${p.id}"[^>]*>`, 'g'))].map(([g]) => g);
      assert.equal(drawn.length, 2, p.id);
      assert.doesNotMatch(drawn[0], /aria-hidden/, `${p.id}: its head`);
      assert.match(drawn[1], /aria-hidden="true"/, `${p.id}: its foot`);
    }
  });

  it('passes its rules with every kind of participant, one made part way down, and a foot on each', () => {
    for (const body of [types, 'actor Buyer\nBuyer->>ERP: Order\ncreate actor Clerk\nERP->>Clerk: Ask\nClerk-->>ERP: Yes', 'participant Q@{ "type": "queue" } as A long queue name here\nparticipant C@{ "type": "collections" } as Lines of orders\nQ->>C: Go']) {
      const model = seq(body), l = layoutSequence(model);
      assert.deepEqual(failed(scoreSequence(model, l, builtIn)), [], body);
    }
  });

  it('brings a message to the mark of a person made part way down, not to the edge of an empty footprint', () => {
    const m = seq('participant ERP\nERP->>ERP: Think\ncreate actor Clerk\nERP->>Clerk: Ask'), l = layoutSequence(m);
    const clerk = l.participants.Clerk, sent = l.messages.m2;
    assert.equal(sent.y, clerk.y - clerk.h / 2 + across.mark / 2, 'the line meets the middle of the figure');
    assert.equal(sent.points[1].x, clerk.x - across.markHalf);
  });

  it('holds a foot to the rule: a foot that sits on the last message is a fault', () => {
    const model = seq(order), l = layoutSequence(model);
    for (const stood of Object.values(l.participants)) stood.foot = /** @type {number} */ (stood.foot) - 60;
    assert.match(scoreSequence(model, l, builtIn).checks[0].detail, /is drawn again at the foot over the last row/);
  });
});

describe('sequence: half arrows and messages to the middle of a line', () => {
  it('reads every half arrow, solid and dotted, and keeps which half it is', () => {
    const m = seq('A-|\\B: a\nA--|\\B: b\nA-|/B: c\nA--|/B: d\nA-\\\\B: e\nA--\\\\B: f\nA-//B: g\nA--//B: h');
    assert.deepEqual(m.warnings, []);
    assert.deepEqual(messages(m).map((x) => [x.from, x.to, x.style, x.head, x.tail]), [
      ['A', 'B', 'solid', 'half-top', 'none'], ['A', 'B', 'dotted', 'half-top', 'none'], ['A', 'B', 'solid', 'half-bottom', 'none'], ['A', 'B', 'dotted', 'half-bottom', 'none'],
      ['A', 'B', 'solid', 'stick-top', 'none'], ['A', 'B', 'dotted', 'stick-top', 'none'], ['A', 'B', 'solid', 'stick-bottom', 'none'], ['A', 'B', 'dotted', 'stick-bottom', 'none'],
    ]);
  });

  it('reads a reversed half arrow as Mermaid draws it: a line back to the one named first, the same side up', () => {
    const m = seq('A/|-B: a\nA\\|--B: b\nA//-B: c\nA\\\\--B: d');
    assert.deepEqual(m.warnings, []);
    assert.deepEqual(m.participants.map((p) => p.id), ['A', 'B'], 'the one named first still stands first');
    // Above the line when read from A to B is the right-hand side of a line that travels from B to A.
    assert.deepEqual(messages(m).map((x) => [x.from, x.to, x.style, x.head]), [['B', 'A', 'solid', 'half-bottom'], ['B', 'A', 'dotted', 'half-top'], ['B', 'A', 'solid', 'stick-bottom'], ['B', 'A', 'dotted', 'stick-top']]);
  });

  it('draws half of an arrowhead on the side its author chose, and a stick as one stroke', () => {
    const m = seq('A-|\\B: top\nA-|/B: bottom\nA-\\\\B: stick\nB-|/A: back'), l = layoutSequence(m);
    const svg = sequencePicture(m, l, builtIn, { title: 't' });
    const head = (/** @type {string} */ id) => new RegExp(`data-edge="${id}"[^>]*><path class="mv-line"[^>]*/>(<[a-z]+ class="mv-(?:head|open)" points="([^"]+)"/>)`).exec(svg) ?? [];
    const ys = (/** @type {string} */ id) => head(id)[2].split(' ').map((pt) => Number(pt.split(',')[1]));
    const line = (/** @type {string} */ id) => l.messages[id].y;
    assert.ok(Math.min(...ys('m1')) < line('m1') && Math.max(...ys('m1')) <= line('m1') + 0.1, 'top: above a line that goes right');
    assert.ok(Math.max(...ys('m2')) > line('m2') && Math.min(...ys('m2')) >= line('m2') - 0.1, 'bottom: below a line that goes right');
    assert.match(head('m3')[1], /^<polyline class="mv-open"/);
    assert.equal(head('m3')[2].split(' ').length, 2, 'a stick is one stroke');
    assert.ok(Math.min(...ys('m4')) < line('m4'), 'bottom, on a line that goes left, is above it: Mermaid turns the head with the line');
  });

  it('reads a message to or from the middle of a line, and keeps which end has the dot', () => {
    const m = seq('participant Buyer\nparticipant ERP\nBuyer->>()ERP: Raise order\nBuyer()->>ERP: Chase it\nERP()->>()Buyer: Done');
    assert.deepEqual(m.warnings, []);
    assert.deepEqual(m.participants.map((p) => p.id), ['Buyer', 'ERP']);
    assert.deepEqual(messages(m).map((x) => [x.from, x.to, x.label, Boolean(x.tailDot), Boolean(x.headDot)]), [['Buyer', 'ERP', 'Raise order', false, true], ['Buyer', 'ERP', 'Chase it', true, false], ['ERP', 'Buyer', 'Done', true, true]]);
  });

  it('draws the dot on the lifeline, the arrowhead short of it, and the line from dot to dot', () => {
    const m = seq('participant Buyer\nparticipant ERP\nBuyer->>+ERP: Start\nBuyer->>()ERP: Raise order\nERP()->>()Buyer: Done'), l = layoutSequence(m);
    const svg = sequencePicture(m, l, builtIn, { title: 't' });
    // The middle of the line, even when the participant is at work and a plain message would stop at its bar.
    assert.equal(l.messages.m2.points[1].x, l.participants.ERP.x);
    assert.notEqual(l.messages.m1.points[1].x, l.participants.ERP.x);
    const edge = (/** @type {string} */ id) => new RegExp(`<g class="mv-edge" data-edge="${id}".*?</g>`).exec(svg)?.[0] ?? '';
    const dots = (/** @type {string} */ id) => [...edge(id).matchAll(/<circle class="mv-head mv-dot" cx="([\d.]+)" cy="([\d.]+)"/g)].map((d) => [Number(d[1]), Number(d[2])]);
    assert.deepEqual(dots('m1'), []);
    assert.deepEqual(dots('m2'), [[l.participants.ERP.x, l.messages.m2.y]]);
    assert.deepEqual(dots('m3').map((d) => d[0]).sort((a, b) => a - b), [l.participants.Buyer.x, l.participants.ERP.x]);
    const tip = Math.max(...(/<polygon class="mv-head" points="([^"]+)"/.exec(edge('m2'))?.[1] ?? '').split(' ').map((pt) => Number(pt.split(',')[0])));
    assert.ok(tip < l.participants.ERP.x - 3 && tip > l.participants.ERP.x - 8, `the arrowhead stops at the dot's edge: ${tip}`);
  });

  it('never drops a message: every line of both corpus samples is a message in the picture', () => {
    for (const body of ['Buyer-|\\ERP: Top half\nERP--|/Buyer: Bottom half\nBuyer-\\\\ERP: Top stick\nERP--//Buyer: Bottom stick', 'participant Buyer\nparticipant ERP\nBuyer->>()ERP: Raise order\nBuyer()->>ERP: Chase it\nERP()->>()Buyer: Done']) {
      const model = seq(body), l = layoutSequence(model);
      assert.equal(messages(model).length, body.split('\n').filter((x) => x.includes(':')).length);
      assert.deepEqual(failed(scoreSequence(model, l, builtIn)), [], body);
    }
  });
});

describe('sequence: the title of a group of participants', () => {
  const grouped = 'box Aqua Buying\nparticipant B as Buyer\nparticipant E as ERP\nend\nbox rgb(33,66,99)\nparticipant W as Warehouse\nend\nbox Outside the firm\nparticipant S as Supplier\nend\nB->>E: Raise order\nE->>W: Check stock\nE->>S: Send order';
  const inside = (/** @type {{x:number,y:number,w:number,h:number}} */ name, /** @type {{x:number,y:number,w:number,h:number}} */ g) => name.x - name.w / 2 >= g.x && name.x + name.w / 2 <= g.x + g.w && name.y - name.h / 2 >= g.y && name.y + name.h / 2 <= g.y + g.h;

  it('sits inside its frame, above its participants, and a group with no title has none', () => {
    const m = seq(grouped), l = layoutSequence(m);
    assert.deepEqual(l.groups.map((g) => g.name?.lines.join(' ') ?? null), ['Buying', null, 'Outside the firm']);
    for (const g of l.groups) {
      if (!g.name) continue;
      assert.ok(inside(g.name, g), g.title);
      assert.ok(g.name.y + g.name.h / 2 <= l.participants.B.y - l.participants.B.h / 2, 'clear of the participants');
      assert.ok(g.name.x - g.name.w / 2 >= 0 && g.name.x + g.name.w / 2 <= l.width, 'inside the picture');
    }
  });

  it('wraps a title wider than its frame, and makes the row of titles as tall as the longest needs', () => {
    const m = seq(grouped), l = layoutSequence(m);
    const outside = l.groups[2];
    assert.ok((outside.name?.lines.length ?? 0) > 1, 'three words over one narrow participant take more than a line');
    assert.equal(l.groups[0].y, outside.y, 'every group starts at the same height');
    assert.deepEqual(failed(scoreSequence(m, l, builtIn)), []);
  });

  it('makes every participant wide enough for the longest word of a title no wrapping can help', () => {
    const m = seq('box Counterparties\nparticipant S\nend\nparticipant B\nS->>B: hi'), l = layoutSequence(m);
    assert.ok(l.head.w > across.widths[0]);
    assert.ok(inside(/** @type {NonNullable<typeof l.groups[0]['name']>} */ (l.groups[0].name), l.groups[0]));
    assert.deepEqual(failed(scoreSequence(m, l, builtIn)), []);
  });

  it('says so when a word of a title is too long for any frame, and when a title is moved out of its frame', () => {
    const long = seq('box Supercalifragilisticexpialidocious\nparticipant S\nend\nS->>S: hi');
    assert.match(scoreSequence(long, layoutSequence(long), builtIn).checks.find((c) => c.id === 'S7')?.detail ?? '', /the title "Supercalifragilisticexpialidocious" has a word too long for its group/);
    const m = seq(grouped), l = layoutSequence(m);
    /** @type {NonNullable<typeof l.groups[0]['name']>} */ (l.groups[0].name).y -= 40;
    assert.match(scoreSequence(m, l, builtIn).checks.find((c) => c.id === 'S7')?.detail ?? '', /the title "Buying" is not inside its group/);
  });

  it("is drawn in the design's quiet text colour, in the still picture as on the page, in light and in dark", () => {
    const m = seq(grouped), l = layoutSequence(m);
    const svg = sequencePicture(m, l, builtIn, { title: 't' });
    assert.match(svg, /<text class="mv-group-name">(<tspan [^>]*>[^<]+<\/tspan>)+<\/text>/);
    assert.match(svg, /\.mv-group-name\{[^}]*fill:var\(--mv-muted\)/);
    assert.match(sequencePage(m, l, builtIn, { title: 't', source: 's', version: '0' }), /\.mv-group-name\{[^}]*fill:var\(--mv-muted\)/);
    // No words in the drawing are left to the colour a browser gives text that was given none.
    assert.doesNotMatch(svg, /<g class="mv-group">(?:(?!<\/g>).)*<text>/, 'a title with no class of its own is black, whatever the page');
  });

  it("holds that colour to the rule: quiet text on a group's own fill must be readable", () => {
    const m = seq(grouped), l = layoutSequence(m);
    const faint = designFrom({ name: 'Faint', light: { ...builtIn.light, muted: '#dfe9e7' } });
    const d1 = scoreSequence(m, l, faint).checks.find((c) => c.id === 'D1');
    assert.match(d1?.detail ?? '', /the title of a group/);
    const plain = seq(order);
    assert.doesNotMatch(scoreSequence(plain, layoutSequence(plain), faint).checks.find((c) => c.id === 'D1')?.detail ?? '', /the title of a group/);
  });
});
