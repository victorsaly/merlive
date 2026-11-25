// Why: Merlive reads a small, honest part of Mermaid's flowchart language and says what it left out, so a
// diagram is never drawn from a guess. Everything here is pure: text in, a model out.

/** @typedef {{id:string,label:string,shape:'box'|'pill'|'decision',kind:string}} Node */
/** @typedef {{id:string,from:string,to:string,label:string,style:'solid'|'dotted'|'thick',arrow:boolean}} Edge */
/** @typedef {{title:string,text:string,path:string,seq:string[],loop:boolean}} Step */
/**
 * @typedef {object} Model
 * @property {'flowchart'|'unsupported'} type
 * @property {string} kindOfDiagram the first word of the source, for the message when it is not a flowchart
 * @property {'TD'|'LR'} direction
 * @property {Node[]} nodes
 * @property {Edge[]} edges
 * @property {Record<string,string>} notes
 * @property {Step[]} steps
 * @property {{main?:string[],side?:'left'|'right'}} hints
 * @property {string[]} warnings
 */

// Longest opener first, so "([" is not read as "(" and then "[".
const OPENERS = /** @type {const} */ ([
  ['([', '])', 'pill'],
  ['((', '))', 'pill'],
  ['[[', ']]', 'box'],
  ['{{', '}}', 'decision'],
  ['[', ']', 'box'],
  ['(', ')', 'box'],
  ['{', '}', 'decision'],
]);

const ARROWS = /** @type {const} */ ([
  ['-.->', 'dotted', true],
  ['-.-', 'dotted', false],
  ['==>', 'thick', true],
  ['===', 'thick', false],
  ['-->', 'solid', true],
  ['---', 'solid', false],
]);

// Mermaid styling lines. Merlive's look comes from the design file, so these are read past without a warning.
const STYLING = /^(classDef|style|linkStyle|click|direction)\b/;

