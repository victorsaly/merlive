// Why: an author who draws a database as a cylinder, or a question as a rhombus, said something with the shape.
// Merlive keeps it. Every shape is drawn inside the one footprint all boxes of a diagram share, so the grid
// holds and no shape is bigger than its neighbours; what changes is the outline, how much room it leaves for
// words, and where a line meets it. Layout and drawing both ask here, so a line always ends on the outline.
// Pure.

/** @typedef {'box'|'pill'|'diamond'|'hexagon'|'cylinder'|'subroutine'|'lean-right'|'lean-left'|'trapezoid'|'trapezoid-alt'|'double-circle'|'flag'|'note'} Shape */
/** @typedef {'top'|'bottom'|'left'|'right'} Side */

/** @type {Shape[]} */
export const shapes = ['box', 'pill', 'diamond', 'hexagon', 'cylinder', 'subroutine', 'lean-right', 'lean-left', 'trapezoid', 'trapezoid-alt', 'double-circle', 'flag', 'note'];

// What is measured, named once.
export const form = {
  pad: 28, // px a plain box keeps clear of its words, left and right together
  cut: 0.36, // how much of a hexagon's height its corners are cut by
  hexagonPad: 52, // a hexagon's cut corners leave less room for words
  diamondRoom: 0.5, // the share of a rhombus's width that two lines of words can use: half way up, it is half as wide
  slant: 14, // px a leaning side leans across the height of the box
  cap: 7, // px from the rim of a cylinder to the top of its curve
  rail: 8, // px from the edge of a subroutine to the line inside it
  ring: 4, // px between the two lines of a double circle
  notch: 14, // px a flag is cut in at the middle of its left side
  fold: 12, // px of a note's top right corner that is folded over: enough to see, not enough to take a word's room
};

/** How far the corners of a hexagon of this height are cut. */
export const cut = (/** @type {number} */ h) => Math.round(h * form.cut);

/** The px a shape of this width leaves for a line of words. */
export function roomIn(/** @type {Shape} */ shape, /** @type {number} */ w) {
  switch (shape) {
    case 'diamond': return w * form.diamondRoom;
    case 'hexagon': return w - form.hexagonPad;
    case 'subroutine': return w - form.pad - 2 * form.rail;
    case 'lean-right': case 'lean-left': case 'flag': return w - form.pad - form.slant;
    case 'trapezoid': case 'trapezoid-alt': return w - form.pad - 2 * form.slant + 12;
    case 'double-circle': return w - form.pad - 2 * form.ring;
    default: return w - form.pad;
  }
}

/** Where the middle of a shape's words sits, from the middle of its box: lower in a cylinder, under its rim; further right in a flag, past its notch. */
export function wordsAt(/** @type {Shape} */ shape, /** @type {number} */ _h) {
  return { dx: shape === 'flag' ? form.notch / 2 : 0, dy: shape === 'cylinder' ? form.cap / 2 : 0 };
}

/**
 * How far in from the edge of its box a shape's outline is, where a line meets it: `off` px along the side
 * from its middle (down or to the right is more). A line that stopped at the box would stop short of a
 * rhombus; this is how much further it has to go.
 * @param {Shape} shape
 * @param {Side} side
 * @param {number} off
 * @param {number} w
 * @param {number} h
 */
export function inset(shape, side, off, w, h) {
  const flat = side === 'top' || side === 'bottom';
  const along = flat ? w : h, across = flat ? h : w;
  const a = Math.min(Math.abs(off), along / 2), s = form.slant;
  /** How far a side that leans is in, at this height: nothing at the end it leans away from. */
  const lean = (/** @type {boolean} */ inAtTop) => s * (inAtTop ? 0.5 - off / h : 0.5 + off / h);
  const within = (/** @type {number} */ v) => Math.max(0, Math.min(across / 2, v));
  switch (shape) {
    case 'diamond': return within((a / (along / 2)) * (across / 2));
    case 'pill': case 'double-circle': {
      // The ends are half circles: a side port meets one; a top port only past where the flat part ends.
      const r = h / 2, past = flat ? Math.max(0, a - (w / 2 - r)) : a;
      return within(r - Math.sqrt(Math.max(0, r * r - past * past)));
    }
    case 'hexagon': {
      const c = cut(h);
      return within(flat ? (Math.max(0, a - (w / 2 - c)) / c) * (h / 2) : (a / (h / 2)) * c);
    }
    case 'lean-right': return flat ? 0 : within(Math.max(0, lean(side === 'left')));
    case 'lean-left': return flat ? 0 : within(Math.max(0, lean(side === 'right')));
    case 'trapezoid': return flat ? 0 : within(Math.max(0, lean(true)));
    case 'trapezoid-alt': return flat ? 0 : within(Math.max(0, lean(false)));
    case 'flag': return side === 'left' ? within(form.notch * (1 - a / (h / 2))) : 0;
    // Only the folded corner is in from the box: the last few px of the top, and the first few of the right side.
    case 'note': return side === 'top' ? within(Math.max(0, off - (w / 2 - form.fold))) : side === 'right' ? within(Math.max(0, -off - (h / 2 - form.fold))) : 0;
    case 'cylinder': return flat ? within(form.cap * (1 - Math.sqrt(Math.max(0, 1 - (a / (w / 2)) ** 2)))) : 0;
    default: return 0;
  }
}

