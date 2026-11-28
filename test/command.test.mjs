import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { exits, help, optionsFrom, run } from '../skills/merlive/scripts/merlive.mjs';

// The command run for real, into a temporary folder: nothing is written into the repository.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const example = join(root, 'examples/order-approval.md');
const temp = () => mkdtempSync(join(tmpdir(), 'merlive-'));
const go = async (/** @type {string[]} */ argv, cwd = temp()) => {
  /** @type {string[]} */
  const said = [];
  const code = await run(argv, { cwd, say: (line) => said.push(line) });
  return { code, said, text: said.join('\n'), cwd };
};
const put = (/** @type {string} */ cwd, /** @type {string} */ path, /** @type {string} */ text) => {
  mkdirSync(dirname(join(cwd, path)), { recursive: true });
  writeFileSync(join(cwd, path), text);
};
const json = (/** @type {string} */ path) => JSON.parse(readFileSync(path, 'utf8'));
/** A site on this machine, for as long as one test needs it. */
const serve = async (/** @type {Record<string,[string,string]>} */ pages, /** @type {(base:string)=>Promise<void>} */ during) => {
  const server = createServer((req, res) => {
    const page = pages[req.url ?? ''];
    res.writeHead(page ? 200 : 404, { 'content-type': page?.[0] ?? 'text/plain' }).end(page?.[1] ?? 'no');
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', () => done(undefined)));
  try {
    await during(`http://127.0.0.1:${/** @type {import('node:net').AddressInfo} */ (server.address()).port}`);
  } finally {
    server.close();
  }
};

const siteCss = `:root{--paper:#ffffff;--ink:#000000;--mark:#ffc400;--font:'Atkinson Hyperlegible', system-ui, sans-serif}
@media (prefers-color-scheme: dark){:root{--paper:#1c1c1c;--ink:#e6e6e6}}
body{background:var(--paper);color:var(--ink);font-family:var(--font)}`;
const flowMd = '# Flow\n\n```mermaid\nflowchart TD\nA([Start]) --> B{Ready?}\nB -->|Yes| C[Go]\nB -->|No| A\n%% step: All | A>B>C | Through.\n```\n';

describe('options', () => {
  it('reads each option', () => {
    assert.deepEqual(optionsFrom(['a.md', '--out', 'o', '--design', 'd.json', '--format', 'svg', '--only', '2', '--check', '--force']), {
      file: 'a.md', out: 'o', design: 'd.json', format: 'svg', only: 2, check: true, force: true, help: false, setup: false, from: '',
    });
    assert.deepEqual(optionsFrom(['--setup', '--from', 'https://a.example']), {
      file: '', out: '', design: '', format: '', only: 0, check: false, force: false, help: false, setup: true, from: 'https://a.example',
    });
  });

  it('refuses what it does not know, with what to do', () => {
    assert.throws(() => optionsFrom(['--nope']), /There is no option --nope\. Run with --help/);
    assert.throws(() => optionsFrom(['--out']), /--out needs a value/);
    assert.throws(() => optionsFrom(['--out', '--check']), /--out needs a value/);
    assert.throws(() => optionsFrom(['--format', 'png']), /--format is html, svg or both/);
    assert.throws(() => optionsFrom(['--only', '0']), /counting from 1/);
    assert.throws(() => optionsFrom(['a.md', 'b.md']), /One file at a time/);
  });

  it('says every option in --help', async () => {
    for (const option of ['--setup', '--from', '--out', '--design', '--format', '--only', '--check', '--force', '--help']) assert.ok(help.includes(option), option);
    assert.equal((await go(['--help'])).text, help);
  });
});

describe('the command', () => {
  it('draws each flowchart and each sequence diagram as a page', async () => {
    const out = temp();
    const { code, text } = await go([example, '--out', out]);
    assert.equal(code, exits.drawn);
    assert.match(text, /drew .*order-approval-1\.html \(8 boxes, 9 links, 0 crossings, merlive design\)/);
    assert.match(text, /drew .*order-approval-3\.html \(3 participants, 2 messages, merlive design\)/);
    const page = readFileSync(join(out, 'order-approval-1.html'), 'utf8');
    assert.match(page, /<title>Purchase order approval<\/title>/);
    assert.ok(page.includes('Revise order'));
    const calls = readFileSync(join(out, 'order-approval-3.html'), 'utf8');
    assert.match(calls, /<title>Who talks to whom<\/title>/);
    assert.ok(calls.includes('Ask for approval') && calls.includes('id="mv-next"'));
  });

  it('draws a sequence diagram as a still picture, says what would be drawn, and refuses one that breaks a rule', async () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'calls.mmd'), 'sequenceDiagram\n  Buyer->>ERP: Raise order\n  wibble wobble\n');
    const checked = await go(['calls.mmd', '--check'], cwd);
    assert.match(checked.text, /note, block 1: line 3: not read: "wibble wobble"/);
    assert.match(checked.text, /would draw calls-1\.html \(2 participants, 1 messages, merlive design\)/);
    assert.equal((await go(['calls.mmd', '--format', 'svg'], cwd)).code, exits.drawn);
    assert.match(readFileSync(join(cwd, 'diagrams/calls-1.svg'), 'utf8'), /^<svg xmlns/);
    writeFileSync(join(cwd, 'long.mmd'), 'sequenceDiagram\n  participant A as Pneumonoultramicroscopicsilicovolcanoconiosis\n  A->>B: hi\n');
    const long = await go(['long.mmd'], cwd);
    assert.equal(long.code, exits.brokeARule);
    assert.match(long.text, /not drawn: block 1 \(line 1\) breaks 1 of its rules\n {2}S7 Names, words and notes fit where they sit: /);
  });

  it('leaves and names a kind of diagram it does not draw', async () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'mixed.md'), '```mermaid\nflowchart TD\nA --> B\n```\n\n```mermaid\npie title Orders\n  "UK" : 46\n```\n');
    assert.match((await go(['mixed.md', '--check'], cwd)).text, /left as Mermaid: block 2 \(line 6\) is a pie, and Merlive draws flowcharts, state, class, entity, requirement, C4, architecture, block and sequence diagrams, mindmaps, kanban boards, timelines and packets for now/);
  });

  it('writes a page that fetches nothing and carries its source', async () => {
    const out = temp();
    await go([example, '--out', out]);
    const page = readFileSync(join(out, 'order-approval-1.html'), 'utf8');
    assert.doesNotMatch(page, /(src|href)="https?:/);
    assert.doesNotMatch(page, /@import|url\((?!#)/, 'the only url() is one that points inside the page itself');
    assert.ok(page.includes('id="mermaid-source"'));
    assert.ok(page.includes('C --&gt;|Yes| D[Manager approval]'), 'the Mermaid, as written');
  });

  it('writes a still picture with --format svg', async () => {
    const out = temp();
    assert.equal((await go([example, '--out', out, '--format', 'svg', '--only', '2'])).code, exits.drawn);
    const svg = readFileSync(join(out, 'order-approval-2.svg'), 'utf8');
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.doesNotMatch(svg, /<script/);
    assert.equal(existsSync(join(out, 'order-approval-1.svg')), false);
  });

  it('writes nothing with --check', async () => {
    const out = temp();
    const { code, text } = await go([example, '--out', out, '--check']);
    assert.equal(code, exits.drawn);
    assert.match(text, /would draw order-approval-1\.html/);
    assert.equal(existsSync(join(out, 'order-approval-1.html')), false);
  });

  it('puts the diagrams beside the file when no folder is named', async () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'flow.mmd'), 'flowchart TD\nA[One] --> B[Two]\n');
    assert.equal((await go(['flow.mmd'], cwd)).code, exits.drawn);
    assert.ok(existsSync(join(cwd, 'diagrams/flow-1.html')));
  });

  it('does not write a diagram that breaks a rule, names the rule, and ends with 1', async () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'long.mmd'), `flowchart TD\nA[${'far too many words '.repeat(8)}] --> B\n`);
    const { code, text } = await go(['long.mmd'], cwd);
    assert.equal(code, exits.brokeARule);
    assert.match(text, /not drawn: block 1 \(line 1\) breaks 1 of its rules\n {2}P6 Words fit their box: /);
    assert.equal(existsSync(join(cwd, 'diagrams/long-1.html')), false);
    const forced = await go(['long.mmd', '--force'], cwd);
    assert.equal(forced.code, exits.drawn);
    assert.match(forced.text, /drawn anyway/);
    assert.ok(existsSync(join(cwd, 'diagrams/long-1.html')));
  });

  it('passes on what the Mermaid held that it could not read', async () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'odd.mmd'), 'flowchart TD\nA --> B\nA ~~> C\n');
    assert.match((await go(['odd.mmd', '--check'], cwd)).text, /note, block 1: line 3: not read: "A ~~> C"/);
  });
});

