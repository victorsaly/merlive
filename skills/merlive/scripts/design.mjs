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
 * @property {number} weight
 * @property {number} radius a box's corner, in px
 * @property {'none'|'calm'|'lively'} motion none: nothing moves. calm: one dot, when asked. lively: the path flows too.
 * @property {Palette} light
 * @property {Palette} [dark] left out, the diagram keeps its one look in both
 */

/**
 * Merlive's own look, used until a project has a design file, and what a design file is laid over.
 * Sea water and coral, not the grey-blue every tool starts with. The kinds were chosen by measuring: in light,
 * six colours searched for the widest gap between the closest two in ordinary and red-green colour-blind
 * sight; in dark, six of the Okabe-Ito colours, the set most often recommended for colour-blind readers.
 * @type {Design}
 */
export const builtIn = {
  name: 'merlive', font: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', weight: 500, radius: 8, motion: 'calm',
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

/** The fill of a box of some kind: its colour, thinned into the box's own fill. */
export const kindFill = (/** @type {Palette} */ p, /** @type {string} */ kind) => (p.kinds[kind] ? mix(p.kinds[kind], p.node, 0.13) : p.node);

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
  const d = { ...builtIn, ...given, name: given.name ?? 'your', light: palette(builtIn.light, given.light) };
  // A project that sets its light colours and says nothing of dark gets one look, not its own light beside
  // Merlive's dark. A file that touches no colour keeps both.
  if (given.dark) d.dark = palette(/** @type {Palette} */ (builtIn.dark), given.dark);
  else if (given.light) delete d.dark;
  for (const [mode, p] of /** @type {[string, Palette|undefined][]} */ ([['light', d.light], ['dark', d.dark]])) {
    if (!p) continue;
    for (const [key, value] of [...Object.entries(p).filter(([k]) => k !== 'kinds'), ...Object.entries(p.kinds).map(([k, v]) => [`kinds.${k}`, v])]) {
      if (typeof value !== 'string' || !HEX.test(value)) throw new Error(`Design "${d.name}": ${mode}.${key} must be a colour like #1f5fd1, not ${JSON.stringify(value)}.`);
    }
  }
  if (!['none', 'calm', 'lively'].includes(d.motion)) throw new Error(`Design "${d.name}": motion must be none, calm or lively.`);
  return d;
}
