// Why: setup is something Merlive does, not something a person fills in. It reads the project's colours and
// writes the design file itself. This page is what it shows afterwards: the project's own diagram in those
// colours, what was read and what was made up, and every choice there is, each already made and each
// changeable. Nothing on it has to be touched. Pure: a model, a layout and a design in, a string out.

import { looksOf } from './design.mjs';
import { inside, kindName, kindsIn, rulesFor, variables } from './render.mjs';

const esc = (/** @type {unknown} */ s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The diagram shown when a project has no flowchart of its own yet. */
export const sample = `flowchart TD
  A([Request comes in]) --> B[Check the details]
  B --> C{All there?}
  C -->|Yes| D[Do the work]
  C -->|No| E[Ask for what is missing]
  E --> B
  D --> F([Done])
  class E rework`;

const colourNames = { bg: 'Page', node: 'Box', stroke: 'Box edge', text: 'Words', muted: 'Quiet words', edge: 'Lines', accent: 'Accent' };

/**
 * Handed to the page as source and run there, after the colour sums of design.mjs, which it uses by name.
 * @param {any} state the design, as the settings file holds it
 * @param {string[]} kinds
 */
export function setupRuntime(state, kinds) {
  /* global colourChecks, kindFill */
  const byId = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));
  const ruleNames = { D1: 'Words and lines can be read', D2: 'Kinds of box can be told apart' };
  const paint = () => {
    for (const mode of ['light', 'dark']) {
      const el = /** @type {HTMLElement|null} */ (document.querySelector(`.mv-look[data-look="${mode}"]`)), p = state[mode];
      if (!el || !p) continue;
      for (const k of ['bg', 'node', 'stroke', 'text', 'muted', 'edge', 'accent']) el.style.setProperty(`--mv-${k}`, p[k]);
      for (const k of kinds) {
        el.style.setProperty(`--mv-k-${k}`, p.kinds[k] || p.stroke);
        // @ts-expect-error kindFill comes from the sums written into the page before this
        el.style.setProperty(`--mv-kf-${k}`, kindFill(p, k));
      }
      el.hidden = !(state.modes === 'both' || state.modes === mode);
    }
    document.querySelectorAll('rect.mv-shape:not(.mv-pill)').forEach((r) => r.setAttribute('rx', String(Math.min(state.radius, Number(r.getAttribute('height')) / 2))));
    byId('radius-now').textContent = `${state.radius}px`;

    const rules = byId('rules');
    rules.textContent = '';
    // @ts-expect-error colourChecks comes from the sums written into the page before this
    for (const c of colourChecks(state, kinds)) {
      const li = document.createElement('li');
      li.className = c.broken.length ? 'no' : 'yes';
      li.textContent = `${c.broken.length ? 'Not yet' : 'Passes'}: ${ruleNames[/** @type {'D1'|'D2'} */ (c.id)]}`;
      if (c.broken.length) {
        const why = document.createElement('ul');
        for (const line of c.broken) why.appendChild(document.createElement('li')).textContent = line;
        li.appendChild(why);
      }
      rules.appendChild(li);
    }
    /** @type {HTMLTextAreaElement} */ (byId('settings')).value = JSON.stringify(state, null, 2);
  };

  document.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', () => {
      const { name, id, type, value, checked, dataset } = input;
      if (type === 'radio' && name === 'format') state.output.format = value;
      else if (type === 'radio') state[name] = value;
      else if (type === 'checkbox') state.output[id] = checked;
      else if (type === 'range') state.radius = Number(value);
      else if (type === 'color' && dataset.kind) state[dataset.look ?? 'light'].kinds[dataset.kind] = value;
      else if (type === 'color') state[dataset.look ?? 'light'][dataset.key ?? 'bg'] = value;
      paint();
    });
  });
  byId('copy').addEventListener('click', () => {
    const box = /** @type {HTMLTextAreaElement} */ (byId('settings'));
    const done = () => (byId('copy').textContent = 'Copied');
    // Some places a page is opened in will not let it write to the clipboard; the words are then selected.
    navigator.clipboard.writeText(box.value).then(done, () => box.select());
  });
  paint();
}

