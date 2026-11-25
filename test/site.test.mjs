import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { apart, builtIn, colourChecks, contrast, designFrom } from '../skills/merlive/scripts/design.mjs';
import { colourOf, designOf, readingOf, stylesheetsOf } from '../skills/merlive/scripts/site.mjs';

// A site written the way Victor's skills site is: named tokens, a dark set under a media query, no var is
// called "background" or "primary".
const ink = `
/* tokens */
@import 'somewhere/font.css';
:root {
  --paper: #ffffff;
  --ink: #000000;
  --quiet: #525252; /* 7.8:1 on paper */
  --rule: #cfcfcf;
  --mark: #ffc400;
  --font: 'Atkinson Hyperlegible Next Variable', 'Atkinson Hyperlegible', system-ui, sans-serif;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root { --paper: #1c1c1c; --ink: #e6e6e6; --rule: #454545; }
}
body { margin: 0; background: var(--paper); color: var(--ink); font-family: var(--font); }
a { color: inherit; }
@keyframes spin { from { color: #ff0000 } to { color: #00ff00 } }
`;

// A site written the way shadcn/ui sets one up: bare hsl numbers, a .dark class, a radius token.
const shad = `
@layer base {
  :root { --background: 0 0% 100%; --foreground: 222 47% 11%; --primary: 221 83% 53%; --radius: 0.5rem; }
  .dark { --background: 222 47% 11%; --foreground: 210 40% 98%; --primary: 217 91% 60%; }
  body { background-color: hsl(var(--background)); color: hsl(var(--foreground)); font-family: Inter, sans-serif; }
  .card { border-radius: var(--radius); }
}
`;

describe('colourOf', () => {
  it('reads the ways a stylesheet writes a colour', () => {
    assert.equal(colourOf('#abc'), '#aabbcc');
    assert.equal(colourOf('#A1B2C3'), '#a1b2c3');
    assert.equal(colourOf('#a1b2c3ff'), '#a1b2c3');
    assert.equal(colourOf('rgb(255, 196, 0)'), '#ffc400');
    assert.equal(colourOf('rgb(255 196 0 / 90%)'), '#ffc400');
    assert.equal(colourOf('hsl(0 0% 100%)'), '#ffffff');
    assert.equal(colourOf('hsl(221, 83%, 53%)'), '#2463eb');
    assert.equal(colourOf('221 83% 53%'), '#2463eb');
    assert.equal(colourOf('white'), '#ffffff');
    assert.equal(colourOf('black'), '#000000');
  });

  it('reads oklch, the way newer stylesheets write colours', () => {
    assert.equal(colourOf('oklch(1 0 0)'), '#ffffff');
    assert.equal(colourOf('oklch(0 0 0)'), '#000000');
    // Pure red and pure blue, to within what rounding the published figures allows.
    assert.ok(apart(colourOf('oklch(62.8% 0.2577 29.23)') ?? '#000000', '#ff0000') < 1.5, colourOf('oklch(62.8% 0.2577 29.23)') ?? '');
    assert.ok(apart(colourOf('oklch(0.452 0.313 264.05)') ?? '#000000', '#0000ff') < 1.5, colourOf('oklch(0.452 0.313 264.05)') ?? '');
    assert.equal(colourOf('oklch(0.7 0.1 150 / 0.2)'), null);
  });

  it('says no to what is not one colour', () => {
    for (const v of ['transparent', 'inherit', 'var(--x)', 'linear-gradient(#fff, #000)', 'rgb(1 2)', '#12', '', 'rgba(0, 0, 0, 0.1)']) assert.equal(colourOf(v), null, v);
  });
});

describe('readingOf', () => {
  it('finds page, text, accent and face on a site with names of its own, in light and dark', () => {
    const r = readingOf([ink]);
    assert.deepEqual(r.light, { bg: '#ffffff', text: '#000000', accent: '#ffc400' });
    assert.deepEqual(r.dark, { bg: '#1c1c1c', text: '#e6e6e6', accent: '#ffc400' });
    assert.equal(r.font, "'Atkinson Hyperlegible Next Variable', 'Atkinson Hyperlegible', system-ui, sans-serif");
    assert.equal(r.radius, undefined, 'too little read to say the site has square corners');
  });

  it('finds them on a site set up with bare hsl numbers and a .dark class, with its corner', () => {
    const r = readingOf([shad]);
    assert.deepEqual(r.light, { bg: '#ffffff', text: '#0f1729', accent: '#2463eb' });
    assert.deepEqual(r.dark, { bg: '#0f1729', text: '#f8fafc', accent: '#3c83f6' });
    assert.equal(r.font, 'Inter, sans-serif');
    assert.equal(r.radius, 8);
  });

  it('takes the colour of links for the accent when it is a colour, and else the strongest colour there is', () => {
    assert.equal(readingOf(['body{background:#fff;color:#111} a{color:#0a5cc2}']).light?.accent, '#0a5cc2');
    assert.equal(readingOf([':root{--a:#777777;--b:#c2185b;--c:#fafafa} body{background:#fff;color:#111}']).light?.accent, '#c2185b');
    assert.equal(readingOf(['body{background:#fff;color:#111}']).light?.accent, undefined);
  });

  it('goes by the names of tokens when nothing is set on body', () => {
    const r = readingOf([':root{--bg:#fdf6e3;--text-color:#073642;--brand:#b58900} [data-theme="dark"]{--bg:#002b36;--text-color:#eee8d5}']);
    assert.deepEqual(r.light, { bg: '#fdf6e3', text: '#073642', accent: '#b58900' });
    assert.deepEqual(r.dark, { bg: '#002b36', text: '#eee8d5', accent: '#b58900' });
  });

  it('says a site has square corners only when it read enough of it to know', () => {
    const many = Array.from({ length: 24 }, (_, i) => `.c${i}{margin:${i}px}`).join('');
    assert.equal(readingOf([`body{background:#fff;color:#000}${many}`]).radius, 0);
    assert.equal(readingOf([`body{background:#fff;color:#000}${many}.b{border-radius:6px}.c{border-radius:6px}.pill{border-radius:999px}.d{border-radius:2px}`]).radius, 6);
  });

  it('finds nothing in a stylesheet that sets no colours, and does not take a keyframe for the page', () => {
    assert.equal(readingOf(['.a{margin:0} @keyframes x{from{background:#f00}to{background:#0f0}}']).light, undefined);
    assert.equal(readingOf([]).light, undefined);
  });
});

