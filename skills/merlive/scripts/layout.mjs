// Why: placement is the product. Mermaid's own layout is why diagrams look odd, so Merlive places every box
// on a grid by rule: the main path is one straight spine, everything else sits to one side, every box is the
// same size, and lines turn at right angles and never share a port. Pure: a model in, coordinates out.

/** @typedef {import('./parse.mjs').Model} Model */
/** @typedef {{x:number,y:number}} Pt */
/** @typedef {'top'|'bottom'|'left'|'right'} Side */
/** @typedef {{id:string,x:number,y:number,w:number,h:number,rank:number,lane:number,spine:boolean,lines:string[],titled:boolean}} Placed */
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
  trackStep: 12, // between two lines that share the room between two ranks
  trackEdge: 12, // the least from such a line to the boxes either side of that room
  mostLines: 3, // of words in a box
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

/**
 * The lines of a box's words in a box of some width. Where the author broke the label, each of their lines is
 * kept and only wrapped if it must be; else the label is wrapped as it falls.
 */
export const linesOf = (/** @type {import('./parse.mjs').Node} */ n, /** @type {number} */ width) =>
  n.breaks ? n.breaks.flatMap((b) => wrap(b, roomFor(n, width))) : wrap(n.label, roomFor(n, width));

/**
 * One box size for the whole diagram: the narrowest width in which a plain label takes two lines or fewer and
 * a label its author broke keeps the lines it was given.
 */
