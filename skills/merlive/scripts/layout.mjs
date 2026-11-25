// Why: placement is the product. Mermaid's own layout is why diagrams look odd, so Merlive places every box
// on a grid by rule: the main path is one straight spine, everything else sits to one side, every box is the
// same size, and lines turn at right angles and never share a port. Pure: a model in, coordinates out.

/** @typedef {import('./parse.mjs').Model} Model */
/** @typedef {{x:number,y:number}} Pt */
/** @typedef {'top'|'bottom'|'left'|'right'} Side */
/** @typedef {{id:string,x:number,y:number,w:number,h:number,rank:number,lane:number,spine:boolean,lines:string[]}} Placed */
/** @typedef {{id:string,points:Pt[],back:boolean,label:null|{x:number,y:number,w:number,h:number,text:string}}} Routed */
/** @typedef {{width:number,height:number,direction:'TD'|'LR',box:{w:number,h:number},nodes:Record<string,Placed>,edges:Record<string,Routed>,spine:string[],warnings:string[]}} Layout */

// What is measured, named once. Boxes are sized without a browser, from the average glyph of a 13px UI face.
export const measure = {
  glyph: 7.1, // px per character at 13px
  labelGlyph: 6.6, // px per character of a link's label at 11px
  widths: [128, 160, 192, 224], // the only box widths there are; a diagram uses one of them throughout
  padBox: 28, // left and right inside a box
  padDecision: 52, // a decision's cut corners leave less room for words
  lineHeight: 16,
  pad: 28, // around the whole drawing
  laneGap: { TD: 64, LR: 40 }, // between a box and the one beside it
  rankGap: { TD: 48, LR: 72 }, // between a box and the next one along the flow
  channel: 26, // from the outermost box to the first loop that goes round the outside
  channelStep: 16, // between two such loops
  portStep: 20, // between two lines on one side of a box
  portShare: 0.31, // how far from the middle of a side a line may leave, as a share of the side
  clear: 4, // how close a line may come to a box it does not belong to
  wide: 1100, // past this a left-to-right flow no longer fits a laptop's reading column
};

/** Words wrapped to at most `max` characters a line. A word longer than that keeps a line of its own. */
export function wrap(/** @type {string} */ label, /** @type {number} */ max) {
  /** @type {string[]} */
  const lines = [];
  for (const word of label.split(/\s+/).filter(Boolean)) {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= max) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines.length ? lines : [''];
}

export const roomFor = (/** @type {{shape:string}} */ n, /** @type {number} */ width) =>
  Math.floor((width - (n.shape === 'decision' ? measure.padDecision : measure.padBox)) / measure.glyph);

/** One box size for the whole diagram: the narrowest width in which every label takes two lines or fewer. */
function boxFor(/** @type {Model} */ model) {
  const fits = (/** @type {number} */ w) =>
    model.nodes.every((n) => {
      const lines = wrap(n.label, roomFor(n, w));
      return lines.length <= 2 && lines.every((l) => l.length <= roomFor(n, w));
    });
  const w = measure.widths.find(fits) ?? measure.widths[measure.widths.length - 1];
  const most = Math.max(1, ...model.nodes.map((n) => wrap(n.label, roomFor(n, w)).length));
  return { w, h: 28 + measure.lineHeight * most };
}

// ---- geometry, shared with score.mjs ---------------------------------------------------------------------

/** @returns {[Pt,Pt][]} */
export const segmentsOf = (/** @type {Pt[]} */ pts) => pts.slice(1).map((p, i) => /** @type {[Pt,Pt]} */ ([pts[i], p]));

/** Does a straight, axis-aligned run pass through a box (grown by `grow`)? */
export function hitsBox(/** @type {[Pt,Pt]} */ [a, b], /** @type {{x:number,y:number,w:number,h:number}} */ box, grow = measure.clear) {
  const l = box.x - box.w / 2 - grow, r = box.x + box.w / 2 + grow, t = box.y - box.h / 2 - grow, m = box.y + box.h / 2 + grow;
  return Math.max(a.x, b.x) > l && Math.min(a.x, b.x) < r && Math.max(a.y, b.y) > t && Math.min(a.y, b.y) < m;
}