const n = (/** @type {number} */ v) => String(Math.round(v * 10) / 10);

/**
 * A shape's outline as SVG, in a box whose top left corner is (l, t). `main` is filled; `more` are the lines
 * that only some shapes have (a cylinder's rim, a subroutine's rails, a double circle's second line).
 * @param {Shape} shape
 * @param {number} l
 * @param {number} t
 * @param {number} w
 * @param {number} h
 * @param {number} radius the corner the design gives a plain box
 * @returns {{main:string,more:string[]}}
 */
export function outlineOf(shape, l, t, w, h, radius) {
  const r = l + w, u = t + h, x = l + w / 2, y = t + h / 2, s = form.slant;
  const polygon = (/** @type {[number,number][]} */ pts) => `<polygon class="mv-shape" points="${pts.map(([a, b]) => `${n(a)},${n(b)}`).join(' ')}"/>`;
  const rect = (/** @type {string} */ cls, /** @type {number} */ by, /** @type {number} */ rx) => `<rect class="${cls}" x="${n(l + by)}" y="${n(t + by)}" width="${n(w - 2 * by)}" height="${n(h - 2 * by)}" rx="${n(rx)}"/>`;
  const corner = Math.min(radius, h / 2);
  switch (shape) {
    case 'pill': return { main: rect('mv-shape mv-pill', 0, h / 2), more: [] };
    case 'double-circle': return { main: rect('mv-shape mv-pill', 0, h / 2), more: [rect('mv-shape mv-detail mv-pill', form.ring, h / 2 - form.ring)] };
    case 'diamond': return { main: polygon([[x, t], [r, y], [x, u], [l, y]]), more: [] };
    case 'hexagon': {
      const c = cut(h);
      return { main: polygon([[l + c, t], [r - c, t], [r, y], [r - c, u], [l + c, u], [l, y]]), more: [] };
    }
    case 'lean-right': return { main: polygon([[l + s, t], [r, t], [r - s, u], [l, u]]), more: [] };
    case 'lean-left': return { main: polygon([[l, t], [r - s, t], [r, u], [l + s, u]]), more: [] };
    case 'trapezoid': return { main: polygon([[l + s, t], [r - s, t], [r, u], [l, u]]), more: [] };
    case 'trapezoid-alt': return { main: polygon([[l, t], [r, t], [r - s, u], [l + s, u]]), more: [] };
    case 'flag': return { main: polygon([[l, t], [r, t], [r, u], [l, u], [l + form.notch, y]]), more: [] };
    case 'note': {
      const f = Math.min(form.fold, h / 2);
      return { main: polygon([[l, t], [r - f, t], [r, t + f], [r, u], [l, u]]), more: [`<path class="mv-shape mv-detail" d="M${n(r - f)},${n(t)}V${n(t + f)}H${n(r)}"/>`] };
    }
    case 'cylinder': {
      const c = form.cap, rx = n(w / 2);
      return {
        main: `<path class="mv-shape" d="M${n(l)},${n(t + c)}A${rx},${c} 0 0 1 ${n(r)},${n(t + c)}V${n(u - c)}A${rx},${c} 0 0 1 ${n(l)},${n(u - c)}Z"/>`,
        more: [`<path class="mv-shape mv-detail" d="M${n(l)},${n(t + c)}A${rx},${c} 0 0 0 ${n(r)},${n(t + c)}"/>`],
      };
    }
    case 'subroutine': return {
      main: rect('mv-shape', 0, corner),
      more: [`<path class="mv-shape mv-detail" d="M${n(l + form.rail)},${n(t)}V${n(u)}M${n(r - form.rail)},${n(t)}V${n(u)}"/>`],
    };
    default: return { main: rect('mv-shape', 0, corner), more: [] };
  }
}
