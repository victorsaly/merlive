#!/usr/bin/env node
// A picture changed is a picture seen. This lists every picture a branch draws differently from another (main,
// unless told), and writes one page with each as it was beside each as it is, to be looked at before merging.
//   npm run changed                       # against origin/main, to changed.html
//   node scripts/changed.mjs main out.html
// The page stands alone (its pictures are inside it), is never committed, and needs nothing but git.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
/** Where pictures are kept: what real documents come out as first, then the corpus, then the examples. */
export const kept = ['wild/drawn', 'corpus/drawn', 'examples'];

/**
 * The page: each picture as it was beside as it is. One that is new has nothing before it; one that is gone has
 * nothing after.
 * @param {{path:string,before:string,after:string}[]} pairs
 * @param {string} base what "before" is
 */
export function changedPage(pairs, base) {
  const esc = (/** @type {string} */ s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const shown = (/** @type {string} */ svg, /** @type {string} */ none) => (svg ? `<img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" alt="">` : `<p class="none">${none}</p>`);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pictures changed since ${esc(base)}</title>
<style>body{margin:0;font:15px/1.5 system-ui,sans-serif;background:#f6f7f7;color:#1c2422}main{max-width:1100px;margin:0 auto;padding:16px}h1{font-size:22px}h2{font-size:15px;margin:0 0 8px;word-break:break-all}section{background:#fff;border:1px solid #dfe4e3;border-radius:10px;padding:14px;margin:14px 0}.pair{display:grid;grid-template-columns:1fr;gap:10px}@media(min-width:800px){.pair{grid-template-columns:1fr 1fr}}figure{margin:0;border:1px solid #e6eae9;border-radius:8px;padding:8px;overflow:auto}figcaption{font-size:12px;color:#55615e;margin-bottom:6px}img{max-width:100%;height:auto;display:block;margin:0 auto}.none{color:#7a8683;font-size:13px}</style></head>
<body><main><h1>${pairs.length} picture${pairs.length === 1 ? '' : 's'} changed since ${esc(base)}</h1>
${pairs.length ? '' : '<p>Nothing is drawn differently.</p>'}${pairs.map((p) => `<section><h2>${esc(p.path)}</h2><div class="pair"><figure><figcaption>Before</figcaption>${shown(p.before, 'Not drawn before: this one is new.')}</figure><figure><figcaption>After</figcaption>${shown(p.after, 'No longer drawn.')}</figure></div></section>`).join('\n')}
</main></body></html>
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const base = process.argv[2] ?? 'origin/main', out = process.argv[3] ?? join(root, 'changed.html');
  const git = (/** @type {string[]} */ args) => spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const listed = git(['diff', '--name-only', base, '--', ...kept]);
  if (listed.status !== 0) {
    console.error(`could not compare with "${base}": ${listed.stderr.trim()}\nFetch it first (git fetch origin main), or name another branch: node scripts/changed.mjs <branch>`);
    process.exit(2);
  }
  const pairs = listed.stdout.split('\n').filter((path) => path.endsWith('.svg')).map((path) => {
    const was = git(['show', `${base}:${path}`]);
    return { path, before: was.status === 0 ? was.stdout : '', after: existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8') : '' };
  });
  writeFileSync(out, changedPage(pairs, base));
  console.log(`${pairs.length} picture${pairs.length === 1 ? '' : 's'} changed since ${base}: ${out}`);
}
