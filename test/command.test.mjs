import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { exits, help, optionsFrom, run } from '../skills/merlive/scripts/merlive.mjs';

// The command run for real, into a temporary folder: nothing is written into the repository.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const example = join(root, 'examples/order-approval.md');
const temp = () => mkdtempSync(join(tmpdir(), 'merlive-'));
const go = (/** @type {string[]} */ argv, cwd = temp()) => {
  /** @type {string[]} */
  const said = [];
  const code = run(argv, { cwd, say: (line) => said.push(line) });
  return { code, said, text: said.join('\n'), cwd };
};

describe('options', () => {
  it('reads each option', () => {
    assert.deepEqual(optionsFrom(['a.md', '--out', 'o', '--design', 'd.json', '--format', 'svg', '--only', '2', '--check', '--force']), {
      file: 'a.md', out: 'o', design: 'd.json', format: 'svg', only: 2, check: true, force: true, help: false,
    });
  });

  it('refuses what it does not know, with what to do', () => {
    assert.throws(() => optionsFrom(['--nope']), /There is no option --nope\. Run with --help/);
    assert.throws(() => optionsFrom(['--out']), /--out needs a value/);
    assert.throws(() => optionsFrom(['--out', '--check']), /--out needs a value/);
    assert.throws(() => optionsFrom(['--format', 'png']), /--format is html or svg/);
    assert.throws(() => optionsFrom(['--only', '0']), /counting from 1/);
    assert.throws(() => optionsFrom(['a.md', 'b.md']), /One file at a time/);
  });

  it('says every option in --help', () => {
    for (const option of ['--out', '--design', '--format', '--only', '--check', '--force', '--help']) assert.ok(help.includes(option), option);
    assert.equal(go(['--help']).text, help);
  });
});

describe('the command', () => {
  it('draws each flowchart as a page, and leaves and names what is not one', () => {
    const out = temp();
    const { code, text } = go([example, '--out', out]);
    assert.equal(code, exits.drawn);
    assert.match(text, /drew .*order-approval-1\.html \(8 boxes, 9 links, 0 crossings, merlive design\)/);
    assert.match(text, /left as Mermaid: block 3 \(line \d+\) is a sequenceDiagram/);
    const page = readFileSync(join(out, 'order-approval-1.html'), 'utf8');
    assert.match(page, /<title>Purchase order approval<\/title>/);
    assert.ok(page.includes('Revise order'));
    assert.equal(existsSync(join(out, 'order-approval-3.html')), false);
  });

  it('writes a page that fetches nothing and carries its source', () => {
    const out = temp();
    go([example, '--out', out]);
    const page = readFileSync(join(out, 'order-approval-1.html'), 'utf8');
    assert.doesNotMatch(page, /(src|href)="https?:/);
    assert.doesNotMatch(page, /@import|url\(/);
    assert.ok(page.includes('id="mermaid-source"'));
    assert.ok(page.includes('C --&gt;|Yes| D[Manager approval]'), 'the Mermaid, as written');
  });

  it('writes a still picture with --format svg', () => {
    const out = temp();
    assert.equal(go([example, '--out', out, '--format', 'svg', '--only', '2']).code, exits.drawn);
    const svg = readFileSync(join(out, 'order-approval-2.svg'), 'utf8');
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.doesNotMatch(svg, /<script/);
    assert.equal(existsSync(join(out, 'order-approval-1.svg')), false);
  });

  it('writes nothing with --check', () => {
    const out = temp();
    const { code, text } = go([example, '--out', out, '--check']);
    assert.equal(code, exits.drawn);
    assert.match(text, /would draw order-approval-1\.html/);
    assert.equal(existsSync(join(out, 'order-approval-1.html')), false);
  });

  it('puts the diagrams beside the file when no folder is named', () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'flow.mmd'), 'flowchart TD\nA[One] --> B[Two]\n');
    assert.equal(go(['flow.mmd'], cwd).code, exits.drawn);
    assert.ok(existsSync(join(cwd, 'diagrams/flow-1.html')));
  });

  it('does not write a diagram that breaks a rule, names the rule, and ends with 1', () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'long.mmd'), `flowchart TD\nA[${'far too many words '.repeat(8)}] --> B\n`);
    const { code, text } = go(['long.mmd'], cwd);
    assert.equal(code, exits.brokeARule);
    assert.match(text, /not drawn: block 1 \(line 1\) breaks 1 of its rules\n {2}P6 Words fit their box: /);
    assert.equal(existsSync(join(cwd, 'diagrams/long-1.html')), false);
    const forced = go(['long.mmd', '--force'], cwd);
    assert.equal(forced.code, exits.drawn);
    assert.match(forced.text, /drawn anyway/);
    assert.ok(existsSync(join(cwd, 'diagrams/long-1.html')));
  });

  it('passes on what the Mermaid held that it read past', () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'sub.mmd'), 'flowchart TD\nsubgraph one\nA --> B\nend\n');
    assert.match(go(['sub.mmd', '--check'], cwd).text, /note, block 1: line 2: subgraph boxes are not drawn yet/);
  });
});