/** How many times two lines cross, and how many times they run along each other. */
export function meet(/** @type {Pt[]} */ one, /** @type {Pt[]} */ other) {
  let crossings = 0;
  let overlaps = 0;
  for (const [a, b] of segmentsOf(one)) {
    for (const [c, d] of segmentsOf(other)) {
      const flatA = a.y === b.y, flatC = c.y === d.y;
      if (flatA !== flatC) {
        const [h1, h2] = flatA ? [a, b] : [c, d];
        const [v1, v2] = flatA ? [c, d] : [a, b];
        const inX = v1.x > Math.min(h1.x, h2.x) + 1 && v1.x < Math.max(h1.x, h2.x) - 1;
        const inY = h1.y > Math.min(v1.y, v2.y) + 1 && h1.y < Math.max(v1.y, v2.y) - 1;
        if (inX && inY) crossings++;
      } else {
        const key = flatA ? /** @type {const} */ ('y') : /** @type {const} */ ('x');
        const along = flatA ? /** @type {const} */ ('x') : /** @type {const} */ ('y');
        const shared = Math.min(Math.max(a[along], b[along]), Math.max(c[along], d[along])) - Math.max(Math.min(a[along], b[along]), Math.min(c[along], d[along]));
        if (Math.abs(a[key] - c[key]) < 3 && shared > 2) overlaps++;
      }
    }
  }
  return { crossings, overlaps };
}

// ---- the layout ------------------------------------------------------------------------------------------

/**
 * @param {Model} model
 * @returns {Layout}
 */