describe('the command: the design', () => {
  it("draws in Merlive's own look when the folder has no design file", async () => {
    assert.match((await go([example, '--check'])).text, /merlive design/);
  });

  it("uses the folder's own design file when there is one, by its name", async () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'merlive.design.json'), JSON.stringify({ name: 'storm', light: { accent: '#0a5cc2' } }));
    const { code, text } = await go([example, '--check'], cwd);
    assert.equal(code, exits.drawn);
    assert.match(text, /storm design/);
  });

  it('uses a design file named by --design, before the folder\'s own', async () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'merlive.design.json'), JSON.stringify({ name: 'storm' }));
    writeFileSync(join(cwd, 'mine.json'), JSON.stringify({ radius: 0 }));
    assert.match((await go([example, '--check', '--design', 'mine.json'], cwd)).text, /your design/);
  });

  it('does not draw in a design whose words cannot be read', async () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'merlive.design.json'), JSON.stringify({ light: { text: '#eeeeee' } }));
    const { code, text } = await go([example, '--check'], cwd);
    assert.equal(code, exits.brokeARule);
    assert.match(text, /D1 Words and lines can be read/);
  });

  it('does not draw in a design whose kinds of box cannot be told apart', async () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'merlive.design.json'), JSON.stringify({ light: { kinds: { rework: '#2c7d4f' } } }));
    const { code, text } = await go([example, '--check', '--only', '1'], cwd);
    assert.equal(code, exits.brokeARule);
    assert.match(text, /D2 Kinds of box can be told apart: light: terminal and rework boxes look alike/);
  });
});

