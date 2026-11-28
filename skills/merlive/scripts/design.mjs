// Why: the colours are the user's. A project sets its own in a design file, once, and every diagram follows.
// What Merlive brings is one look of its own to start from, in light and dark, and the sums that hold any
// palette to account: can the words be read, and can the kinds of box be told apart, also by people who do
// not see red and green apart. Placement is not in here: a design cannot switch that off.

/**
 * @typedef {object} Palette
 * @property {string} bg the page behind the drawing
 * @property {string} node a box's fill
 * @property {string} stroke a box's edge
 * @property {string} text
 * @property {string} muted quieter words: link labels, the legend
 * @property {string} edge a line
 * @property {string} accent the selected thing and the path being shown
 * @property {Record<string,string>} kinds a colour for each kind of box that means something
 */
/**
 * @typedef {object} Design
 * @property {string} name
 * @property {string} font
 * @property {string} mono the face for code: the Mermaid a page shows, and the rows a class lists (an entity's table keeps the page's face)
 * @property {number} weight
 * @property {number} radius a box's corner, in px
 * @property {'none'|'calm'|'lively'} motion none: nothing moves. calm: one dot, when asked. lively: the path flows too.
 * @property {'flat'|'soft'} depth flat: boxes lie on the page. soft: a shadow lifts them off it.
 * @property {'plain'|'dots'} ground plain: the page as it is. dots: the grid the boxes are placed on, shown faintly.
 * @property {Palette} light
 * @property {Palette} [dark] left out, the diagram keeps its one look in both
 * @property {'light'|'dark'|'both'} modes which of the two a diagram is drawn in
 * @property {{format:'html'|'svg'|'both',steps:boolean,legend:boolean,source:boolean}} output what a diagram is
 *   written as and what its page carries: a live page, a still picture or both; the steps; the legend; the Mermaid
 * @property {string} [from] where the colours were read from, when setup read them
 */

/**
 * Merlive's own look, used until a project has a design file, and what a design file is laid over.
 * Sea water and coral, not the grey-blue every tool starts with. The kinds were chosen by measuring: in light,
 * six colours searched for the widest gap between the closest two in ordinary and red-green colour-blind
 * sight; in dark, six of the Okabe-Ito colours, the set most often recommended for colour-blind readers.
 * @type {Design}
 */
export const builtIn = {
  name: 'merlive', font: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', mono: 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace', weight: 500, radius: 8, motion: 'calm', depth: 'soft', ground: 'dots',
  modes: 'both', output: { format: 'html', steps: true, legend: true, source: true },
  light: { bg: '#eff6f5', node: '#ffffff', stroke: '#b3cbc7', text: '#0f2f2d', muted: '#48615e', edge: '#5e827e', accent: '#d6452b',
    kinds: { decision: '#b87a00', terminal: '#2c7d4f', rework: '#a8327a', external: '#5a4fcf', data: '#0a84c4', risk: '#7a1f12' } },
  dark: { bg: '#06191d', node: '#0d2a30', stroke: '#2b5560', text: '#e4f3f0', muted: '#9bbcb7', edge: '#6b9aa1', accent: '#ff8566',
    kinds: { decision: '#e69f00', terminal: '#009e73', rework: '#cc79a7', external: '#56b4e9', data: '#0072b2', risk: '#d55e00' } },
};

const HEX = /^#[0-9a-f]{6}$/i;
const rgb = (/** @type {string} */ hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
// sRGB as stored, to light as it adds up.
const linear = (/** @type {number} */ v) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);

