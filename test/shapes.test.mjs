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
      assert.ok(roomIn(shape, w) > 40 && roomIn(shape, w) <= w - 28, `${shape} leaves ${roomIn(shape, w)}px for words`);
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