describe('the command: what is missing ends with 2, nothing to draw with 3', () => {
  it('says what is missing and what to do', async () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'bad.json'), '{');
    for (const [argv, words] of /** @type {[string[], RegExp][]} */ ([
      [[], /Which file\?/],
      [['nowhere.md'], /No file at .*nowhere\.md/],
      [[example, '--design', 'nowhere.json'], /No design file at .*nowhere\.json\./],
      [[example, '--design', 'bad.json'], /bad\.json is not valid JSON/],
      [[example, '--frmat', 'svg'], /There is no option --frmat/],
    ])) {
      const { code, text } = await go(argv, cwd);
      assert.equal(code, exits.missing, argv.join(' '));
      assert.match(text, words);
    }
  });

  it('ends with 3 for a file with no flowchart', async () => {
    const cwd = temp();
    writeFileSync(join(cwd, 'plain.md'), '# Nothing\n\n```mermaid\npie title Orders\n"UK" : 46\n```\n\n```mermaid\nflowchart TD\n```\n');
    const { code, text } = await go(['plain.md'], cwd);
    assert.equal(code, exits.nothingToDraw);
    assert.match(text, /block 2 \(line 8\) has no boxes/);
    assert.match(text, /Nothing to draw: plain\.md has no Mermaid diagram of a kind Merlive draws\./);
    assert.match((await go([example, '--only', '9'])).text, /at block 9/);
  });
});

