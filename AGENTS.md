# Working on Merlive

For coding agents changing this repository. It follows the same habits as
[SideShot](https://github.com/victorsaly/sideshot).

## What is where

- `skills/merlive/SKILL.md`: what an agent reads to use Merlive. Short on purpose (the checks hold it under 500
  lines); anything only some diagrams need goes in `reference.md`, linked from SKILL.md and linking nowhere.
- `skills/merlive/scripts/merlive.mjs`: the command. The only file that reads and writes the disk.
- `skills/merlive/scripts/parse.mjs`: Mermaid text to a model, and the Mermaid blocks of a Markdown file. Says
  what it did not read. Pure.
- `skills/merlive/scripts/layout.mjs`: the model to coordinates, by the rules in `docs/PLACEMENT.md`. Every
  measured number is in `measure` at the top, with why. Pure.
- `skills/merlive/scripts/score.mjs`: the rules as checks. A rule in `docs/PLACEMENT.md` with no check here is a
  bug. Pure.
- `skills/merlive/scripts/design.mjs`: the three designs that come with it, a design file laid over one, and the
  colour sums (mixing, contrast). Pure.
- `skills/merlive/scripts/render.mjs`: a model, a layout and a design to one HTML page or one SVG. Pure.
- `skills/merlive/scripts/runtime.mjs`: handed to the page as source and run there, so browser globals, not
  Node's, and nothing from outside the function.
- `docs/PLACEMENT.md`: the rules, each with pass, fail and what to do. `docs/ROADMAP.md`: what comes next and what
  was borrowed from where.
- `examples/`: a real document and what Merlive draws from it. Drawn again with `npm run examples`.
- `test/`: the pure files at 90% of lines or more, the command run for real into a temporary folder, and
  `skill.test.mjs` for the skill's own files and one version everywhere.

## Before you push

```bash
npm run check   # the tests, with coverage
```

Change how anything is drawn, and run `npm run examples` and look at the pictures. A layout that passes its checks
can still look wrong; when it does, the fix is a new rule and a check for it, not a special case.

## How the code is written

- Comments say why, in plain words. The docs say "boxes", "links" and "lines", not "nodes" and "edges", and use
  British spelling (colour, licence).
- The skill needs nothing but Node 22. No dependencies in `skills/`.
- A number that is measured is named and explained where it is defined (`measure` in layout.mjs, `limits` in
  score.mjs, `draw` in render.mjs), not left in the code.
- Errors say what to do next, in a sentence an agent can act on; exit 1 when a diagram broke a rule, 2 for what is
  missing, 3 for nothing to draw.
- The Mermaid a person wrote is never changed by a script.

## Rules

- Write the failing test first, then the fix.
- One pull request is one release: bump `.claude-plugin/plugin.json`, SKILL.md's `metadata.version`, `version` in
  merlive.mjs, the README badge and a changelog entry marked `(unreleased)` in the same pull request. `npm test`
  fails when they disagree.
- Never move or replace a published tag; ship a new patch instead.
- Other sessions may work in the main checkout at the same time: work in a `git worktree` of your own.
