// Why: an author who draws a database as a cylinder, or a question as a rhombus, said something with the shape.
// Merlive keeps it. Every shape is drawn inside the one footprint all boxes of a diagram share, so the grid
// holds and no shape is bigger than its neighbours; what changes is the outline, how much room it leaves for
// words, and where a line meets it. Layout and drawing both ask here, so a line always ends on the outline.
// Pure.

/** @typedef {'box'|'pill'|'diamond'|'hexagon'|'cylinder'|'subroutine'|'lean-right'|'lean-left'|'trapezoid'|'trapezoid-alt'|'double-circle'|'flag'|'note'|'point'|'bar'|'bar-upright'|'cell'|'arrow-right'|'arrow-left'|'arrow-up'|'arrow-down'|'arrow-x'|'arrow-y'} Shape */
/** @typedef {'top'|'bottom'|'left'|'right'} Side */

/** @type {Shape[]} */
export const shapes = ['box', 'pill', 'diamond', 'hexagon', 'cylinder', 'subroutine', 'lean-right', 'lean-left', 'trapezoid', 'trapezoid-alt', 'double-circle', 'flag', 'note', 'point', 'bar', 'bar-upright', 'cell', 'arrow-right', 'arrow-left', 'arrow-up', 'arrow-down', 'arrow-x', 'arrow-y'];

// What is measured, named once.
export const form = {
  pad: 28, // px a plain box keeps clear of its words, left and right together
  cellPad: 8, // the same for a cell: a field of a packet a bit wide is a few letters across, as Mermaid's is, and the cells round it say where it ends
  cut: 0.36, // how much of a hexagon's height its corners are cut by
  hexagonPad: 52, // a hexagon's cut corners leave less room for words
  diamondRoom: 0.5, // the share of a rhombus's width that two lines of words can use: half way up, it is half as wide
  slant: 14, // px a leaning side leans across the height of the box
  cap: 7, // px from the rim of a cylinder to the top of its curve
  rail: 8, // px from the edge of a subroutine to the line inside it
  ring: 4, // px between the two lines of a double circle
  notch: 14, // px a flag is cut in at the middle of its left side
  pillMost: 30, // px a pill's ends are rounded at most: a taller one (it says a sentence, or lists things) keeps flat sides for its words
  point: 7, // px from the middle of a point to its edge: a dot where lines meet and part, a little wider than a line's turn
  bar: 8, // px a fork's or a join's bar is thick: a line and a half of a box's border, so it reads as a bar and not a line
  arrowHead: 16, // px from the back of a block arrow's head to its tip
  arrowBroad: 128, // px a block arrow that points up or down is broad at most: in a wider cell it stays an arrow, in the middle of it
  arrowShaft: 0.6, // the share of a block arrow's breadth its shaft takes: the head is wider, or it is no arrow
  fold: 12, // px of a note's top right corner that is folded over: enough to see, not enough to take a word's room
};

/** How far the corners of a hexagon of this height are cut. */
export const cut = (/** @type {number} */ h) => Math.round(h * form.cut);

/**
 * A block arrow, as which ends have a head and which way it lies: an arrow that points up or down is one that
 * points across, turned a quarter.
 * @param {Shape} shape
 * @returns {{upright:boolean,first:boolean,last:boolean}|null} first: a head at the left or the top; last: at the right or the bottom
 */
const arrowOf = (shape) => {
  switch (shape) {
    case 'arrow-right': return { upright: false, first: false, last: true };
    case 'arrow-left': return { upright: false, first: true, last: false };
    case 'arrow-x': return { upright: false, first: true, last: true };
    case 'arrow-down': return { upright: true, first: false, last: true };
    case 'arrow-up': return { upright: true, first: true, last: false };
    case 'arrow-y': return { upright: true, first: true, last: true };
    default: return null;
  }
};

/**
 * The outline of a block arrow lying across, as corners: `long` px from back to tip and `broad` px across. A
 * head is a triangle as broad as the box; the shaft between is narrower. An end with no head is the flat back
 * of the shaft.
 */
const arrowCorners = (/** @type {number} */ long, /** @type {number} */ broad, /** @type {boolean} */ first, /** @type {boolean} */ last) => {
  const head = Math.min(form.arrowHead, long / 2), shoulder = (broad * (1 - form.arrowShaft)) / 2, mid = broad / 2;
  /** @type {[number, number][]} */
  const top = [], bottom = [];
  if (first) top.push([0, mid], [head, 0], [head, shoulder]);
  else top.push([0, shoulder]);
  if (last) top.push([long - head, shoulder], [long - head, 0], [long, mid]);
  else top.push([long, shoulder]);
  if (last) bottom.push([long - head, broad], [long - head, broad - shoulder]);
  else bottom.push([long, broad - shoulder]);
  if (first) bottom.push([head, broad - shoulder], [head, broad]);
  else bottom.push([0, broad - shoulder]);
  return [...top, ...bottom];
};

/** How far in the outline of a block arrow lying across is: from its tip or back at `a` off the middle (`ends`), or from its long side at `off` along it. */
const arrowInset = (/** @type {number} */ long, /** @type {number} */ broad, /** @type {boolean} */ first, /** @type {boolean} */ last, /** @type {'first'|'last'|'side'} */ where, /** @type {number} */ off) => {
  const head = Math.min(form.arrowHead, long / 2), shoulder = (broad * (1 - form.arrowShaft)) / 2, a = Math.min(Math.abs(off), broad / 2);
  if (where !== 'side') {
    // An end with a head is its tip in the middle and falls back to the head's back at its corners; one with
    // none is flat across the shaft, and outside the shaft there is nothing until the far head, or at all.
    if (where === 'first' ? first : last) return (a / (broad / 2)) * head;
    return a <= broad / 2 - shoulder ? 0 : (where === 'first' ? last : first) ? long - head : long;
  }
  // Along a long side: the shaft is in by its shoulder; a head rises from the middle line at its tip to the edge at its back.
  const fromFirst = off + long / 2, fromLast = long / 2 - off;
  if (first && fromFirst < head) return (broad / 2) * (1 - Math.max(0, fromFirst) / head);
  if (last && fromLast < head) return (broad / 2) * (1 - Math.max(0, fromLast) / head);
  return shoulder;
};

