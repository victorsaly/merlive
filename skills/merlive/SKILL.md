---
name: merlive
description: Turns the Mermaid flowcharts and state, class, entity, requirement, C4, architecture, block and sequence diagrams in a Markdown file into well placed, live diagrams, one self-contained HTML page (or a still SVG) each, in the project's own colours, which it reads from the project's site by itself, with the main path straight, boxes of one size, and steps a reader can walk through. The Mermaid stays the source and is not changed. Use when asked to make a Mermaid diagram live, interactive, better looking or better laid out, to "merlive" a document, to add a walkthrough to a flowchart, or to set the look of a project's diagrams. Load it before planning the diagrams, even when asked not to run anything yet.
license: MIT
metadata:
  version: 0.3.0
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
- **The design is the project's, and sets itself up.** The script reads the project's colours; nobody is asked
  for one. Do not invent a look for a diagram, and never ask a person for a colour code.

## 1. Decide whether to draw at all

- **Draw** a flowchart that has a path worth following: about six boxes or more, a loop, or a decision.
- **Leave as Mermaid** a diagram of three or four boxes with nothing to step through. Say so; a live page adds
  nothing there.
- **Flowcharts** (`flowchart` or `graph`), **state diagrams** (`stateDiagram`), **class diagrams**
  (`classDiagram`), **entity diagrams** (`erDiagram`), **requirement diagrams** (`requirementDiagram`), **C4
  diagrams** (`C4Context` and the rest), **architecture diagrams** (`architecture-beta`) and **block diagrams**
  (`block-beta`, on the grid their author wrote), **and sequence diagrams** (`sequenceDiagram`), which have
  rules of their own. Timeline, gantt and the rest are left as they are, and the script names each one it
  leaves. Tell the person which were left.

## 2. Check first, then draw

```bash
node ${CLAUDE_SKILL_DIR}/scripts/merlive.mjs docs/orders.md --check   # what would be drawn; writes nothing
node ${CLAUDE_SKILL_DIR}/scripts/merlive.mjs docs/orders.md           # diagrams/orders-1.html beside the file
```

- One file at a time: Markdown, a `.mmd` file, or a page or script that keeps a flowchart in a string (an
  `.astro` page, say). Each flowchart becomes `<file>-<n>.html` in a `diagrams` folder beside the Markdown file;
  `--out` puts them elsewhere, `--only 2` draws just the second block.
- `--format svg` writes a still picture instead, for a wiki or anywhere a page cannot be opened.
- A line starting `note,` is something the script could not read or draw (a direction drawn the other way round, a group's frame left out): pass it on if it changes what
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
| S7 a name or words too long (a sequence diagram) | Give the participant a shorter name with `as`; break a message with `<br/>` |
| P3 a line through a box | Name the main path with `%% main:` so the box in the way moves aside |
| D1 contrast | Change the colour the message names, in the design file |
| D2 kinds look alike | Make one of the two colours named lighter or darker, in the design file |

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

## 5. The design sets itself up

The person should not have to configure anything. The first time in a project, before the first diagram, when
there is no `merlive.design.json` in its folder, run setup yourself, without asking:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/merlive.mjs --setup
```

It finds the project's own stylesheet (or the site named in `package.json`), reads its page, text and accent
colours, its face, its corner and whether it has a dark mode, writes `merlive.design.json`, and writes
`diagrams/merlive-setup.html`: one of the project's diagrams in those colours, with every choice there is. It
puts right whatever would break a colour rule and says what it changed. Then draw as usual.

- **Tell the person what it did, in a sentence or two**: where the colours came from, anything it changed (an
  accent too light for a line, say), and that the setup page is there if they want to look. Do not read them the
  settings.
- **The diagrams will be read somewhere else** (a blog, a docs site that is not this folder): when the person has
  named it, or the README does, give it: `--setup --from https://their.site`.
- **Setup found no colours**: ask one question, "What site will these diagrams be read on?", and run it again
  with `--from`. If they have none, Merlive's own look is the answer; say so and carry on.
- **The script cannot reach the site from here**: fetch the site's stylesheet with your own tools, save it to a
  scratch file, and pass that path to `--from`.
- **A project that already has a design** is left alone. `--setup --force` makes it again; ask first.
- **One diagram in another project's colours**: `--design path/to/merlive.design.json` draws with a file elsewhere.

### When they want something different

They say it in their own words ("dark only", "no steps", "a picture for the wiki as well", "our blue for the
accent", "square corners"), or paste settings copied from the setup page. Change `merlive.design.json` to match
(its fields are in [reference.md](reference.md)), then run `--check`:

| They want | Change |
|---|---|
| Light only, dark only, or both | `modes` |
| Nothing moving, or more | `motion`: `none`, `calm`, `lively` |
| More character, or less: shadows, a dotted ground | `depth`: `flat`, `soft`. `ground`: `plain`, `dots` |
| A still picture as well as, or in place of, the page | `output.format`: `html`, `svg`, `both` |
| No walkthrough, no legend, no Mermaid shown | `output.steps`, `output.legend`, `output.source` |
| Another colour, face or corner | `light`, `dark`, `font`, `radius` |

Two rules hold any colours to account, and the message names the colour to change: D1, words and lines can be
read, and D2, the kinds of box can be told apart, also by people who do not see red and green apart. Pass the
message on in plain words; do not pick a replacement colour for them unless they ask you to.

## 6. Say what you did

Finish with: which blocks were drawn and where the files are, which were left as Mermaid and why, any `note,`
lines that matter, and anything a rule would not let through. If you added steps or notes to the Mermaid, say
which file changed.