function boxFor(/** @type {Model} */ model) {
  const fits = (/** @type {number} */ w) =>
    model.nodes.every((n) => {
      const lines = linesOf(n, w);
      return lines.length <= Math.max(2, Math.min(measure.mostLines, n.breaks?.length ?? 0)) && lines.every((l) => l.length <= roomFor(n, w));
    });
  const w = measure.widths.find(fits) ?? measure.widths[measure.widths.length - 1];
  const most = Math.max(1, ...model.nodes.map((n) => linesOf(n, w).length));
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

  // 4. A box nothing leads to, off the main path, feeds something further on. It sits one step before what it
  //    feeds, not back at the start with a long line to draw.
  for (const id of ids) {
    if (onSpine.has(id) || forward.some((e) => e.to === id)) continue;
    const fed = forward.filter((e) => e.from === id).map((e) => rank.get(e.to) ?? 0);
    if (fed.length) rank.set(id, Math.max(0, Math.min(...fed) - 1));
  }

  // 5. Lanes: the spine is lane 0. What leaves it goes to one side, what feeds it comes in from the other, each
  //    to the nearest free place, so the two never have to cross.
  const lane = new Map(spine.map((id) => [id, 0]));
  const taken = new Set(spine.map((id) => `${rank.get(id)}:0`));
  /** @type {Map<string, 1|-1>} */
  const sideOf = new Map();
  const rest = ids.filter((id) => !onSpine.has(id)).sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0) || (order.get(a) ?? 0) - (order.get(b) ?? 0));
  for (const id of rest) {
    const before = forward.filter((e) => e.to === id).map((e) => e.from);
    // It goes where the box that led to it went; with only the spine behind it, it leaves; with nothing, it feeds.
    const led = before.find((p) => sideOf.has(p));
    const side = led ? /** @type {1|-1} */ (sideOf.get(led)) : before.length ? 1 : -1;
    sideOf.set(id, side);
    let l = Math.max(1, ...before.filter((p) => sideOf.has(p) && lane.has(p)).map((p) => Math.abs(lane.get(p) ?? 1)));
    while (taken.has(`${rank.get(id)}:${side * l}`)) l++;
    lane.set(id, side * l);
    taken.add(`${rank.get(id)}:${side * l}`);
  }
  /**
   * Everything that follows from where the boxes are: their coordinates, each link's route, its port and its
   * track, and what the result costs in lines through boxes, crossings and shared paths. Thorough also tries
   * every order of the lines on each side of a box; without it, it is quick enough to try many placements.
   */
  const settle = (/** @type {boolean} */ thorough) => {
    const firstLane = Math.min(0, ...lane.values());

    /** @type {Record<string, Placed>} */
    const nodes = {};
    for (const n of model.nodes) {
      const l = (lane.get(n.id) ?? 0) - firstLane, r = rank.get(n.id) ?? 0;
      nodes[n.id] = {
        id: n.id, w: bw, h: bh, rank: r, lane: l, spine: onSpine.has(n.id), lines: linesOf(n, box.w), titled: (n.breaks?.length ?? 0) > 1,
        x: measure.pad + l * (bw + laneGap) + bw / 2,
        y: measure.pad + r * (bh + rankGap) + bh / 2,
      };
    }
    const all = Object.values(nodes);

    // 6. Routes. Each link takes one of a few shapes, tried in an order that keeps the spine's top and bottom for
    //    the spine: straight; across then along (HV); along then across (VH); along, across in the room between
    //    two ranks, along again (VHV), which is how a branch fans out; and round the outside.
    /** @typedef {{e:import('./parse.mjs').Edge,s:Placed,t:Placed,shape:'straight'|'HV'|'VH'|'VHV'|'outer',sSide:Side,tSide:Side,cx:number,gap:number,ty:number,points:Pt[]}} Route */
    const mid = (/** @type {Placed} */ n, /** @type {Side} */ side, off = 0) =>
      side === 'top' ? { x: n.x + off, y: n.y - n.h / 2 } : side === 'bottom' ? { x: n.x + off, y: n.y + n.h / 2 } : side === 'left' ? { x: n.x - n.w / 2, y: n.y + off } : { x: n.x + n.w / 2, y: n.y + off };
    const others = (/** @type {Placed} */ s, /** @type {Placed} */ t) => all.filter((n) => n !== s && n !== t);
    const hits = (/** @type {Pt[]} */ pts, /** @type {Placed} */ s, /** @type {Placed} */ t) => segmentsOf(pts).reduce((sum, seg) => sum + others(s, t).filter((n) => hitsBox(seg, n)).length, 0);
    /** The middle of the room after rank g, where a line may run across. */
    const roomAfter = (/** @type {number} */ g) => measure.pad + g * (bh + rankGap) + bh + rankGap / 2;
    const shapeOf = (/** @type {Route} */ r, /** @type {Pt} */ a, /** @type {Pt} */ b) =>
      r.shape === 'straight' ? [a, b]
        : r.shape === 'HV' ? [a, { x: b.x, y: a.y }, b]
          : r.shape === 'VH' ? [a, { x: a.x, y: b.y }, b]
            : r.shape === 'VHV' ? [a, { x: a.x, y: r.ty }, { x: b.x, y: r.ty }, b]
              : [a, { x: r.cx, y: a.y }, { x: r.cx, y: b.y }, b];
    /** Where the outside is for a link between two ranks: past every box in between, on the side things leave by. */
    const outside = (/** @type {Placed} */ s, /** @type {Placed} */ t) => {
      const lo = Math.min(s.rank, t.rank), hi = Math.max(s.rank, t.rank);
      return Math.max(...all.filter((n) => n.rank >= lo && n.rank <= hi).map((n) => n.x + n.w / 2)) + measure.channel;
    };

    /** @type {Route[]} */
    const routes = model.edges.map((e) => {
      const s = nodes[e.from], t = nodes[e.to];
      const down = t.rank > s.rank, right = t.lane > s.lane;
      /** @type {Route} */
      const r = { e, s, t, shape: 'outer', sSide: 'right', tSide: 'right', cx: outside(s, t), gap: 0, ty: 0, points: [] };
      const hv = { shape: 'HV', sSide: right ? 'right' : 'left', tSide: down ? 'top' : 'bottom' };
      const vh = { shape: 'VH', sSide: down ? 'bottom' : 'top', tSide: right ? 'left' : 'right' };
      // Across in the room next to where it starts, or next to where it ends.
      const near = { shape: 'VHV', sSide: down ? 'bottom' : 'top', tSide: down ? 'top' : 'bottom', gap: down ? s.rank : s.rank - 1 };
      const far = { ...near, gap: down ? t.rank - 1 : t.rank };
      const outer = { shape: 'outer', sSide: 'right', tSide: 'right' };
      if (s.lane === t.lane) {
        const between = all.some((n) => n.lane === s.lane && n.rank > Math.min(s.rank, t.rank) && n.rank < Math.max(s.rank, t.rank));
        if (down && !between) Object.assign(r, { shape: 'straight', sSide: 'bottom', tSide: 'top' });
        return r;
      }
      if (s.rank === t.rank) return Object.assign(r, { shape: 'straight', sSide: right ? 'right' : 'left', tSide: right ? 'left' : 'right' });
      // Leaving the spine a line goes across first; coming back to it, along first; between two boxes off it, it
      // turns in the room between ranks. Back up the flow it keeps to the sides, and to the outside if it must.
      const order = !down ? [vh, hv, near, far, outer] : s.spine && !t.spine ? [hv, near, far, vh] : t.spine && !s.spine ? [vh, far, near, hv] : [near, far, hv, vh];
      let best = Infinity;
      for (const choice of order) {
        const tried = /** @type {Route} */ ({ ...r, ...choice });
        tried.ty = roomAfter(tried.gap);
        const n = hits(shapeOf(tried, mid(s, tried.sSide), mid(t, tried.tSide)), s, t);
        if (n < best) [best] = [n, Object.assign(r, choice)];
        if (n === 0) break;
      }
      return r;
    });

    // Loops that go round the outside: the shortest innermost, each in a channel of its own.
    /** @type {{lo:number,hi:number}[]} */
    const used = [];
    for (const r of routes.filter((x) => x.shape === 'outer').sort((a, b) => Math.abs(a.s.rank - a.t.rank) - Math.abs(b.s.rank - b.t.rank))) {
      const lo = Math.min(r.s.rank, r.t.rank), hi = Math.max(r.s.rank, r.t.rank);
      r.cx = outside(r.s, r.t) + measure.channelStep * used.filter((u) => u.lo <= hi && u.hi >= lo).length;
      used.push({ lo, hi });
    }

    // Lines that cross in the same room between two ranks each get a track there, so none lies on another.
    /** @type {Map<number, Route[][]>} */
    const rooms = new Map();
    const span = (/** @type {Route} */ r) => [Math.min(r.s.x, r.t.x) - bw / 2, Math.max(r.s.x, r.t.x) + bw / 2];
    for (const r of routes.filter((x) => x.shape === 'VHV').sort((a, b) => span(b)[1] - span(b)[0] - (span(a)[1] - span(a)[0]))) {
      const tracks = rooms.get(r.gap) ?? [];
      const free = tracks.find((track) => track.every((o) => span(o)[1] <= span(r)[0] || span(o)[0] >= span(r)[1]));
      if (free) free.push(r);
      else tracks.push([r]);
      rooms.set(r.gap, tracks);
    }
    const setTracks = () => {
      for (const [gap, tracks] of rooms) {
        const step = Math.min(measure.trackStep, (rankGap - 2 * measure.trackEdge) / Math.max(1, tracks.length - 1));
        tracks.forEach((track, i) => track.forEach((r) => (r.ty = roomAfter(gap) + (i - (tracks.length - 1) / 2) * step)));
      }
    };

    // Ports. A straight line keeps the middle of its side. The others share the rest, in an order chosen to
    // cross as little as possible.
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
      setTracks();
      for (const r of routes) {
        const en = endsOf.get(r);
        r.points = shapeOf(r, mid(r.s, r.sSide, en?.s.off), mid(r.t, r.tSide, en?.t.off));
      }
    };
    const cost = () => {
      let c = 0;
      for (let i = 0; i < routes.length; i++) {
        c += 50 * hits(routes[i].points, routes[i].s, routes[i].t);
        for (let j = i + 1; j < routes.length; j++) {
          const m = meet(routes[i].points, routes[j].points);
          c += 10 * m.crossings + 8 * m.overlaps;
        }
      }
      return c;
    };
    /** Every order of a short list. */
    const orders = (/** @type {any[]} */ list) => {
      /** @type {any[][]} */
      const out = [];
      const go = (/** @type {any[]} */ done, /** @type {any[]} */ left) => (left.length ? left.forEach((x, i) => go([...done, x], [...left.slice(0, i), ...left.slice(i + 1)])) : out.push(done));
      go([], list);
      return out;
    };
    for (const [key, list] of groups) list.sort((a, b) => far(a, /** @type {Side} */ (key.split('|')[1])) - far(b, /** @type {Side} */ (key.split('|')[1])));
    build();
    if (!thorough) return { nodes, all, routes, cost: cost() };
    // Trying every order is only affordable for a few lines on a side, or a few tracks in a room; four makes
    // twenty-four orders. What can be reordered: the lines on one side of a box, and the tracks of one room.
    const few = 4, passes = 3;
    /** @type {[Map<any, any[]>, any][]} */
    const reorderable = [...[...groups.keys()].map((k) => /** @type {[Map<any, any[]>, any]} */ ([groups, k])), ...[...rooms.keys()].map((k) => /** @type {[Map<any, any[]>, any]} */ ([rooms, k]))];
    for (let pass = 0, better = true; pass < passes && better; pass++) {
      better = false;
      for (const [map, key] of reorderable) {
        const list = map.get(key) ?? [];
        if (list.length < 2 || list.length > few) continue;
        let best = cost(), keep = [...list];
        for (const o of orders(list)) {
          map.set(key, o);
          build();
          const c = cost();
          if (c < best) [best, keep, better] = [c, o, true];
        }
        map.set(key, keep);
        build();
      }
    }
    return { nodes, all, routes, cost: cost() };
  };

  // A box moves to another free lane of its rank when that costs less: fewer lines through boxes, fewer
  // crossings. Being far from the spine and being on the other side from where its kind goes both cost a
  // little, so a box only leaves its place for a reason.
  const weights = { far: 1, otherSide: 3, tries: 3 };
  const weigh = (/** @type {string} */ id, /** @type {number} */ l) => Math.abs(l) * weights.far + (Math.sign(l) === sideOf.get(id) ? 0 : weights.otherSide);
  let quick = settle(true).cost;
  // Placed as they first fall, most diagrams cost nothing and are left alone.
  const worthTrying = quick > 0;
  for (let pass = 0, moved = true; pass < weights.tries && moved && worthTrying; pass++) {
    moved = false;
    for (const id of rest) {
      const r = rank.get(id);
      const furthest = Math.max(1, ...[...lane.values()].map(Math.abs)) + 1;
      for (let l = -furthest; l <= furthest; l++) {
        const now = lane.get(id) ?? 0;
        if (l === 0 || l === now || taken.has(`${r}:${l}`)) continue;
        lane.set(id, l);
        const tried = settle(true).cost;
        if (tried + weigh(id, l) < quick + weigh(id, now)) {
          taken.delete(`${r}:${now}`);
          taken.add(`${r}:${l}`);
          [quick, moved] = [tried, true];
        } else lane.set(id, now);
      }
    }
  }
  // A lane left empty by the moves is closed up, each side of the spine in turn.
  for (const side of [1, -1]) {
    const usedLanes = [...new Set([...lane.values()].filter((l) => Math.sign(l) === side).map(Math.abs))].sort((a, b) => a - b);
    for (const [id, l] of lane) if (Math.sign(l) === side) lane.set(id, side * (usedLanes.indexOf(Math.abs(l)) + 1));
  }
  const { nodes, all, routes } = settle(true);

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

/**
 * A link's words sit beside the first run of its line long enough to carry them, close to where it leaves,
 * where a reader looks for the answer.
 */
function labelAt(/** @type {Pt[]} */ pts, /** @type {string} */ text) {
  const w = Math.round(text.length * measure.labelGlyph + 10), h = 18;
  const runs = segmentsOf(pts);
  const carries = (/** @type {[Pt,Pt]} */ [a, b]) => (a.y === b.y ? Math.abs(b.x - a.x) >= w + 24 : Math.abs(b.y - a.y) >= 34);
  const [a, b] = runs.find(carries) ?? runs[0];
  if (a.y === b.y) return { x: a.x + Math.sign(b.x - a.x) * (12 + w / 2), y: a.y - 12, w, h, text };
  return { x: a.x + 8 + w / 2, y: a.y + Math.sign(b.y - a.y) * 17, w, h, text };
}
