# Where Merlive is going

Merlive turns the Mermaid already in your Markdown into diagrams that are well placed, in your own design, and
live. The Mermaid stays the source: it is what people edit, and it still renders anywhere Mermaid does.

## What is borrowed, and from where

| Idea | From | In Merlive |
|---|---|---|
| A design settled once and kept in a file | Impeccable | `merlive.design.json`, which `--setup` writes by reading the project's own site |
| Colours a colour-blind reader can tell apart | Okabe and Ito, Paul Tol | Rule D2, checked on every palette; Merlive's dark kinds are Okabe-Ito's |
| Rules checked before output, not left to the model | Impeccable, Archify | `score.mjs`: nothing is written that breaks a rule |
| A typed model between the text and the drawing | Archify | `parse.mjs` gives a model; layout and drawing never read Mermaid |
| Step-by-step walkthroughs a reader can leave and come back to | Ilograph | `%% step:` comments |
| Pick a thing, see only what it touches | Ilograph | In every page |
| Flows played over a diagram that is already there | IcePanel | A step is a path over the flowchart |
| A legend made for you | Structurizr | From the kinds of box the diagram uses |
| Colours as variables, so a theme is a few values | beautiful-mermaid | The design's palette |
| A still version for where a page cannot go | D2, Archify | `--format svg`; notes print as an appendix |

What is Merlive's own: Mermaid stays the source of truth, placement is by named rule, nothing is configured by
hand, and the colours are yours, read from your site, but checked, for contrast and for colour-blind readers, before anything is drawn in them.

## Milestones

1. **0.1, flowcharts (this version).** Parse, place, check, draw; steps and notes; setup that reads a project's
   colours and choices with nothing asked; the two colour rules.
2. **0.2, setup that reads more.** Colours kept in a Tailwind config or a component's own styles; a dark look made
   from a light one when a site has none and the reader wants one; the setup page saving its settings itself.
3. **0.3, bigger flowcharts.** A group's own direction (rows inside a column), groups inside groups, pan, zoom and a search
   box for diagrams past about twenty boxes.
4. **0.4, state diagrams.** The same placement, with loops as first-class paths.
5. **0.5, sequence diagrams.** Stepped through one message at a time, and played over a flowchart in the same
   document when the names match.
6. **Later.** A build step for docs sites (Docusaurus first), an audit mode over a whole repository, evals for the
   skill, a film export.

## What the corpus found

`corpus/` holds one sample of everything Mermaid documents, and [COVERAGE.md](COVERAGE.md) says what Merlive
draws of each, written again whenever the code changes. Its first run found seven things. Three are done: front
matter, `&` between boxes, and everything written with `@{ … }`. What is left, worst first, is all flowchart
features, so it comes before any new kind of diagram:

1. **Links that end in a circle or a cross, or point both ways**, and the invisible link.
2. **Six of the older shapes**: the flag, the double circle, and the four leaning ones, which today keep their
   slashes as words.
3. **Words**: entity codes, Markdown strings and Font Awesome icons are drawn as they were typed.
4. **Bottom-to-top and right-to-left** are drawn the other way round, and a group inside a group is drawn as part
   of the outer one. Both are said when met.

Reading `&` brought out a fourth thing, now done: two boxes that each lead to the same two (`A & B --> C & D`)
were refused. The lines that swap sides no longer lie on each other, and P4 allows the one crossing such a
diagram cannot be drawn without. Three boxes that each lead to the same three are still refused: that forces
nine crossings, and placement does not yet find the order that has only those.

And one thing no check caught, seen in the pictures: a line coming into a group from above runs through the
group's name. By this project's habit that is a new rule and a check for it, not a nudge.

## What it will not become

- A diagram editor. The Mermaid is edited as text; Merlive never asks anyone to drag a box.
- A second diagram language. Hints are comments in Mermaid, and there are four of them.