/** The px a shape of this width leaves for a line of words. */
export function roomIn(/** @type {Shape} */ shape, /** @type {number} */ w) {
  switch (shape) {
    case 'diamond': return w * form.diamondRoom;
    case 'hexagon': return w - form.hexagonPad;
    case 'subroutine': return w - form.pad - 2 * form.rail;
    case 'lean-right': case 'lean-left': case 'flag': return w - form.pad - form.slant;
    case 'trapezoid': case 'trapezoid-alt': return w - form.pad - 2 * form.slant + 12;
    case 'double-circle': return w - form.pad - 2 * form.ring;
    case 'arrow-right': case 'arrow-left': return w - form.pad - form.arrowHead;
    case 'arrow-x': return w - form.pad - 2 * form.arrowHead;
    // An arrow that points up or down keeps its words in its shaft, which is narrower than its box.
    case 'arrow-up': case 'arrow-down': case 'arrow-y': return Math.min(w, form.arrowBroad) * form.arrowShaft - 12;
    case 'cell': return w - form.cellPad;
    default: return w - form.pad;
  }
}

/** Where the middle of a shape's words sits, from the middle of its box: lower in a cylinder, under its rim; further right in a flag, past its notch. */
/**
 * A bar lies across the flow: flat in a flow drawn top to bottom, upright in one drawn left to right. A flow may be
 * turned from how it was written, so a bar is drawn for the way it is laid out, which only layout knows.
 * @param {Shape} shape
 * @param {'TD'|'LR'} direction as it is laid out
 * @returns {Shape}
 */
export const asDrawn = (shape, direction) => (shape === 'bar' && direction === 'LR' ? 'bar-upright' : shape);

export function wordsAt(/** @type {Shape} */ shape, /** @type {number} */ _h) {
  // A block arrow's words are in its shaft, which is off the middle by half of the one head it has.
  const arrow = arrowOf(shape), back = arrow && arrow.first !== arrow.last ? (arrow.last ? -form.arrowHead / 2 : form.arrowHead / 2) : 0;
  if (arrow) return arrow.upright ? { dx: 0, dy: back } : { dx: back, dy: 0 };
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
  const arrow = arrowOf(shape);
  if (arrow) {
    // The sides an arrow points along are its ends; the other two are its long sides.
    // An upright arrow in a cell wider than an arrow is drawn in the middle of it: its long sides are that much further in.
    const end = arrow.upright ? flat : !flat, long = arrow.upright ? h : w, broad = arrow.upright ? Math.min(w, form.arrowBroad) : h, aside = arrow.upright ? (w - broad) / 2 : 0;
    const where = !end ? 'side' : side === 'left' || side === 'top' ? 'first' : 'last';
    return within(arrowInset(long, broad, arrow.first, arrow.last, where, off) + (end ? 0 : aside));
  }
  switch (shape) {
    case 'diamond': return within((a / (along / 2)) * (across / 2));
    // A point is a dot in the middle of its box: a line runs on to it, or, past its edge, to the line through its middle.
    case 'point': return across / 2 - (a < form.point ? Math.sqrt(form.point ** 2 - a ** 2) : 0);
    // A bar fills its box along the flow's breadth: a line from the side it faces runs on to it, and one at its
    // end meets it there.
    case 'bar': return flat ? across / 2 - form.bar / 2 : 0;
    case 'bar-upright': return flat ? 0 : across / 2 - form.bar / 2;
    case 'pill': case 'double-circle': {
      // The ends are half circles: a side port meets one; a top port only past where the flat part ends.
      const r = Math.min(h / 2, form.pillMost), past = Math.max(0, a - ((flat ? w : h) / 2 - r));
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
  const arrow = arrowOf(shape);
  if (arrow) {
    const broad = Math.min(w, form.arrowBroad), aside = (w - broad) / 2;
    const corners = arrow.upright ? arrowCorners(h, broad, arrow.first, arrow.last).map(([a, b]) => /** @type {[number, number]} */ ([l + aside + b, t + a])) : arrowCorners(w, h, arrow.first, arrow.last).map(([a, b]) => /** @type {[number, number]} */ ([l + a, t + b]));
    return { main: polygon(corners), more: [] };
  }
  switch (shape) {
    case 'pill': return { main: rect('mv-shape mv-pill', 0, Math.min(h / 2, form.pillMost)), more: [] };
    // A bar is solid, in the colour of the lines it parts or gathers: a rule render.mjs adds where there is a bar.
    case 'bar': return { main: `<rect class="mv-shape mv-bar" x="${n(l)}" y="${n(y - form.bar / 2)}" width="${n(w)}" height="${n(form.bar)}" rx="2"/>`, more: [] };
    case 'bar-upright': return { main: `<rect class="mv-shape mv-bar" x="${n(x - form.bar / 2)}" y="${n(t)}" width="${n(form.bar)}" height="${n(h)}" rx="2"/>`, more: [] };
    case 'point': return { main: `<rect class="mv-shape mv-point" x="${n(x - form.point)}" y="${n(y - form.point)}" width="${n(2 * form.point)}" height="${n(2 * form.point)}" rx="${n(form.point)}"/>`, more: [] };
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
