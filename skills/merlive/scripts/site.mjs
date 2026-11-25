// Why: nobody should have to know their colours to get diagrams that belong on their site. Merlive reads the
// stylesheet the site already has, finds its page, text and accent colours, its face and its corner, and makes
// a design from them that passes the colour rules, with nobody choosing a colour. Pure: stylesheet text in, a
// design file out, with what was found, changed and made up said in plain words.

import { builtIn, colourChecks, colourLimits, contrast, designFrom, mix, strength } from './design.mjs';

/** @typedef {{bg?:string,text?:string,accent?:string}} Found */
/** @typedef {{light?:Found,dark?:Found,font?:string,radius?:number,shadows?:boolean}} Reading */

// What is looked for, and how sure it has to be.
const reads = {
  enoughRules: 20, // a stylesheet with this many rules and no rounded corner is taken to have square ones
  pill: 100, // a corner of this many px or more is a pill or a circle, not the site's corner
  mostCorner: 24, // the roundest a box of Merlive's is drawn
  linkStrength: 20, // a link colour weaker than this is a grey, not an accent
  tokenStrength: 30, // the strongest colour among the tokens is taken for the accent only from here up
  seeThrough: 0.5, // a colour less solid than this is a tint over something else, not a colour to read
  rem: 16, // px in a rem, as browsers start out
};

