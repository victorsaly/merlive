# Where Merlive is going

Merlive turns the Mermaid already in your Markdown into diagrams that are well placed, in your own design, and
live. The Mermaid stays the source: it is what people edit, and it still renders anywhere Mermaid does.

## What is borrowed, and from where

| Idea | From | In Merlive |
|---|---|---|
| A design asked for once and kept in a file | Impeccable | `merlive.design.json`: the colours are the project's own |
| Colours a colour-blind reader can tell apart | Okabe and Ito, Paul Tol | Rule D2, checked on every palette; Merlive's dark kinds are Okabe-Ito's |
| Rules checked before output, not left to the model | Impeccable, Archify | `score.mjs`: nothing is written that breaks a rule |
| A typed model between the text and the drawing | Archify | `parse.mjs` gives a model; layout and drawing never read Mermaid |
| Step-by-step walkthroughs a reader can leave and come back to | Ilograph | `%% step:` comments |
| Pick a thing, see only what it touches | Ilograph | In every page |
| Flows played over a diagram that is already there | IcePanel | A step is a path over the flowchart |
| A legend made for you | Structurizr | From the kinds of box the diagram uses |
| Colours as variables, so a theme is a few values | beautiful-mermaid | The design's palette |
| A still version for where a page cannot go | D2, Archify | `--format svg`; notes print as an appendix |

What is Merlive's own: Mermaid stays the source of truth, placement is by named rule, and the colours are yours
but checked, for contrast and for colour-blind readers, before anything is drawn in them.

## Milestones

1. **0.1, flowcharts (this version).** Parse, place, check, draw; steps and notes; a look of its own in light and
   dark, and a design file for a project's own colours, checked.
2. **0.2, the design page.** `merlive.mjs --design-page` writes one page showing one of your own diagrams in your
   colours, light and dark side by side, with each colour editable, the two colour rules checked as you change
   them, and a button that copies the design file. A dark made from your light when you give only one.
3. **0.3, bigger flowcharts.** Subgraph outlines, branches on both sides of the spine, pan, zoom and a search
   box for diagrams past about twenty boxes.
4. **0.4, state diagrams.** The same placement, with loops as first-class paths.
5. **0.5, sequence diagrams.** Stepped through one message at a time, and played over a flowchart in the same
   document when the names match.
6. **Later.** A build step for docs sites (Docusaurus first), an audit mode over a whole repository, evals for the
   skill, a film export.

## What it will not become

- A diagram editor. The Mermaid is edited as text; Merlive never asks anyone to drag a box.
- A second diagram language. Hints are comments in Mermaid, and there are four of them.