describe('the command: the design', () => {
  it("draws in Merlive's own look when the folder has no design file", () => {
    assert.match(go([example, '--check']).text, /merlive design/);
  });

  it("uses the folder's own design file when there is one, by its name", () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'merlive.design.json'), JSON.stringify({ name: 'storm', light: { accent: '#0a5cc2' } }));
    const { code, text } = go([example, '--check'], cwd);
    assert.equal(code, exits.drawn);
    assert.match(text, /storm design/);
  });

  it('uses a design file named by --design, before the folder\'s own', () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'merlive.design.json'), JSON.stringify({ name: 'storm' }));
    writeFileSync(join(cwd, 'mine.json'), JSON.stringify({ radius: 0 }));
    assert.match(go([example, '--check', '--design', 'mine.json'], cwd).text, /your design/);
  });

  it('does not draw in a design whose words cannot be read', () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'merlive.design.json'), JSON.stringify({ light: { text: '#eeeeee' } }));
    const { code, text } = go([example, '--check'], cwd);
    assert.equal(code, exits.brokeARule);
    assert.match(text, /D1 Words and lines can be read/);
  });

  it('does not draw in a design whose kinds of box cannot be told apart', () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'merlive.design.json'), JSON.stringify({ light: { kinds: { rework: '#2c7d4f' } } }));
    const { code, text } = go([example, '--check', '--only', '1'], cwd);
    assert.equal(code, exits.brokeARule);
    assert.match(text, /D2 Kinds of box can be told apart: light: terminal and rework boxes look alike/);
  });
});

describe('the command: what is missing ends with 2, nothing to draw with 3', () => {
  it('says what is missing and what to do', () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'bad.json'), '{');
    for (const [argv, words] of /** @type {[string[], RegExp][]} */ ([
      [[], /Which file\?/],
      [['nowhere.md'], /No file at .*nowhere\.md/],
      [[example, '--design', 'nowhere.json'], /No design file at .*nowhere\.json\./],
      [[example, '--design', 'bad.json'], /bad\.json is not valid JSON/],
      [[example, '--frmat', 'svg'], /There is no option --frmat/],
    ])) {
      const { code, text } = go(argv, cwd);
      assert.equal(code, exits.missing, argv.join(' '));
      assert.match(text, words);
    }
  });

  it('ends with 3 for a file with no flowchart', () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'plain.md'), '# Nothing\n\n```mermaid\nsequenceDiagram\nA->>B: hi\n```\n\n```mermaid\nflowchart TD\n```\n');
    const { code, text } = go(['plain.md'], cwd);
    assert.equal(code, exits.nothingToDraw);
    assert.match(text, /block 2 \(line 8\) has no boxes/);
    assert.match(text, /Nothing to draw: plain\.md has no Mermaid flowchart\./);
    assert.match(go([example, '--only', '9']).text, /at block 9/);
  });
});