describe('the command: what a project asks for in its design file', () => {
  it('writes a page and a picture when the design asks for both, and what --format says when it says', async () => {
    const cwd = temp();
    put(cwd, 'flow.md', flowMd);
    put(cwd, 'merlive.design.json', JSON.stringify({ output: { format: 'both' } }));
    assert.equal((await go(['flow.md'], cwd)).code, exits.drawn);
    assert.ok(existsSync(join(cwd, 'diagrams/flow-1.html')) && existsSync(join(cwd, 'diagrams/flow-1.svg')));
    const only = temp();
    put(only, 'flow.md', flowMd);
    put(only, 'merlive.design.json', JSON.stringify({ output: { format: 'both' } }));
    await go(['flow.md', '--format', 'svg'], only);
    assert.equal(existsSync(join(only, 'diagrams/flow-1.html')), false);
  });

  it('leaves out the steps, the legend and the Mermaid when the design says to', async () => {
    const cwd = temp();
    put(cwd, 'flow.md', flowMd);
    await go(['flow.md'], cwd);
    const full = readFileSync(join(cwd, 'diagrams/flow-1.html'), 'utf8');
    assert.ok(full.includes('id="mv-next"') && full.includes('class="mv-legend"') && full.includes('id="mermaid-source"'));
    put(cwd, 'merlive.design.json', JSON.stringify({ output: { steps: false, legend: false, source: false } }));
    await go(['flow.md'], cwd);
    const bare = readFileSync(join(cwd, 'diagrams/flow-1.html'), 'utf8');
    assert.equal(bare.includes('id="mv-next"') || bare.includes('class="mv-legend"') || bare.includes('id="mermaid-source"'), false);
  });

  it('draws in dark only when the design says dark, and in both when it says both', async () => {
    const cwd = temp();
    put(cwd, 'flow.md', flowMd);
    put(cwd, 'merlive.design.json', JSON.stringify({ modes: 'dark' }));
    await go(['flow.md'], cwd);
    const dark = readFileSync(join(cwd, 'diagrams/flow-1.html'), 'utf8');
    assert.ok(dark.includes('--mv-bg:#06191d') && !dark.includes('prefers-color-scheme:dark'));
    put(cwd, 'merlive.design.json', JSON.stringify({ modes: 'both' }));
    await go(['flow.md'], cwd);
    const both = readFileSync(join(cwd, 'diagrams/flow-1.html'), 'utf8');
    assert.ok(both.includes('--mv-bg:#eff6f5') && both.includes('prefers-color-scheme:dark'));
  });
});

