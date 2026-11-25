# Where the work stands

For whoever picks Merlive up next, a person or an agent, with no memory of the sessions before. It says what is
done, what is half done and how to finish it, what waits on Victor, and what was decided and why.
[ROADMAP.md](ROADMAP.md) is where Merlive is going; this is where it is. Change this page in the same pull
request as the work it describes: a plan nobody keeps is worse than none.

Last brought up to date: 25 November 2026, on the branch `class-er`.

## Released

**0.1.0** (25 November 2026). Flowcharts, state diagrams and sequence diagrams: read, placed by rules that are
checked, drawn in a project's own design, with the Mermaid left as the source. What each draws of Mermaid, feature
by feature, is in [COVERAGE.md](COVERAGE.md), which the tests hold to the code.

## In hand: 0.2.0, class diagrams and entity diagrams

On the branch `class-er`, to be one pull request and one release.

Done on the branch:

- **The model holds them** (`parse.mjs` typedefs): a box may list `rows` (a compartment at a time) and carry a
  short line `over` its name; a link may end in `triangle`, `diamond`, `diamond-open`, `one`, `zero-or-one`,
  `one-or-many` or `zero-or-many`, and carry a few words `near` and `far`.
- **They are placed and drawn** (`layout.mjs`, `render.mjs`, `score.mjs`; `test/rows.test.mjs`): one width for
  the diagram, each box as tall as what it lists, a rank as tall as its tallest box, rows in a fixed-width face
  with their spaces kept, the new ends of a line, the words at a line's ends, and no path drawn heavier in a
  diagram of things.
- **They are read** (`class.mjs`, `er.mjs`, each a reader in `READERS` in `parse.mjs`, with `test/class.test.mjs`
  and `test/er.test.mjs`), and held to a corpus: the lists `class` and `er` in `corpus/index.json`, shown in
  `docs/COVERAGE.md` and on the comparison page, with their sections in `skills/merlive/reference.md`.

Still to do, in this order:

1. **Look, sample by sample.** Open `corpus/compare.html` and go through every class and entity sample beside
   Mermaid's. Only four were looked at closely (`class-whole`, `class`, `er`, and two made by hand). A picture
   that passes its checks and looks wrong gets a new rule and a check, not a special case. Known to look at:
   where the words at a line's ends land when several lines meet one box; a line entering the side of a tall box
   among its rows; a class with a very long method; a lollipop interface.
2. **What is known to be missing**, each said by the command when met: a direction other than top to bottom,
   for either kind (boxes of different heights are only placed top to bottom); attributes written on the line
   that opens an entity. A picked class is called "Step" on the page, since a class has no kind of its own.
3. **An attribute's comment is not on the picture.** An entity is drawn as a table of type, name and keys. A
   comment (`string number PK "As printed"`) is Mermaid's fourth column; here it is in the note on the entity,
   since one sentence would make every box of the diagram as wide as itself. To draw it, a comment column needs
   to wrap inside its cell and make only its own row taller.
4. **Notes in a state diagram are not drawn yet.** A class diagram's notes are (a `note` shape, a box of kind
   `note`, a dotted link with nothing at its ends: `class.mjs`). A state diagram's (`note right of X`) are still
   only what a reader sees on picking the state. Drawing them the same way needs one thing first: a state
   diagram has a main path and steps, and a note's link must not be taken for part of the flow (a note has
   nothing coming in, so it looks like a place to start). A note is drawn in the design's own colours, not
   Mermaid's yellow: the colours are the user's.
5. **One thing the class reader changed for flowcharts too**: two groups with one id are now one group
   (`frame()` in `parse.mjs` reopens a group whose id exists). Dotted namespaces need it. Nothing in the corpus
   or in Victor's diagrams has two subgraphs with one id, but it is a change of behaviour, so say so in the pull
   request.
6. **Release.** The pull request for `class-er`, with the changelog's `0.2.0 (unreleased)` given its date on
   the day it is merged; then the tag.

## Waiting on Victor

- **The tag `v0.1.0`.** The session that released 0.1.0 could not push tags. In a clone:
  `git tag -a v0.1.0 c2de18e -m "Merlive 0.1.0" && git push origin v0.1.0`.
