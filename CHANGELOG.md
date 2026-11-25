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
- **Steps and notes live in the Mermaid source**, as `%%` comments other renderers ignore: `%% step:` for a
  walkthrough, `%% note X:` for what a box means, `%% main:` to name the main path, `%% side:` for where loops go.
- **A reader can pick a box or a line** to see only what it connects to, and walk the steps. Nothing moves until
  they press play, and then one dot follows the path; a loop repeats until paused.
- **It sets itself up.** `--setup` reads the project's own stylesheet, or the site named in `package.json` or
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
- **What is not a flowchart is left as Mermaid and named**: sequence diagrams and the rest come later. Subgraph
  boxes, `&` between nodes and links from a box to itself are not drawn yet, and each is said when met.