describe('the command: --setup, with nobody choosing a colour', () => {
  it("reads the project's own stylesheet, writes the design file and a page to look at, and says what it did", async () => {
    const cwd = temp();
    // The colours in one sheet, and what body does with them in the sheet beside it, as a real site keeps them.
    put(cwd, 'src/styles/tokens.css', siteCss.split('\n').slice(0, 2).join('\n'));
    put(cwd, 'src/styles/base.css', siteCss.split('\n')[2]);
    put(cwd, 'node_modules/loud/loud.css', 'body{background:#ff00ff;color:#00ff00} a{color:#ff0000}');
    put(cwd, 'docs/flow.md', flowMd);
    const { code, text } = await go(['--setup'], cwd);
    assert.equal(code, exits.drawn);
    assert.match(text, /^read src\/styles\n {2}found: page #ffffff, text #000000, accent #ffc400, face 'Atkinson Hyperlegible', in light and dark/);
    assert.match(text, /\n {2}changed: accent #ffc400 is 1\.\d to 1 on the light page/);
    assert.match(text, /\nwrote merlive\.design\.json\n/);
    assert.match(text, /wrote .*merlive-setup\.html/);
    const file = json(join(cwd, 'merlive.design.json'));
    assert.equal(file.from, 'src/styles');
    assert.equal(file.modes, 'both');
    assert.equal(file.light.bg, '#ffffff');
    assert.equal(file.dark.bg, '#1c1c1c');
    const page = readFileSync(join(cwd, 'diagrams/merlive-setup.html'), 'utf8');
    assert.ok(page.includes('Ready?'), "the project's own diagram is what is shown");
    // And from then on every diagram is drawn with it, and passes.
    const drawn = await go(['docs/flow.md', '--check'], cwd);
    assert.equal(drawn.code, exits.drawn);
    assert.match(drawn.text, new RegExp(`${file.name} design`));
  });

  it('does not write over a design a project already has, unless told to', async () => {
    const cwd = temp();
    put(cwd, 'site.css', siteCss);
    put(cwd, 'merlive.design.json', JSON.stringify({ name: 'kept' }));
    const { code, text } = await go(['--setup'], cwd);
    assert.equal(code, exits.drawn);
    assert.match(text, /already has merlive\.design\.json/);
    assert.deepEqual(json(join(cwd, 'merlive.design.json')), { name: 'kept' });
    assert.ok(existsSync(join(cwd, 'diagrams/merlive-setup.html')));
    await go(['--setup', '--force'], cwd);
    assert.equal(json(join(cwd, 'merlive.design.json')).light.bg, '#ffffff');
  });

  it("says so, and shows Merlive's own look, when the project has no colours to read", async () => {
    const cwd = temp();
    put(cwd, 'package.json', JSON.stringify({ homepage: 'https://github.com/someone/thing#readme' }));
    const { code, text } = await go(['--setup'], cwd);
    assert.equal(code, exits.drawn);
    assert.match(text, /no stylesheet with colours in this folder.*--from/s);
    assert.equal(existsSync(join(cwd, 'merlive.design.json')), false);
    assert.ok(readFileSync(join(cwd, 'diagrams/merlive-setup.html'), 'utf8').includes('--mv-bg:#eff6f5'));
  });

  it('reads a site by its address: the page, the stylesheets it links to and the styles written in it', async () => {
    await serve({ '/blog/': ['text/html', '<link rel="stylesheet" href="/site.css"><style>a{color:#0a5cc2}</style>'], '/site.css': ['text/css', siteCss] }, async (base) => {
      const cwd = temp();
      const { code, text } = await go(['--setup', '--from', `${base}/blog/`], cwd);
      assert.equal(code, exits.drawn);
      assert.match(text, new RegExp(`^read ${base}/blog/\\n {2}found: page #ffffff, text #000000, accent #0a5cc2`));
      assert.equal(json(join(cwd, 'merlive.design.json')).light.accent, '#0a5cc2');
    });
  });

  it("reads the site named in package.json when the folder has no stylesheet of its own", async () => {
    await serve({ '/': ['text/html', `<style>${siteCss}</style>`] }, async (base) => {
      const cwd = temp();
      put(cwd, 'package.json', JSON.stringify({ homepage: `${base}/` }));
      const { text } = await go(['--setup'], cwd);
      assert.match(text, new RegExp(`^read ${base}/`));
      assert.equal(json(join(cwd, 'merlive.design.json')).dark.bg, '#1c1c1c');
    });
  });

  it('reads a stylesheet named by its path', async () => {
    const cwd = temp();
    put(cwd, 'saved/theirs.css', 'body{background:#fdf6e3;color:#073642} a{color:#268bd2}');
    await go(['--setup', '--from', 'saved/theirs.css'], cwd);
    const file = json(join(cwd, 'merlive.design.json'));
    assert.equal(file.light.bg, '#fdf6e3');
    assert.equal(file.modes, 'light');
  });

  it('ends with 2 and says what to do when the site cannot be read', async () => {
    await serve({}, async (base) => {
      const missing = await go(['--setup', '--from', `${base}/gone`]);
      assert.equal(missing.code, exits.missing);
      assert.match(missing.text, /Could not read .*\/gone: it answered 404\. Save the site's stylesheet to a file and name it with --from/);
    });
    const nowhere = await go(['--setup', '--from', 'nowhere.css']);
    assert.equal(nowhere.code, exits.missing);
    assert.match(nowhere.text, /No file at .*nowhere\.css/);
  });
});