describe('stylesheetsOf', () => {
  it('finds the stylesheets a page links to, as full addresses, and the styles written in it', () => {
    const html = `<html><head>
      <link rel="stylesheet" href="/assets/site.css">
      <link href='theme.css?v=2' rel='stylesheet preload'>
      <link rel="icon" href="/favicon.svg">
      <link rel="stylesheet" href="https://fonts.example.com/css2?family=Inter">
      <style>body{color:#123456}</style><style media="print">a{color:#000}</style>
    </head></html>`;
    const found = stylesheetsOf(html, 'https://blog.example.com/posts/one/');
    assert.deepEqual(found.links, ['https://blog.example.com/assets/site.css', 'https://blog.example.com/posts/one/theme.css?v=2', 'https://fonts.example.com/css2?family=Inter']);
    assert.deepEqual(found.inline, ['body{color:#123456}', 'a{color:#000}']);
  });

  it('leaves out an address that is not http or https', () => {
    assert.deepEqual(stylesheetsOf('<link rel="stylesheet" href="file:///etc/passwd"><link rel="stylesheet" href="javascript:alert(1)">', 'https://a.example/').links, []);
  });
});

describe('designOf: a design made from what was read', () => {
  const kinds = Object.keys(builtIn.light.kinds);

  it("keeps the site's page, text and face, in light and dark, and passes both colour rules with no one choosing a colour", () => {
    const { file, said } = designOf(readingOf([ink]), { name: 'skills', from: 'src/styles/global.css' });
    const d = designFrom(file);
    assert.equal(d.name, 'skills');
    assert.equal(d.from, 'src/styles/global.css');
    assert.equal(d.modes, 'both');
    assert.equal(d.light.bg, '#ffffff');
    assert.equal(d.light.text, '#000000');
    assert.equal(d.dark?.bg, '#1c1c1c');
    assert.match(d.font, /^'Atkinson Hyperlegible Next Variable'/);
    assert.deepEqual(colourChecks(d, kinds).flatMap((c) => c.broken), []);
    assert.ok(said.found.some((line) => /page #ffffff, text #000000, accent #ffc400/.test(line)), said.found.join('|'));
  });

  it('makes an accent that is too light for a line dark enough to be one, keeps its hue, and says so', () => {
    const { file, said } = designOf(readingOf([ink]), { name: 'skills', from: 'x.css' });
    const d = designFrom(file);
    assert.notEqual(d.light.accent, '#ffc400');
    assert.ok(contrast(d.light.accent, d.light.bg) >= 3);
    assert.equal(d.dark?.accent, '#ffc400', 'on the dark page it is fine as it is');
    assert.ok(said.changed.some((line) => /accent #ffc400 is 1\.\d to 1 on the light page/.test(line)), said.changed.join('|'));
  });

  it('gives one look to a site that has one', () => {
    const { file } = designOf(readingOf(['body{background:#fdf6e3;color:#073642} a{color:#268bd2}']), { name: 'solar', from: 'x.css' });
    const d = designFrom(file);
    assert.equal(d.modes, 'light');
    assert.equal(d.dark, undefined);
    assert.deepEqual(colourChecks(d, kinds).flatMap((c) => c.broken), []);
  });

  it('gives a dark site its one dark look, with kinds made for a dark page', () => {
    const { file } = designOf(readingOf(['body{background:#0b1020;color:#e8ecf5} a{color:#7aa2ff}']), { name: 'night', from: 'x.css' });
    const d = designFrom(file);
    assert.equal(d.modes, 'light', 'one look, whatever the reader asks for');
    assert.equal(d.light.bg, '#0b1020');
    assert.equal(d.light.kinds.decision, builtIn.dark?.kinds.decision);
    assert.deepEqual(colourChecks(d, kinds).flatMap((c) => c.broken), []);
  });

  it('puts words that could not be read on the page right, and says so', () => {
    const { file, said } = designOf(readingOf(['body{background:#ffffff;color:#cccccc}']), { name: 'pale', from: 'x.css' });
    assert.equal(designFrom(file).light.text, '#000000');
    assert.match(said.changed.join('|'), /text #cccccc is 1\.\d to 1 on the light page/);
  });

  it('keeps only what a list of faces may hold from the face it read, and its corner within bounds', () => {
    const r = readingOf(['body{background:#fff;color:#000;font-family:Inter</style><script>alert(1)</script>, sans-serif} .a{border-radius:64px}.b{border-radius:64px}']);
    const d = designFrom(designOf(r, { name: 'x', from: 'x.css' }).file);
    assert.match(d.font, /^[\w\s,'"-]+$/);
    assert.ok(d.radius <= 24);
  });

  it("is Merlive's own look, said plainly, when nothing was found", () => {
    const { file, said } = designOf(readingOf(['.a{margin:0}']), { name: 'bare', from: 'x.css' });
    const d = designFrom(file);
    assert.equal(d.light.bg, builtIn.light.bg);
    assert.equal(d.modes, 'both');
    assert.match(said.found.join('|'), /no colours/);
  });
});
