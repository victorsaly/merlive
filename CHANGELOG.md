# Changelog

## 0.1.0 (unreleased)

The first version. It draws flowcharts and nothing else, and says so.

- **A Mermaid flowchart becomes one page.** `merlive.mjs` reads a Markdown file's `mermaid` blocks (or a `.mmd`
  file) and writes one self-contained HTML page for each flowchart, or a still SVG with `--format svg`. Nothing is
  fetched when the page opens. The Mermaid block is never changed.
- **Placement is by rule, and the rules are checked.** The main path is one straight line, every box is the same
  size on a grid, lines turn at right angles, leave from ports of their own and go round boxes, loops go to one
  side. Seven placement rules and one for contrast are checked before anything is written; a diagram that breaks
  one is not written, and the message says which rule, where, and what to change. `--check` reports without
  writing; `--force` writes anyway.
- **Steps and notes live in the Mermaid source**, as `%%` comments other renderers ignore: `%% step:` for a
  walkthrough, `%% note X:` for what a box means, `%% main:` to name the main path, `%% side:` for where loops go.
- **A reader can pick a box or a line** to see only what it connects to, and walk the steps. Nothing moves until
  they press play, and then one dot follows the path; a loop repeats until paused.
- **Three designs come with it** (quiet, bold, soft), and a `merlive.design.json` in the project sets your own:
  colours, face, corner and how much may move (`none`, `calm`, `lively`).
- **What is not a flowchart is left as Mermaid and named**: sequence diagrams and the rest come later. Subgraph
  boxes, `&` between nodes and links from a box to itself are not drawn yet, and each is said when met.