/** `share` of colour a laid over colour b, as a plain hex, so a drawing needs no colour maths from the browser. */
export function mix(/** @type {string} */ a, /** @type {string} */ b, /** @type {number} */ share) {
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((v, i) => Math.round(v * share + y[i] * (1 - share)).toString(16).padStart(2, '0')).join('')}`;
}

/** WCAG contrast between two colours, 1 to 21. */
export function contrast(/** @type {string} */ a, /** @type {string} */ b) {
  const lum = (/** @type {string} */ hex) => {
    const [r, g, bl] = rgb(hex).map(linear);
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * How a colour arrives for three kinds of sight, as a matrix over linear red, green and blue: ordinary sight,
 * and the two common forms of red-green colour blindness at their fullest (no working red cones, no working
 * green cones). The figures are those of Machado, Oliveira and Fernandes (2009). Each row adds up to one, so a
 * grey stays the same grey.
 * @type {Record<'ordinary'|'protan'|'deutan', number[][]>}
 */
export const sights = {
  ordinary: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
};

/** A colour as CIELAB (lightness, green to red, blue to yellow), as one kind of sight receives it. */
function lab(/** @type {string} */ hex, /** @type {number[][]} */ sight) {
  const c = rgb(hex).map(linear);
  const [r, g, b] = sight.map((row) => Math.min(1, Math.max(0, row[0] * c[0] + row[1] * c[1] + row[2] * c[2])));
  // Linear sRGB to XYZ, each over the white of daylight (D65), then the cube-root curve of CIELAB.
  const f = (/** @type {number} */ t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047);
  const y = f(0.2126729 * r + 0.7151522 * g + 0.072175 * b);
  const z = f((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

/** How far apart two colours look to one kind of sight: 0 the same, about 100 black from white. */
export function apart(/** @type {string} */ a, /** @type {string} */ b, /** @type {keyof typeof sights} */ sight = 'ordinary') {
  const [p, q] = [lab(a, sights[sight]), lab(b, sights[sight])];
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

/** How strong a colour is, apart from how light: 0 for a grey, 100 and more for the purest. */
export const strength = (/** @type {string} */ hex) => Math.hypot(...lab(hex, sights.ordinary).slice(1));

// How much of the text colour shades every second row of a table: enough to follow a row across, in light and
// in dark, and little enough that its words read as they do on any box.
export const rowShade = 0.06;
/** The fill of a shaded row, over the fill of its box. */
export const shadedFill = (/** @type {Palette} */ p, /** @type {string} */ fill) => mix(p.text, fill, rowShade);

/** The fill of a box of some kind: its colour, thinned into the box's own fill. */
export const kindFill = (/** @type {Palette} */ p, /** @type {string} */ kind) => (p.kinds[kind] ? mix(p.kinds[kind], p.node, 0.13) : p.node);

/**
 * A design that also knows the classes a diagram's author made up. A class the design has no colour for takes
 * the design's own colour nearest to the one its author chose (a red they called "red" becomes the design's
 * risk), so what they meant is kept and the palette stays the project's.
 * @param {Design} design
 * @param {{nodes:{kind:string}[],classes:Record<string,string>}} model
 * @returns {Design}
 */
export function designWith(design, model) {
  const strangers = [...new Set([...model.nodes.map((n) => n.kind), ...model.edges.flatMap((e) => (e.kind ? [e.kind] : []))])].filter((k) => !design.light.kinds[k] && HEX.test(model.classes[k] ?? ''));
  if (!strangers.length) return design;
  const present = [...new Set([...model.nodes.map((n) => n.kind), ...model.edges.flatMap((e) => (e.kind ? [e.kind] : []))])];
  const more = (/** @type {Palette} */ p) => {
    // A colour one of the design's own kinds has in this diagram would make two kinds one to the eye, so the
    // nearest of the rest is taken; only when every colour is taken is one shared. Two colours an author chose
    // may still come to the same one: they chose them alike.
    const taken = new Set(present.flatMap((k) => (p.kinds[k] ? [p.kinds[k]] : [])));
    const nearest = (/** @type {string} */ c) => {
      const all = Object.values(p.kinds), free = all.filter((x) => !taken.has(x));
      return (free.length ? free : all).reduce((a, b) => (apart(b, c) < apart(a, c) ? b : a));
    };
    return { ...p, kinds: { ...p.kinds, ...Object.fromEntries(strangers.map((k) => [k, nearest(model.classes[k])])) } };
  };
  return { ...design, light: more(design.light), ...(design.dark ? { dark: more(design.dark) } : {}) };
}

// A colour weaker than this, apart from how light it is, is a grey: there is no hue its author meant to keep.
// A pale highlight Mermaid's own pages use (rgb(191,223,255)) is 19; a light grey is under 1.
const greyBelow = 8;
/** A colour's hue as CIELAB has it, in degrees: hues the eye takes as near are near here. */
const hueAngle = (/** @type {string} */ hex) => {
  const [, a, b] = lab(hex, sights.ordinary);
  return ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
};

/**
 * Which of the design's own kinds' colours to draw each colour in that an author gave a highlight or a group of a
 * sequence: the nearest in hue, since such colours are pale and only their hue says anything. A colour after the
 * first takes the nearest not yet taken, so colours an author told apart stay apart while there are colours to
 * spare. A grey keeps the design's own tint. Chosen in the design's first look, and drawn in each look's colour
 * of that kind.
 * @param {Design} design
 * @param {string[]} colours as hex, in the order they were written
 * @returns {Record<string, string|undefined>} each colour to a kind of the design, or to nothing
 */
export function huesFor(design, colours) {
  const p = looksOf(design)[0][1], kinds = Object.keys(p.kinds), taken = new Set();
  /** @type {Record<string, string|undefined>} */
  const out = {};
  for (const c of colours) {
    if (c in out) continue;
    const from = kinds.filter((k) => !taken.has(k));
    if (!HEX.test(c) || strength(c) < greyBelow || !kinds.length) {
      out[c] = undefined;
      continue;
    }
    const gap = (/** @type {string} */ k) => {
      const d = Math.abs(hueAngle(p.kinds[k]) - hueAngle(c));
      return Math.min(d, 360 - d);
    };
    const k = (from.length ? from : kinds).reduce((a, b) => (gap(b) < gap(a) ? b : a));
    taken.add(k);
    out[c] = k;
  }
  return out;
}

// What any palette is held to. Each is set out in docs/PLACEMENT.md.
export const colourLimits = {
  text: 4.5, // WCAG AA for words
  line: 3, // WCAG AA for lines and edges of boxes
  // The least two kinds' colours may differ, in CIELAB. The sets made for colour-blind readers (Okabe-Ito, Paul
  // Tol's bright) keep their closest pair at 16 to 17, so they pass with room; two outlines closer than this
  // read as one colour with a legend beside them.
  tellApart: 12,
};

/** The looks a design is drawn in, each with its name: light, dark or both. */
export const looksOf = (/** @type {Design} */ d) =>
  /** @type {['light'|'dark', Palette][]} */ ([['light', d.light], ['dark', d.dark]]).filter(([mode, p]) => p && (d.modes === 'both' || d.modes === mode));

/**
 * The two colour rules, for the kinds of box a diagram uses. Used before a diagram is written, and by the setup
 * page as colours are changed, so both say the same.
 * @param {Design} design
 * @param {string[]} kinds
 * @param {string[]} [shaded] the kinds of box that have a shaded row: a table of two rows or more
 * @returns {{id:'D1'|'D2',broken:string[]}[]}
 */
export function colourChecks(design, kinds, shaded = []) {
  /** @type {string[]} */
  const faint = [];
  /** @type {string[]} */
  const alike = [];
  for (const [mode, p] of looksOf(design)) {
    const need = (/** @type {string} */ what, /** @type {string} */ a, /** @type {string} */ b, /** @type {number} */ least) => {
      const c = contrast(a, b);
      if (c < least) faint.push(`${mode}: ${what} is ${c.toFixed(1)} to 1, and needs ${least}`);
    };
    for (const k of kinds) need(`text on a ${k} box`, p.text, kindFill(p, k), colourLimits.text);
    for (const k of shaded) need(`text on a shaded row of a ${k} box`, p.text, shadedFill(p, kindFill(p, k)), colourLimits.text);
    need('quiet text on the page', p.muted, p.bg, colourLimits.text);
    need('a line on the page', p.edge, p.bg, colourLimits.line);
    need('the accent on the page', p.accent, p.bg, colourLimits.line);
    for (const k of kinds) if (p.kinds[k]) need(`the edge of a ${k} box`, p.kinds[k], p.bg, colourLimits.line);

    // Only kinds the design gives a colour: the rest share the plain box on purpose.
    const coloured = kinds.filter((k) => p.kinds[k]);
    coloured.forEach((a, i) => coloured.slice(i + 1).forEach((b) => {
      const plain = apart(p.kinds[a], p.kinds[b]);
      const redGreen = Math.min(apart(p.kinds[a], p.kinds[b], 'protan'), apart(p.kinds[a], p.kinds[b], 'deutan'));
      // Said once for a pair: as everyone sees it if that is already too close, else as red-green sight does.
      if (plain < colourLimits.tellApart) alike.push(`${mode}: ${a} and ${b} boxes look alike (${Math.round(plain)} apart, and need ${colourLimits.tellApart})`);
      else if (redGreen < colourLimits.tellApart) alike.push(`${mode}: ${a} and ${b} boxes look alike to someone who does not see red and green apart (${Math.round(redGreen)} apart, and need ${colourLimits.tellApart})`);
    }));
  }
  return [{ id: 'D1', broken: faint }, { id: 'D2', broken: alike }];
}

/**
 * Merlive's own look, or a project's design file laid over it. Throws with what to fix.
 * @param {unknown} [file] the parsed design file, when there is one
 * @returns {Design}
 */
export function designFrom(file) {
  if (file === undefined) return builtIn;
  if (typeof file !== 'object' || file === null || Array.isArray(file)) throw new Error('A design file holds one JSON object, like { "light": { "accent": "#0a5cc2" } }.');
  const given = /** @type {Partial<Design>} */ (file);
  const palette = (/** @type {Palette} */ b, /** @type {Partial<Palette>|undefined} */ g) => ({ ...b, ...g, kinds: { ...b.kinds, ...g?.kinds } });
  /** @type {Design} */
  const d = { ...builtIn, ...given, name: given.name ?? 'your', light: palette(builtIn.light, given.light), output: { ...builtIn.output, ...given.output } };
  // A project that sets its light colours and says nothing of dark gets one look, not its own light beside
  // Merlive's dark. A file that touches no colour keeps both.
  if (given.dark) d.dark = palette(/** @type {Palette} */ (builtIn.dark), given.dark);
  else if (given.light) delete d.dark;
  const say = (/** @type {string} */ what) => new Error(`Design "${d.name}": ${what}`);
  for (const [mode, p] of /** @type {[string, Palette|undefined][]} */ ([['light', d.light], ['dark', d.dark]])) {
    if (!p) continue;
    for (const [key, value] of [...Object.entries(p).filter(([k]) => k !== 'kinds'), ...Object.entries(p.kinds).map(([k, v]) => [`kinds.${k}`, v])]) {
      if (typeof value !== 'string' || !HEX.test(value)) throw say(`${mode}.${key} must be a colour like #1f5fd1, not ${JSON.stringify(value)}.`);
    }
    // A kind's name becomes part of the page's styles, so it is held to what a class name in Mermaid can be,
    // a hyphen between letters (read-only) and all, as the readers take one.
    for (const k of Object.keys(p.kinds)) if (!/^\w+(?:-\w+)*$/.test(k)) throw say(`${mode}.kinds has "${k}"; a kind is named in letters, digits, _ and a hyphen between them only.`);
  }
  if (!['none', 'calm', 'lively'].includes(d.motion)) throw say('motion must be none, calm or lively.');
  if (!['flat', 'soft'].includes(d.depth)) throw say('depth must be flat or soft.');
  if (!['plain', 'dots'].includes(d.ground)) throw say('ground must be plain or dots.');
  // The face is written into the page's styles as it is, so it may hold only what a list of faces holds.
  if (typeof d.font !== 'string' || !/^[\w\s,'"-]+$/.test(d.font)) throw say('font must be a list of faces, like "Inter", system-ui, sans-serif.');
  if (typeof d.mono !== 'string' || !/^[\w\s,'"-]+$/.test(d.mono)) throw say('mono must be a list of faces, like "Courier Prime", ui-monospace, monospace.');
  if (typeof d.radius !== 'number' || d.radius < 0 || d.radius > 40) throw say('radius must be a number of pixels from 0 to 40.');
  if (typeof d.weight !== 'number' || d.weight < 100 || d.weight > 900) throw say('weight must be a number from 100 to 900.');
  if (given.modes === undefined) d.modes = d.dark ? 'both' : 'light';
  else if (!['light', 'dark', 'both'].includes(d.modes)) throw say('modes must be light, dark or both.');
  else if (d.modes !== 'light' && !d.dark) throw say(`modes is ${d.modes}, and there are no dark colours. Add "dark", or set modes to light.`);
  if (!['html', 'svg', 'both'].includes(d.output.format)) throw say('output.format must be html, svg or both.');
  for (const key of /** @type {const} */ (['steps', 'legend', 'source'])) if (typeof d.output[key] !== 'boolean') throw say(`output.${key} must be true or false.`);
  return d;
}
