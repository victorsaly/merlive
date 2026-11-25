# Changelog

## 0.1.0 (unreleased)

The first version. It draws flowcharts and nothing else, and says so.

- **A Mermaid flowchart becomes one page.** `merlive.mjs` reads a Markdown file's `mermaid` blocks (or a `.mmd`
  file) and writes one self-contained HTML page for each flowchart, or a still SVG with `--format svg`. Nothing is
  fetched when the page opens. The Mermaid block is never changed.
- **Placement is by rule, and the rules are checked.** The main path is one straight line, every box is the same
  size on a grid, lines turn at right angles, leave from ports of their own and go round boxes, loops go to one
  side. Seven placement rules and two for colour are checked before anything is written; a diagram that breaks
  one is not written, and the message says which rule, where, and what to change. `--check` reports without
  writing; `--force` writes anyway.
- **It was run on a diagram somebody really wrote**, the paper trail on blog.victorsaly.com, and what that broke
  is fixed and held by tests. A branch now turns in the room between two ranks, with a track of its own, where
  it used to cut across a row of boxes. What feeds the main path comes in from one side and what leaves it goes
  out the other, and a box moves to a better lane when that removes a crossing. A box nothing leads to sits one
  step before what it feeds.
- **A label's own lines are kept**, up to four, where the author wrote `<br/>`, in a box wide enough for each. `accTitle` and `accDescr` are read and written into the picture for readers who cannot
  see it. A line that cannot be read leaves no box behind, and a `;` inside quotes no longer cuts a label.
- **Then on seventeen more**, every flowchart in the docs of business-analyst-agent-demo and correlateAI. All
  seventeen now draw, with no crossings. What they needed: words written into a link (`-- "words" -->`,
  `-. words .->`, `== words ==>`) and arrows drawn longer; a store of data (`[("…")]`) as a box of the data kind;
  groups (`subgraph`) drawn as frames with their titles, and a link between two groups; a class's colour read for
  what it means, so a class the design does not know takes the design's own nearest colour; a link's words set
  down where they sit on no box and no other words, wrapped to fit; and a line round the outside going round
  whichever side crosses less.
- **Mermaid kept in code is found**: a flowchart in a string in an `.astro` page or a script is drawn like one
  in Markdown.
- **A diagram has character, and each part of it means something.** The main path is drawn heavier. A box of a
  kind carries a stripe of its colour down its edge. A group's frame has a faint fill. In Merlive's own look,
  boxes lift off the page with a soft shadow and sit on a ground of dots, the grid they are placed on. Both are
  the design's to switch (`depth`, `ground`), both are on the setup page, and a design read from a site follows
  the site: a shadow only where the site has shadows, its page left plain.
- **Steps and notes live in the Mermaid source**, as `%%` comments other renderers ignore: `%% step:` for a
  walkthrough, `%% note X:` for what a box means, `%% main:` to name the main path, `%% side:` for where loops go.
- **A reader can pick a box or a line** to see only what it connects to, and walk the steps. Nothing moves until
  they press play, and then one dot follows the path; a loop repeats until paused.
- **It sets itself up.** `--setup` reads the project's own stylesheets, a folder of them together, or the site named in `package.json` or
  with `--from`, and writes `merlive.design.json` with nobody choosing a colour: the site's page, text and accent
  colours, its face and corner, a dark mode when the site has one, and the rest a diagram needs made from them.
  Whatever would break a colour rule is put right and said. It reads hex, `rgb()`, `hsl()`, bare hsl numbers and
  `oklch()`, and never writes over a design a project already has.
- **Setup shows a page**, `diagrams/merlive-setup.html`: the project's own diagram in light and dark, what was
  read and what was made, and every choice there is, with the two colour rules checked as a colour changes.
- **A project's choices are in its design file**: `modes` (light, dark or both), `motion`, `output.format` (a
  page, a picture or both), and `output.steps`, `output.legend`, `output.source` for what a page carries.
  `--format` takes `both`. Until a project has a design, Merlive draws in a look of its own, sea water and
  coral, in light and dark.
- **Any palette is held to two rules.** D1: words and lines can be read against what is behind them. D2: every
  two kinds of box a diagram uses can be told apart, as most people see them and with either common form of
  red-green colour blindness. The message names the two colours. Merlive's own kinds were chosen by that measure:
  in dark they are six of the Okabe-Ito colours.
- **A picked box says its kind in words**, so colour is never the only thing that carries it.
- **More of a flowchart is read**, the first three things the corpus found: a flowchart with front matter is
  drawn, and its `title` kept; `A & B --> C` links every box before the link to every box after it; and anything
  written with `@{ … }` is read, on one line or several: a box's shape and label, an icon or image kept as its
  label, a link's id, and what Mermaid sets on a link or a group read past.
- **What Merlive draws of Mermaid is written down, and checked.** `corpus/` holds one sample of each of the 32
  other kinds of diagram Mermaid documents and of 69 features of its flowcharts; `npm run coverage` runs Merlive
  over all of it and writes `docs/COVERAGE.md` and a picture of each flowchart sample. The tests fail when the
  page no longer says what the code does.
- **What is not a flowchart is left as Mermaid and named**: sequence diagrams, timelines and the rest come later.
  Links from a box to itself are not drawn yet, and each is said when met.