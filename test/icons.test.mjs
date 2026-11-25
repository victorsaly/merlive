// Why: an icon is a drawing nobody reads as code, so the tests hold what can be held: every one stays on its
// grid and is made of plain strokes, every name an author might write leads somewhere or to nothing, and nothing
// of anybody else's mark is drawn.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { aliases, iconFor, iconMeasure, icons } from '../skills/merlive/scripts/icons.mjs';

const asked = ['user', 'users', 'database', 'server', 'cloud', 'gear', 'check', 'xmark', 'envelope', 'file', 'folder', 'lock', 'key', 'search', 'home', 'globe', 'code', 'bell', 'clock', 'calendar', 'truck', 'cart', 'credit-card', 'warning', 'ban', 'bolt', 'bug', 'robot', 'mobile', 'laptop', 'phone', 'comment', 'chart', 'download', 'upload', 'trash', 'pen', 'plus', 'minus', 'question', 'info', 'star', 'heart', 'money', 'box', 'building', 'link', 'list', 'table', 'tag', 'wrench', 'shield', 'play', 'stop', 'pause', 'refresh', 'filter', 'eye', 'print', 'camera', 'flag', 'book'];

/** A path as the commands it is made of: each a letter and its numbers. */
const commandsOf = (/** @type {string} */ d) => [...d.matchAll(/([A-Za-z])([^A-Za-z]*)/g)].map((m) => ({ letter: m[1], numbers: m[2].trim().split(/[\s,]+/).filter(Boolean).map(Number), written: m[2] }));

/** Points along an arc, from the two ends SVG gives to the middle it is drawn round (the SVG note's own sums). */
function alongArc(/** @type {{x:number,y:number}} */ from, /** @type {number[]} */ [rx, ry, turn, large, sweep, x, y]) {
  const phi = (turn * Math.PI) / 180, cos = Math.cos(phi), sin = Math.sin(phi);
  const dx = (from.x - x) / 2, dy = (from.y - y) / 2;
  const x1 = cos * dx + sin * dy, y1 = -sin * dx + cos * dy;
  const grow = Math.max(1, Math.sqrt((x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry)));
  const a = rx * grow, b = ry * grow;
  const k = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, (a * a * b * b - a * a * y1 * y1 - b * b * x1 * x1) / (a * a * y1 * y1 + b * b * x1 * x1)));
  const cx1 = (k * a * y1) / b, cy1 = (-k * b * x1) / a;
  const cx = cos * cx1 - sin * cy1 + (from.x + x) / 2, cy = sin * cx1 + cos * cy1 + (from.y + y) / 2;
  const angle = (/** @type {number} */ ux, /** @type {number} */ uy) => Math.atan2(uy, ux);
  const start = angle((x1 - cx1) / a, (y1 - cy1) / b);
  let sweepBy = angle((-x1 - cx1) / a, (-y1 - cy1) / b) - start;
  if (sweep && sweepBy < 0) sweepBy += 2 * Math.PI;
  if (!sweep && sweepBy > 0) sweepBy -= 2 * Math.PI;
  return Array.from({ length: 25 }, (_, i) => {
    const t = start + (sweepBy * i) / 24;
    return { x: cx + a * Math.cos(t) * cos - b * Math.sin(t) * sin, y: cy + a * Math.cos(t) * sin + b * Math.sin(t) * cos };
  });
}

/** Points along the whole of a drawing: its corners, and its curves walked in small steps. */
function pointsOf(/** @type {string} */ d) {
  /** @type {{x:number,y:number}[]} */
  const out = [];
  let at = { x: 0, y: 0 }, began = at;
  const steps = Array.from({ length: 13 }, (_, i) => i / 12);
  for (const { letter, numbers: v } of commandsOf(d)) {
    if (letter === 'M') out.push((at = began = { x: v[0], y: v[1] }));
    else if (letter === 'L') out.push((at = { x: v[0], y: v[1] }));
    else if (letter === 'H') out.push((at = { x: v[0], y: at.y }));
    else if (letter === 'V') out.push((at = { x: at.x, y: v[0] }));
    else if (letter === 'Z') at = began;
    else if (letter === 'Q') {
      const p = at;
      out.push(...steps.map((t) => ({ x: (1 - t) ** 2 * p.x + 2 * (1 - t) * t * v[0] + t * t * v[2], y: (1 - t) ** 2 * p.y + 2 * (1 - t) * t * v[1] + t * t * v[3] })));
      at = { x: v[2], y: v[3] };
    } else if (letter === 'C') {
      const p = at;
      out.push(...steps.map((t) => ({ x: (1 - t) ** 3 * p.x + 3 * (1 - t) ** 2 * t * v[0] + 3 * (1 - t) * t * t * v[2] + t ** 3 * v[4], y: (1 - t) ** 3 * p.y + 3 * (1 - t) ** 2 * t * v[1] + 3 * (1 - t) * t * t * v[3] + t ** 3 * v[5] })));
      at = { x: v[4], y: v[5] };
    } else if (letter === 'A') {
      out.push(...alongArc(at, v));
      at = { x: v[5], y: v[6] };
    }
  }
  return out;
}