/**
 * @param {object} about
 * @param {import('./parse.mjs').Model} about.model the diagram shown: the project's own, or the sample
 * @param {import('./layout.mjs').Layout} about.lay
 * @param {import('./design.mjs').Design} about.design
 * @param {{found:string[],changed:string[],made:string[]}} about.said what setup read, put right and made up
 * @param {string} about.sums the source of design.mjs, so the page checks colours with the command's own sums
 * @param {boolean} about.wrote whether setup has just written the design file
 */
export function setupPage({ model, lay, design, said, sums, wrote }) {
  const kinds = [...new Set([...kindsIn(model), ...Object.keys(design.light.kinds)])];
  const palettes = /** @type {['light'|'dark', import('./design.mjs').Palette][]} */ ([['light', design.light], ['dark', design.dark]]).filter(([, p]) => p);
  const shown = new Set(looksOf(design).map(([mode]) => mode));
  /** @type {Record<string, unknown>} */
  const state = { name: design.name, modes: design.modes, motion: design.motion, radius: design.radius, font: design.font, weight: design.weight, output: design.output, light: design.light };
  if (design.from) state.from = design.from;
  if (design.dark) state.dark = design.dark;

  const radio = (/** @type {string} */ name, /** @type {string} */ value, /** @type {string} */ words, /** @type {string} */ now) =>
    `<label><input type="radio" name="${name}" value="${value}"${value === now ? ' checked' : ''}> ${esc(words)}</label>`;
  const tick = (/** @type {'steps'|'legend'|'source'} */ id, /** @type {string} */ words) => `<label><input type="checkbox" id="${id}"${design.output[id] ? ' checked' : ''}> ${esc(words)}</label>`;
  const list = (/** @type {string} */ title, /** @type {string[]} */ lines) => (lines.length ? `<li><strong>${title}</strong><ul>${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></li>` : '');
  const swatches = palettes.map(([mode, p]) => `<fieldset><legend>${mode === 'light' && palettes.length === 1 ? 'Colours' : `${mode === 'light' ? 'Light' : 'Dark'} colours`}</legend><div class="grid">
${Object.entries(colourNames).map(([key, words]) => `<label><input type="color" data-look="${mode}" data-key="${key}" value="${/** @type {Record<string,string>} */ (/** @type {unknown} */ (p))[key]}"> ${words}</label>`).join('\n')}
${Object.entries(p.kinds).map(([k, c]) => `<label><input type="color" data-look="${mode}" data-kind="${esc(k)}" value="${c}"> ${esc(kindName(k))}</label>`).join('\n')}
</div></fieldset>`).join('\n');
  const drawing = inside(model, lay, design, false);
  const looks = palettes.map(([mode, p]) => `<figure class="mv-look" data-look="${mode}" style="${variables(p, kinds)}"${shown.has(mode) ? '' : ' hidden'}>
<figcaption>${mode === 'light' && palettes.length === 1 ? 'Your diagram' : mode === 'light' ? 'Light' : 'Dark'}</figcaption>
<svg class="mv-svg" viewBox="0 0 ${lay.width} ${lay.height}" style="width:${lay.width}px" role="img" aria-label="The diagram in ${mode}">${drawing}</svg>
</figure>`).join('\n');
  const lead = wrote
    ? 'Merlive read your site, made these settings from it and saved them as <code>merlive.design.json</code>. Every diagram in this project is now drawn this way. Nothing on this page needs doing.'
    : 'These are the settings every diagram in this project is drawn with. Nothing on this page needs doing.';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Merlive setup</title>
<style>
:root{color-scheme:light dark}
*{box-sizing:border-box}
body{margin:0;background:Canvas;color:CanvasText;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:1080px;margin:0 auto;padding:20px 16px 48px;display:grid;gap:20px}
h1{font-size:22px;margin:0;text-wrap:balance}
h2{font-size:16px;margin:0 0 8px}
p{margin:0;max-width:68ch}
ul{margin:0;padding-left:20px}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em}
section,fieldset{border:1px solid rgba(128,128,128,.4);border-radius:10px;padding:14px;margin:0;min-width:0}
legend{font-weight:600;padding:0 6px}
.looks{display:flex;gap:16px;flex-wrap:wrap;border:0;padding:0}
.mv-look{margin:0;padding:12px;border-radius:10px;background:var(--mv-bg);overflow-x:auto;flex:1 1 300px;border:1px solid rgba(128,128,128,.4)}
.mv-look[hidden]{display:none}
.mv-look figcaption{color:var(--mv-muted);font-size:12px;margin-bottom:6px}
.mv-svg{display:block;max-width:100%;height:auto;margin:0 auto}
form{display:grid;gap:12px}
.row{display:flex;flex-wrap:wrap;gap:6px 18px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px 14px}
label{display:inline-flex;align-items:center;gap:8px;min-height:32px}
input[type=color]{width:34px;height:28px;padding:0;border:1px solid rgba(128,128,128,.6);border-radius:6px;background:none}
#rules{list-style:none;padding:0;display:grid;gap:6px}
#rules>li.yes::before{content:"✓ "}
#rules>li.no::before{content:"✗ "}
#rules>li.no{font-weight:600}
#rules ul{font-weight:400}
textarea{width:100%;height:180px;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;border:1px solid rgba(128,128,128,.6);border-radius:8px;padding:10px;background:Canvas;color:CanvasText}
button{font:inherit;padding:8px 14px;border-radius:8px;border:1px solid rgba(128,128,128,.6);background:ButtonFace;color:ButtonText;cursor:pointer;min-height:38px;justify-self:start}
:focus-visible{outline:3px solid Highlight;outline-offset:2px}
${rulesFor(design, kinds)}
</style>
</head>
<body>
<main>
<h1>Your diagrams, in your colours</h1>
<p>${lead} If you would like something different, say it to your agent in your own words ("dark only", "no steps", "make the accent our blue"), or change it here and copy the settings at the bottom.</p>
<section><h2>What Merlive read${design.from ? ` from ${esc(design.from)}` : ''}</h2><ul>
${list('Found on your site', said.found)}${list('Put right, so it can be read', said.changed)}${list('Made by Merlive, because a site has no such thing', said.made)}
</ul></section>
<div class="looks">
${looks}
</div>
<form id="choices" onsubmit="return false">
<fieldset><legend>Light and dark</legend><div class="row">
${design.dark ? [radio('modes', 'both', 'Both: follow the reader\'s system', design.modes), radio('modes', 'light', 'Light only', design.modes), radio('modes', 'dark', 'Dark only', design.modes)].join('\n') : `${radio('modes', 'light', 'One look, as your site has', 'light')}<span>Your site has one look, so its diagrams have one too.</span>`}
</div></fieldset>
<fieldset><legend>Movement</legend><div class="row">
${radio('motion', 'none', 'None', design.motion)}
${radio('motion', 'calm', 'Calm: one dot follows a path, when the reader presses play', design.motion)}
${radio('motion', 'lively', 'Lively: the path flows too', design.motion)}
</div></fieldset>
<fieldset><legend>What is made for each diagram</legend><div class="row">
${radio('format', 'html', 'A live page', design.output.format)}
${radio('format', 'svg', 'A still picture, for wikis', design.output.format)}
${radio('format', 'both', 'Both', design.output.format)}
</div></fieldset>
<fieldset><legend>What a live page carries</legend><div class="row">
${tick('steps', 'Steps to walk through, when the diagram has them')}
${tick('legend', 'A legend of the kinds of box')}
${tick('source', 'The Mermaid it was drawn from')}
</div></fieldset>
<fieldset><legend>Corner of a box</legend><div class="row">
<label><input type="range" id="radius" min="0" max="24" step="1" value="${Math.min(24, design.radius)}"> <span id="radius-now"></span></label>
</div></fieldset>
${swatches}
</form>
<section><h2>The two colour rules</h2><ul id="rules"></ul></section>
<section><h2>Settings</h2>
<p>This is <code>merlive.design.json</code> as the choices above make it. Copy it and give it to your agent to save, only if you changed something.</p>
<textarea id="settings" readonly aria-label="The settings file"></textarea>
<button type="button" id="copy">Copy settings</button>
</section>
</main>
<script>
${sums.replace(/^export /gm, '')}
(${setupRuntime.toString()})(${JSON.stringify(state).replace(/</g, '\\u003c')}, ${JSON.stringify(kinds)});
</script>
</body>
</html>
`;
}
