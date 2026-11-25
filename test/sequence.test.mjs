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
    assert.deepEqual(m.participants.map((p) => [p.label, p.role, p.kind, p.shape]), [['Buyer', 'actor', 'external', 'pill'], ['Orders', 'database', 'data', 'box'], ['Jobs', 'queue', 'step', 'box']]);
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
    const m = seq('A->>B: hi\nA-|\\B: half\nA->>()B: central\nwibble wobble\nB-->>A: bye');
    assert.match(m.warnings[0], /^line 3: half arrows are not read yet/);
    assert.match(m.warnings[1], /^line 4: a message to the middle of a line, written with \(\), is not read yet/);
    assert.match(m.warnings[2], /^line 5: not read: "wibble wobble"/);
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

  it('repeats the participants at the foot of a long diagram, and not of a short one', () => {
    const long = layoutSequence(seq(Array.from({ length: 14 }, (_, i) => `A->>B: Message ${i}`).join('\n')));
    assert.equal(long.feet, true);
    assert.equal(lay.feet, false);
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