export function layout(model) {
  const dir = model.direction;
  /** @type {string[]} */
  const warnings = [];
  const box = boxFor(model);
  // Everything is placed as if the flow ran downwards. A left-to-right diagram is the same drawing turned on
  // its side at the end, so along the flow a box is as "tall" as it is really wide.
  const bw = dir === 'LR' ? box.h : box.w;
  const bh = dir === 'LR' ? box.w : box.h;
  const laneGap = measure.laneGap[dir], rankGap = measure.rankGap[dir];

  const ids = model.nodes.map((n) => n.id);
  const order = new Map(ids.map((id, i) => [id, i]));
  /** @type {Map<string, import('./parse.mjs').Edge[]>} */
  const out = new Map(ids.map((id) => [id, []]));
  for (const e of model.edges) out.get(e.from)?.push(e);

  // 1. Links that close a loop are set aside: without them the graph has a first box and a last one.
  const back = new Set();
  const seen = new Map();
  const visit = (/** @type {string} */ id) => {
    seen.set(id, 'open');
    for (const e of out.get(id) ?? []) {
      if (seen.get(e.to) === 'open') back.add(e.id);
      else if (!seen.has(e.to)) visit(e.to);
    }
    seen.set(id, 'done');
  };
  const entered = new Set(model.edges.map((e) => e.to));
  for (const id of ids) if (!entered.has(id) && !seen.has(id)) visit(id);
  for (const id of ids) if (!seen.has(id)) visit(id);
  const forward = model.edges.filter((e) => !back.has(e.id));

  // 2. Rank: how far along the flow a box sits, which is the longest way to reach it.
  const waiting = new Map(ids.map((id) => [id, 0]));
  for (const e of forward) waiting.set(e.to, (waiting.get(e.to) ?? 0) + 1);
  const rank = new Map(ids.map((id) => [id, 0]));
  const queue = ids.filter((id) => waiting.get(id) === 0);
  /** @type {string[]} */
  const sorted = [];
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    sorted.push(id);
    for (const e of forward.filter((f) => f.from === id)) {
      rank.set(e.to, Math.max(rank.get(e.to) ?? 0, (rank.get(id) ?? 0) + 1));
      waiting.set(e.to, (waiting.get(e.to) ?? 1) - 1);
      if (waiting.get(e.to) === 0) queue.push(e.to);
    }
  }

  // 3. The spine: the path the author named, or else the longest one. It gets the straight line.
  const forwardIds = new Set(forward.map((e) => `${e.from}>${e.to}`));
  /** @type {string[]} */
  let spine = [];
  const named = model.hints.main;
  if (named && named.length > 1) {
    if (named.every((id, i) => i === 0 || forwardIds.has(`${named[i - 1]}>${id}`))) spine = named;
    else warnings.push('the "%% main:" path does not follow the links, so the longest path was used instead');
  }
  if (!spine.length && ids.length) {
    const longest = new Map();
    for (const id of [...sorted].reverse()) longest.set(id, 1 + Math.max(0, ...forward.filter((e) => e.from === id).map((e) => longest.get(e.to) ?? 0)));
    const pick = (/** @type {string[]} */ from) => from.reduce((a, b) => ((longest.get(b) ?? 0) > (longest.get(a) ?? 0) ? b : a));
    let at = pick(ids.filter((id) => (rank.get(id) ?? 0) === 0));
    spine = [at];
    for (let next = forward.filter((e) => e.from === at).map((e) => e.to); next.length; next = forward.filter((e) => e.from === at).map((e) => e.to)) {
      at = pick(next);
      spine.push(at);
    }
  }
  const onSpine = new Set(spine);

  // 4. Lanes: the spine is lane 0, and every other box takes the nearest free place to one side of it.
  const lane = new Map(spine.map((id) => [id, 0]));
  const taken = new Set(spine.map((id) => `${rank.get(id)}:0`));
  const rest = ids.filter((id) => !onSpine.has(id)).sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0) || (order.get(a) ?? 0) - (order.get(b) ?? 0));
  for (const id of rest) {
    const from = forward.filter((e) => e.to === id && lane.has(e.from) && !onSpine.has(e.from)).map((e) => lane.get(e.from) ?? 1);
    let l = Math.max(1, ...from);
    while (taken.has(`${rank.get(id)}:${l}`)) l++;
    lane.set(id, l);
    taken.add(`${rank.get(id)}:${l}`);
  }

  /** @type {Record<string, Placed>} */
  const nodes = {};
  for (const n of model.nodes) {
    const l = lane.get(n.id) ?? 0, r = rank.get(n.id) ?? 0;
    nodes[n.id] = {
      id: n.id, w: bw, h: bh, rank: r, lane: l, spine: onSpine.has(n.id), lines: wrap(n.label, roomFor(n, box.w)),
      x: measure.pad + l * (bw + laneGap) + bw / 2,
      y: measure.pad + r * (bh + rankGap) + bh / 2,
    };
  }
  const all = Object.values(nodes);

  // 5. Routes. Each link is one of five shapes, chosen so the spine keeps the top and bottom of its boxes and
  //    everything else comes and goes by the sides.
  /** @typedef {{e:import('./parse.mjs').Edge,s:Placed,t:Placed,shape:'straight'|'HV'|'VH'|'outer',sSide:Side,tSide:Side,cx:number,points:Pt[]}} Route */
  const mid = (/** @type {Placed} */ n, /** @type {Side} */ side, off = 0) =>
    side === 'top' ? { x: n.x + off, y: n.y - n.h / 2 } : side === 'bottom' ? { x: n.x + off, y: n.y + n.h / 2 } : side === 'left' ? { x: n.x - n.w / 2, y: n.y + off } : { x: n.x + n.w / 2, y: n.y + off };
  const others = (/** @type {Placed} */ s, /** @type {Placed} */ t) => all.filter((n) => n !== s && n !== t);
  const clean = (/** @type {Pt[]} */ pts, /** @type {Placed} */ s, /** @type {Placed} */ t) => segmentsOf(pts).every((seg) => others(s, t).every((n) => !hitsBox(seg, n)));
  const shapeOf = (/** @type {Route} */ r, /** @type {Pt} */ a, /** @type {Pt} */ b) =>
    r.shape === 'straight' ? [a, b] : r.shape === 'HV' ? [a, { x: b.x, y: a.y }, b] : r.shape === 'VH' ? [a, { x: a.x, y: b.y }, b] : [a, { x: r.cx, y: a.y }, { x: r.cx, y: b.y }, b];

  /** @type {Route[]} */
  const routes = model.edges.map((e) => {
    const s = nodes[e.from], t = nodes[e.to];
    const down = t.rank > s.rank, right = t.lane > s.lane;
    /** @type {Route} */
    const r = { e, s, t, shape: 'outer', sSide: 'right', tSide: 'right', cx: 0, points: [] };
    const hv = () => Object.assign(r, { shape: 'HV', sSide: right ? 'right' : 'left', tSide: down ? 'top' : 'bottom' });
    const vh = () => Object.assign(r, { shape: 'VH', sSide: down ? 'bottom' : 'top', tSide: right ? 'left' : 'right' });
    const tryOn = (/** @type {() => Route} */ set) => {
      set();
      return clean(shapeOf(r, mid(s, r.sSide), mid(t, r.tSide)), s, t);
    };
    if (s.lane === t.lane) {
      const between = all.some((n) => n.lane === s.lane && n.rank > Math.min(s.rank, t.rank) && n.rank < Math.max(s.rank, t.rank));
      if (down && !between) Object.assign(r, { shape: 'straight', sSide: 'bottom', tSide: 'top' });
    } else if (s.rank === t.rank) {
      Object.assign(r, { shape: 'straight', sSide: right ? 'right' : 'left', tSide: right ? 'left' : 'right' });
    } else {
      // Leaving the spine, a line goes across first and arrives from above or below. Coming back to it, or
      // going back up the flow, it runs along the flow first and arrives at the side.
      const first = s.spine && !t.spine ? [hv, vh] : [vh, hv];
      if (!tryOn(first[0]) && !tryOn(first[1])) first[0]();
    }
    return r;
  });

  // Loops that cannot go straight go round the outside, the shortest innermost, each in a channel of its own.
  const outer = routes.filter((r) => r.shape === 'outer').sort((a, b) => Math.abs(a.s.rank - a.t.rank) - Math.abs(b.s.rank - b.t.rank));
  /** @type {{lo:number,hi:number}[]} */
  const used = [];
  for (const r of outer) {
    const lo = Math.min(r.s.rank, r.t.rank), hi = Math.max(r.s.rank, r.t.rank);
    const edge = Math.max(...all.filter((n) => n.rank >= lo && n.rank <= hi).map((n) => n.x + n.w / 2));
    r.cx = edge + measure.channel + measure.channelStep * used.filter((u) => u.lo <= hi && u.hi >= lo).length;
    used.push({ lo, hi });
  }

  // 6. Ports. A straight line keeps the middle of its side. The others share the rest, in an order chosen to
  //    cross as little as possible.
  /** @typedef {{r:Route,end:'s'|'t',off:number}} End */
  /** @type {Map<string, End[]>} */
  const groups = new Map();
  /** @type {Map<Route, {s:End,t:End}>} */
  const endsOf = new Map();
  const far = (/** @type {End} */ en, /** @type {Side} */ side) => {
    const o = en.end === 's' ? en.r.t : en.r.s;
    return side === 'top' || side === 'bottom' ? o.x : o.y;
  };
  for (const r of routes) {
    const s = /** @type {End} */ ({ r, end: 's', off: 0 }), t = /** @type {End} */ ({ r, end: 't', off: 0 });
    endsOf.set(r, { s, t });
    if (r.shape === 'straight') continue;
    for (const [en, n, side] of /** @type {[End,Placed,Side][]} */ ([[s, r.s, r.sSide], [t, r.t, r.tSide]])) {
      const here = side === 'top' || side === 'bottom' ? n.x : n.y;
      const centred = routes.some((q) => q.shape === 'straight' && ((q.s === n && q.sSide === side) || (q.t === n && q.tSide === side)));
      // With a straight line in the middle, the rest split to the side their other end is on.
      const half = centred ? (far(en, side) < here ? 'low' : 'high') : 'all';
      const key = `${n.id}|${side}|${half}`;
      groups.set(key, [...(groups.get(key) ?? []), en]);
    }
  }
  const setOffsets = () => {
    for (const [key, list] of groups) {
      const [id, side, half] = key.split('|');
      const n = nodes[id];
      const length = side === 'top' || side === 'bottom' ? n.w : n.h;
      const reach = length * measure.portShare;
      if (half === 'all') {
        const step = list.length > 1 ? Math.min(measure.portStep, (2 * reach) / (list.length - 1)) : 0;
        list.forEach((en, i) => (en.off = (i - (list.length - 1) / 2) * step));
      } else {
        const step = Math.min(measure.portStep, reach / list.length);
        list.forEach((en, i) => (en.off = half === 'low' ? -step * (list.length - i) : step * (i + 1)));
      }
    }
  };
  const build = () => {
    setOffsets();
    for (const r of routes) {
      const en = endsOf.get(r);
      r.points = shapeOf(r, mid(r.s, r.sSide, en?.s.off), mid(r.t, r.tSide, en?.t.off));
    }
  };
  const cost = () => {
    let c = 0;
    for (let i = 0; i < routes.length; i++) {
      for (const seg of segmentsOf(routes[i].points)) c += 50 * others(routes[i].s, routes[i].t).filter((n) => hitsBox(seg, n)).length;
      for (let j = i + 1; j < routes.length; j++) {
        const m = meet(routes[i].points, routes[j].points);
        c += 10 * m.crossings + 8 * m.overlaps;
      }
    }
    return c;
  };
  const orders = (/** @type {End[]} */ list) => {
    /** @type {End[][]} */
    const all = [];
    const go = (/** @type {End[]} */ done, /** @type {End[]} */ left) => (left.length ? left.forEach((x, i) => go([...done, x], [...left.slice(0, i), ...left.slice(i + 1)])) : all.push(done));
    go([], list);
    return all;
  };
  for (const [key, list] of groups) list.sort((a, b) => far(a, /** @type {Side} */ (key.split('|')[1])) - far(b, /** @type {Side} */ (key.split('|')[1])));
  build();
  // Trying every order is only affordable for a few lines on a side; four makes twenty-four orders.
  const few = 4, passes = 3;
  for (let pass = 0, better = true; pass < passes && better; pass++) {
    better = false;
    for (const [key, list] of groups) {
      if (list.length < 2 || list.length > few) continue;
      let best = cost(), keep = [...list];
      for (const o of orders(list)) {
        groups.set(key, o);
        build();
        const c = cost();
        if (c < best) [best, keep, better] = [c, o, true];
      }
      groups.set(key, keep);
      build();
    }
  }

  // 7. Turn it to the side it was asked for, then on its side for a left-to-right flow.
  const farRight = Math.max(...all.map((n) => n.x + n.w / 2), ...routes.flatMap((r) => r.points.map((p) => p.x)), 0);
  const flip = (/** @type {Pt} */ p) => (model.hints.side === 'left' ? { x: farRight + measure.pad - p.x, y: p.y } : p);
  const turn = (/** @type {Pt} */ p) => (dir === 'LR' ? { x: p.y, y: p.x } : p);
  const place = (/** @type {Pt} */ p) => turn(flip(p));
  for (const n of all) Object.assign(n, place(n), { w: box.w, h: box.h });

  /** @type {Record<string, Routed>} */
  const edges = {};
  for (const r of routes) {
    const points = tidy(r.points.map(place));
    edges[r.e.id] = { id: r.e.id, points, back: back.has(r.e.id), label: r.e.label ? labelAt(points, r.e.label) : null };
  }

  const xs = [...all.flatMap((n) => [n.x + n.w / 2]), ...Object.values(edges).flatMap((e) => [...e.points.map((p) => p.x), ...(e.label ? [e.label.x + e.label.w / 2] : [])])];
  const ys = [...all.flatMap((n) => [n.y + n.h / 2]), ...Object.values(edges).flatMap((e) => [...e.points.map((p) => p.y), ...(e.label ? [e.label.y + e.label.h / 2] : [])])];
  const width = Math.ceil(Math.max(0, ...xs) + measure.pad), height = Math.ceil(Math.max(0, ...ys) + measure.pad);
  if (dir === 'LR' && width > measure.wide) warnings.push(`left to right, this flow is ${width}px wide and will scroll on most screens; "flowchart TD" would read better`);
  return { width, height, direction: dir, box, nodes, edges, spine, warnings };
}

/** Drops points that repeat or sit on a straight run between their neighbours. */
function tidy(/** @type {Pt[]} */ pts) {
  const out = pts.filter((p, i) => i === 0 || p.x !== pts[i - 1].x || p.y !== pts[i - 1].y);
  return out.filter((p, i) => i === 0 || i === out.length - 1 || !((out[i - 1].x === p.x && p.x === out[i + 1].x) || (out[i - 1].y === p.y && p.y === out[i + 1].y)));
}

/** A link's words sit beside its first run, close to where it leaves, where a reader looks for the answer. */
function labelAt(/** @type {Pt[]} */ pts, /** @type {string} */ text) {
  const [a, b] = pts;
  const w = Math.round(text.length * measure.labelGlyph + 10), h = 18;
  if (a.y === b.y) return { x: a.x + Math.sign(b.x - a.x) * (12 + w / 2), y: a.y - 12, w, h, text };
  return { x: a.x + 8 + w / 2, y: a.y + Math.sign(b.y - a.y) * 15, w, h, text };
}
