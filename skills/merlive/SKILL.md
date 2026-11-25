---
name: merlive
description: Turns the Mermaid flowcharts in a Markdown file into well placed, live diagrams, one self-contained HTML page (or a still SVG) each, in the project's own design, with the main path straight, boxes of one size, and steps a reader can walk through. The Mermaid stays the source and is not changed. Use when asked to make a Mermaid diagram live, interactive, better looking or better laid out, to "merlive" a document, to add a walkthrough to a flowchart, or to set the look of a project's diagrams. Load it before planning the diagrams, even when asked not to run anything yet.
license: MIT
metadata:
  version: 0.1.0
  homepage: https://github.com/victorsaly/merlive
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/scripts/*)
---

# Merlive: Mermaid, placed by rule and made live

One Mermaid flowchart in, one page out: the main path in a straight line, every box the same size, lines that go
round boxes, in the project's design, with steps a reader can walk. The script is `scripts/merlive.mjs` next to
this file (in Claude Code, `${CLAUDE_SKILL_DIR}`); run it with Node from the project's folder. `--help` says every
option, so there is no need to read the script.

Three things hold throughout:

- **The Mermaid is the source.** Never edit the generated page or picture by hand; change the Mermaid and draw
  again. Never change a person's Mermaid block without asking first.
- **Placement is Merlive's, not yours.** Do not try to position anything. If a diagram breaks a rule, change the
  Mermaid as the message says, or tell the person; do not reach for `--force`.
- **The design is the project's, chosen once.** Do not invent a look for one diagram.

## 1. Decide whether to draw at all

- **Draw** a flowchart that has a path worth following: about six boxes or more, a loop, or a decision.
- **Leave as Mermaid** a diagram of three or four boxes with nothing to step through. Say so; a live page adds
  nothing there.
- **Only flowcharts for now** (`flowchart` or `graph`). Sequence, state, class and the rest are left as they are,
  and the script names each one it leaves. Tell the person which were left.

## 2. Check first, then draw

```bash
node ${CLAUDE_SKILL_DIR}/scripts/merlive.mjs docs/orders.md --check   # what would be drawn; writes nothing
node ${CLAUDE_SKILL_DIR}/scripts/merlive.mjs docs/orders.md           # diagrams/orders-1.html beside the file
```

- One file at a time. Each flowchart becomes `<file>-<n>.html` in a `diagrams` folder beside the Markdown file;
  `--out` puts them elsewhere, `--only 2` draws just the second block.
- `--format svg` writes a still picture instead, for a wiki or anywhere a page cannot be opened.
- A line starting `note,` is something the script read past (a subgraph, an `&`): pass it on if it changes what
  the person will see.
- Open the result and look at it before saying it is done. A diagram can pass every check and still not say what
  the document says.

## 3. When a rule fails

The script ends with 1, writes nothing for that diagram, and names the rule. Each has one usual fix, made in the
Mermaid, with the person's agreement:

| Rule | Usual fix |
|---|---|
| P6 words do not fit | Shorten the label; put the detail in a `%% note` |
| P4 too many crossings | Name the main path with `%% main:`, or split the diagram in two |
| P3 a line through a box | Name the main path with `%% main:` so the box in the way moves aside |
| D1 contrast | Change the colour the message names, in the design file |

`--force` writes the diagram anyway. Use it only when the person has seen the message and asks for it.

## 4. Steps and notes, in the Mermaid itself

A walkthrough and what each box means are written as `%%` comments inside the block, so every other Mermaid
renderer ignores them and the file still renders anywhere:

```
%% note C: Compares the order total with what is left in the budget.
%% step: The budget check | B>C | A valid order is compared with the remaining budget.
%% step: The revision loop | loop 1 | Over budget, so the requester revises and it is validated again.
%% main: A>B>C>D
```

- When a flowchart has no steps, **offer** to add some: draft them from the document's own words (three to six
  steps, the normal path first, then each loop), show the person the lines you would add, and add them only when
  they agree. Never invent what a box does; a note says only what the document says.
- `loop 1` is the shortest loop in the graph, `loop 2` the next. The syntax in full is in
  [reference.md](reference.md).

## 5. The design

- The script uses `merlive.design.json` in the project's folder when there is one, else the `quiet` design.
  `--design bold` or `--design soft` tries another; `--design path/to/file.json` uses a file elsewhere.
- **The first time in a project with no design file**, draw one of their diagrams in each of the three designs
  into a scratch folder (`--design quiet --out /tmp/merlive/quiet`, and so on), show them, and ask which is
  closest and what to change. Then write `merlive.design.json` (its fields are in [reference.md](reference.md))
  and draw everything with it from then on.
- A design sets colours, the face, the corner, and how much may move: `none`, `calm` (one dot, when the reader
  presses play) or `lively` (the path flows too). Leave it at `calm` unless asked.
- A design that fails the contrast check is not used until its colours are fixed.

## 6. Say what you did

Finish with: which blocks were drawn and where the files are, which were left as Mermaid and why, any `note,`
lines that matter, and anything a rule would not let through. If you added steps or notes to the Mermaid, say
which file changed.
