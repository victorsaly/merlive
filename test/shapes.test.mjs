// Why: a shape is drawn in one file and lines are brought to its edge in another. Both ask shapes.mjs, and
// these hold it to the one thing that matters: a line that arrives at a shape ends on its outline, not short
// of it and not inside it.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cut, form, inset, outlineOf, roomIn, shapes, wordsAt } from '../skills/merlive/scripts/shapes.mjs';

const w = 160, h = 60;

describe('shapes: every shape Merlive draws', () => {
  it('has an outline, room for words, and somewhere to put them', () => {
    for (const shape of shapes) {
      const { main, more } = outlineOf(shape, 0, 0, w, h, 8);
      assert.match(main, /^<(rect|polygon|path) class="mv-shape/, shape);
      for (const extra of more) assert.match(extra, /class="mv-shape mv-detail/, shape);
      // A cell keeps more room for words than a plain box on purpose: 'shapes: a cell' holds it.
      if (shape !== 'point' && shape !== 'cell') assert.ok(roomIn(shape, w) > 40 && roomIn(shape, w) <= w - 28, `${shape} leaves ${roomIn(shape, w)}px for words`);
      const at = wordsAt(shape, h);
      assert.ok(Math.abs(at.dx) <= 8 && Math.abs(at.dy) <= 8, shape);
    }
  });

  it('keeps every corner of every outline inside the one footprint all boxes share', () => {
    for (const shape of shapes) {
      const { main, more } = outlineOf(shape, 100, 200, w, h, 8);
      for (const [, points] of [main, ...more].join(' ').matchAll(/points="([^"]*)"/g)) {
        for (const [x, y] of points.split(' ').map((p) => p.split(',').map(Number))) assert.ok(x >= 100 && x <= 260 && y >= 200 && y <= 260, `${shape}: ${x},${y} is outside its box`);
      }
      for (const [, x, y, wide, tall] of [main, ...more].join(' ').matchAll(/<rect [^>]*x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
        assert.ok(Number(x) >= 100 && Number(x) + Number(wide) <= 260 && Number(y) >= 200 && Number(y) + Number(tall) <= 260, `${shape}: a rectangle outside its box`);
      }
    }
  });
});

describe('shapes: where a line meets the outline', () => {
  it('is the edge of the box for a box, and for the middle of any flat side', () => {
    for (const side of /** @type {const} */ (['top', 'bottom', 'left', 'right'])) {
      assert.equal(inset('box', side, 20, w, h), 0);
      assert.equal(inset('subroutine', side, -20, w, h), 0);
    }
    assert.equal(inset('hexagon', 'top', 0, w, h), 0);
    assert.equal(inset('lean-right', 'top', 0, w, h), 0);
  });

  it('follows a rhombus in from its corners', () => {
    assert.equal(inset('diamond', 'top', 0, w, h), 0);
    assert.equal(inset('diamond', 'top', 40, w, h), 15, 'half way along, half way down');
    assert.equal(inset('diamond', 'bottom', -40, w, h), 15);
    assert.equal(inset('diamond', 'left', 15, w, h), 40);
    assert.equal(inset('diamond', 'right', 0, w, h), 0);
  });

  it('follows a pill round its ends and a hexagon down its cut corners', () => {
    assert.equal(inset('pill', 'left', 0, w, h), 0);
    assert.ok(Math.abs(inset('pill', 'left', 18, w, h) - 6) < 0.01, 'a 30px round, 18 off the middle: 30 less 24');
    assert.equal(inset('pill', 'top', 20, w, h), 0, 'the top of a pill is flat between its ends');
    assert.equal(inset('double-circle', 'right', 18, w, h), inset('pill', 'right', 18, w, h));
    assert.equal(inset('hexagon', 'left', 15, w, h), cut(h) / 2);
  });

  it('follows the sides that lean, each the way it leans', () => {
    const top = inset('lean-right', 'left', -30, w, h), bottom = inset('lean-right', 'left', 30, w, h);
    assert.ok(top > bottom && bottom === 0, 'leaning right, the left side is furthest in at the top');
    assert.equal(inset('lean-right', 'right', 30, w, h), top);
    assert.equal(inset('lean-left', 'left', 30, w, h), top);
    assert.equal(inset('trapezoid', 'left', -30, w, h), inset('trapezoid', 'right', -30, w, h), 'narrow at the top on both sides');
    assert.equal(inset('trapezoid-alt', 'left', 30, w, h), inset('trapezoid', 'left', -30, w, h));
    assert.ok(inset('flag', 'left', 0, w, h) > inset('flag', 'left', 20, w, h), 'a flag is notched deepest at the middle of its left side');
    assert.equal(inset('flag', 'right', 0, w, h), 0);
  });

  it('follows the curve of a cylinder at its top and bottom', () => {
    assert.equal(inset('cylinder', 'top', 0, w, h), 0);
    assert.ok(inset('cylinder', 'top', 60, w, h) > 1 && inset('cylinder', 'top', 60, w, h) < 7);
    assert.equal(inset('cylinder', 'left', 10, w, h), 0);
  });

  it('never asks a line to go further in than the middle of the shape', () => {
    for (const shape of shapes) for (const side of /** @type {const} */ (['top', 'bottom', 'left', 'right'])) for (const off of [-200, -30, 0, 30, 200]) {
      const far = inset(shape, side, off, w, h);
      assert.ok(far >= 0 && far <= (side === 'top' || side === 'bottom' ? h : w) / 2, `${shape} ${side} ${off}: ${far}`);
    }
  });
});

describe('shapes: a note', () => {
  it('is a sheet with its top right corner folded, and the fold drawn', () => {
    const { main, more } = outlineOf('note', 0, 0, w, h, 8);
    assert.equal((main.match(/\d+(\.\d+)?,\d+(\.\d+)?/g) ?? []).length, 5, 'four corners, one of them cut');
    assert.equal(more.length, 1);
  });

  it('is met on its outline where the corner is folded, and at the edge of its box everywhere else', () => {
    assert.equal(inset('note', 'top', 0, w, h), 0);
    assert.equal(inset('note', 'top', -w / 2, w, h), 0);
    assert.ok(inset('note', 'top', w / 2 - 2, w, h) > 0, 'a line down onto the fold goes on to it');
    assert.ok(inset('note', 'right', -h / 2 + 2, w, h) > 0, 'and so does one in from the right, at the top');
    assert.equal(inset('note', 'right', h / 2, w, h), 0);
    assert.equal(inset('note', 'bottom', w / 2, w, h), 0);
    assert.equal(inset('note', 'left', -h / 2, w, h), 0);
  });
});

describe('shapes: a pill taller than a plain box', () => {
  it('keeps flat sides for its words: its ends are rounded no more than a plain pill of two lines is', () => {
    const { main } = outlineOf('pill', 0, 0, 200, 140, 8);
    assert.match(main, new RegExp(`rx="${form.pillMost}"`));
    assert.equal(inset('pill', 'left', 0, 200, 140), 0, 'the middle of a tall side is flat');
    assert.ok(inset('pill', 'left', 68, 200, 140) > 0, 'and the corner is still round');
    assert.equal(outlineOf('pill', 0, 0, 160, 44, 8).main.includes('rx="22"'), true, 'a plain pill is as it was');
  });
});

describe('shapes: a cell', () => {
  it('is a plain box that keeps less room round its words, for a field of a packet a bit or two wide', () => {
    assert.ok(shapes.includes('cell'));
    assert.ok(form.cellPad < form.pad);
    assert.equal(roomIn('cell', 40), 40 - form.cellPad);
    assert.equal(inset('cell', 'left', 0, 40, 60), inset('box', 'left', 0, 40, 60));
  });
});

describe('shapes: a point', () => {
  it('is a dot in the middle of its box, with no room for words', () => {
    const { main, more } = outlineOf('point', 0, 0, w, h, 8);
    assert.match(main, new RegExp(`x="${w / 2 - form.point}" y="${h / 2 - form.point}" width="${2 * form.point}" height="${2 * form.point}" rx="${form.point}"`));
    assert.deepEqual(more, []);
  });

  it('is met at the dot: a line runs on from the edge of the box to it', () => {
    assert.equal(inset('point', 'top', 0, w, h), h / 2 - form.point);
    assert.equal(inset('point', 'left', 0, w, h), w / 2 - form.point);
    assert.ok(inset('point', 'top', 5, w, h) > h / 2 - form.point, 'off its middle, a little further');
    assert.equal(inset('point', 'top', 40, w, h), h / 2, 'and past the dot, to the line through its middle');
  });
});

describe('shapes: an arrow drawn as a block', () => {
  const pts = (/** @type {string} */ shape, wide = w, tall = h) => (/points="([^"]*)"/.exec(outlineOf(/** @type {any} */ (shape), 0, 0, wide, tall, 8).main)?.[1] ?? '').split(' ').map((p) => p.split(',').map(Number));

  it('points the way it is called: its tip is the middle of that side, and only of that side', () => {
    const tips = { 'arrow-right': [[w, h / 2]], 'arrow-left': [[0, h / 2]], 'arrow-up': [[w / 2, 0]], 'arrow-down': [[w / 2, h]], 'arrow-x': [[0, h / 2], [w, h / 2]], 'arrow-y': [[w / 2, 0], [w / 2, h]] };
    const middles = [[w, h / 2], [0, h / 2], [w / 2, 0], [w / 2, h]];
    for (const [shape, tip] of Object.entries(tips)) {
      const corners = pts(shape).map((p) => p.join(','));
      for (const m of middles) assert.equal(corners.includes(m.join(',')), tip.some((t) => t.join(',') === m.join(',')), `${shape}: ${m}`);
    }
  });

  it('is met at its tip in the middle of the side it points to, and further in away from the tip', () => {
    assert.equal(inset('arrow-right', 'right', 0, w, h), 0);
    assert.ok(inset('arrow-right', 'right', 20, w, h) > 0 && inset('arrow-right', 'right', -20, w, h) > 0);
    assert.equal(inset('arrow-right', 'left', 0, w, h), 0, 'the back of its shaft is the edge of its box');
    assert.ok(inset('arrow-right', 'top', 0, w, h) > 0, 'its shaft is narrower than its head');
    assert.equal(inset('arrow-down', 'bottom', 0, w, h), 0);
    assert.ok(inset('arrow-down', 'bottom', 30, w, h) > 0);
    assert.equal(inset('arrow-down', 'top', 0, w, h), 0);
    assert.ok(inset('arrow-down', 'left', 0, w, h) > 0);
    assert.equal(inset('arrow-x', 'left', 0, w, h), 0);
    assert.ok(inset('arrow-x', 'left', 15, w, h) > 0);
    assert.equal(inset('arrow-y', 'top', 0, w, h), 0);
    assert.equal(inset('arrow-up', 'top', 0, w, h), 0);
    assert.equal(inset('arrow-left', 'left', 0, w, h), 0);
  });

  it('ends a line on its outline: where a line is met is a point of the shape, for every side and every arrow', () => {
    // The outline at a given height or width, worked out from its corners, is what inset has to agree with.
    const edgeAt = (/** @type {number[][]} */ poly, /** @type {'x'|'y'} */ along, /** @type {number} */ at, /** @type {boolean} */ least) => {
      const hits = poly.flatMap((p, i) => {
        const q = poly[(i + 1) % poly.length], [a, b] = along === 'x' ? [p[0], q[0]] : [p[1], q[1]], [c, d] = along === 'x' ? [p[1], q[1]] : [p[0], q[0]];
        if (a === b) return a === at ? [c, d] : [];
        return (at - a) * (at - b) <= 0 ? [c + ((at - a) / (b - a)) * (d - c)] : [];
      });
      return least ? Math.min(...hits) : Math.max(...hits);
    };
    for (const shape of ['arrow-right', 'arrow-left', 'arrow-up', 'arrow-down', 'arrow-x', 'arrow-y']) {
      const poly = pts(shape);
      for (const off of [-12, 0, 9]) {
        assert.ok(Math.abs(inset(/** @type {any} */ (shape), 'top', off, w, h) - edgeAt(poly, 'x', w / 2 + off, true)) < 0.6, `${shape} top ${off}`);
        assert.ok(Math.abs(inset(/** @type {any} */ (shape), 'bottom', off, w, h) - (h - edgeAt(poly, 'x', w / 2 + off, false))) < 0.6, `${shape} bottom ${off}`);
        assert.ok(Math.abs(inset(/** @type {any} */ (shape), 'left', off, w, h) - edgeAt(poly, 'y', h / 2 + off, true)) < 0.6, `${shape} left ${off}`);
        assert.ok(Math.abs(inset(/** @type {any} */ (shape), 'right', off, w, h) - (w - edgeAt(poly, 'y', h / 2 + off, false))) < 0.6, `${shape} right ${off}`);
      }
    }
  });

  it('keeps its words in its shaft: off the middle by half its head, towards its back', () => {
    assert.ok(wordsAt('arrow-right', h).dx < 0 && wordsAt('arrow-left', h).dx > 0);
    assert.ok(wordsAt('arrow-down', h).dy < 0 && wordsAt('arrow-up', h).dy > 0);
    assert.deepEqual(wordsAt('arrow-x', h), { dx: 0, dy: 0 });
    assert.ok(roomIn('arrow-x', w) < roomIn('arrow-right', w) && roomIn('arrow-down', w) < roomIn('arrow-right', w));
  });
});

describe('shapes: an arrow that points up or down in a wide cell', () => {
  it('is drawn no broader than an arrow is, in the middle of its cell, and is met there', () => {
    const wide = 400, xs = (/points="([^"]*)"/.exec(outlineOf('arrow-down', 0, 0, wide, h, 8).main)?.[1] ?? '').split(' ').map((p) => Number(p.split(',')[0]));
    assert.equal(Math.max(...xs) - Math.min(...xs), form.arrowBroad);
    assert.equal((Math.max(...xs) + Math.min(...xs)) / 2, wide / 2);
    assert.ok(inset('arrow-down', 'left', -h / 4, wide, h) >= (wide - form.arrowBroad) / 2, 'a line from the side goes on to where the arrow is');
    assert.equal(inset('arrow-down', 'bottom', 0, wide, h), 0);
    assert.equal(roomIn('arrow-down', wide), roomIn('arrow-down', form.arrowBroad));
  });
});
