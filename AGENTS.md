# Working on Merlive

For coding agents changing this repository. It follows the same habits as
[SideShot](https://github.com/victorsaly/sideshot).

## What is where

- `skills/merlive/SKILL.md`: what an agent reads to use Merlive. Short on purpose (the checks hold it under 500
  lines); anything only some diagrams need goes in `reference.md`, linked from SKILL.md and linking nowhere.
- `skills/merlive/scripts/merlive.mjs`: the command. The only file that reads and writes the disk, and the only
  one that goes to the network (setup, reading a site). Everything it decides with is in the pure files.
- `skills/merlive/scripts/parse.mjs`: Mermaid text to a model, and the Mermaid blocks of a Markdown file. Says
  what it did not read. Pure.
- `skills/merlive/scripts/state.mjs`: a state diagram's lines, read into the model a flowchart gives, with the
  tools parse.mjs lends it. It places and draws nothing: a state diagram is a flowchart from there on. Pure.
- `skills/merlive/scripts/class.mjs`, `er.mjs`: the same for a class diagram and an entity diagram. A class or an
  entity is a box that lists rows under its name; what its links end in says "is a", "has" or how many. A new
  kind of boxes and links is a reader like these and one line in `READERS` in parse.mjs. Pure.
- `skills/merlive/scripts/requirement.mjs`, `c4.mjs`, `architecture.mjs`, `block.mjs`: four more readers of the
  same kind. A requirement and a C4 element say a sentence about themselves (`text`). A block diagram that is a flow is
  placed by rank; one whose meaning is in its author's grid is marked to be placed on that grid
  (`model.placedBy`). Each has its list in `corpus/index.json`, and its line in `things` in `scripts/coverage.mjs`,
  which is all the coverage page and the comparison page need to show a new kind. Pure.
- `skills/merlive/scripts/grid.mjs`: places a block diagram on the grid its author wrote, and routes its links
  round the blocks. Gives the same layout layout.mjs does, so it is drawn and checked by the same code. Its
  measured numbers are in `gridMeasure`. Pure.
- `skills/merlive/scripts/layout.mjs`: the model to coordinates, by the rules in `docs/PLACEMENT.md`. Every
  measured number is in `measure` at the top, with why. Pure.
- `skills/merlive/scripts/shapes.mjs`: every shape Merlive draws: its outline, the room it leaves for words, and
  where a line meets it. Layout and drawing both ask here. Its measured numbers are in `form`. Pure.
- `skills/merlive/scripts/score.mjs`: the rules as checks. A rule in `docs/PLACEMENT.md` with no check here is a
  bug. Pure.
- `skills/merlive/scripts/design.mjs`: Merlive's own look in light and dark, a project's design file laid over
  it, and the colour sums (mixing, contrast, how far apart two colours look to ordinary and colour-blind sight).
  Pure. The colours are the user's: do not add ready-made palettes to choose from.
- `skills/merlive/scripts/site.mjs`: a site's stylesheets to what they say of its page (colours, face, corner,
  dark mode), and a design file made from that with nobody choosing a colour. What was found, changed and made
  is said. Nothing is guessed. Pure.
- `skills/merlive/scripts/setup.mjs`: the page setup shows. It carries design.mjs's own source, so the page and
  the command check colours with the same sums. Pure.
- `skills/merlive/scripts/render.mjs`: a model, a layout and a design to one HTML page or one SVG. Pure.
- `skills/merlive/scripts/icons.mjs`: Merlive's own line icons, each drawn by hand on a 16px grid, and the names
  an author may have written for one (Font Awesome's, across its versions). Nothing is fetched and nobody's mark
  is drawn. What an icon is held to is in `iconMeasure` at the top. Pure.
- `skills/merlive/scripts/runtime.mjs`: handed to the page as source and run there, so browser globals, not
  Node's, and nothing from outside the function.
- `skills/merlive/scripts/sequence.mjs`: a sequence diagram, start to finish but for the drawing: its text to a
  model, the model to coordinates by the rules in `docs/SEQUENCE.md`, and those rules as checks. Every measured
  number is in `across` at the top. `parse()` hands it any block that starts `sequenceDiagram`. Pure.
  `sequence-render.mjs` draws it (one page or one SVG, with a flowchart's own colours and box and line styles),
  and `sequence-runtime.mjs` is that page's script, run in the browser like runtime.mjs.
- `docs/PLAN.md`: where the work stands: what is released, what is half done and how to finish it, what waits on
  Victor, and what was decided and why. Read it before starting, and change it in the same pull request as the
  work.
- `docs/PLACEMENT.md`: the rules, each with pass, fail and what to do. `docs/SEQUENCE.md`: the same for a sequence
  diagram. `docs/ROADMAP.md`: what comes next and what
  was borrowed from where.
- `examples/`: a real document and what Merlive draws from it. Drawn again with `npm run examples`.
- `corpus/`: one sample of every kind of diagram Mermaid documents and of every feature of its flowcharts and its
  state, class, entity and sequence diagrams, with what each should be read as in `index.json`. `scripts/coverage.mjs` runs Merlive over all of it and writes
  `docs/COVERAGE.md` and `corpus/drawn/`. Written again with `npm run coverage`; never edited by hand.
- `corpus/compare.html`: every sample drawn twice, by Mermaid's own command and by Merlive, to look at side by
  side. `scripts/compare.mjs` writes it. Mermaid's pictures are kept in `corpus/mermaid/` and drawn again only by
  `npm run compare`, which needs `mmdc` and Chrome; `npm run coverage` writes the page again from them, and the
  tests need neither.
- `test/`: the pure files at 90% of lines or more, the command run for real into a temporary folder, and
  `skill.test.mjs` for the skill's own files and one version everywhere.

## Before you push

```bash
npm run check   # the tests, with coverage
```

GitHub runs the same command on every push and pull request, on Linux and macOS (`.github/workflows/check.yml`).
It installs nothing: the tests need Node and nothing else.

Change what is read or how anything is drawn, and run `npm run examples` and `npm run coverage` and look at the
pictures; the tests fail while `docs/COVERAGE.md` says something the code no longer does. A layout that passes its checks
can still look wrong; when it does, the fix is a new rule and a check for it, not a special case.

## How the code is written

- Comments say why, in plain words. The docs say "boxes", "links" and "lines", not "nodes" and "edges", and use
  British spelling (colour, licence).
- The skill needs nothing but Node 22. No dependencies in `skills/`.
- A number that is measured is named and explained where it is defined (`measure` in layout.mjs, `form` in
  shapes.mjs, `limits` in score.mjs, `draw` in render.mjs, `across` in sequence.mjs), not left in the code.
- Errors say what to do next, in a sentence an agent can act on; exit 1 when a diagram broke a rule, 2 for what is
  missing, 3 for nothing to draw.
- The Mermaid a person wrote is never changed by a script.
- Nothing is configured by hand that the script can find out. A new choice gets a default that is right for
  most projects, a place in the design file and on the setup page, and never a question.
- What is read from a site is text from a stranger: only colours, a list of faces and a number are kept, each
  checked for what it is before it reaches a page.

## Rules

- Write the failing test first, then the fix.
- 0.1.0 is released, so nothing goes straight to `main` any more: work is on a branch, in a pull request.
- One pull request is one release: bump `.claude-plugin/plugin.json`, SKILL.md's `metadata.version`, `version` in
  merlive.mjs, the README badge and a changelog entry marked `(unreleased)` in the same pull request. `npm test`
  fails when they disagree.
- Never move or replace a published tag; ship a new patch instead.
- Other sessions may work in the main checkout at the same time: work in a `git worktree` of your own.