- **The site.** [skills pull request 11](https://github.com/victorsaly/skills/pull/11) takes "not released
  yet" off Merlive's page; merge it after the tag. Then, in the skills repository: `npm install`,
  `npm run build` (the Merlive page has never been built: it could not be, where it was written),
  `npm run cards` (the share card `public/og/merlive.png` is missing and the hub's card shows two skills), and
  `npm run deploy` (the site deploys by hand, so skills.victorsaly.com does not show Merlive until then).
- **The About box** of the Merlive repository on GitHub is empty. Description: "Your Mermaid diagrams, placed by
  rule and made live. Turns the Mermaid already in your Markdown into well placed, interactive diagrams in your
  own design, as an agent skill for Claude Code, Codex, Cursor and OpenCode." Website:
  `https://skills.victorsaly.com/merlive`. Topics: agent-skill, agent-skills, claude-code, codex, cursor,
  mermaid, diagrams, flowchart, markdown, documentation, visualization.
- **His own diagrams turn.** A flow written left to right and wider than 1,100 px is now drawn top to bottom. Nine
  of the fifteen diagrams in his blog and the business-analyst demo do. He has not said whether the blog's should
  (`%% turn: no` keeps one as written).
- **Open questions on the site page**: the mark and the wordmark are proposals; whether Merlive wants a film as
  SideShot has.

## After 0.2.0, in this order

1. **Where Mermaid still reads better**, from the comparison page:
   - in a sequence diagram: a participant that is destroyed is not drawn again where it ends; the figure and the
     marks are smaller than Mermaid's; the page's legend names only three kinds of participant; a foot is picked
     by pointer and not by keyboard; a note over two participants may sit on an activation bar (not checked
     whether that is new); an author's highlight colours become the design's tint;
   - a state diagram's fork and join are boxes, not bars;
   - `A & B --> C & D`: the crossing sits beside a bend; three to three is refused (it forces nine crossings and
     placement finds eleven);
   - the name of a narrow group usually has its line pass behind it, and the arrowhead sits close under it;
   - a group's own direction is read past;
   - of the newer `@{ shape }` list, twelve shapes are drawn and the rest are boxes.
2. **The other kinds**, picked by what Victor's own repositories use, not by Mermaid's list. Thirty are left.
   A kind of boxes and links (requirement, C4, block, architecture) can use the placement there is; a chart or a
   tree needs a way of drawing of its own, as a sequence diagram did (`sequence.mjs` is the pattern: read, place,
   check, with its rules written down first).
3. **What 0.1 left for later**: setup that reads colours from a Tailwind config; pan, zoom and search for big
   diagrams; a build step for docs sites; evals for the skill.

## What was decided, and why

Each of these was a choice somebody could reopen. The reason is here so that nobody reopens one by accident.

- **Mermaid stays the source, and no script changes it.** Merlive's own instructions are `%%` comments.
- **Placement is by rules that are checked, and a diagram that breaks one is not written.** A picture that passes
  and still looks wrong gets a new rule and its check.
- **Colours are the project's, read from its site, never chosen from palettes.** An author's own colour
  (`style B stroke:#c00`) is drawn in the design's nearest colour and named for its hue, so the contrast and
  colour-blind checks stay true. Victor was told and did not ask for the exact hex.
- **A shape is what its author drew, in the one footprint every box shares.** Victor asked for this after seeing
  rhombuses drawn as cut-corner boxes; a rhombus is as wide and as tall as its neighbours, not twice their size.
- **A crossing the diagram forces is allowed, and counted exactly** (P4): one for every two boxes of a rank that
  are each linked to the same two of another. Victor agreed; any other crossing in a small diagram is refused.
- **A flow too wide for a screen is turned top to bottom.** Victor agreed; the alternative was narrower boxes,
  which wrap labels onto more lines.
- **Icons are Merlive's own drawings**, found by Font Awesome's names. Nothing is fetched, and Font Awesome's art
  has its own licence. Brand marks are never drawn.
- **A class or entity box has one width for the diagram and its own height** (P2 keeps its columns, not its
  rows). Victor chose this over refusing such diagrams.
- **After 0.1.0, one pull request is one release**, and nothing goes straight to `main`.

## How to pick it up

```bash
npm run check      # every test, with coverage: must pass before and after
npm run examples   # draw the examples again
npm run coverage   # what is drawn of Mermaid, and the comparison page's Merlive side
npm run compare    # Mermaid's side of the comparison (needs mermaid-cli and Chrome), about three minutes
```

[AGENTS.md](../AGENTS.md) says how the code is laid out and written. Read it first. Then open
`corpus/compare.html` in a browser: it is the quickest way to see what Merlive does and where it falls short.
