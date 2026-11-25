// Why: this function is handed to the page as source and run there, so it uses the browser's globals, not
// Node's, and nothing from outside itself. It adds what a still picture cannot: pick a box or a line to see
// only what it touches, and walk the steps the author wrote. Nothing moves until the reader asks.

/* eslint-env browser */

/**
 * @param {{
 *   nodes:{id:string,label:string,kind:string,note:string}[],
 *   edges:{id:string,from:string,to:string,label:string}[],
 *   steps:{title:string,text:string,seq:string[],loop:boolean}[],
 *   motion:'none'|'calm'|'lively'
 * }} data
 */
export function runtime(data) {
  const speed = 110; // px a second: slow enough to follow, quick enough that a long path is not a wait
  const byId = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));
  const svg = /** @type {SVGSVGElement} */ (/** @type {unknown} */ (document.querySelector('.mv-svg')));
  const nodes = new Map(data.nodes.map((n) => [n.id, n]));
  const edges = new Map(data.edges.map((e) => [e.id, e]));
  /** @type {Map<string, Element>} */
  const nodeEl = new Map();
  /** @type {Map<string, Element>} */
  const edgeEl = new Map();
  svg.querySelectorAll('[data-node]').forEach((el) => nodeEl.set(el.getAttribute('data-node') ?? '', el));
  svg.querySelectorAll('[data-edge]').forEach((el) => edgeEl.set(el.getAttribute('data-edge') ?? '', el));
  const dot = /** @type {SVGGElement} */ (/** @type {unknown} */ (document.getElementById('mv-dot')));

  /** @type {null|{type:'node'|'edge',id:string}} */
  let picked = null;
  let step = 0;
  let playing = false;
  let travelled = 0;
  let last = 0;

  // ---- pick a box or a line ----
  const pick = (/** @type {null|{type:'node'|'edge',id:string}} */ what) => {
    picked = what && picked && picked.type === what.type && picked.id === what.id ? null : what;
    const keepNodes = new Set(), keepEdges = new Set();
    if (picked?.type === 'node') {
      keepNodes.add(picked.id);
      for (const e of data.edges) {
        if (e.from !== picked.id && e.to !== picked.id) continue;
        keepEdges.add(e.id);
        keepNodes.add(e.from).add(e.to);
      }
    } else if (picked) {
      const e = edges.get(picked.id);
      if (e) keepNodes.add(e.from).add(e.to);
      keepEdges.add(picked.id);
    }
    nodeEl.forEach((el, id) => {
      el.classList.toggle('mv-dim', Boolean(picked) && !keepNodes.has(id));
      el.classList.toggle('mv-sel', picked?.type === 'node' && picked.id === id);
    });
    edgeEl.forEach((el, id) => {
      el.classList.toggle('mv-dim', Boolean(picked) && !keepEdges.has(id));
      el.classList.toggle('mv-sel', picked?.type === 'edge' && picked.id === id);
    });
    byId('mv-none').hidden = Boolean(picked);
    byId('mv-picked').hidden = !picked;
    if (!picked) return;
    const facts = byId('mv-facts');
    facts.textContent = '';
    const fact = (/** @type {string} */ name, /** @type {string} */ value) => {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = name;
      dd.textContent = value;
      facts.append(dt, dd);
    };
    const name = (/** @type {string} */ id) => nodes.get(id)?.label ?? id;
    if (picked.type === 'node') {
      const n = nodes.get(picked.id);
      const id = picked.id;
      byId('mv-title').textContent = n?.label ?? id;
      byId('mv-note').textContent = n?.note ?? '';
      const from = data.edges.filter((e) => e.to === id).map((e) => name(e.from));
      const to = data.edges.filter((e) => e.from === id).map((e) => name(e.to) + (e.label ? ` (${e.label})` : ''));
      fact('Comes from', from.length ? from.join(', ') : 'Nothing: the flow starts here');
      fact('Goes to', to.length ? to.join(', ') : 'Nothing: the flow ends here');
    } else {
      const e = edges.get(picked.id);
      byId('mv-title').textContent = e ? `${name(e.from)} to ${name(e.to)}` : picked.id;
      byId('mv-note').textContent = e?.label ? `Taken when the answer is ${e.label}.` : '';
      if (e) {
        fact('From', name(e.from));
        fact('To', name(e.to));
      }
    }
  };
  const wire = (/** @type {Element} */ el, /** @type {'node'|'edge'} */ type, /** @type {string} */ id) => {
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      pick({ type, id });
    });
    el.addEventListener('keydown', (ev) => {
      const key = /** @type {KeyboardEvent} */ (ev).key;
      if (key !== 'Enter' && key !== ' ') return;
      ev.preventDefault();
      pick({ type, id });
    });
  };
  nodeEl.forEach((el, id) => wire(el, 'node', id));
  edgeEl.forEach((el, id) => wire(el, 'edge', id));
  svg.addEventListener('click', () => pick(null));
  byId('mv-clear').addEventListener('click', () => pick(null));

  // ---- walk the steps ----
  if (!data.steps.length) return;
  const play = /** @type {HTMLButtonElement} */ (byId('mv-play'));
  const lineOf = (/** @type {string} */ id) => /** @type {SVGPathElement} */ (/** @type {unknown} */ (edgeEl.get(id)?.querySelector('.mv-line')));
  const setPlaying = (/** @type {boolean} */ on) => {
    playing = on;
    play.textContent = on ? 'Pause' : 'Play this path';
    document.body.classList.toggle('mv-playing', on);
    if (on) {
      last = 0;
      requestAnimationFrame(tick);
    }
  };
  const put = () => {
    const seq = data.steps[step].seq;
    let left = travelled;
    for (const id of seq) {
      const line = lineOf(id), length = line.getTotalLength();
      if (left <= length || id === seq[seq.length - 1]) {
        const p = line.getPointAtLength(Math.min(left, length));
        dot.setAttribute('transform', `translate(${p.x},${p.y})`);
        return;
      }
      left -= length;
    }
  };
  const tick = (/** @type {number} */ now) => {
    if (!playing) return;
    const s = data.steps[step];
    const total = s.seq.reduce((sum, id) => sum + lineOf(id).getTotalLength(), 0);
    // A long gap between frames (a hidden tab) must not throw the dot far ahead.
    travelled += last ? (Math.min(now - last, 64) / 1000) * speed : 0;
    last = now;
    if (travelled >= total) {
      if (s.loop) travelled %= total;
      else {
        travelled = total;
        put();
        return setPlaying(false);
      }
    }
    put();
    requestAnimationFrame(tick);
  };
  const show = (/** @type {number} */ to) => {
    step = Math.max(0, Math.min(data.steps.length - 1, to));
    const s = data.steps[step];
    setPlaying(false);
    travelled = 0;
    const on = new Set(s.seq), lit = new Set();
    edgeEl.forEach((el, id) => el.classList.toggle('mv-on', on.has(id)));
    s.seq.forEach((id, i) => {
      const e = edges.get(id), badge = edgeEl.get(id)?.querySelector('.mv-seq text');
      if (badge) badge.textContent = String(i + 1);
      if (e) lit.add(e.from).add(e.to);
    });
    nodeEl.forEach((el, id) => el.classList.toggle('mv-lit', lit.has(id)));
    byId('mv-count').textContent = `Step ${step + 1} of ${data.steps.length}`;
    byId('mv-step-title').textContent = s.title;
    byId('mv-step-text').textContent = s.text;
    byId('mv-loop').hidden = !s.loop;
    /** @type {HTMLButtonElement} */ (byId('mv-prev')).disabled = step === 0;
    /** @type {HTMLButtonElement} */ (byId('mv-next')).disabled = step === data.steps.length - 1;
    play.hidden = data.motion === 'none' || !s.seq.length;
    dot.style.display = data.motion === 'none' || !s.seq.length ? 'none' : '';
    if (s.seq.length) put();
  };
  byId('mv-prev').addEventListener('click', () => show(step - 1));
  byId('mv-next').addEventListener('click', () => show(step + 1));
  play.addEventListener('click', () => {
    // Pressed again at the end of a path that does not repeat, it starts over.
    if (!playing && !data.steps[step].loop) travelled = 0;
    setPlaying(!playing);
  });
  document.addEventListener('keydown', (ev) => {
    const el = /** @type {Element} */ (ev.target);
    if (el.closest('button, summary, [data-node], [data-edge]')) return;
    if (ev.key === 'ArrowRight') show(step + 1);
    else if (ev.key === 'ArrowLeft') show(step - 1);
    else if (ev.key === 'Escape') pick(null);
  });
  show(0);
}
