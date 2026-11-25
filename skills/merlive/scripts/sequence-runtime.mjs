// Why: a sequence is read one message at a time. This is the page's own script for a sequence diagram: it is
// handed to the page as source and run there, so it uses the browser's globals, not Node's, and nothing from
// outside the function. Everything is shown until a reader asks for less, and nothing moves until they press.

/**
 * @param {{participants:{id:string,label:string,role:string}[],messages:{id:string,from:string,to:string,label:string}[],motion:string}} data
 */
export function sequenceRuntime(data) {
  const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));
  const svg = /** @type {SVGSVGElement} */ (document.querySelector('.mv-svg'));
  const all = (/** @type {string} */ what) => /** @type {SVGElement[]} */ ([...svg.querySelectorAll(what)]);
  const lines = all('[data-edge]'), people = all('[data-node]'), notes = all('[data-note]'), frames = all('.mv-frame'), bars = all('.mv-bar');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || data.motion === 'none';
  const named = (/** @type {string} */ id) => data.participants.find((p) => p.id === id)?.label ?? id;
  const total = data.messages.length;
  let step = 0;
  /** @type {{what:'message'|'participant',id:string}|null} */
  let picked = null;

  /** One dot, once, from the sender to the receiver: which way a message went. */
  const run = (/** @type {SVGElement} */ line) => {
    const path = /** @type {SVGPathElement|null} */ (line.querySelector('.mv-line')), dot = /** @type {SVGElement|null} */ (svg.querySelector('#mv-dot'));
    if (still || !path || !dot) return;
    const length = path.getTotalLength(), began = performance.now(), takes = 450;
    dot.style.display = '';
    const move = (/** @type {number} */ now) => {
      const t = Math.min(1, (now - began) / takes), p = path.getPointAtLength(length * t);
      dot.setAttribute('transform', `translate(${p.x},${p.y})`);
      if (t < 1) requestAnimationFrame(move);
      else dot.style.display = 'none';
    };
    requestAnimationFrame(move);
  };

  const paint = () => {
    for (const el of [...lines, ...people, ...notes, ...frames, ...bars]) el.classList.remove('mv-dim', 'mv-on', 'mv-sel', 'mv-lit');
    const dim = (/** @type {SVGElement[]} */ list, /** @type {(el:SVGElement, i:number) => boolean} */ when) => list.forEach((el, i) => el.classList.toggle('mv-dim', when(el, i)));
    const at = (/** @type {SVGElement} */ el, /** @type {string} */ key) => Number(el.dataset[key] ?? 0);
    const now = step ? data.messages[step - 1] : null;
    if (now) {
      // What has not been said yet is faint; what is being said is lit.
      dim(lines, (_, i) => i + 1 > step);
      lines[step - 1]?.classList.add('mv-on');
      dim(notes, (el) => at(el, 'after') > step);
      dim(frames, (el) => at(el, 'first') > step);
      dim(bars, (el) => at(el, 'first') > step);
      for (const el of people) if (el.dataset.node === now.from || el.dataset.node === now.to) el.classList.add('mv-lit');
    } else if (picked?.what === 'participant') {
      const id = picked.id, with_ = new Set([id]);
      for (const m of data.messages) if (m.from === id || m.to === id) with_.add(m.from).add(m.to);
      dim(lines, (_, i) => data.messages[i].from !== id && data.messages[i].to !== id);
      dim(people, (el) => !with_.has(el.dataset.node ?? ''));
      dim(notes, (el) => !(el.dataset.over ?? '').split(' ').includes(id));
      dim(bars, (el) => el.dataset.of !== id);
      for (const el of people) if (el.dataset.node === id) el.classList.add('mv-sel');
    } else if (picked) {
      const m = data.messages.find((x) => x.id === picked?.id);
      dim(lines, (el) => el.dataset.edge !== picked?.id);
      dim(people, (el) => el.dataset.node !== m?.from && el.dataset.node !== m?.to);
      dim(notes, () => true);
      for (const el of lines) if (el.dataset.edge === picked.id) el.classList.add('mv-sel');
    }

    const count = $('mv-count');
    if (count) {
      count.textContent = now ? `Message ${step} of ${total}` : `${total} messages, all shown`;
      $('mv-step-title').textContent = now ? `${named(now.from)} to ${named(now.to)}` : 'Go through it one message at a time';
      $('mv-step-text').textContent = now ? now.label : 'Next shows the first message and leaves the rest faint.';
      /** @type {HTMLButtonElement} */ ($('mv-prev')).disabled = step === 0;
      /** @type {HTMLButtonElement} */ ($('mv-next')).disabled = step === total;
    }
    $('mv-none').hidden = Boolean(picked) || Boolean(now);
    $('mv-picked').hidden = !picked && !now;
    const facts = $('mv-facts');
    facts.textContent = '';
    const fact = (/** @type {string} */ what, /** @type {string} */ value) => {
      facts.append(Object.assign(document.createElement('dt'), { textContent: what }), Object.assign(document.createElement('dd'), { textContent: value }));
    };
    if (picked?.what === 'participant') {
      const p = data.participants.find((x) => x.id === picked?.id);
      $('mv-title').textContent = p?.label ?? '';
      $('mv-note').textContent = '';
      fact('Is', p?.role ?? '');
      fact('Sends', String(data.messages.filter((m) => m.from === p?.id).length));
      fact('Receives', String(data.messages.filter((m) => m.to === p?.id).length));
    } else if (picked) {
      const m = data.messages.find((x) => x.id === picked?.id);
      $('mv-title').textContent = m ? `${named(m.from)} to ${named(m.to)}` : '';
      $('mv-note').textContent = m?.label ?? '';
      if (m) fact('Message', `${data.messages.indexOf(m) + 1} of ${total}`);
    } else {
      // Going through the messages, the card above says which one this is; here is only the way back.
      $('mv-title').textContent = 'What is still to come is faint';
      $('mv-note').textContent = '';
    }
  };

  const pick = (/** @type {EventTarget|null} */ target) => {
    const el = /** @type {Element|null} */ (target instanceof Element ? target.closest('[data-edge],[data-node]') : null);
    if (!el) return;
    const line = el.getAttribute('data-edge'), id = line ?? el.getAttribute('data-node') ?? '';
    const same = picked && picked.id === id && (picked.what === 'message') === Boolean(line);
    picked = same ? null : { what: line ? 'message' : 'participant', id };
    step = 0;
    paint();
  };
  svg.addEventListener('click', (e) => pick(e.target));
  svg.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    pick(e.target);
  });
  const go = (/** @type {number} */ to) => {
    step = Math.max(0, Math.min(total, to));
    picked = null;
    paint();
    const line = lines[step - 1];
    if (!line) return;
    line.scrollIntoView({ block: 'center', inline: 'nearest', behavior: still ? 'auto' : 'smooth' });
    run(line);
  };
  $('mv-next')?.addEventListener('click', () => go(step + 1));
  $('mv-prev')?.addEventListener('click', () => go(step - 1));
  $('mv-clear').addEventListener('click', () => {
    picked = null;
    go(0);
  });
  paint();
}