describe('icons: the drawings', () => {
  it('has every icon a flowchart is likely to ask for', () => {
    assert.deepEqual(asked.filter((name) => !icons[name]), []);
    assert.ok(Object.keys(icons).length >= 60);
  });

  it('names each in lowercase words joined by dashes', () => {
    for (const name of Object.keys(icons)) assert.match(name, /^[a-z]+(-[a-z]+)*$/);
  });

  it('draws each with plain strokes: whole commands only, each with the numbers it takes, to one decimal', () => {
    const takes = { M: 2, L: 2, H: 1, V: 1, C: 6, Q: 4, A: 7, Z: 0 };
    for (const [name, d] of Object.entries(icons)) {
      const commands = commandsOf(d);
      assert.equal(commands[0]?.letter, 'M', `${name} starts by moving to where it begins`);
      for (const { letter, numbers, written } of commands) {
        assert.ok(letter in takes, `${name} uses ${letter}`);
        assert.equal(numbers.length, takes[/** @type {keyof typeof takes} */ (letter)], `${name}: ${letter}${written}`);
        assert.ok(numbers.every((v) => Number.isFinite(v) && Math.round(v * 10) / 10 === v), `${name}: ${letter}${written}`);
      }
    }
  });

  it('keeps every stroke inside the grid, its own width included', () => {
    const least = iconMeasure.stroke / 2, most = iconMeasure.grid - iconMeasure.stroke / 2;
    for (const [name, d] of Object.entries(icons)) {
      for (const p of pointsOf(d)) assert.ok(p.x >= least - 0.01 && p.x <= most + 0.01 && p.y >= least - 0.01 && p.y <= most + 0.01, `${name} reaches ${p.x.toFixed(2)},${p.y.toFixed(2)}`);
    }
  });

  it('fills most of the grid, so no icon looks small beside its neighbours', () => {
    for (const [name, d] of Object.entries(icons)) {
      const points = pointsOf(d), xs = points.map((p) => p.x), ys = points.map((p) => p.y);
      const reach = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
      assert.ok(reach >= iconMeasure.least, `${name} is ${reach.toFixed(1)} across`);
    }
  });

  it('sits in the middle of the grid, near enough that none looks pushed to a side', () => {
    for (const [name, d] of Object.entries(icons)) {
      const points = pointsOf(d), xs = points.map((p) => p.x), ys = points.map((p) => p.y);
      const off = Math.max(Math.abs((Math.max(...xs) + Math.min(...xs)) / 2 - iconMeasure.grid / 2), Math.abs((Math.max(...ys) + Math.min(...ys)) / 2 - iconMeasure.grid / 2));
      assert.ok(off <= iconMeasure.offCentre, `${name} is ${off.toFixed(2)} off the middle`);
    }
  });
});

describe('icons: what an author wrote', () => {
  it('understands every way Font Awesome is written, and a bare name', () => {
    for (const written of ['fa:fa-truck', 'fas:fa-truck', 'far:fa-truck', 'fa-solid fa-truck', 'fa fa-truck', 'fa-truck', 'truck', ' FA:FA-Truck ', 'fa:fa-truck fa-2x', 'fa-solid fa-truck fa-spin']) {
      assert.deepEqual(iconFor(written), { name: 'truck', d: icons.truck }, written);
    }
  });

  it('knows a thing by the names it has had across versions', () => {
    const same = { gear: ['cog', 'cogs', 'gears', 'fa:fa-cog'], xmark: ['times', 'close', 'fa:fa-times-circle'], cart: ['shopping-cart', 'cart-shopping'], warning: ['exclamation-triangle', 'triangle-exclamation'], pen: ['edit', 'pencil', 'pen-to-square'], home: ['house'], search: ['magnifying-glass'], user: ['user-circle', 'fa:fa-user-o'], envelope: ['envelope-o', 'fa:fa-envelope-open'], file: ['file-alt', 'file-lines', 'file-o'], trash: ['trash-alt', 'trash-can'], refresh: ['sync', 'rotate', 'arrows-rotate'], chart: ['bar-chart', 'chart-bar', 'chart-line'], money: ['dollar-sign', 'money-bill'], mobile: ['mobile-alt', 'mobile-screen'], comment: ['comments', 'message'] };
    for (const [name, written] of Object.entries(same)) for (const w of written) assert.equal(iconFor(w)?.name, name, w);
  });

  it('leads every alias to a drawing, and never hides a drawing behind one', () => {
    for (const [alias, name] of Object.entries(aliases)) {
      assert.ok(icons[name], `${alias} leads to ${name}, which is not drawn`);
      assert.ok(!icons[alias], `${alias} is a drawing and an alias both`);
    }
  });

  it("draws nobody's mark: a brand gives nothing, however it is written", () => {
    for (const written of ['fab:fa-github', 'fa-brands fa-twitter', 'fa:fa-github', 'github', 'fab:fa-truck', 'logos:aws']) assert.equal(iconFor(written), null, written);
  });

  it('gives nothing for a name it has no drawing for, and for nothing at all', () => {
    for (const written of ['fa:fa-dragon', 'dragon', '', '   ', 'fa', 'fa:']) assert.equal(iconFor(written), null, JSON.stringify(written));
  });
});
