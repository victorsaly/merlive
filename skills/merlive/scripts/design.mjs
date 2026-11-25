// Why: one design, chosen once, drives every diagram. A design is a few colours, a face, a corner and how much
// may move. Placement is not in here: that is Merlive's own, and a design cannot switch it off.

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

const system = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** @type {Record<string, Design>} */
export const presets = {
  quiet: {
    name: 'quiet', font: system, weight: 500, radius: 8, motion: 'calm',
    light: { bg: '#f6f7f9', node: '#ffffff', stroke: '#c3cad5', text: '#18202b', muted: '#566070', edge: '#7a8696', accent: '#1f5fd1',
      kinds: { decision: '#8a5a00', terminal: '#0f7a5a', rework: '#b3391f', external: '#6b4fc4', data: '#0b7285', risk: '#b3261e' } },
    dark: { bg: '#11141a', node: '#1a1f27', stroke: '#3a4352', text: '#eceef2', muted: '#a3adbb', edge: '#7c8798', accent: '#7fb0ff',
      kinds: { decision: '#e0a93a', terminal: '#4fc79c', rework: '#ff8a70', external: '#b39bff', data: '#5cc8d8', risk: '#ff7a70' } },
  },
  bold: {
    name: 'bold', font: `"Archivo", "Helvetica Neue", Arial, ${system}`, weight: 700, radius: 2, motion: 'calm',
    light: { bg: '#101114', node: '#1b1d22', stroke: '#474d58', text: '#f3f1ea', muted: '#b4b8c0', edge: '#7b818d', accent: '#ffb000',
      kinds: { decision: '#6fb6ff', terminal: '#57d99a', rework: '#ff6b57', external: '#c8a6ff', data: '#5fd4e0', risk: '#ff6b57' } },
  },
  soft: {
    name: 'soft', font: `"Nunito", ui-rounded, ${system}`, weight: 700, radius: 22, motion: 'calm',
    light: { bg: '#eef2ec', node: '#ffffff', stroke: '#c3cfba', text: '#2b3327', muted: '#586352', edge: '#74826a', accent: '#5b46c9',
      kinds: { decision: '#8f5600', terminal: '#2c7d4f', rework: '#b8375f', external: '#5b46c9', data: '#1d7286', risk: '#b3261e' } },
  },
};

const HEX = /^#[0-9a-f]{6}$/i;
const rgb = (/** @type {string} */ hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** `share` of colour a laid over colour b, as a plain hex, so a drawing needs no colour maths from the browser. */
export function mix(/** @type {string} */ a, /** @type {string} */ b, /** @type {number} */ share) {
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((v, i) => Math.round(v * share + y[i] * (1 - share)).toString(16).padStart(2, '0')).join('')}`;
}

/** WCAG contrast between two colours, 1 to 21. */
export function contrast(/** @type {string} */ a, /** @type {string} */ b) {
  const lum = (/** @type {string} */ hex) => {
    const [r, g, bl] = rgb(hex).map((v) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

/** The fill of a box of some kind: its colour, thinned into the box's own fill. */
export const kindFill = (/** @type {Palette} */ p, /** @type {string} */ kind) => (p.kinds[kind] ? mix(p.kinds[kind], p.node, 0.13) : p.node);

/**
 * A preset by name, or a design file's JSON laid over the quiet preset. Throws with what to fix.
 * @param {string} name
 * @param {unknown} [file] the parsed design file, when there is one
 * @returns {Design}
 */
export function designFrom(name, file) {
  if (file === undefined) {
    if (!presets[name]) throw new Error(`No design called "${name}". Use one of: ${Object.keys(presets).join(', ')}, or the path of a design file.`);
    return presets[name];
  }
  const given = /** @type {Partial<Design> & {extends?: string}} */ (file);
  const base = presets[given.extends ?? 'quiet'] ?? presets.quiet;
  const palette = (/** @type {Palette} */ b, /** @type {Partial<Palette>|undefined} */ g) => ({ ...b, ...g, kinds: { ...b.kinds, ...g?.kinds } });
  /** @type {Design} */
  const d = { ...base, ...given, name: given.name ?? name, light: palette(base.light, given.light) };
  if (given.dark || (base.dark && !given.light)) d.dark = palette(base.dark ?? d.light, given.dark);
  else delete d.dark;
  for (const [mode, p] of /** @type {[string, Palette|undefined][]} */ ([['light', d.light], ['dark', d.dark]])) {
    if (!p) continue;
    for (const [key, value] of [...Object.entries(p).filter(([k]) => k !== 'kinds'), ...Object.entries(p.kinds).map(([k, v]) => [`kinds.${k}`, v])]) {
      if (typeof value !== 'string' || !HEX.test(value)) throw new Error(`Design "${d.name}": ${mode}.${key} must be a colour like #1f5fd1, not ${JSON.stringify(value)}.`);
    }
  }
  if (!['none', 'calm', 'lively'].includes(d.motion)) throw new Error(`Design "${d.name}": motion must be none, calm or lively.`);
  return d;
}