const escapeRe = (/** @type {string} */ s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @param {string} src one Mermaid block
 * @returns {Model}
 */
export function parse(src) {
  /** @type {Model} */
  const model = { type: 'flowchart', kindOfDiagram: '', direction: 'TD', nodes: [], edges: [], notes: {}, steps: [], hints: {}, warnings: [] };
  /** @type {Map<string, Node>} */
  const byId = new Map();
  const seenEdge = new Map();
  let header = false;
  let warnedSubgraph = false;

  const warn = (/** @type {number} */ line, /** @type {string} */ what) => model.warnings.push(`line ${line}: ${what}`);

  const node = (/** @type {string} */ id) => {
    let n = byId.get(id);
    if (!n) {
      n = { id, label: id, shape: 'box', kind: '' };
      byId.set(id, n);
      model.nodes.push(n);
    }
    return n;
  };

  /** Reads `A`, `A[Label]`, `A{Label}:::kind` at pos. */
  const readNode = (/** @type {string} */ s, /** @type {number} */ pos) => {
    const m = /^\s*([A-Za-z_]\w*)/.exec(s.slice(pos));
    if (!m) return null;
    let p = pos + m[0].length;
    const n = node(m[1]);
    for (const [open, close, shape] of OPENERS) {
      if (!s.startsWith(open, p)) continue;
      const start = p + open.length;
      // A quoted label may hold the closing bracket itself, so the closer is looked for after the quote ends.
      const quoted = s[start] === '"' ? s.indexOf('"', start + 1) : -1;
      const end = s.indexOf(close, quoted > 0 ? quoted + 1 : start);
      if (end < 0) return null;
      n.label = s.slice(start, end).trim().replace(/^"|"$/g, '').replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ');
      n.shape = shape;
      p = end + close.length;
      break;
    }
    const cls = /^:::(\w+)/.exec(s.slice(p));
    if (cls) {
      n.kind = cls[1];
      p += cls[0].length;
    }
    return { node: n, pos: p };
  };

  /** Reads `-->`, `-->|Yes|`, `-- Yes -->` and the dotted and thick forms at pos. */
  const readLink = (/** @type {string} */ s, /** @type {number} */ pos) => {
    const rest = s.slice(pos);
    const worded = /^\s*--\s*([^\s|>-][^|>]*?)\s*(-->|---)/.exec(rest);
    if (worded) return { style: /** @type {const} */ ('solid'), arrow: worded[2] === '-->', label: worded[1].trim(), pos: pos + worded[0].length };
    for (const [arrow, style, head] of ARROWS) {
      const m = new RegExp(`^\\s*${escapeRe(arrow)}\\s*(?:\\|([^|]*)\\|)?`).exec(rest);
      if (m) return { style, arrow: head, label: (m[1] ?? '').trim().replace(/^"|"$/g, ''), pos: pos + m[0].length };
    }
    return null;
  };

  const statement = (/** @type {string} */ s, /** @type {number} */ line) => {
    const first = readNode(s, 0);
    if (!first) return warn(line, `not read: "${s}"`);
    let pos = first.pos;
    let prev = first.node;
    while (s.slice(pos).trim() !== '') {
      if (/^\s*&/.test(s.slice(pos))) return warn(line, `"&" between nodes is not read yet; write one link per line: "${s}"`);
      const link = readLink(s, pos);
      const next = link && readNode(s, link.pos);
      if (!link || !next) return warn(line, `not read: "${s}"`);
      if (prev.id === next.node.id) {
        warn(line, `a link from ${prev.id} to itself is not drawn`);
      } else {
        const base = `${prev.id}-${next.node.id}`;
        const count = (seenEdge.get(base) ?? 0) + 1;
        seenEdge.set(base, count);
        model.edges.push({ id: count === 1 ? base : `${base}#${count}`, from: prev.id, to: next.node.id, label: link.label, style: link.style, arrow: link.arrow });
      }
      prev = next.node;
      pos = next.pos;
    }
  };

  src.split(/\r?\n/).forEach((raw, i) => {
    const line = i + 1;
    const text = raw.trim();
    if (!text) return;

    // Merlive's own lines live in Mermaid comments, so every other Mermaid renderer still reads the block.
    const note = /^%%\s*note\s+(\w+)\s*:\s*(.+)$/.exec(text);
    if (note) return void (model.notes[note[1]] = note[2].trim());
    const step = /^%%\s*step\s*:\s*(.+)$/.exec(text);
    if (step) {
      const [title = '', path = '-', words = ''] = step[1].split('|').map((x) => x.trim());
      return void model.steps.push({ title, text: words, path, seq: [], loop: false });
    }
    const main = /^%%\s*main\s*:\s*(.+)$/.exec(text);
    if (main) return void (model.hints.main = main[1].split('>').map((x) => x.trim()).filter(Boolean));
    const side = /^%%\s*side\s*:\s*(left|right)\s*$/.exec(text);
    if (side) return void (model.hints.side = /** @type {'left'|'right'} */ (side[1]));
    if (text.startsWith('%%')) return;

    if (!header) {
      header = true;
      const h = /^(flowchart|graph)\b\s*(TD|TB|BT|LR|RL)?/.exec(text);
      model.kindOfDiagram = text.split(/\s+/)[0];
      if (!h) {
        model.type = 'unsupported';
        return;
      }
      if (h[2] === 'LR' || h[2] === 'RL') model.direction = 'LR';
      if (h[2] === 'BT' || h[2] === 'RL') warn(line, `${h[2]} is drawn as ${model.direction}`);
      return;
    }
    if (model.type === 'unsupported') return;

    if (/^subgraph\b/.test(text) || text === 'end') {
      if (!warnedSubgraph) warn(line, 'subgraph boxes are not drawn yet; their nodes are placed as if ungrouped');
      warnedSubgraph = true;
      return;
    }
    if (STYLING.test(text)) return;
    const cls = /^class\s+([\w,\s]+?)\s+(\w+)\s*;?$/.exec(text);
    if (cls) {
      for (const id of cls[1].split(',').map((x) => x.trim())) if (byId.has(id)) node(id).kind = cls[2];
      return;
    }
    for (const part of text.split(';').map((x) => x.trim()).filter(Boolean)) statement(part, line);
  });

  for (const n of model.nodes) if (!n.kind) n.kind = n.shape === 'decision' ? 'decision' : n.shape === 'pill' ? 'terminal' : 'step';
  for (const id of Object.keys(model.notes)) if (!byId.has(id)) model.warnings.push(`note for ${id}: no such node`);
  resolveSteps(model);
  return model;
}

/**
 * Every loop in the graph, shortest first, each starting at its earliest node in source order.
 * @param {Pick<Model,'nodes'|'edges'>} model
 * @returns {string[][]}
 */
export function findLoops(model) {
  const index = new Map(model.nodes.map((n, i) => [n.id, i]));
  /** @type {Map<string,string[]>} */
  const next = new Map(model.nodes.map((n) => [n.id, []]));
  for (const e of model.edges) if (!next.get(e.from)?.includes(e.to)) next.get(e.from)?.push(e.to);
  /** @type {string[][]} */
  const loops = [];
  const at = (/** @type {string} */ id) => index.get(id) ?? -1;
  for (const start of model.nodes.map((n) => n.id)) {
    const walk = (/** @type {string} */ v, /** @type {string[]} */ path) => {
      for (const w of next.get(v) ?? []) {
        if (w === start) loops.push([...path]);
        // Only later nodes are walked, so each loop is found once, from its earliest node.
        else if (at(w) > at(start) && !path.includes(w)) walk(w, [...path, w]);
      }
    };
    walk(start, [start]);
  }
  return loops.sort((a, b) => a.length - b.length);
}

/** Turns each step's path ("A>B>C", "loop 1" or "-") into the links it runs along. */
function resolveSteps(/** @type {Model} */ model) {
  const has = new Set(model.edges.map((e) => e.id));
  const loops = model.steps.some((s) => /^loop\s+\d+$/.test(s.path)) ? findLoops(model) : [];
  for (const s of model.steps) {
    /** @type {string[]} */
    let ids = [];
    const loop = /^loop\s+(\d+)$/.exec(s.path);
    if (loop) {
      const found = loops[Number(loop[1]) - 1];
      if (!found) model.warnings.push(`step "${s.title}": there is no loop ${loop[1]}`);
      else ids = [...found, found[0]];
      s.loop = Boolean(found);
    } else if (s.path !== '-' && s.path !== '') {
      ids = s.path.split('>').map((x) => x.trim());
    }
    for (let i = 0; i < ids.length - 1; i++) {
      const id = `${ids[i]}-${ids[i + 1]}`;
      if (has.has(id)) s.seq.push(id);
      else model.warnings.push(`step "${s.title}": no link from ${ids[i]} to ${ids[i + 1]}`);
    }
  }
}

/**
 * The Mermaid blocks of a Markdown file, each with the heading it sits under.
 * @param {string} text
 * @param {boolean} wholeFile true for a .mmd file, which is one block with no fences
 * @returns {{source:string,title:string,line:number}[]}
 */
export function blocksOf(text, wholeFile = false) {
  if (wholeFile) return [{ source: text, title: '', line: 1 }];
  const out = [];
  let heading = '';
  /** @type {string[]|null} */
  let open = null;
  let openedAt = 0;
  text.split(/\r?\n/).forEach((line, i) => {
    if (open) {
      if (/^\s*(```|~~~)\s*$/.test(line)) {
        out.push({ source: open.join('\n'), title: heading, line: openedAt });
        open = null;
      } else open.push(line);
      return;
    }
    const h = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) heading = h[1];
    if (/^\s*(```|~~~)\s*mermaid\s*$/.test(line)) {
      open = [];
      openedAt = i + 1;
    }
  });
  return out;
}