const DARK = /\.dark\b|\.theme-dark\b|\[data-(?:theme|mode|color-scheme|bs-theme)=["']?dark["']?\]/g;
// A selector's theme switches other than the dark ones: "not light", or "light" said outright. A switch for
// anything else (a second face, a density) is not the page as it starts out, and is left on, so the rule is not read.
const THEME = /:not\(\[data-(?:theme|mode|color-scheme|bs-theme)=["']?\w+["']?\]\)|\[data-(?:theme|mode|color-scheme|bs-theme)=["']?light["']?\]|\.light\b/g;
const names = {
  bg: /^--(?:color-|clr-|c-)?(?:bg|background|paper|page|canvas|surface|base)(?:-color|-default|-primary)?$/i,
  text: /^--(?:color-|clr-|c-)?(?:text|fg|foreground|ink|body)(?:-color|-default|-primary)?$/i,
  accent: /^--(?:color-|clr-|c-)?(?:accent|primary|brand|link|mark|highlight|theme)(?:-color|-default)?$/i,
};
const generic = ['serif', 'sans-serif', 'monospace', 'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace', 'ui-rounded', 'cursive'];

const hex = (/** @type {number[]} */ rgb) => `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;
const part = (/** @type {string} */ v, whole = 1) => (v.endsWith('%') ? (parseFloat(v) / 100) * whole : parseFloat(v));

function hsl(/** @type {number} */ h, /** @type {number} */ s, /** @type {number} */ l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((((h % 360) + 360) % 360) / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor((((h % 360) + 360) % 360) / 60)];
  return hex([r, g, b].map((v) => (v + m) * 255));
}

/** OKLCH (lightness, strength, hue) to sRGB, by Björn Ottosson's OKLab figures. */
function oklch(/** @type {number} */ L, /** @type {number} */ C, /** @type {number} */ H) {
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const curve = (/** @type {number} */ v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.max(0, v) ** (1 / 2.4) - 0.055);
  return hex([4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map(curve));
}

/**
 * One colour as #rrggbb, from any of the ways a stylesheet writes one, or null for what is not one solid colour.
 * @param {string} value
 * @returns {string|null}
 */
export function colourOf(value) {
  const v = value.trim().toLowerCase();
  if (v === 'white') return '#ffffff';
  if (v === 'black') return '#000000';
  const h = /^#([0-9a-f]{3,8})$/.exec(v)?.[1];
  if (h && [3, 4, 6, 8].includes(h.length)) {
    const full = h.length < 6 ? [...h].map((c) => c + c).join('') : h;
    return full.length === 8 && parseInt(full.slice(6), 16) / 255 < reads.seeThrough ? null : `#${full.slice(0, 6)}`;
  }
  // "221 83% 53%": the bare numbers some sites keep in a token and wrap in hsl() where they use it.
  const bare = /^(-?[\d.]+)(?:deg)?\s+([\d.]+%)\s+([\d.]+%)$/.exec(v);
  if (bare) return hsl(parseFloat(bare[1]), part(bare[2]), part(bare[3]));
  const fn = /^(rgba?|hsla?|oklch)\(([^()]*)\)$/.exec(v);
  if (!fn) return null;
  const [main, alpha] = fn[2].split('/').map((x) => x.trim());
  const nums = main.split(/[\s,]+/).filter(Boolean);
  const solid = alpha ?? (nums.length === 4 ? nums.pop() : undefined);
  if (nums.length !== 3 || nums.some((x) => Number.isNaN(parseFloat(x)))) return null;
  if (solid !== undefined && part(solid) < reads.seeThrough) return null;
  if (fn[1].startsWith('rgb')) return hex(nums.map((x) => part(x, 255)));
  if (fn[1].startsWith('hsl')) return hsl(parseFloat(nums[0]), part(nums[1]), part(nums[2]));
  return oklch(part(nums[0]), part(nums[1], 0.4), parseFloat(nums[2]));
}

/** @typedef {{selector:string,dark:boolean,decls:[string,string][]}} Rule */

/** A stylesheet's rules, with whether each is for a dark page. Keyframes and font faces are not rules of a page. */
function rulesOf(/** @type {string} */ css, dark = false, /** @type {Rule[]} */ out = []) {
  for (let i = 0; ;) {
    const open = css.indexOf('{', i);
    if (open < 0) return out;
    let depth = 1, j = open + 1;
    for (; j < css.length && depth; j++) depth += css[j] === '{' ? 1 : css[j] === '}' ? -1 : 0;
    // What comes before the brace, after any one-line rule such as @import.
    const before = (css.slice(i, open).split(';').pop() ?? '').trim();
    const body = css.slice(open + 1, j - 1);
    if (/^@(media|supports|layer|container)\b/.test(before)) rulesOf(body, dark || /prefers-color-scheme\s*:\s*dark/.test(before), out);
    else if (!before.startsWith('@')) {
      // Rules nested inside this one are somebody else's; only its own lines are read.
      let own = body;
      for (let last = ''; last !== own;) [last, own] = [own, own.replace(/[^{};]*\{[^{}]*\}/g, '')];
      /** @type {[string,string][]} */
      const decls = [];
      for (const line of own.split(';')) {
        const at = line.indexOf(':');
        if (at > 0) decls.push([line.slice(0, at).trim(), line.slice(at + 1).replace(/!important/i, '').trim()]);
      }
      out.push({ selector: before, dark: dark || new RegExp(DARK.source).test(before), decls });
    }
    i = j;
  }
}

/**
 * What a site's stylesheets say of its page: the colours of its page, text and accent in light and in dark, its
 * face and its corner. Anything not found is left out, never guessed.
 * @param {string[]} sheets the text of each stylesheet
 * @returns {Reading}
 */
export function readingOf(sheets) {
  const rules = sheets.flatMap((css) => rulesOf(css.replace(/\/\*[\s\S]*?\*\//g, '')));
  /** @type {Record<'light'|'dark', Map<string,string>>} */
  const tokens = { light: new Map(), dark: new Map() };
  /** @type {Record<'light'|'dark', {bg?:string,text?:string,link?:string}>} */
  const set = { light: {}, dark: {} };
  let face = '';
  /** @type {string[]} */
  const corners = [];
  let shadowed = false;
  for (const r of rules) {
    const mode = r.dark ? 'dark' : 'light';
    // What is left of each selector once its theme switches are taken off: ":root:not([data-theme='light'])" is :root.
    const parts = r.selector.split(',').map((s) => s.replace(new RegExp(DARK.source, 'g'), '').replace(THEME, '').trim());
    const page = parts.some((s) => ['', ':root', 'html', 'body'].includes(s));
    for (const [name, value] of r.decls) {
      if (page && name.startsWith('--')) tokens[mode].set(name, value);
      else if (page && (name === 'background' || name === 'background-color')) set[mode].bg = value;
      else if (page && name === 'color') set[mode].text = value;
      else if (page && name === 'font-family') face = value;
      else if (name === 'color' && parts.some((s) => s === 'a' || s === 'a:link')) set[mode].link = value;
      else if (name === 'border-radius') corners.push(value);
      else if (name === 'box-shadow' && !/^(none|unset|initial|inherit|0)$/i.test(value)) shadowed = true;
    }
  }
  const token = (/** @type {'light'|'dark'} */ mode, /** @type {string} */ name) => tokens[mode].get(name) ?? tokens.light.get(name);
  /** A value with its var()s filled in, for a light or a dark page. */
  const filled = (/** @type {string|undefined} */ raw, /** @type {'light'|'dark'} */ mode) => {
    let v = raw ?? '';
    for (let i = 0; i < 8 && v.includes('var('); i++) v = v.replace(/var\(\s*(--[\w-]+)\s*(?:,([^()]*))?\)/g, (_, name, fallback) => token(mode, name) ?? (fallback ?? '').trim());
    return v.trim();
  };
  /** The colour in a value: the whole of it, or the first colour among other things (as in a background). */
  const colourIn = (/** @type {string|undefined} */ raw, /** @type {'light'|'dark'} */ mode) => {
    const v = filled(raw, mode);
    return colourOf(v) ?? colourOf(/#[0-9a-f]{3,8}\b|(?:rgba?|hsla?|oklch)\([^()]*\)|\b(?:white|black)\b/i.exec(v)?.[0] ?? '');
  };
  const all = (/** @type {'light'|'dark'} */ mode) => [...new Map([...tokens.light, ...tokens[mode]]).keys()];
  const named = (/** @type {'light'|'dark'} */ mode, /** @type {RegExp} */ like) => all(mode).filter((n) => like.test(n)).map((n) => colourIn(token(mode, n), mode)).find(Boolean) ?? undefined;
  const look = (/** @type {'light'|'dark'} */ mode) => {
    // A dark page rarely sets body again; it changes the tokens body already uses.
    const bg = colourIn(set[mode].bg ?? set.light.bg, mode) ?? named(mode, names.bg);
    const text = colourIn(set[mode].text ?? set.light.text, mode) ?? named(mode, names.text);
    const link = colourIn(set[mode].link ?? set.light.link, mode);
    const strongest = all(mode).map((n) => colourIn(token(mode, n), mode)).filter((c) => c && strength(c) >= reads.tokenStrength).sort((a, b) => strength(/** @type {string} */ (b)) - strength(/** @type {string} */ (a)))[0];
    const accent = (link && strength(link) >= reads.linkStrength ? link : undefined) ?? named(mode, names.accent) ?? strongest ?? undefined;
    /** @type {Found} */
    const found = {};
    if (bg) found.bg = bg;
    if (text) found.text = text;
    if (accent) found.accent = accent;
    return bg || text ? found : undefined;
  };

  /** @type {Reading} */
  const reading = {};
  const light = look('light');
  if (light) reading.light = light;
  const hasDark = tokens.dark.size > 0 || Object.keys(set.dark).length > 0;
  const dark = hasDark ? look('dark') : undefined;
  if (dark && dark.bg && dark.bg !== light?.bg) reading.dark = dark;
  if (face) reading.font = filled(face, 'light');
  const px = corners.map((c) => /^(\d*\.?\d+)(px|rem|em)$/.exec(filled(c, 'light'))).filter((m) => m !== null).map((m) => parseFloat(m[1]) * (m[2] === 'px' ? 1 : reads.rem)).filter((v) => v < reads.pill);
  if (reading.light || reading.dark) reading.shadows = shadowed;
  if (px.length) reading.radius = [...new Set(px)].sort((a, b) => px.filter((v) => v === b).length - px.filter((v) => v === a).length || a - b)[0];
  else if (reading.light && rules.length >= reads.enoughRules) reading.radius = 0;
  return reading;
}

/**
 * The stylesheets of a page: the addresses it links to, and the styles written in it.
 * @param {string} html
 * @param {string} base the page's own address
 * @returns {{links:string[],inline:string[]}}
 */
export function stylesheetsOf(html, base) {
  /** @type {string[]} */
  const links = [];
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const attr = (/** @type {string} */ name) => new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag)?.slice(1).find((x) => x !== undefined);
    if (!/\bstylesheet\b/i.test(attr('rel') ?? '')) continue;
    try {
      const url = new URL(attr('href') ?? '', base);
      // Only the web: a page must not be able to send Merlive to a file on this machine.
      if (url.protocol === 'http:' || url.protocol === 'https:') links.push(url.href);
    } catch {
      // An address that is not one is not a stylesheet.
    }
  }
  return { links, inline: [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]) };
}

/** A colour moved towards another, a little at a time, until it stands out from the page enough. */
function reach(/** @type {string} */ colour, /** @type {string} */ bg, /** @type {number} */ least, /** @type {string} */ toward) {
  for (let share = 0; share < 1; share += 0.05) {
    const c = mix(toward, colour, share);
    if (contrast(c, bg) >= least) return c;
  }
  return toward;
}

/**
 * A design file made from what was read, with nobody choosing a colour: the site's page, text, accent, face and
 * corner kept; what a diagram needs and a site does not have (a box's fill, lines, kinds of box) made from them;
 * anything that would break a colour rule put right, and said.
 * @param {Reading} reading
 * @param {{name:string,from:string}} about
 * @returns {{file:Record<string,unknown>,said:{found:string[],changed:string[],made:string[]}}}
 */
export function designOf(reading, about) {
  const said = { found: /** @type {string[]} */ ([]), changed: /** @type {string[]} */ ([]), made: /** @type {string[]} */ ([]) };
  /** @type {Record<string,unknown>} */
  const file = { name: about.name, from: about.from };
  if (!reading.light) {
    said.found.push(`no colours found in ${about.from}, so this is Merlive's own look, in light and dark`);
    return { file, said };
  }

  const look = (/** @type {Found} */ found, /** @type {string} */ mode) => {
    const lightPage = (/** @type {string} */ c) => contrast('#000000', c) >= contrast('#ffffff', c);
    const bg = found.bg ?? (found.text && lightPage(found.text) ? '#111111' : '#ffffff');
    const plain = lightPage(bg) ? '#000000' : '#ffffff';
    let text = found.text ?? plain;
    if (contrast(text, bg) < colourLimits.text) {
      said.changed.push(`text ${text} is ${contrast(text, bg).toFixed(1)} to 1 on the ${mode} page, too faint to read; using ${plain}`);
      text = plain;
    }
    const accent = reach(found.accent ?? text, bg, colourLimits.line, text);
    if (found.accent && accent !== found.accent) said.changed.push(`accent ${found.accent} is ${contrast(found.accent, bg).toFixed(1)} to 1 on the ${mode} page, too close to it for a line; using ${accent}, the same hue made to stand out`);
    const base = lightPage(bg) ? builtIn.light.kinds : /** @type {import('./design.mjs').Palette} */ (builtIn.dark).kinds;
    return {
      bg, text, accent,
      // A box is a little lighter than the page, the way a card is; on a white page it is white, with its edge.
      node: lightPage(bg) ? mix('#ffffff', bg, 0.6) : mix('#ffffff', bg, 0.06),
      stroke: mix(text, bg, 0.25),
      edge: reach(mix(text, bg, 0.45), bg, colourLimits.line, text),
      muted: reach(mix(text, bg, 0.65), bg, colourLimits.text, text),
      kinds: Object.fromEntries(Object.entries(base).map(([k, c]) => [k, reach(c, bg, colourLimits.line, text)])),
    };
  };

  const faces = (reading.font ?? '').split(',').map((f) => f.trim()).filter((f) => /^(['"]?)[\w -]+\1$/.test(f));
  if (faces.length && !generic.includes(faces[faces.length - 1])) faces.push('system-ui', 'sans-serif');
  const one = `page ${reading.light.bg ?? 'not set'}, text ${reading.light.text ?? 'not set'}, accent ${reading.light.accent ?? 'not set'}`;
  said.found.push(`${one}${faces.length ? `, face ${faces[0]}` : ''}, ${reading.dark ? 'in light and dark' : 'one look'}`);
  said.made.push('a box\'s fill and edge, lines and quiet text, from your page and text colours', 'the colours for kinds of box (decision, rework and the rest) are Merlive\'s, held to your page');

  // A diagram on somebody's site keeps that site's manners: a shadow only where the site has shadows, and the
  // page behind it left as the site made it.
  Object.assign(file, { modes: reading.dark ? 'both' : 'light', motion: builtIn.motion, depth: reading.shadows ? 'soft' : 'flat', ground: 'plain', output: { ...builtIn.output }, light: look(reading.light, 'light') });
  if (reading.dark) file.dark = look(reading.dark, 'dark');
  if (faces.length) file.font = faces.join(', ');
  if (reading.radius !== undefined) file.radius = Math.min(reads.mostCorner, Math.round(reading.radius));
  // What was made is held to the same rules as anything else, and what is left over is said, not hidden.
  for (const c of colourChecks(designFrom(file), Object.keys(builtIn.light.kinds))) for (const line of c.broken) said.changed.push(`still to settle: ${line}`);
  return { file, said };
}
